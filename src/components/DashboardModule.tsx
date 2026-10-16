import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle2,
  Search,
  Sparkles,
  Layers,
  Clock,
  Building2,
  ShieldCheck,
  Calculator,
  FileCheck,
  BarChart3,
  ArrowUpRight,
  TrendingDown,
  PieChart as PieChartIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from "recharts";

import { INITIAL_OFFLINE_SALES } from "../salesData";
import { 
  getStoredSales, 
  mergeRemoteSalesWithLocal, 
  normalizeDateString, 
  getMonthFromDate, 
  SaleTransaction 
} from "../utils/salesStorage";
export type { SaleTransaction };

export type SaleChannel = "nueva" | "renovacion" | "socio" | "distribuidor";

export function getSaleChannel(item: SaleTransaction): SaleChannel {
  const tipo = (item.tipo || "").toLowerCase().trim();
  const socioCol = (item.socioDistribuidor || "").toLowerCase().trim();

  if (tipo.includes("distribuidor") || socioCol.includes("distribuidor")) {
    return "distribuidor";
  }
  if (socioCol.length > 0 || tipo.includes("socio")) {
    return "socio";
  }
  if (tipo.includes("renov")) {
    return "renovacion";
  }
  return "nueva";
}

export const MONTHS_LIST = [
  { num: 1, key: "01", name: "Enero", short: "Ene" },
  { num: 2, key: "02", name: "Febrero", short: "Feb" },
  { num: 3, key: "03", name: "Marzo", short: "Mar" },
  { num: 4, key: "04", name: "Abril", short: "Abr" },
  { num: 5, key: "05", name: "Mayo", short: "May" },
  { num: 6, key: "06", name: "Junio", short: "Jun" },
  { num: 7, key: "07", name: "Julio", short: "Jul" },
  { num: 8, key: "08", name: "Agosto", short: "Ago" },
  { num: 9, key: "09", name: "Septiembre", short: "Sep" },
  { num: 10, key: "10", name: "Octubre", short: "Oct" },
  { num: 11, key: "11", name: "Noviembre", short: "Nov" },
  { num: 12, key: "12", name: "Diciembre", short: "Dic" }
];

// Helper function to calculate month-isolated Friday-to-Thursday week info
function getFridayToThursdayWeek(dateStr: string) {
  if (!dateStr) return { weekNumber: 1, label: "Semana 1", isoStart: "", isoEnd: "" };
  
  const norm = normalizeDateString(dateStr);
  const parts = norm.split("-");
  if (parts.length !== 3) return { weekNumber: 1, label: "Semana 1", isoStart: "", isoEnd: "" };

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { weekNumber: 1, label: "Semana 1", isoStart: "", isoEnd: "" };
  }

  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstOfMonth.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat

  let firstFridayDay = 1;
  if (firstDayOfWeek === 5) {
    firstFridayDay = 1;
  } else if (firstDayOfWeek < 5) {
    firstFridayDay = 1 + (5 - firstDayOfWeek);
  } else {
    firstFridayDay = 1 + (5 + 7 - firstDayOfWeek);
  }

  let weekNum = 1;
  if (firstFridayDay === 1) {
    weekNum = 1 + Math.floor((day - 1) / 7);
  } else {
    if (day < firstFridayDay) {
      weekNum = 1;
    } else {
      const daysFromFirstFriday = day - firstFridayDay;
      weekNum = 2 + Math.floor(daysFromFirstFriday / 7);
    }
  }

  if (weekNum > 5) weekNum = 5;

  return {
    weekNumber: weekNum,
    label: `Semana ${weekNum}`,
    isoStart: norm,
    isoEnd: norm
  };
}

