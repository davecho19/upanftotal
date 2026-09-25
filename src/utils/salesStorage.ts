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
export const STORAGE_KEY_SALES_VERSION = "sales_data_v_2026_09_25_live_v7_audit";

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
    const storedVersion = localStorage.getItem(STORAGE_KEY_SALES_VERSION);
    if (storedVersion !== STORAGE_KEY_SALES_VERSION) {
      try {
        localStorage.removeItem(STORAGE_KEY_SALES);
        localStorage.removeItem(STORAGE_KEY_CUSTOM_SALES);
        localStorage.setItem(STORAGE_KEY_SALES_VERSION, STORAGE_KEY_SALES_VERSION);
      } catch (e) {}
      return [...INITIAL_OFFLINE_SALES.slice(0, 10000)];
    }

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
        if (Array.isArray(parsed) && parsed.length >= INITIAL_OFFLINE_SALES.length) {
          baseSales = parsed;
        }
      } catch (e) {}
    }

    if (baseSales.length === 0) {
      baseSales = [...INITIAL_OFFLINE_SALES.slice(0, 10000)];
      try {
        localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(baseSales));
        localStorage.setItem(STORAGE_KEY_SALES_VERSION, STORAGE_KEY_SALES_VERSION);
      } catch (e) {}
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
    return INITIAL_OFFLINE_SALES.slice(0, 10000);
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
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(updated.slice(0, 10000)));

    // 3. Dispatch events to notify all tabs/components
    window.dispatchEvent(new CustomEvent("sales_data_updated", { detail: saleItem }));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.warn("Failed to persist custom sale:", e);
  }
}

export function mergeRemoteSalesWithLocal(remoteSales: SaleTransaction[]): SaleTransaction[] {
  try {
    if (!remoteSales || remoteSales.length === 0) {
      return getStoredSales();
    }

    const slice10000 = remoteSales.slice(0, 10000);
    try {
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(slice10000));
      localStorage.setItem(STORAGE_KEY_SALES_VERSION, STORAGE_KEY_SALES_VERSION);
      // Remove stale test sales to prevent ghost sales from inflating advisor totals
      localStorage.removeItem(STORAGE_KEY_CUSTOM_SALES);
    } catch (e) {}
    return slice10000;
  } catch (e) {
    console.warn("Error merging remote sales:", e);
    return remoteSales;
  }
}

export function isUpContaSale(item: SaleTransaction): boolean {
  const prod = (item.producto || "").toLowerCase();
  const plan = (item.plan || "").toLowerCase();
  return prod.includes("plan") || prod.includes("facturaci") || prod.includes("erp") || prod.includes("contador") || prod.includes("upconta") || plan.includes("erp") || plan.includes("contador");
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

const SPANISH_MONTHS: Record<string, string> = {
  "January": "Enero",
  "February": "Febrero",
  "March": "Marzo",
  "April": "Abril",
  "May": "Mayo",
  "June": "Junio",
  "July": "Julio",
  "August": "Agosto",
  "September": "Septiembre",
  "October": "Octubre",
  "November": "Noviembre",
  "December": "Diciembre"
};

export function getSpanishCurrentMonthLabel(): string {
  const current = getCurrentMonthString();
  const [mName, y] = current.split(" ");
  return `${SPANISH_MONTHS[mName] || mName} ${y}`;
}

export function matchMonth(item: SaleTransaction, targetMonth: string): boolean {
  if (!targetMonth || targetMonth === "all_year" || targetMonth === "all") return true;
  const mLower = targetMonth.toLowerCase();
  const itemMesLower = (item.mes || "").toLowerCase();

  const norm = normalizeDateString(item.fecha);
  if (norm) {
    const parts = norm.split("-");
    if (parts.length >= 2) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const monthNamesEn = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const monthNamesEs = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      if (m >= 1 && m <= 12) {
        const nameEn = monthNamesEn[m - 1];
        const nameEs = monthNamesEs[m - 1];
        if (mLower.includes(nameEn) || mLower.includes(nameEs)) {
          if (mLower.includes(y) || !mLower.match(/\d{4}/)) return true;
        }
      }
    }
  }

  return itemMesLower.includes(mLower);
}

export function calculateCurrentMonthTotals(sales: SaleTransaction[]) {
  const currentMonthStr = getCurrentMonthString();
  let up = 0;
  let fi = 0;
  let upConIva = 0;
  let fiConIva = 0;
  let countUp = 0;
  let countFi = 0;

  for (const s of sales) {
    if (matchMonth(s, currentMonthStr)) {
      const isUp = isUpContaSale(s);
      // Strictly calculate Sin IVA and Con IVA
      const val = Number(s.totalSinIva) || (Number(s.total) ? Number((s.total / 1.15).toFixed(2)) : 0) || 0;
      const valConIva = Number(s.total) || 0;
      if (isUp) {
        up += val;
        upConIva += valConIva;
        countUp++;
      } else {
        fi += val;
        fiConIva += valConIva;
        countFi++;
      }
    }
  }

  return {
    upconta: up,
    firmas: fi,
    total: up + fi,
    upcontaConIva: upConIva,
    firmasConIva: fiConIva,
    totalConIva: upConIva + fiConIva,
    countUp,
    countFi,
    totalCount: countUp + countFi,
    monthLabel: getSpanishCurrentMonthLabel()
  };
}
