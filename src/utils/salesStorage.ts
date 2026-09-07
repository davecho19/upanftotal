import { INITIAL_OFFLINE_SALES } from "../salesData";

export interface SaleTransaction {
  asesor: string;
  fecha: string; // YYYY-MM-DD
  ruc: string;
  nombre: string;
  tipo: string;
  producto: string;
  plan: string;
  adicionales: string;
  valorPlan: number;
  valorAdicional: number;
  descuento: number;
  total: number;
  totalSinIva: number;
  mes: string;
  id?: string;
  isCustom?: boolean;
}

export const STORAGE_KEY_SALES = "sales_data_db";
export const STORAGE_KEY_CUSTOM_SALES = "custom_registered_sales_db";

export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return "";
  const trimmed = dateStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  if (/^\d{4}[\/\.]\d{1,2}[\/\.]\d{1,2}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\.]/);
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }

  if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/\.-]/);
    const d = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  return trimmed;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getMonthFromDate(dateStr: string): string {
  const norm = normalizeDateString(dateStr);
  if (!norm) return "Desconocido";
  const parts = norm.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
  }
  return "Desconocido";
}

// Check if two sales are equivalent to prevent duplicates
function isSameSale(a: SaleTransaction, b: SaleTransaction): boolean {
  if (a.id && b.id && a.id === b.id) return true;
  const normA = normalizeDateString(a.fecha);
  const normB = normalizeDateString(b.fecha);
  const cleanRucA = (a.ruc || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  const cleanRucB = (b.ruc || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  const sameRuc = cleanRucA && cleanRucB && cleanRucA === cleanRucB;
  const sameFecha = normA && normB && normA === normB;
  const sameTotal = Math.abs((Number(a.total) || 0) - (Number(b.total) || 0)) < 0.05;
  const sameAsesor = (a.asesor || "").toLowerCase().trim() === (b.asesor || "").toLowerCase().trim();

  return sameRuc && sameFecha && sameTotal && sameAsesor;
}

export function getStoredSales(): SaleTransaction[] {
  try {
    let customSales: SaleTransaction[] = [];
    const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_SALES);
    if (customRaw) {
      try {
        const parsed = JSON.parse(customRaw);
        if (Array.isArray(parsed)) customSales = parsed;
      } catch (e) {}
    }

    let baseSales: SaleTransaction[] = [];
    const baseRaw = localStorage.getItem(STORAGE_KEY_SALES);
    if (baseRaw) {
      try {
        const parsed = JSON.parse(baseRaw);
        if (Array.isArray(parsed) && parsed.length > 0) baseSales = parsed;
      } catch (e) {}
    }

    if (baseSales.length === 0) {
      baseSales = [...INITIAL_OFFLINE_SALES.slice(0, 5000)];
    }

    if (customSales.length > 0) {
      const merged = [...customSales];
      for (const item of baseSales) {
        if (!customSales.some(c => isSameSale(c, item))) {
          merged.push(item);
        }
      }
      return merged;
    }

    return baseSales;
  } catch (e) {
    console.warn("Error reading stored sales:", e);
    return INITIAL_OFFLINE_SALES.slice(0, 5000);
  }
}

export function saveCustomRegisteredSale(sale: SaleTransaction): void {
  try {
    const saleItem: SaleTransaction = {
      ...sale,
      id: sale.id || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      isCustom: true,
      valorPlan: Number(sale.valorPlan) || 0,
      valorAdicional: Number(sale.valorAdicional) || 0,
      descuento: Number(sale.descuento) || 0,
      total: Number(sale.total) || 0,
      totalSinIva: Number(sale.totalSinIva) || (Number(sale.total) ? Number((sale.total / 1.15).toFixed(2)) : 0),
      mes: sale.mes || getMonthFromDate(sale.fecha)
    };

    // 1. Save to custom sales list
    let customSales: SaleTransaction[] = [];
    const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_SALES);
    if (customRaw) {
      try {
        const parsed = JSON.parse(customRaw);
        if (Array.isArray(parsed)) customSales = parsed;
      } catch (e) {}
    }
    customSales.unshift(saleItem);
    localStorage.setItem(STORAGE_KEY_CUSTOM_SALES, JSON.stringify(customSales));

    // 2. Save to sales_data_db as well
    const currentSales = getStoredSales();
    const updated = [saleItem, ...currentSales.filter(s => !isSameSale(s, saleItem))];
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(updated.slice(0, 5000)));

    // 3. Dispatch events to notify all tabs/components
    window.dispatchEvent(new CustomEvent("sales_data_updated", { detail: saleItem }));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.warn("Failed to persist custom sale:", e);
  }
}

export function mergeRemoteSalesWithLocal(remoteSales: SaleTransaction[]): SaleTransaction[] {
  try {
    let customSales: SaleTransaction[] = [];
    const customRaw = localStorage.getItem(STORAGE_KEY_CUSTOM_SALES);
    if (customRaw) {
      try {
        const parsed = JSON.parse(customRaw);
        if (Array.isArray(parsed)) customSales = parsed;
      } catch (e) {}
    }

    if (customSales.length === 0) {
      const slice5000 = remoteSales.slice(0, 5000);
      try {
        localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(slice5000));
      } catch (e) {}
      return slice5000;
    }

    const merged = [...customSales];
    for (const rem of remoteSales) {
      if (!customSales.some(c => isSameSale(c, rem))) {
        merged.push(rem);
      }
    }

    const slice5000 = merged.slice(0, 5000);
    try {
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(slice5000));
    } catch (e) {}
    return slice5000;
  } catch (e) {
    console.warn("Error merging remote sales:", e);
    return remoteSales;
  }
}