function getWeekRangesForMonth(selectedMonthStr: string) {
  let year = 2026;
  let month = 7;

  const mLower = (selectedMonthStr || "").toLowerCase();
  if (mLower.includes("june") || mLower.includes("junio")) month = 6;
  else if (mLower.includes("may") || mLower.includes("mayo")) month = 5;
  else if (mLower.includes("april") || mLower.includes("abril")) month = 4;
  else if (mLower.includes("march") || mLower.includes("marzo")) month = 3;
  else if (mLower.includes("february") || mLower.includes("febrero")) month = 2;
  else if (mLower.includes("january") || mLower.includes("enero")) month = 1;
  else if (mLower.includes("august") || mLower.includes("agosto")) month = 8;
  else if (mLower.includes("september") || mLower.includes("septiembre")) month = 9;
  else if (mLower.includes("october") || mLower.includes("octubre")) month = 10;
  else if (mLower.includes("november") || mLower.includes("noviembre")) month = 11;
  else if (mLower.includes("december") || mLower.includes("diciembre")) month = 12;

  const yrMatch = selectedMonthStr.match(/\d{4}/);
  if (yrMatch) year = parseInt(yrMatch[0], 10);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstOfMonth.getDay();

  let firstFridayDay = 1;
  if (firstDayOfWeek === 5) {
    firstFridayDay = 1;
  } else if (firstDayOfWeek < 5) {
    firstFridayDay = 1 + (5 - firstDayOfWeek);
  } else {
    firstFridayDay = 1 + (5 + 7 - firstDayOfWeek);
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const mPad = pad(month);

  const ranges: { weekNum: number; label: string }[] = [];

  if (firstFridayDay === 1) {
    for (let w = 1; w <= 5; w++) {
      const start = 1 + (w - 1) * 7;
      if (start > daysInMonth) break;
      const end = Math.min(start + 6, daysInMonth);
      ranges.push({
        weekNum: w,
        label: `Semana ${w} (${pad(start)}/${mPad} al ${pad(end)}/${mPad})`
      });
    }
  } else {
    ranges.push({
      weekNum: 1,
      label: `Semana 1 (01/${mPad} al ${pad(firstFridayDay - 1)}/${mPad})`
    });

    for (let w = 2; w <= 5; w++) {
      const start = firstFridayDay + (w - 2) * 7;
      if (start > daysInMonth) break;
      const end = w === 5 ? daysInMonth : Math.min(start + 6, daysInMonth);
      ranges.push({
        weekNum: w,
        label: `Semana ${w} (${pad(start)}/${mPad} al ${pad(end)}/${mPad})`
      });
    }
  }

  return ranges;
}

const getCurrentMonthString = (): string => {
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

const getMonthDateRange = (monthStr: string) => {
  if (monthStr === "all_year" || monthStr === "all") {
    return { start: "2026-01-01", end: "2026-12-31" };
  }
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const parts = monthStr.split(" ");
  if (parts.length === 2) {
    const mIdx = monthNames.indexOf(parts[0]);
    const y = parseInt(parts[1], 10);
    if (mIdx !== -1 && !isNaN(y)) {
      const mm = String(mIdx + 1).padStart(2, "0");
      const lastDay = new Date(y, mIdx + 1, 0).getDate();
      return {
        start: `${y}-${mm}-01`,
        end: `${y}-${mm}-${String(lastDay).padStart(2, "0")}`
      };
    }
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${lastDay}` };
};

const MONTH_TRANSLATIONS: Record<string, string> = {
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

const getSpanishMonthLabel = (mStr: string): string => {
  if (!mStr) return "";
  if (mStr === "all_year") return "Todo el Año";
  const [mName, year] = mStr.split(" ");
  const spanishName = MONTH_TRANSLATIONS[mName] || mName;
  return year ? `${spanishName} ${year}` : spanishName;
};

export interface DashboardModuleProps {
  companyMode?: "all" | "upconta" | "firmas" | "locked";
  accessProfile?: string | null;
}

const normalizeText = (str: string): string => {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export function DashboardModule({ companyMode = "all", accessProfile = null }: DashboardModuleProps) {
  const isAccess1998 = accessProfile === "1998";
  const currentMonthString = getCurrentMonthString();
  const defaultRange = getMonthDateRange(currentMonthString);

  const [sales, setSales] = useState<SaleTransaction[]>(getStoredSales);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("En vivo");
  const [syncStatus, setSyncStatus] = useState<"success" | "error" | "loading">("success");

  // Real-time listener for registered sales across tabs and modules
  useEffect(() => {
    const handleSalesUpdate = () => {
      const stored = getStoredSales();
      setSales(stored);
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };

    window.addEventListener("sales_data_updated", handleSalesUpdate);
    window.addEventListener("storage", handleSalesUpdate);
    return () => {
      window.removeEventListener("sales_data_updated", handleSalesUpdate);
      window.removeEventListener("storage", handleSalesUpdate);
    };
  }, []);

  // Filters State
  const [timeFilter, setTimeFilter] = useState<"total" | "mes" | "mes_anterior" | "ano" | "semana" | "rango">("mes");
  const [selectedMonth, setSelectedMonth] = useState<string>("all_year");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedAdviser, setSelectedAdviser] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    companyMode === "upconta" ? "upconta" : companyMode === "firmas" ? "firmas" : "all"
  );
  const [startDate, setStartDate] = useState<string>("2026-01-01");
  const [endDate, setEndDate] = useState<string>("2026-12-31");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync category filter if companyMode changes
  useEffect(() => {
    if (companyMode === "upconta") {
      setSelectedCategory("upconta");
      setSelectedAdviser("all");
    } else if (companyMode === "firmas") {
      setSelectedCategory("firmas");
      setSelectedAdviser("all");
    } else {
      setSelectedCategory("all");
      setSelectedAdviser("all");
    }
  }, [companyMode]);

  // Keep date range synced when selectedMonth changes
  useEffect(() => {
    const range = getMonthDateRange(selectedMonth);
    setStartDate(range.start);
    setEndDate(range.end);
  }, [selectedMonth]);

  // Dynamic week ranges for selected month
  const dynamicWeekRanges = useMemo(() => {
    return getWeekRangesForMonth(selectedMonth);
  }, [selectedMonth]);

  // Fetch Google Sheets Data
  const fetchGoogleSheetData = async (force: boolean = true) => {
    setIsLoading(true);
    setSyncStatus("loading");
    try {
      let csvText = "";
      
      // Attempt 1: Local server proxy (instant live proxy with cache-busting)
      try {
        const resProxy = await fetch(`/api/sheets?t=${Date.now()}&force=true`, { cache: "no-store" });
        if (resProxy.ok) {
          const t = await resProxy.text();
          if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
            csvText = t;
          }
        }
      } catch (e) {
        console.warn("Proxy fetch skipped/failed:", e);
      }

      // Attempt 2: Direct Google Sheets export URL with timestamp cache buster
      if (!csvText) {
        try {
          const primaryUrl = `https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000&t=${Date.now()}`;
          const res0 = await fetch(primaryUrl, { cache: "no-store" });
          if (res0.ok) {
            const t = await res0.text();
            if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
              csvText = t;
            }
          }
        } catch (e) {
          console.warn("Direct fetch skipped/failed:", e);
        }
      }

      // Attempt 3: Google Visualization API (gviz) with timestamp cache buster
      if (!csvText) {
        try {
          const gvizUrl = `https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/gviz/tq?tqx=out:csv&gid=0&t=${Date.now()}`;
          const resGviz = await fetch(gvizUrl, { cache: "no-store" });
          if (resGviz.ok) {
            const t = await resGviz.text();
            if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
              csvText = t;
            }
          }
        } catch (e) {
          console.warn("Gviz fetch skipped/failed:", e);
        }
      }

      // Attempt 4: CORS proxy fallbacks
      if (!csvText) {
        const proxies = [
          "https://api.allorigins.win/raw?url=" + encodeURIComponent(`https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000&t=${Date.now()}`),
          "https://corsproxy.io/?" + encodeURIComponent(`https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000&t=${Date.now()}`)
        ];
        for (const pUrl of proxies) {
          try {
            const resCors = await fetch(pUrl, { cache: "no-store" });
            if (resCors.ok) {
              const t = await resCors.text();
              if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
                csvText = t;
                break;
              }
            }
          } catch (e) {}
        }
      }

      if (csvText) {
        const parsedSales = parseSalesCSV(csvText);
        if (parsedSales.length > 0) {
          setSales(parsedSales);
          mergeRemoteSalesWithLocal(parsedSales);
          setSyncStatus("success");
          return;
        }
      }

      // Safe fallback to current stored sales rather than wiping with old data
      const currentStored = getStoredSales();
      if (currentStored.length > 0) {
        setSales(currentStored);
        setSyncStatus("success");
      } else {
        const fallbackSlice = INITIAL_OFFLINE_SALES.slice(0, 10000);
        const mergedFallback = mergeRemoteSalesWithLocal(fallbackSlice);
        setSales(mergedFallback);
        setSyncStatus("success");
      }
    } catch (error) {
      console.warn("Using offline dataset due to Google Sheets sync error:", error);
      const currentStored = getStoredSales();
      if (currentStored.length > 0) {
        setSales(currentStored);
      }
      setSyncStatus("error");
    } finally {
      setIsLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  };

  useEffect(() => {
    fetchGoogleSheetData(true);
  }, []);

  // CSV Parser (up to 10000 records)
  const parseSalesCSV = (csvText: string): SaleTransaction[] => {
    const lines = csvText.split(/\r?\n/);
    const result: SaleTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (result.length >= 10000) break;
      const line = lines[i].trim();
      if (!line) continue;

      const cols: string[] = [];
      let inQuotes = false;
      let current = "";

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(current.trim().replace(/^"/, "").replace(/"$/, ""));
          current = "";
        } else {
          current += char;
        }
      }
      cols.push(current.trim().replace(/^"/, "").replace(/"$/, ""));

      if (cols.length >= 12 && cols[0] && cols[0].toUpperCase() !== "ASESOR") {
        const asesor = cols[0];
        const fecha = normalizeDateString(cols[1] || "");
        const ruc = cols[2] || "";
        const nombre = cols[3] || "";
        const tipo = cols[4] || "";
        const producto = cols[5] || "";
        const plan = cols[6] || "";
        const adicionales = cols[7] || "";
        const valorPlan = parseFloat((cols[8] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0;
        const valorAdicional = parseFloat((cols[9] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0;
        const descuento = parseFloat((cols[10] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0;
        const total = parseFloat((cols[11] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0;
        const totalSinIva = parseFloat((cols[12] || "0").replace(/\$/g, "").replace(/,/g, "")) || (total > 0 ? total / 1.15 : 0);
        
        const calculatedMes = getMonthFromDate(fecha);
        let rawMes = cols[13] ? cols[13].trim() : "";
        let mes = calculatedMes !== "Desconocido" ? calculatedMes : rawMes;

        result.push({
          asesor,
          fecha,
          ruc,
          nombre,
          tipo,
          producto,
          plan,
          adicionales,
          valorPlan,
          valorAdicional,
          descuento,
          total,
          totalSinIva,
          mes,
          socioDistribuidor: cols[14] ? cols[14].trim() : ""
        });
      }
    }
    return result;
  };

  // Helper check for UpConta vs Firmas sale line
  const isUpContaSale = (item: SaleTransaction) => {
    const prod = (item.producto || "").toLowerCase();
    const plan = (item.plan || "").toLowerCase();
    return prod.includes("plan") || prod.includes("facturaci") || prod.includes("erp") || prod.includes("contador") || prod.includes("upconta") || plan.includes("erp") || plan.includes("contador");
  };

  // Helper check for Convenio sale (any sale with value > $100)
  const isConvenioSale = (item: SaleTransaction) => {
    const tot = Number(item.total) || 0;
    const sinIva = Number(item.totalSinIva) || (tot ? tot / 1.15 : 0) || 0;
    return tot > 100 || sinIva > 100;
  };

  // Base sales filtered by company mode:
  // - "upconta" (170622): only Karla Haro & David Santander, and only UpConta products
  // - "firmas" (123456 / 1998): only Salomé Estrella, Ismenia Escalona, Evelyn Narváez, and only Firmas products
  // - "all" (0000) / "locked": all records
  const baseSales = useMemo(() => {
    if (companyMode === "upconta") {
      return sales.filter((item) => {
        const advNorm = normalizeText(item.asesor);
        const isAllowedAdv = advNorm.includes("karla") || advNorm.includes("david");
        const isUp = isUpContaSale(item);
        return isAllowedAdv && isUp;
      });
    }
    if (companyMode === "firmas") {
      return sales.filter((item) => {
        const advNorm = normalizeText(item.asesor);
        const isAllowedAdv = advNorm.includes("salome") || advNorm.includes("ismen") || advNorm.includes("evelyn");
        const isFir = !isUpContaSale(item);
        return (isAllowedAdv || isAccess1998) && isFir;
      });
    }
    return sales;
  }, [sales, companyMode, isAccess1998]);

  // Available unique advisers and months based on company baseSales
  const allAdvisers = useMemo(() => {
    const set = new Set<string>();
    baseSales.forEach(s => { if (s.asesor) set.add(s.asesor); });
    if (set.size === 0) {
      if (companyMode === "upconta") return ["Karla Haro", "David Santander"];
      if (companyMode === "firmas") return ["Salomé Estrella", "Ismenia Escalona", "Evelyn Narváez"];
      return ["Karla Haro", "Ismenia Escalona", "Salomé Estrella", "Evelyn Narváez", "David Santander"];
    }
    return Array.from(set);
  }, [baseSales, companyMode]);

  const allMonths = useMemo(() => {
    const set = new Set<string>();
    baseSales.forEach(s => { if (s.mes) set.add(s.mes); });
    return Array.from(set).sort();
  }, [baseSales]);

  const allAvailableMonthsOptions = useMemo(() => {
    const monthsOrder = [
      "January 2026", "February 2026", "March 2026", "April 2026",
      "May 2026", "June 2026", "July 2026", "August 2026",
      "September 2026", "October 2026", "November 2026", "December 2026"
    ];
    const set = new Set<string>([currentMonthString, ...allMonths, ...monthsOrder]);
    const monthOrderMap: Record<string, number> = {
      "January": 1, "February": 2, "March": 3, "April": 4,
      "May": 5, "June": 6, "July": 7, "August": 8,
      "September": 9, "October": 10, "November": 11, "December": 12
    };
    return Array.from(set).sort((a, b) => {
      const partsA = a.split(" ");
      const partsB = b.split(" ");
      const yrA = parseInt(partsA[1] || "2026", 10);
      const yrB = parseInt(partsB[1] || "2026", 10);
      if (yrA !== yrB) return yrA - yrB;
      const mA = monthOrderMap[partsA[0]] || 99;
      const mB = monthOrderMap[partsB[0]] || 99;
      return mA - mB;
    });
  }, [allMonths, currentMonthString]);

  // Month matching helper
  const matchMonthFilter = (item: SaleTransaction, monthFilterValue: string) => {
    if (!monthFilterValue || monthFilterValue === "all" || monthFilterValue === "all_year") return true;
    
    const mLower = monthFilterValue.toLowerCase().trim();

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
          // If transaction date is valid and does NOT match target month, it belongs to another month!
          return false;
        }
      }
    }

    const itemMesLower = (item.mes || "").toLowerCase().trim();
    return itemMesLower.includes(mLower);
  };

  // 1. Sales dataset strictly for CHARTS and REPORTS (Only affected by MES filter)
  const salesForChartsAndCommissions = useMemo(() => {
    return baseSales.filter(item => {
      // Adviser filter
      if (selectedAdviser !== "all" && item.asesor.toLowerCase() !== selectedAdviser.toLowerCase()) {
        return false;
      }

      // Product Line filter (UpConta vs Firmas vs Convenios)
      if (selectedCategory !== "all") {
        const isUp = isUpContaSale(item);
        const isConv = isConvenioSale(item);
        if (selectedCategory === "upconta" && !isUp) return false;
        if (selectedCategory === "firmas" && isUp) return false;
        if (selectedCategory === "solo_firmas" && (isUp || isConv)) return false;
        if (selectedCategory === "solo_convenios" && (isUp || !isConv)) return false;
      }

      // Must match selected Month
      if (!matchMonthFilter(item, selectedMonth)) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.nombre.toLowerCase().includes(q) ||
          item.ruc.toLowerCase().includes(q) ||
          item.asesor.toLowerCase().includes(q) ||
          item.producto.toLowerCase().includes(q) ||
          item.plan.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [baseSales, selectedMonth, selectedAdviser, selectedCategory, searchQuery]);

  // 2. Main Filtered Sales Logic for Scorecards, Detailed Table & Product Table
  const filteredSales = useMemo(() => {
    return salesForChartsAndCommissions.filter(item => {
      // Time Period Filter (semana or rango)
      if (timeFilter === "semana") {
        if (selectedWeek !== "all") {
          const weekNum = parseInt(selectedWeek, 10);
          const weekInfo = getFridayToThursdayWeek(item.fecha);
          if (weekInfo.weekNumber !== weekNum) return false;
        }
      } else if (timeFilter === "rango") {
        if (startDate && item.fecha < startDate) return false;
        if (endDate && item.fecha > endDate) return false;
      }

      return true;
    });
  }, [salesForChartsAndCommissions, timeFilter, selectedWeek, startDate, endDate]);

  // Breakdown metrics for KPI cards (3 rows of 3 matching brand guidelines)
  const totalVentasMonto = useMemo(() => filteredSales.reduce((acc, curr) => acc + (Number(curr.totalSinIva) || (Number(curr.total) ? Number(curr.total) / 1.15 : 0) || 0), 0), [filteredSales]);
  const totalVentasSinIva = totalVentasMonto;
  const totalVentasConIva = useMemo(() => filteredSales.reduce((acc, curr) => acc + (Number(curr.total) || (Number(curr.totalSinIva) ? Number(curr.totalSinIva) * 1.15 : 0) || 0), 0), [filteredSales]);
  const cantidadVentas = filteredSales.length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentasMonto / cantidadVentas : 0;

  const salesUpConta = useMemo(() => filteredSales.filter(isUpContaSale), [filteredSales]);
  const salesFirmas = useMemo(() => filteredSales.filter(s => !isUpContaSale(s)), [filteredSales]);

  const totalVentasUpConta = useMemo(() => salesUpConta.reduce((acc, curr) => acc + (Number(curr.totalSinIva) || (Number(curr.total) ? Number(curr.total) / 1.15 : 0) || 0), 0), [salesUpConta]);
  const cantidadUpConta = salesUpConta.length;
  const ticketPromedioUpConta = cantidadUpConta > 0 ? totalVentasUpConta / cantidadUpConta : 0;

  const totalVentasFirmas = useMemo(() => salesFirmas.reduce((acc, curr) => acc + (Number(curr.totalSinIva) || (Number(curr.total) ? Number(curr.total) / 1.15 : 0) || 0), 0), [salesFirmas]);
  const cantidadFirmas = salesFirmas.length;
  const ticketPromedioFirmas = cantidadFirmas > 0 ? totalVentasFirmas / cantidadFirmas : 0;

  // Specific metrics for access 1998: Ventas Firmas (<= $100) vs Venta Convenios (> $100)
  const salesFirmasNormal = useMemo(() => salesFirmas.filter(s => !isConvenioSale(s)), [salesFirmas]);
  const salesConvenios = useMemo(() => salesFirmas.filter(s => isConvenioSale(s)), [salesFirmas]);

  const totalVentasFirmasNormal = useMemo(() => salesFirmasNormal.reduce((acc, curr) => acc + (Number(curr.totalSinIva) || (Number(curr.total) ? Number(curr.total) / 1.15 : 0) || 0), 0), [salesFirmasNormal]);
  const totalVentasFirmasNormalConIva = useMemo(() => salesFirmasNormal.reduce((acc, curr) => acc + (Number(curr.total) || (Number(curr.totalSinIva) ? Number(curr.totalSinIva) * 1.15 : 0) || 0), 0), [salesFirmasNormal]);
  const cantidadFirmasNormal = salesFirmasNormal.length;
  const ticketPromedioFirmasNormal = cantidadFirmasNormal > 0 ? totalVentasFirmasNormal / cantidadFirmasNormal : 0;

  const totalVentasConvenios = useMemo(() => salesConvenios.reduce((acc, curr) => acc + (Number(curr.totalSinIva) || (Number(curr.total) ? Number(curr.total) / 1.15 : 0) || 0), 0), [salesConvenios]);
  const totalVentasConveniosConIva = useMemo(() => salesConvenios.reduce((acc, curr) => acc + (Number(curr.total) || (Number(curr.totalSinIva) ? Number(curr.totalSinIva) * 1.15 : 0) || 0), 0), [salesConvenios]);
  const cantidadConvenios = salesConvenios.length;
  const ticketPromedioConvenios = cantidadConvenios > 0 ? totalVentasConvenios / cantidadConvenios : 0;

  // Formatters
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Additional state for plan table search
  const [planSearch, setPlanSearch] = useState<string>("");

  const isGeneralDashboard = (companyMode === "all" || companyMode === "locked") && selectedCategory === "all";
  const showBothProducts = isGeneralDashboard;
  const isAllYear = !selectedMonth || selectedMonth === "all_year" || selectedMonth === "all";

  // 1. Channel Totals based on filteredSales with UpConta, Firmas & Convenios breakdown
  const channelTotals = useMemo(() => {
    const totals = {
      nueva: { 
        count: 0, sinIva: 0, conIva: 0, 
        upcontaCount: 0, upcontaMonto: 0, 
        firmasCount: 0, firmasMonto: 0,
        firmasNormalCount: 0, firmasNormalMonto: 0,
        conveniosCount: 0, conveniosMonto: 0
      },
      renovacion: { 
        count: 0, sinIva: 0, conIva: 0, 
        upcontaCount: 0, upcontaMonto: 0, 
        firmasCount: 0, firmasMonto: 0,
        firmasNormalCount: 0, firmasNormalMonto: 0,
        conveniosCount: 0, conveniosMonto: 0
      },
      socio: { 
        count: 0, sinIva: 0, conIva: 0, 
        upcontaCount: 0, upcontaMonto: 0, 
        firmasCount: 0, firmasMonto: 0,
        firmasNormalCount: 0, firmasNormalMonto: 0,
        conveniosCount: 0, conveniosMonto: 0
      },
      distribuidor: { 
        count: 0, sinIva: 0, conIva: 0, 
        upcontaCount: 0, upcontaMonto: 0, 
        firmasCount: 0, firmasMonto: 0,
        firmasNormalCount: 0, firmasNormalMonto: 0,
        conveniosCount: 0, conveniosMonto: 0
      }
    };

    filteredSales.forEach((item) => {
      const ch = getSaleChannel(item);
      const sinIva = Number(item.totalSinIva) || (Number(item.total) ? Number(item.total) / 1.15 : 0) || 0;
      const conIva = Number(item.total) || (Number(item.totalSinIva) ? Number(item.totalSinIva) * 1.15 : 0) || 0;
      const isUp = isUpContaSale(item);
      const isConv = isConvenioSale(item);

      totals[ch].count++;
      totals[ch].sinIva += sinIva;
      totals[ch].conIva += conIva;

      if (isUp) {
        totals[ch].upcontaCount++;
        totals[ch].upcontaMonto += sinIva;
      } else {
        totals[ch].firmasCount++;
        totals[ch].firmasMonto += sinIva;

        if (isConv) {
          totals[ch].conveniosCount++;
          totals[ch].conveniosMonto += sinIva;
        } else {
          totals[ch].firmasNormalCount++;
          totals[ch].firmasNormalMonto += sinIva;
        }
      }
    });

    return totals;
  }, [filteredSales]);

  // 2. Monthly Channel Data (12 months comparative for Nuevas, Renovaciones, Socios, Distribuidores)
  // Each channel has separate UpConta, Firmas & Convenios counts
  const monthlyChannelData = useMemo(() => {
    const eligibleSales = baseSales.filter((item) => {
      if (selectedAdviser !== "all" && item.asesor.toLowerCase() !== selectedAdviser.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== "all") {
        const isUp = isUpContaSale(item);
        const isConv = isConvenioSale(item);
        if (selectedCategory === "upconta" && !isUp) return false;
        if (selectedCategory === "firmas" && isUp) return false;
        if (selectedCategory === "solo_firmas" && (isUp || isConv)) return false;
        if (selectedCategory === "solo_convenios" && (isUp || !isConv)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.nombre.toLowerCase().includes(q) ||
          item.ruc.toLowerCase().includes(q) ||
          item.asesor.toLowerCase().includes(q) ||
          item.producto.toLowerCase().includes(q) ||
          item.plan.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const monthMap: Record<number, {
      mes: string;
      fullName: string;
      mesNum: number;
      nuevasUpconta: number;
      nuevasFirmas: number;
      nuevasFirmasNormal: number;
      nuevasConvenios: number;
      nuevasTotal: number;
      renovUpconta: number;
      renovFirmas: number;
      renovFirmasNormal: number;
      renovConvenios: number;
      renovTotal: number;
      sociosUpconta: number;
      sociosFirmas: number;
      sociosFirmasNormal: number;
      sociosConvenios: number;
      sociosTotal: number;
      distUpconta: number;
      distFirmas: number;
      distFirmasNormal: number;
      distConvenios: number;
      distTotal: number;
    }> = {};

    MONTHS_LIST.forEach((m) => {
      monthMap[m.num] = {
        mes: m.short,
        fullName: m.name,
        mesNum: m.num,
        nuevasUpconta: 0,
        nuevasFirmas: 0,
        nuevasFirmasNormal: 0,
        nuevasConvenios: 0,
        nuevasTotal: 0,
        renovUpconta: 0,
        renovFirmas: 0,
        renovFirmasNormal: 0,
        renovConvenios: 0,
        renovTotal: 0,
        sociosUpconta: 0,
        sociosFirmas: 0,
        sociosFirmasNormal: 0,
        sociosConvenios: 0,
        sociosTotal: 0,
        distUpconta: 0,
        distFirmas: 0,
        distFirmasNormal: 0,
        distConvenios: 0,
        distTotal: 0
      };
    });

    eligibleSales.forEach((item) => {
      const norm = normalizeDateString(item.fecha);
      if (!norm) return;
      const parts = norm.split("-");
      if (parts.length < 2) return;
      const mNum = parseInt(parts[1], 10);
      if (mNum >= 1 && mNum <= 12 && monthMap[mNum]) {
        const ch = getSaleChannel(item);
        const isUp = isUpContaSale(item);
        const isConv = isConvenioSale(item);

        if (ch === "nueva") {
          if (isUp) {
            monthMap[mNum].nuevasUpconta++;
          } else {
            monthMap[mNum].nuevasFirmas++;
            if (isConv) monthMap[mNum].nuevasConvenios++;
            else monthMap[mNum].nuevasFirmasNormal++;
          }
          monthMap[mNum].nuevasTotal++;
        } else if (ch === "renovacion") {
          if (isUp) {
            monthMap[mNum].renovUpconta++;
          } else {
            monthMap[mNum].renovFirmas++;
            if (isConv) monthMap[mNum].renovConvenios++;
            else monthMap[mNum].renovFirmasNormal++;
          }
          monthMap[mNum].renovTotal++;
        } else if (ch === "socio") {
          if (isUp) {
            monthMap[mNum].sociosUpconta++;
          } else {
            monthMap[mNum].sociosFirmas++;
            if (isConv) monthMap[mNum].sociosConvenios++;
            else monthMap[mNum].sociosFirmasNormal++;
          }
          monthMap[mNum].sociosTotal++;
        } else if (ch === "distribuidor") {
          if (isUp) {
            monthMap[mNum].distUpconta++;
          } else {
            monthMap[mNum].distFirmas++;
            if (isConv) monthMap[mNum].distConvenios++;
            else monthMap[mNum].distFirmasNormal++;
          }
          monthMap[mNum].distTotal++;
        }
      }
    });

    return MONTHS_LIST.map((m) => monthMap[m.num]);
  }, [baseSales, selectedAdviser, selectedCategory, searchQuery]);

  // Selected month number for highlighting in monthly charts
  const activeMonthNum = useMemo(() => {
    if (!selectedMonth || selectedMonth === "all_year" || selectedMonth === "all") return null;
    const mLower = selectedMonth.toLowerCase();
    const monthsEn = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    for (let i = 0; i < monthsEn.length; i++) {
      if (mLower.includes(monthsEn[i])) return i + 1;
    }
    return null;
  }, [selectedMonth]);

  // 3. Channel Comparison Bar Data (with separate UpConta, Firmas & Convenios bars)
  const channelComparisonBarData = useMemo(() => {
    return [
      {
        canal: "Nuevas",
        key: "nueva",
        upcontaCantidad: channelTotals.nueva.upcontaCount,
        upcontaMonto: channelTotals.nueva.upcontaMonto,
        firmasCantidad: channelTotals.nueva.firmasCount,
        firmasMonto: channelTotals.nueva.firmasMonto,
        firmasNormalCantidad: channelTotals.nueva.firmasNormalCount,
        firmasNormalMonto: channelTotals.nueva.firmasNormalMonto,
        conveniosCantidad: channelTotals.nueva.conveniosCount,
        conveniosMonto: channelTotals.nueva.conveniosMonto,
        totalCantidad: channelTotals.nueva.count,
        totalMonto: channelTotals.nueva.sinIva,
        pct: cantidadVentas > 0 ? (channelTotals.nueva.count / cantidadVentas) * 100 : 0
      },
      {
        canal: "Renovaciones",
        key: "renovacion",
        upcontaCantidad: channelTotals.renovacion.upcontaCount,
        upcontaMonto: channelTotals.renovacion.upcontaMonto,
        firmasCantidad: channelTotals.renovacion.firmasCount,
        firmasMonto: channelTotals.renovacion.firmasMonto,
        firmasNormalCantidad: channelTotals.renovacion.firmasNormalCount,
        firmasNormalMonto: channelTotals.renovacion.firmasNormalMonto,
        conveniosCantidad: channelTotals.renovacion.conveniosCount,
        conveniosMonto: channelTotals.renovacion.conveniosMonto,
        totalCantidad: channelTotals.renovacion.count,
        totalMonto: channelTotals.renovacion.sinIva,
        pct: cantidadVentas > 0 ? (channelTotals.renovacion.count / cantidadVentas) * 100 : 0
      },
      {
        canal: "Socios",
        key: "socio",
        upcontaCantidad: channelTotals.socio.upcontaCount,
        upcontaMonto: channelTotals.socio.upcontaMonto,
        firmasCantidad: channelTotals.socio.firmasCount,
        firmasMonto: channelTotals.socio.firmasMonto,
        firmasNormalCantidad: channelTotals.socio.firmasNormalCount,
        firmasNormalMonto: channelTotals.socio.firmasNormalMonto,
        conveniosCantidad: channelTotals.socio.conveniosCount,
        conveniosMonto: channelTotals.socio.conveniosMonto,
        totalCantidad: channelTotals.socio.count,
        totalMonto: channelTotals.socio.sinIva,
        pct: cantidadVentas > 0 ? (channelTotals.socio.count / cantidadVentas) * 100 : 0
      },
      {
        canal: "Distribuidores",
        key: "distribuidor",
        upcontaCantidad: channelTotals.distribuidor.upcontaCount,
        upcontaMonto: channelTotals.distribuidor.upcontaMonto,
        firmasCantidad: channelTotals.distribuidor.firmasCount,
        firmasMonto: channelTotals.distribuidor.firmasMonto,
        firmasNormalCantidad: channelTotals.distribuidor.firmasNormalCount,
        firmasNormalMonto: channelTotals.distribuidor.firmasNormalMonto,
        conveniosCantidad: channelTotals.distribuidor.conveniosCount,
        conveniosMonto: channelTotals.distribuidor.conveniosMonto,
        totalCantidad: channelTotals.distribuidor.count,
        totalMonto: channelTotals.distribuidor.sinIva,
        pct: cantidadVentas > 0 ? (channelTotals.distribuidor.count / cantidadVentas) * 100 : 0
      }
    ];
  }, [channelTotals, cantidadVentas]);

  // 4. Product / Plan Breakdown Rows
  const productPlanRows = useMemo(() => {
    const map: Record<string, {
      plan: string;
      producto: string;
      nuevas: number;
      renovaciones: number;
      socios: number;
      distribuidores: number;
      cantidad: number;
      montoSinIva: number;
      totalConIva: number;
      ticketPromedio: number;
      firmasNormalCount: number;
      conveniosCount: number;
      conveniosMonto: number;
    }> = {};

    filteredSales.forEach((item) => {
      const rawPlan = (item.plan || "Sin Plan").trim();
      if (!map[rawPlan]) {
        map[rawPlan] = {
          plan: rawPlan,
          producto: item.producto || "",
          nuevas: 0,
          renovaciones: 0,
          socios: 0,
          distribuidores: 0,
          cantidad: 0,
          montoSinIva: 0,
          totalConIva: 0,
          ticketPromedio: 0,
          firmasNormalCount: 0,
          conveniosCount: 0,
          conveniosMonto: 0
        };
      }

      const ch = getSaleChannel(item);
      const sinIva = Number(item.totalSinIva) || (Number(item.total) ? Number(item.total) / 1.15 : 0) || 0;
      const conIva = Number(item.total) || (Number(item.totalSinIva) ? Number(item.totalSinIva) * 1.15 : 0) || 0;
      const isConv = isConvenioSale(item);

      map[rawPlan].cantidad++;
      map[rawPlan].montoSinIva += sinIva;
      map[rawPlan].totalConIva += conIva;

      if (isConv) {
        map[rawPlan].conveniosCount++;
        map[rawPlan].conveniosMonto += sinIva;
      } else {
        map[rawPlan].firmasNormalCount++;
      }

      if (ch === "nueva") map[rawPlan].nuevas++;
      else if (ch === "renovacion") map[rawPlan].renovaciones++;
      else if (ch === "socio") map[rawPlan].socios++;
      else if (ch === "distribuidor") map[rawPlan].distribuidores++;
    });

    return Object.values(map)
      .map((row) => ({
        ...row,
        ticketPromedio: row.cantidad > 0 ? row.montoSinIva / row.cantidad : 0
      }))
      .sort((a, b) => b.totalConIva - a.totalConIva);
  }, [filteredSales]);

  const filteredProductPlanRows = useMemo(() => {
    if (!planSearch.trim()) return productPlanRows;
    const q = planSearch.toLowerCase();
    return productPlanRows.filter(
      (r) => r.plan.toLowerCase().includes(q) || r.producto.toLowerCase().includes(q)
    );
  }, [productPlanRows, planSearch]);

  // 5. Dynamic Evolution Data:
  // - Mensual (Ene ... Dic) cuando se elige consolidado del año ("all_year")
  // - Semanal (Semana 1 ... Semana 5) cuando se elige un mes específico
  // - Con 2 líneas (UpConta naranja, Firmas azul en dashboard general; o Firmas azul y Convenios morado en 1998)
  const evolutionChartData = useMemo(() => {
    if (isAllYear) {
      // 12 Months Evolution
      const monthMap: Record<number, {
        periodo: string;
        label: string;
        upcontaCantidad: number;
        firmasCantidad: number;
        firmasNormalCantidad: number;
        conveniosCantidad: number;
        totalCantidad: number;
        upcontaMonto: number;
        firmasMonto: number;
        firmasNormalMonto: number;
        conveniosMonto: number;
        totalMonto: number;
      }> = {};

      MONTHS_LIST.forEach((m) => {
        monthMap[m.num] = {
          periodo: m.short,
          label: m.name,
          upcontaCantidad: 0,
          firmasCantidad: 0,
          firmasNormalCantidad: 0,
          conveniosCantidad: 0,
          totalCantidad: 0,
          upcontaMonto: 0,
          firmasMonto: 0,
          firmasNormalMonto: 0,
          conveniosMonto: 0,
          totalMonto: 0
        };
      });

      filteredSales.forEach((item) => {
        const norm = normalizeDateString(item.fecha);
        if (!norm) return;
        const parts = norm.split("-");
        if (parts.length < 2) return;
        const mNum = parseInt(parts[1], 10);
        if (mNum >= 1 && mNum <= 12 && monthMap[mNum]) {
          const isUp = isUpContaSale(item);
          const isConv = isConvenioSale(item);
          const sinIva = Number(item.totalSinIva) || (Number(item.total) ? Number(item.total) / 1.15 : 0) || 0;

          if (isUp) {
            monthMap[mNum].upcontaCantidad++;
            monthMap[mNum].upcontaMonto += sinIva;
          } else {
            monthMap[mNum].firmasCantidad++;
            monthMap[mNum].firmasMonto += sinIva;
            if (isConv) {
              monthMap[mNum].conveniosCantidad++;
              monthMap[mNum].conveniosMonto += sinIva;
            } else {
              monthMap[mNum].firmasNormalCantidad++;
              monthMap[mNum].firmasNormalMonto += sinIva;
            }
          }
          monthMap[mNum].totalCantidad++;
          monthMap[mNum].totalMonto += sinIva;
        }
      });

      return MONTHS_LIST.map((m) => monthMap[m.num]);
    } else {
      // 5 Friday-to-Thursday weeks of the selected month
      const weeksMap: Record<number, {
        periodo: string;
        label: string;
        upcontaCantidad: number;
        firmasCantidad: number;
        firmasNormalCantidad: number;
        conveniosCantidad: number;
        totalCantidad: number;
        upcontaMonto: number;
        firmasMonto: number;
        firmasNormalMonto: number;
        conveniosMonto: number;
        totalMonto: number;
      }> = {
        1: { periodo: "Semana 1", label: "Semana 1", upcontaCantidad: 0, firmasCantidad: 0, firmasNormalCantidad: 0, conveniosCantidad: 0, totalCantidad: 0, upcontaMonto: 0, firmasMonto: 0, firmasNormalMonto: 0, conveniosMonto: 0, totalMonto: 0 },
        2: { periodo: "Semana 2", label: "Semana 2", upcontaCantidad: 0, firmasCantidad: 0, firmasNormalCantidad: 0, conveniosCantidad: 0, totalCantidad: 0, upcontaMonto: 0, firmasMonto: 0, firmasNormalMonto: 0, conveniosMonto: 0, totalMonto: 0 },
        3: { periodo: "Semana 3", label: "Semana 3", upcontaCantidad: 0, firmasCantidad: 0, firmasNormalCantidad: 0, conveniosCantidad: 0, totalCantidad: 0, upcontaMonto: 0, firmasMonto: 0, firmasNormalMonto: 0, conveniosMonto: 0, totalMonto: 0 },
        4: { periodo: "Semana 4", label: "Semana 4", upcontaCantidad: 0, firmasCantidad: 0, firmasNormalCantidad: 0, conveniosCantidad: 0, totalCantidad: 0, upcontaMonto: 0, firmasMonto: 0, firmasNormalMonto: 0, conveniosMonto: 0, totalMonto: 0 },
        5: { periodo: "Semana 5", label: "Semana 5", upcontaCantidad: 0, firmasCantidad: 0, firmasNormalCantidad: 0, conveniosCantidad: 0, totalCantidad: 0, upcontaMonto: 0, firmasMonto: 0, firmasNormalMonto: 0, conveniosMonto: 0, totalMonto: 0 }
      };

      filteredSales.forEach((item) => {
        const wInfo = getFridayToThursdayWeek(item.fecha);
        const w = wInfo.weekNumber;
        if (weeksMap[w]) {
          const isUp = isUpContaSale(item);
          const isConv = isConvenioSale(item);
          const sinIva = Number(item.totalSinIva) || (Number(item.total) ? Number(item.total) / 1.15 : 0) || 0;

          if (isUp) {
            weeksMap[w].upcontaCantidad++;
            weeksMap[w].upcontaMonto += sinIva;
          } else {
            weeksMap[w].firmasCantidad++;
            weeksMap[w].firmasMonto += sinIva;
            if (isConv) {
              weeksMap[w].conveniosCantidad++;
              weeksMap[w].conveniosMonto += sinIva;
            } else {
              weeksMap[w].firmasNormalCantidad++;
              weeksMap[w].firmasNormalMonto += sinIva;
            }
          }
          weeksMap[w].totalCantidad++;
          weeksMap[w].totalMonto += sinIva;
        }
      });

      return [1, 2, 3, 4, 5].map((w) => weeksMap[w]);
    }
  }, [filteredSales, isAllYear]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* ================= CONTROLS & FILTERS BAR ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-wider">
              <Filter className="w-4 h-4 text-orange-500" />
              <span>Filtros Integrados de Análisis</span>
            </div>
            {companyMode === "upconta" && (
              <span className="bg-orange-100 text-orange-800 border border-orange-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                UpConta (170622)
              </span>
            )}
            {companyMode === "firmas" && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                {isAccess1998 ? "Firmas ANF & Convenios (1998)" : "Firmas ANF (123456)"}
              </span>
            )}
            {companyMode === "all" && (
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                Super Admin (0000)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">
              Filtradas: <strong className="text-slate-900">{filteredSales.length}</strong> de <strong className="text-slate-900">{sales.length}</strong> ventas
            </span>

            <button
              onClick={() => fetchGoogleSheetData(true)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Sincronizar datos con Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Sincronizando..." : "Sincronizar Sheets"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Filter 1: Filtro MES */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Mes de Análisis</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all_year">⭐ Todo el Año / Histórico Completo ({sales.length} ventas)</option>
              {allAvailableMonthsOptions.map((mStr) => {
                const [mName, year] = mStr.split(" ");
                const spanishName = MONTH_TRANSLATIONS[mName] || mName;
                const isCurrent = mStr === currentMonthString;
                return (
                  <option key={mStr} value={mStr}>
                    {spanishName} {year} {isCurrent ? "(Mes Actual)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter 2: Período de Tiempo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Período de Tiempo</span>
            </label>
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value as any);
                if (e.target.value === "semana") setSelectedWeek("all");
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="mes">Mes Completo</option>
              <option value="semana">Por Semana (Viernes a Jueves)</option>
              <option value="rango">Rango Personalizado</option>
            </select>
          </div>

          {/* Filter 3: Conditional Week / Date Range / Search */}
          {timeFilter === "semana" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Semana (Viernes a Jueves)</span>
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full bg-amber-50/80 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="all">Todas las Semanas del Mes</option>
                {dynamicWeekRanges.map((wr) => (
                  <option key={wr.weekNum} value={String(wr.weekNum)}>
                    {wr.label}
                  </option>
                ))}
              </select>
            </div>
          ) : timeFilter === "rango" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span>Rango Desde - Hasta</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Búsqueda Rápida</span>
              </label>
              <input
                type="text"
                placeholder="Cliente, RUC, Asesor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
              />
            </div>
          )}

          {/* Filter 4: Línea de Producto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-500" />
              <span>Línea de Producto</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={!isAccess1998 && (companyMode === "upconta" || companyMode === "firmas")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:opacity-80"
            >
              {isAccess1998 ? (
                <>
                  <option value="firmas">Todas las Ventas (Firmas &amp; Convenios)</option>
                  <option value="solo_firmas">Solo Ventas Firmas (&le; $100)</option>
                  <option value="solo_convenios">Solo Venta Convenios (&gt; $100)</option>
                </>
              ) : companyMode === "upconta" ? (
                <option value="upconta">Solo Línea UpConta (Sistemas &amp; ERP)</option>
              ) : companyMode === "firmas" ? (
                <option value="firmas">Solo Línea Firmas Electrónicas.ec</option>
              ) : (
                <>
                  <option value="all">Todas las Líneas (UpConta &amp; Firmas)</option>
                  <option value="upconta">Línea UpConta (Sistemas &amp; ERP)</option>
                  <option value="firmas">Línea Firmas Electrónicas.ec</option>
                </>
              )}
            </select>
          </div>

          {/* Filter 5: Asesor Comercial */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>Asesor Comercial</span>
            </label>
            <select
              value={selectedAdviser}
              onChange={(e) => setSelectedAdviser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all">
                {companyMode === "upconta"
                  ? "Todos los Asesores UpConta (Karla & David)"
                  : companyMode === "firmas"
                  ? "Todas las Asesoras Firmas (Salomé, Ismenia, Evelyn)"
                  : "Todos los Asesores (Equipo Completo)"}
              </option>
              {allAdvisers.map((adv) => (
                <option key={adv} value={adv}>
                  {adv}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= REGISTROS PRINCIPALES DE VENTAS (TOTAL FACTURADOS, CANTIDAD, TICKET, TOTAL UPCONTA Y FIRMAS) ================= */}
      <div className="space-y-4">
        {/* ROW 1: TOTAL FACTURADOS, CANTIDAD Y TICKET PROMEDIO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. TOTAL FACTURADOS */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0B2545] to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group hover:border-orange-500/50 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Total Facturado (Con IVA)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatCurrency(totalVentasConIva)}
                </div>
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="text-slate-400">Sin IVA:</span>
                  <span className="text-emerald-400 font-extrabold">{formatCurrency(totalVentasSinIva)}</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 2. CANTIDAD DE VENTAS */}
          <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Cantidad de Ventas
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {cantidadVentas} <span className="text-xs font-extrabold text-slate-500">operaciones</span>
                </div>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  Total de transacciones comerciales registradas
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 3. TICKET PROMEDIO */}
          <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 relative overflow-hidden group hover:border-purple-400 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ticket Promedio General
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(ticketPromedio)}
                </div>
                <p className="text-xs text-slate-500 font-medium pt-1">
                  Monto promedio facturado por venta
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                <Calculator className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: TOTAL DE VENTAS, CANTIDAD Y TICKET PROMEDIO DE CADA PRODUCTO (UPCONTA, FIRMAS Y CONVENIOS) */}
        <div className={`grid grid-cols-1 ${showBothProducts || isAccess1998 ? "lg:grid-cols-2" : "grid-cols-1"} gap-4`}>
          {/* UPCONTA: FACTURADO, CANTIDAD Y TICKET PROMEDIO */}
          {(companyMode === "upconta" || companyMode === "all" || companyMode === "locked") && (
            <div className="bg-gradient-to-br from-[#0B2545] via-[#003566] to-[#0B2545] text-white rounded-2xl p-5 shadow-md border border-orange-500/40 relative overflow-hidden group hover:border-orange-400 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-orange-500/20 border border-orange-400/30 rounded-xl text-orange-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                      <span>UpConta (Sistemas &amp; ERP)</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium">Facturación electrónica y software contable</p>
                  </div>
                </div>
                <span className="bg-orange-500/20 text-orange-300 border border-orange-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  UpConta
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Ventas</span>
                  <div className="text-lg sm:text-xl font-black text-white">{formatCurrency(totalVentasUpConta)}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Cantidad Ventas</span>
                  <div className="text-lg sm:text-xl font-black text-orange-400">
                    {cantidadUpConta} <span className="text-[10px] font-bold text-slate-300">vtas</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Ticket Promedio</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-400">{formatCurrency(ticketPromedioUpConta)}</div>
                </div>
              </div>
            </div>
          )}

          {/* FIRMAS / CONVENIOS: FACTURADO, CANTIDAD Y TICKET PROMEDIO */}
          {(companyMode === "firmas" || companyMode === "all" || companyMode === "locked") && (
            isAccess1998 ? (
              <>
                {/* 1. VENTAS FIRMAS (<=$100) */}
                <div className="bg-gradient-to-br from-[#002244] via-[#003366] to-[#002244] text-white rounded-2xl p-5 shadow-md border border-blue-500/40 relative overflow-hidden group hover:border-blue-400 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <span>Ventas Firmas</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium">Ventas registradas de firmas hasta $100</p>
                      </div>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      Ventas Firmas
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Ventas</span>
                      <div className="text-lg sm:text-xl font-black text-white">{formatCurrency(totalVentasFirmasNormal)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Cantidad Ventas</span>
                      <div className="text-lg sm:text-xl font-black text-blue-400">
                        {cantidadFirmasNormal} <span className="text-[10px] font-bold text-slate-300">firmas</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Ticket Promedio</span>
                      <div className="text-lg sm:text-xl font-black text-emerald-400">{formatCurrency(ticketPromedioFirmasNormal)}</div>
                    </div>
                  </div>
                </div>

                {/* 2. VENTA CONVENIOS (>$100) */}
                <div className="bg-gradient-to-br from-[#1E1145] via-[#2E1065] to-[#1E1145] text-white rounded-2xl p-5 shadow-md border border-purple-500/40 relative overflow-hidden group hover:border-purple-400 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <span>Venta Convenios</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 font-medium">Ventas registradas superiores a $100</p>
                      </div>
                    </div>
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                      Venta Convenios
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Ventas</span>
                      <div className="text-lg sm:text-xl font-black text-white">{formatCurrency(totalVentasConvenios)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Cantidad Ventas</span>
                      <div className="text-lg sm:text-xl font-black text-purple-400">
                        {cantidadConvenios} <span className="text-[10px] font-bold text-slate-300">convenios</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Ticket Promedio</span>
                      <div className="text-lg sm:text-xl font-black text-emerald-400">{formatCurrency(ticketPromedioConvenios)}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gradient-to-br from-[#002244] via-[#003366] to-[#002244] text-white rounded-2xl p-5 shadow-md border border-blue-500/40 relative overflow-hidden group hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <span>Firmas Electrónicas (ANF AC)</span>
                      </h4>
                      <p className="text-[11px] text-slate-300 font-medium">Certificados digitales y token criptográfico</p>
                    </div>
                  </div>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    Firmas ANF
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Total Ventas</span>
                    <div className="text-lg sm:text-xl font-black text-white">{formatCurrency(totalVentasFirmas)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Cantidad Ventas</span>
                    <div className="text-lg sm:text-xl font-black text-blue-400">
                      {cantidadFirmas} <span className="text-[10px] font-bold text-slate-300">firmas</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Ticket Promedio</span>
                    <div className="text-lg sm:text-xl font-black text-emerald-400">{formatCurrency(ticketPromedioFirmas)}</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* ================= 1. KPIS POR CANAL (NUEVAS, RENOVACIONES, SOCIOS, DISTRIBUIDORES) ================= */}
        <div className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Ventas Nuevas */}
            <div className="bg-white text-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-200/90 relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-50">
                <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Ventas Nuevas
                </span>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {cantidadVentas > 0 ? ((channelTotals.nueva.count / cantidadVentas) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="pt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {channelTotals.nueva.count} <span className="text-xs font-bold text-slate-500">ventas</span>
                </div>
                <div className="text-xs font-bold text-slate-600 flex items-center justify-between pt-1">
                  <span>Facturado Sin IVA:</span>
                  <span className="text-emerald-700 font-black">{formatCurrency(channelTotals.nueva.sinIva)}</span>
                </div>
                {isAccess1998 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-blue-600">Firmas: {channelTotals.nueva.firmasNormalCount}</span>
                    <span className="text-purple-600">Convenios: {channelTotals.nueva.conveniosCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KPI 2: Renovaciones */}
            <div className="bg-white text-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-blue-200/90 relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-blue-50">
                <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  Renovaciones
                </span>
                <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {cantidadVentas > 0 ? ((channelTotals.renovacion.count / cantidadVentas) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="pt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {channelTotals.renovacion.count} <span className="text-xs font-bold text-slate-500">ventas</span>
                </div>
                <div className="text-xs font-bold text-slate-600 flex items-center justify-between pt-1">
                  <span>Facturado Sin IVA:</span>
                  <span className="text-blue-700 font-black">{formatCurrency(channelTotals.renovacion.sinIva)}</span>
                </div>
                {isAccess1998 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-blue-600">Firmas: {channelTotals.renovacion.firmasNormalCount}</span>
                    <span className="text-purple-600">Convenios: {channelTotals.renovacion.conveniosCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KPI 3: Socios */}
            <div className="bg-white text-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-amber-200/90 relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-amber-50">
                <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-600" />
                  Ventas de Socios
                </span>
                <span className="text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {cantidadVentas > 0 ? ((channelTotals.socio.count / cantidadVentas) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="pt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {channelTotals.socio.count} <span className="text-xs font-bold text-slate-500">ventas</span>
                </div>
                <div className="text-xs font-bold text-slate-600 flex items-center justify-between pt-1">
                  <span>Facturado Sin IVA:</span>
                  <span className="text-amber-800 font-black">{formatCurrency(channelTotals.socio.sinIva)}</span>
                </div>
                {isAccess1998 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-blue-600">Firmas: {channelTotals.socio.firmasNormalCount}</span>
                    <span className="text-purple-600">Convenios: {channelTotals.socio.conveniosCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* KPI 4: Distribuidores */}
            <div className="bg-white text-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-purple-200/90 relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between pb-2 border-b border-purple-50">
                <span className="text-[11px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  Distribuidores
                </span>
                <span className="text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  {cantidadVentas > 0 ? ((channelTotals.distribuidor.count / cantidadVentas) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="pt-3 space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {channelTotals.distribuidor.count} <span className="text-xs font-bold text-slate-500">ventas</span>
                </div>
                <div className="text-xs font-bold text-slate-600 flex items-center justify-between pt-1">
                  <span>Facturado Sin IVA:</span>
                  <span className="text-purple-700 font-black">{formatCurrency(channelTotals.distribuidor.sinIva)}</span>
                </div>
                {isAccess1998 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-blue-600">Firmas: {channelTotals.distribuidor.firmasNormalCount}</span>
                    <span className="text-purple-600">Convenios: {channelTotals.distribuidor.conveniosCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. GRÁFICO DE BARRAS: CANTIDAD DE VENTAS POR CANAL ================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-wider">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                <span>Cantidad de Ventas por Canal (Nuevas, Renovaciones, Socios, Distribuidores)</span>
              </div>
              <p className="text-xs text-slate-500">
                {isAccess1998
                  ? "Comparativo de operaciones con dos barras por canal: Azul Ventas Firmas y Morado Venta Convenios"
                  : showBothProducts 
                  ? "Comparativo de operaciones con dos barras por canal: Naranja UpConta y Azul Firmas ANF" 
                  : "Comparativo de volumen de operaciones registrado para el período y filtros activos"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAccess1998 ? (
                <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    Ventas Firmas
                  </span>
                  <span className="flex items-center gap-1.5 text-purple-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    Venta Convenios
                  </span>
                </div>
              ) : showBothProducts && (
                <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    UpConta
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    Firmas
                  </span>
                </div>
              )}
              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Total: {cantidadVentas} operaciones
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelComparisonBarData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="canal" tick={{ fill: "#475569", fontSize: 12, fontWeight: 700 }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#0B2545] text-white p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1.5">
                          <p className="font-extrabold text-white border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                            <span>Canal: {d.canal}</span>
                            <span className="text-[10px] text-orange-400 font-bold">{d.pct.toFixed(1)}% del total</span>
                          </p>
                          <div className="space-y-1 pt-1 text-[11px]">
                            {isAccess1998 ? (
                              <>
                                <div className="flex items-center justify-between gap-4 text-blue-400 font-bold">
                                  <span>🔵 Ventas Firmas:</span>
                                  <span>{d.firmasNormalCantidad} firmas ({formatCurrency(d.firmasNormalMonto)})</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-purple-400 font-bold">
                                  <span>🟣 Venta Convenios:</span>
                                  <span>{d.conveniosCantidad} convenios ({formatCurrency(d.conveniosMonto)})</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-white font-extrabold border-t border-slate-700 pt-1">
                                  <span>Total Canal:</span>
                                  <span>{d.totalCantidad} ventas ({formatCurrency(d.totalMonto)})</span>
                                </div>
                              </>
                            ) : showBothProducts ? (
                              <>
                                <div className="flex items-center justify-between gap-4 text-orange-400 font-bold">
                                  <span>🟠 UpConta:</span>
                                  <span>{d.upcontaCantidad} ventas ({formatCurrency(d.upcontaMonto)})</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-blue-400 font-bold">
                                  <span>🔵 Firmas:</span>
                                  <span>{d.firmasCantidad} firmas ({formatCurrency(d.firmasMonto)})</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-white font-extrabold border-t border-slate-700 pt-1">
                                  <span>Total Canal:</span>
                                  <span>{d.totalCantidad} ventas ({formatCurrency(d.totalMonto)})</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-300">Cantidad:</span>
                                  <span className="font-black text-white">{d.totalCantidad} ventas</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-slate-300">Sin IVA:</span>
                                  <span className="font-bold text-emerald-400">{formatCurrency(d.totalMonto)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {isAccess1998 ? (
                  <>
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "8px", fontSize: "12px", fontWeight: "700" }} />
                    <Bar dataKey="firmasNormalCantidad" name="Ventas Firmas" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="conveniosCantidad" name="Venta Convenios" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  </>
                ) : showBothProducts ? (
                  <>
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: "8px", fontSize: "12px", fontWeight: "700" }} />
                    <Bar dataKey="upcontaCantidad" name="UpConta" fill="#F97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="firmasCantidad" name="Firmas" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </>
                ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                  <Bar dataKey="upcontaCantidad" name="UpConta" fill="#F97316" radius={[6, 6, 0, 0]} />
                ) : (
                  <Bar dataKey="firmasCantidad" name="Firmas" fill="#2563EB" radius={[6, 6, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ================= 3. 4 GRÁFICOS COMPARATIVOS MES A MES (CON DOS BARRAS: UPCONTA Y FIRMAS) ================= */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>4 Gráficos Comparativos Mes a Mes</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isAccess1998
                  ? "Comparativo mensual por canal con dos barras: Azul Ventas Firmas y Morado Venta Convenios"
                  : "Comparativo mensual por canal con dos barras: Naranja UpConta y Azul Firmas ANF"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200">
                {isAccess1998 ? (
                  <>
                    <span className="flex items-center gap-1 text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Ventas Firmas
                    </span>
                    <span className="flex items-center gap-1 text-purple-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                      Venta Convenios
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-orange-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                      UpConta
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Firmas
                    </span>
                  </>
                )}
              </div>
              {activeMonthNum && (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                  Mes en foco: {MONTHS_LIST[activeMonthNum - 1]?.name}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gráfico 1: Ventas Nuevas */}
            <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-50 pb-2">
                <div className="flex items-center gap-1.5 font-black text-emerald-800 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>1. Ventas Nuevas</span>
                </div>
                <span className="text-xs font-black text-emerald-700">
                  {monthlyChannelData.reduce((acc, curr) => acc + curr.nuevasTotal, 0)} vtas
                </span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChannelData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#64748B", fontWeight: 700 }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0B2545] text-white p-2.5 rounded-lg border border-slate-700 text-xs shadow-xl space-y-1">
                              <p className="font-extrabold text-emerald-400 border-b border-slate-700 pb-0.5">{d.fullName} - Nuevas</p>
                              {isAccess1998 ? (
                                <>
                                  <p className="text-blue-400 font-bold">🔵 Ventas Firmas: {d.nuevasFirmasNormal} ventas</p>
                                  <p className="text-purple-400 font-bold">🟣 Venta Convenios: {d.nuevasConvenios} convenios</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-orange-400 font-bold">🟠 UpConta: {d.nuevasUpconta} ventas</p>
                                  <p className="text-blue-400 font-bold">🔵 Firmas: {d.nuevasFirmas} firmas</p>
                                </>
                              )}
                              <p className="text-white font-extrabold border-t border-slate-700 pt-0.5">Total: {d.nuevasTotal} ventas</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {isAccess1998 ? (
                      <>
                        <Bar dataKey="nuevasFirmasNormal" name="Ventas Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="nuevasConvenios" name="Venta Convenios" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                      </>
                    ) : showBothProducts ? (
                      <>
                        <Bar dataKey="nuevasUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="nuevasFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                      </>
                    ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                      <Bar dataKey="nuevasUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                    ) : (
                      <Bar dataKey="nuevasFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Renovaciones */}
            <div className="bg-white border border-blue-200/90 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-blue-50 pb-2">
                <div className="flex items-center gap-1.5 font-black text-blue-800 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>2. Renovaciones</span>
                </div>
                <span className="text-xs font-black text-blue-700">
                  {monthlyChannelData.reduce((acc, curr) => acc + curr.renovTotal, 0)} vtas
                </span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChannelData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#64748B", fontWeight: 700 }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0B2545] text-white p-2.5 rounded-lg border border-slate-700 text-xs shadow-xl space-y-1">
                              <p className="font-extrabold text-blue-400 border-b border-slate-700 pb-0.5">{d.fullName} - Renovaciones</p>
                              {isAccess1998 ? (
                                <>
                                  <p className="text-blue-400 font-bold">🔵 Ventas Firmas: {d.renovFirmasNormal} ventas</p>
                                  <p className="text-purple-400 font-bold">🟣 Venta Convenios: {d.renovConvenios} convenios</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-orange-400 font-bold">🟠 UpConta: {d.renovUpconta} ventas</p>
                                  <p className="text-blue-400 font-bold">🔵 Firmas: {d.renovFirmas} firmas</p>
                                </>
                              )}
                              <p className="text-white font-extrabold border-t border-slate-700 pt-0.5">Total: {d.renovTotal} ventas</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {isAccess1998 ? (
                      <>
                        <Bar dataKey="renovFirmasNormal" name="Ventas Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="renovConvenios" name="Venta Convenios" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                      </>
                    ) : showBothProducts ? (
                      <>
                        <Bar dataKey="renovUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="renovFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                      </>
                    ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                      <Bar dataKey="renovUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                    ) : (
                      <Bar dataKey="renovFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 3: Socios */}
            <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-amber-50 pb-2">
                <div className="flex items-center gap-1.5 font-black text-amber-800 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>3. Ventas Socios</span>
                </div>
                <span className="text-xs font-black text-amber-800">
                  {monthlyChannelData.reduce((acc, curr) => acc + curr.sociosTotal, 0)} vtas
                </span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChannelData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#64748B", fontWeight: 700 }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0B2545] text-white p-2.5 rounded-lg border border-slate-700 text-xs shadow-xl space-y-1">
                              <p className="font-extrabold text-amber-400 border-b border-slate-700 pb-0.5">{d.fullName} - Socios</p>
                              {isAccess1998 ? (
                                <>
                                  <p className="text-blue-400 font-bold">🔵 Ventas Firmas: {d.sociosFirmasNormal} ventas</p>
                                  <p className="text-purple-400 font-bold">🟣 Venta Convenios: {d.sociosConvenios} convenios</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-orange-400 font-bold">🟠 UpConta: {d.sociosUpconta} ventas</p>
                                  <p className="text-blue-400 font-bold">🔵 Firmas: {d.sociosFirmas} firmas</p>
                                </>
                              )}
                              <p className="text-white font-extrabold border-t border-slate-700 pt-0.5">Total: {d.sociosTotal} ventas</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {isAccess1998 ? (
                      <>
                        <Bar dataKey="sociosFirmasNormal" name="Ventas Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="sociosConvenios" name="Venta Convenios" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                      </>
                    ) : showBothProducts ? (
                      <>
                        <Bar dataKey="sociosUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="sociosFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                      </>
                    ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                      <Bar dataKey="sociosUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                    ) : (
                      <Bar dataKey="sociosFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 4: Distribuidores */}
            <div className="bg-white border border-purple-200/90 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-purple-50 pb-2">
                <div className="flex items-center gap-1.5 font-black text-purple-800 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>4. Distribuidores</span>
                </div>
                <span className="text-xs font-black text-purple-700">
                  {monthlyChannelData.reduce((acc, curr) => acc + curr.distTotal, 0)} vtas
                </span>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChannelData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="mes" tick={{ fontSize: 9, fill: "#64748B", fontWeight: 700 }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0B2545] text-white p-2.5 rounded-lg border border-slate-700 text-xs shadow-xl space-y-1">
                              <p className="font-extrabold text-purple-400 border-b border-slate-700 pb-0.5">{d.fullName} - Distribuidores</p>
                              {isAccess1998 ? (
                                <>
                                  <p className="text-blue-400 font-bold">🔵 Ventas Firmas: {d.distFirmasNormal} ventas</p>
                                  <p className="text-purple-400 font-bold">🟣 Venta Convenios: {d.distConvenios} convenios</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-orange-400 font-bold">🟠 UpConta: {d.distUpconta} ventas</p>
                                  <p className="text-blue-400 font-bold">🔵 Firmas: {d.distFirmas} firmas</p>
                                </>
                              )}
                              <p className="text-white font-extrabold border-t border-slate-700 pt-0.5">Total: {d.distTotal} ventas</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {isAccess1998 ? (
                      <>
                        <Bar dataKey="distFirmasNormal" name="Ventas Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="distConvenios" name="Venta Convenios" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                      </>
                    ) : showBothProducts ? (
                      <>
                        <Bar dataKey="distUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="distFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                      </>
                    ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                      <Bar dataKey="distUpconta" name="UpConta" fill="#F97316" radius={[3, 3, 0, 0]} />
                    ) : (
                      <Bar dataKey="distFirmas" name="Firmas" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4. GRÁFICOS LINEALES DE EVOLUCIÓN (SEMANAL / MENSUAL CON 2 LÍNEAS) - ARRIBA DEL LISTADO ================= */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAllYear ? "Evolución Mensual de Ventas" : "Evolución Semanal de Ventas"} (Cantidad y Monto)
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {isAllYear
                  ? "Evolución mes a mes a lo largo del año consolidado"
                  : "Evolución semana a semana (Viernes a Jueves) del mes seleccionado"}
                {isAccess1998 
                  ? " — Dos líneas: Azul Ventas Firmas y Morado Venta Convenios"
                  : showBothProducts && " — Dos líneas: Naranja UpConta y Azul Firmas ANF"}
              </p>
            </div>
            {isAccess1998 ? (
              <div className="flex items-center gap-3 text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Ventas Firmas
                </span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  Venta Convenios
                </span>
              </div>
            ) : showBothProducts && (
              <div className="flex items-center gap-3 text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200">
                <span className="flex items-center gap-1.5 text-orange-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  UpConta
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Firmas
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico Lineal 1: Cantidad de Ventas */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  {isAllYear ? "Evolución Mensual: Cantidad de Ventas" : "Evolución Semanal: Cantidad de Ventas"}
                </span>
                <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {evolutionChartData.reduce((acc, curr) => acc + curr.totalCantidad, 0)} operaciones
                </span>
              </div>
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionChartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#475569", fontWeight: 700 }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0B2545] text-white p-2.5 rounded-xl border border-slate-700 text-xs shadow-2xl space-y-1">
                              <p className="font-extrabold text-white border-b border-slate-700 pb-1">{d.label || d.periodo}</p>
                              {isAccess1998 ? (
                                <>
                                  <p className="font-bold text-blue-400">🔵 Ventas Firmas: {d.firmasNormalCantidad} ventas</p>
                                  <p className="font-bold text-purple-400">🟣 Venta Convenios: {d.conveniosCantidad} convenios</p>
                                  <p className="font-black text-emerald-400 border-t border-slate-700 pt-0.5">Total: {d.totalCantidad} operaciones</p>
                                </>
                              ) : showBothProducts ? (
                                <>
                                  <p className="font-bold text-orange-400">🟠 UpConta: {d.upcontaCantidad} ventas</p>
                                  <p className="font-bold text-blue-400">🔵 Firmas: {d.firmasCantidad} firmas</p>
                                  <p className="font-black text-emerald-400 border-t border-slate-700 pt-0.5">Total: {d.totalCantidad} operaciones</p>
                                </>
                              ) : (
                                <p className="font-black text-blue-400 pt-1">{d.totalCantidad} ventas realizadas</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {isAccess1998 ? (
                      <>
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "6px", fontSize: "11px", fontWeight: "700" }} />
                        <Line
                          type="monotone"
                          dataKey="firmasNormalCantidad"
                          name="Ventas Firmas"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#1D4ED8" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="conveniosCantidad"
                          name="Venta Convenios"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#7C3AED" }}
                        />
                      </>
                    ) : showBothProducts ? (
                      <>
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "6px", fontSize: "11px", fontWeight: "700" }} />
                        <Line
                          type="monotone"
                          dataKey="upcontaCantidad"
                          name="UpConta"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#F97316", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#EA580C" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="firmasCantidad"
                          name="Firmas"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#1D4ED8" }}
                        />
                      </>
                    ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                      <Line
                        type="monotone"
                        dataKey="upcontaCantidad"
                        name="UpConta"
                        stroke="#F97316"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#F97316", strokeWidth: 2, stroke: "#FFFFFF" }}
                        activeDot={{ r: 6, fill: "#EA580C" }}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="firmasCantidad"
                        name="Firmas"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                        activeDot={{ r: 6, fill: "#1D4ED8" }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico Lineal 2: Monto Facturado */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  {isAllYear ? "Evolución Mensual: Monto Facturado ($ Sin IVA)" : "Evolución Semanal: Monto Facturado ($ Sin IVA)"}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {formatCurrency(evolutionChartData.reduce((acc, curr) => acc + curr.totalMonto, 0))}
                </span>
              </div>
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionChartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 10, fill: "#475569", fontWeight: 700 }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94A3B8" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                    />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#0B2545] text-white p-2.5 rounded-xl border border-slate-700 text-xs shadow-2xl space-y-1">
                              <p className="font-extrabold text-white border-b border-slate-700 pb-1">{d.label || d.periodo}</p>
                              {isAccess1998 ? (
                                <>
                                  <p className="font-bold text-blue-400">🔵 Ventas Firmas: {formatCurrency(d.firmasNormalMonto)}</p>
                                  <p className="font-bold text-purple-400">🟣 Venta Convenios: {formatCurrency(d.conveniosMonto)}</p>
                                  <p className="font-black text-emerald-400 border-t border-slate-700 pt-0.5">Total: {formatCurrency(d.totalMonto)}</p>
                                </>
                              ) : showBothProducts ? (
                                <>
                                  <p className="font-bold text-orange-400">🟠 UpConta: {formatCurrency(d.upcontaMonto)}</p>
                                  <p className="font-bold text-blue-400">🔵 Firmas: {formatCurrency(d.firmasMonto)}</p>
                                  <p className="font-black text-emerald-400 border-t border-slate-700 pt-0.5">Total: {formatCurrency(d.totalMonto)}</p>
                                </>
                              ) : (
                                <p className="font-black text-emerald-400 pt-1">Sin IVA: {formatCurrency(d.totalMonto)}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {isAccess1998 ? (
                      <>
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "6px", fontSize: "11px", fontWeight: "700" }} />
                        <Line
                          type="monotone"
                          dataKey="firmasNormalMonto"
                          name="Ventas Firmas ($)"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#1D4ED8" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="conveniosMonto"
                          name="Venta Convenios ($)"
                          stroke="#8B5CF6"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#7C3AED" }}
                        />
                      </>
                    ) : showBothProducts ? (
                      <>
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: "6px", fontSize: "11px", fontWeight: "700" }} />
                        <Line
                          type="monotone"
                          dataKey="upcontaMonto"
                          name="UpConta ($)"
                          stroke="#F97316"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#F97316", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#EA580C" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="firmasMonto"
                          name="Firmas ($)"
                          stroke="#2563EB"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#1D4ED8" }}
                        />
                      </>
                    ) : companyMode === "upconta" || selectedCategory === "upconta" ? (
                      <Line
                        type="monotone"
                        dataKey="upcontaMonto"
                        name="UpConta ($)"
                        stroke="#F97316"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#F97316", strokeWidth: 2, stroke: "#FFFFFF" }}
                        activeDot={{ r: 6, fill: "#EA580C" }}
                      />
                    ) : (
                      <Line
                        type="monotone"
                        dataKey="firmasMonto"
                        name="Firmas ($)"
                        stroke="#2563EB"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                        activeDot={{ r: 6, fill: "#1D4ED8" }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 5. LISTADO DE TIPO DE PRODUCTO / PLAN (ABAJO DE LA EVOLUCIÓN) ================= */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-orange-500" />
                <span>Listado por Tipo de Producto y Plan</span>
              </div>
              <p className="text-xs text-slate-500">
                Planes facturación, contables y firmas: Light, Base, ERP Start, etc. con desglose de canales y ticket promedio
              </p>
            </div>

            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar plan o producto..."
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Tipo de Producto / Plan</th>
                  <th className="py-3 px-2 text-center text-emerald-700">Nuevas</th>
                  <th className="py-3 px-2 text-center text-blue-700">Renov.</th>
                  <th className="py-3 px-2 text-center text-amber-700">Socios</th>
                  <th className="py-3 px-2 text-center text-purple-700">Dist.</th>
                  <th className="py-3 px-3 text-center bg-slate-100/60 font-black">Cantidad</th>
                  <th className="py-3 px-3 text-right">Monto (Sin IVA)</th>
                  <th className="py-3 px-3 text-right text-slate-900 font-black">Total (Con IVA)</th>
                  <th className="py-3 px-3 text-right text-purple-800 font-black">Ticket Prom.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProductPlanRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-bold">
                      No se encontraron planes para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  filteredProductPlanRows.map((row, idx) => (
                    <tr key={row.plan} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40 hover:bg-slate-50"}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900">{row.plan}</span>
                            {isAccess1998 && row.conveniosCount > 0 && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                Convenio (&gt; $100): {row.conveniosCount} vtas
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{row.producto}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                        {row.nuevas > 0 ? row.nuevas : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-blue-700">
                        {row.renovaciones > 0 ? row.renovaciones : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                        {row.socios > 0 ? row.socios : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-purple-700">
                        {row.distribuidores > 0 ? row.distribuidores : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-100/40">
                        {row.cantidad}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                        {formatCurrency(row.montoSinIva)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {formatCurrency(row.totalConIva)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-purple-700">
                        {formatCurrency(row.ticketPromedio)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredProductPlanRows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black text-xs border-t-2 border-slate-900">
                    <td className="py-3 px-3 uppercase tracking-wider text-[11px]">
                      TOTAL CONSOLIDADO ({filteredProductPlanRows.length} planes)
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-300">
                      {filteredProductPlanRows.reduce((a, b) => a + b.nuevas, 0)}
                    </td>
                    <td className="py-3 px-2 text-center text-blue-300">
                      {filteredProductPlanRows.reduce((a, b) => a + b.renovaciones, 0)}
                    </td>
                    <td className="py-3 px-2 text-center text-amber-300">
                      {filteredProductPlanRows.reduce((a, b) => a + b.socios, 0)}
                    </td>
                    <td className="py-3 px-2 text-center text-purple-300">
                      {filteredProductPlanRows.reduce((a, b) => a + b.distribuidores, 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-orange-400 text-sm">
                      {filteredProductPlanRows.reduce((a, b) => a + b.cantidad, 0)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-300">
                      {formatCurrency(filteredProductPlanRows.reduce((a, b) => a + b.montoSinIva, 0))}
                    </td>
                    <td className="py-3 px-3 text-right text-white text-sm">
                      {formatCurrency(filteredProductPlanRows.reduce((a, b) => a + b.totalConIva, 0))}
                    </td>
                    <td className="py-3 px-3 text-right text-purple-300">
                      {formatCurrency(
                        filteredProductPlanRows.reduce((a, b) => a + b.cantidad, 0) > 0
                          ? filteredProductPlanRows.reduce((a, b) => a + b.montoSinIva, 0) /
                              filteredProductPlanRows.reduce((a, b) => a + b.cantidad, 0)
                          : 0
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
