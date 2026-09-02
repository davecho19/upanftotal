import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Calendar,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Award,
  Search,
  Sparkles,
  Layers,
  Table,
  Zap,
  Clock,
  Building2,
  ShieldCheck,
  Calculator,
  FileCheck,
  Flame
} from "lucide-react";

import { INITIAL_OFFLINE_SALES } from "../salesData";

// Types
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
}

const COLORS = ["#0B2545", "#F97316", "#10B981", "#6366F1", "#8B5CF6", "#EC4899", "#14B8A6"];

function normalizeDateString(dateStr: string): string {
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

const CustomBarTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B2545] text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl space-y-2 text-xs font-sans z-50">
        <p className="font-black text-sm text-white border-b border-slate-700/80 pb-1.5 flex items-center justify-between gap-4">
          <span>{label}</span>
          <span className="text-[10px] bg-orange-500/30 text-orange-300 font-extrabold px-2 py-0.5 rounded-full">
            Asesor
          </span>
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            let labelColor = "#38BDF8"; // Bright Sky Blue for UpConta
            if (entry.dataKey === "firmas") labelColor = "#FACC15"; // Bright Yellow for Firmas
            if (entry.dataKey === "cantidad") labelColor = "#FB923C"; // Bright Orange for Cantidad

            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-6 font-bold py-0.5">
                <span className="flex items-center gap-1.5" style={{ color: labelColor }}>
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: labelColor }}></span>
                  {entry.name}:
                </span>
                <span className="text-white font-black text-xs">
                  {entry.dataKey === "cantidad" ? `${entry.value} ventas` : formatCurrency ? formatCurrency(Number(entry.value)) : `$${entry.value}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const getCurrentMonthString = (): string => {
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

const getMonthDateRange = (monthStr: string) => {
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
}

const normalizeText = (str: string): string => {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export function DashboardModule({ companyMode = "all" }: DashboardModuleProps) {
  const currentMonthString = getCurrentMonthString();
  const defaultRange = getMonthDateRange(currentMonthString);

  const [sales, setSales] = useState<SaleTransaction[]>(INITIAL_OFFLINE_SALES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("En vivo");
  const [syncStatus, setSyncStatus] = useState<"success" | "error" | "loading">("success");

  // Filters State
  const [timeFilter, setTimeFilter] = useState<"total" | "mes" | "mes_anterior" | "ano" | "semana" | "rango">("mes");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthString);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedAdviser, setSelectedAdviser] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    companyMode === "upconta" ? "upconta" : companyMode === "firmas" ? "firmas" : "all"
  );
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync category filter if companyMode changes
  useEffect(() => {
    if (companyMode === "upconta") {
      setSelectedCategory("upconta");
      setSelectedAdviser("all");
      setCompCategory("upconta");
    } else if (companyMode === "firmas") {
      setSelectedCategory("firmas");
      setSelectedAdviser("all");
      setCompCategory("firmas");
    } else {
      setSelectedCategory("all");
      setSelectedAdviser("all");
      setCompCategory("all");
    }
  }, [companyMode]);

  // Keep date range synced when selectedMonth changes
  useEffect(() => {
    const range = getMonthDateRange(selectedMonth);
    setStartDate(range.start);
    setEndDate(range.end);
  }, [selectedMonth]);

  // Sub tab view inside dashboard
  const [activeViewTab, setActiveViewTab] = useState<"overview" | "producto" | "comisiones" | "detalle">("overview");

  // Dynamic week ranges for selected month
  const dynamicWeekRanges = useMemo(() => {
    return getWeekRangesForMonth(selectedMonth);
  }, [selectedMonth]);

  // Fetch Google Sheets Data
  const fetchGoogleSheetData = async () => {
    setIsLoading(true);
    setSyncStatus("loading");
    try {
      let csvText = "";
      
      // Attempt 1: Local server proxy
      try {
        const resProxy = await fetch("/api/sheets");
        if (resProxy.ok) {
          const t = await resProxy.text();
          if (t && !t.trim().startsWith("<")) {
            csvText = t;
          }
        }
      } catch (e) {
        console.warn("Proxy fetch skipped/failed:", e);
      }

      // Attempt 2: Direct Google Sheets export URL
      if (!csvText) {
        try {
          const primaryUrl = "https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0";
          const res0 = await fetch(primaryUrl);
          if (res0.ok) {
            const t = await res0.text();
            if (t && !t.trim().startsWith("<")) {
              csvText = t;
            }
          }
        } catch (e) {
          console.warn("Direct fetch skipped/failed:", e);
        }
      }

      // Attempt 3: AllOrigins CORS proxy fallback
      if (!csvText) {
        try {
          const corsUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0");
          const resCors = await fetch(corsUrl);
          if (resCors.ok) {
            const t = await resCors.text();
            if (t && !t.trim().startsWith("<")) {
              csvText = t;
            }
          }
        } catch (e) {
          console.warn("CORS proxy fetch failed:", e);
        }
      }

      if (csvText) {
        const parsedSales = parseSalesCSV(csvText);
        if (parsedSales.length > 0) {
          setSales(parsedSales.slice(0, 5000));
          setSyncStatus("success");
          return;
        }
      }

      // Default fallback to INITIAL_OFFLINE_SALES
      setSales(INITIAL_OFFLINE_SALES.slice(0, 5000));
      setSyncStatus("success");
    } catch (error) {
      console.warn("Using offline dataset due to Google Sheets sync error:", error);
      setSales(INITIAL_OFFLINE_SALES.slice(0, 5000));
      setSyncStatus("error");
    } finally {
      setIsLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  };

  useEffect(() => {
    fetchGoogleSheetData();
  }, []);

  // CSV Parser (up to 5000 records)
  const parseSalesCSV = (csvText: string): SaleTransaction[] => {
    const lines = csvText.split("\n");
    const result: SaleTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (result.length >= 5000) break;
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
        
        let rawMes = cols[13] ? cols[13].trim() : "";
        let mes = rawMes;
        if (!mes || mes === "Desconocido") {
          mes = getMonthFromDate(fecha);
        }

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
          mes
        });
      }
    }
    return result;
  };

  const getMonthFromDate = (dateStr: string) => {
    const norm = normalizeDateString(dateStr);
    if (!norm) return "Desconocido";
    const parts = norm.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${months[monthNum - 1]} ${year}`;
      }
    }
    return "Desconocido";
  };

  // Helper check for UpConta vs Firmas sale line
  const isUpContaSale = (item: SaleTransaction) => {
    const prod = (item.producto || "").toLowerCase();
    const plan = (item.plan || "").toLowerCase();
    return prod.includes("plan") || prod.includes("facturaci") || prod.includes("erp") || prod.includes("contador") || prod.includes("upconta") || plan.includes("erp") || plan.includes("contador");
  };

  // Base sales filtered by company mode:
  // - "upconta" (170622): only Karla Haro & David Santander, and only UpConta products
  // - "firmas" (123456): only Salomé Estrella, Ismenia Escalona, Evelyn Narváez, and only Firmas products
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
        return isAllowedAdv && isFir;
      });
    }
    return sales;
  }, [sales, companyMode]);

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
    if (monthFilterValue === "all" || monthFilterValue === "all_year") return true;
    
    const mLower = monthFilterValue.toLowerCase();
    const itemMesLower = (item.mes || "").toLowerCase();
    const dateStr = item.fecha || "";

    if (itemMesLower === mLower) return true;

    if (mLower.includes("july") || mLower.includes("julio")) {
      return itemMesLower.includes("july") || itemMesLower.includes("julio") || dateStr.startsWith("2026-07");
    }
    if (mLower.includes("june") || mLower.includes("junio")) {
      return itemMesLower.includes("june") || itemMesLower.includes("junio") || dateStr.startsWith("2026-06");
    }
    if (mLower.includes("may") || mLower.includes("mayo")) {
      return itemMesLower.includes("may") || itemMesLower.includes("mayo") || dateStr.startsWith("2026-05");
    }
    if (mLower.includes("april") || mLower.includes("abril")) {
      return itemMesLower.includes("april") || itemMesLower.includes("abril") || dateStr.startsWith("2026-04");
    }
    if (mLower.includes("march") || mLower.includes("marzo")) {
      return itemMesLower.includes("march") || itemMesLower.includes("marzo") || dateStr.startsWith("2026-03");
    }
    if (mLower.includes("february") || mLower.includes("febrero")) {
      return itemMesLower.includes("february") || itemMesLower.includes("febrero") || dateStr.startsWith("2026-02");
    }
    if (mLower.includes("january") || mLower.includes("enero")) {
      return itemMesLower.includes("january") || itemMesLower.includes("enero") || dateStr.startsWith("2026-01");
    }
    if (mLower.includes("august") || mLower.includes("agosto")) {
      return itemMesLower.includes("august") || itemMesLower.includes("agosto") || dateStr.startsWith("2026-08");
    }
    if (mLower.includes("september") || mLower.includes("septiembre")) {
      return itemMesLower.includes("september") || itemMesLower.includes("septiembre") || dateStr.startsWith("2026-09");
    }
    if (mLower.includes("october") || mLower.includes("octubre")) {
      return itemMesLower.includes("october") || itemMesLower.includes("octubre") || dateStr.startsWith("2026-10");
    }
    if (mLower.includes("november") || mLower.includes("noviembre")) {
      return itemMesLower.includes("november") || itemMesLower.includes("noviembre") || dateStr.startsWith("2026-11");
    }
    if (mLower.includes("december") || mLower.includes("diciembre")) {
      return itemMesLower.includes("december") || itemMesLower.includes("diciembre") || dateStr.startsWith("2026-12");
    }

    return itemMesLower.includes(mLower);
  };

  // State for 4th Comparative Month module
  const [compFilterMode, setCompFilterMode] = useState<"mes_semana" | "rango_fechas">("mes_semana");
  const [compMonthA, setCompMonthA] = useState<string>("June 2026");
  const [compMonthB, setCompMonthB] = useState<string>("July 2026");
  const [compWeek, setCompWeek] = useState<string>("all");
  const [compCategory, setCompCategory] = useState<string>("all");
  const [compStartDateA, setCompStartDateA] = useState<string>("2026-06-01");
  const [compEndDateA, setCompEndDateA] = useState<string>("2026-06-30");
  const [compStartDateB, setCompStartDateB] = useState<string>("2026-07-01");
  const [compEndDateB, setCompEndDateB] = useState<string>("2026-07-31");

  // Keep comparative date ranges synced when compMonthA or compMonthB changes
  useEffect(() => {
    const rA = getMonthDateRange(compMonthA);
    const rB = getMonthDateRange(compMonthB);
    setCompStartDateA(rA.start);
    setCompEndDateA(rA.end);
    setCompStartDateB(rB.start);
    setCompEndDateB(rB.end);
  }, [compMonthA, compMonthB]);

  // 1. Sales dataset strictly for CHARTS and REPORTE COMISIONES (Only affected by MES filter)
  const salesForChartsAndCommissions = useMemo(() => {
    return baseSales.filter(item => {
      // Adviser filter
      if (selectedAdviser !== "all" && item.asesor.toLowerCase() !== selectedAdviser.toLowerCase()) {
        return false;
      }

      // Product Line filter (UpConta vs Firmas)
      if (selectedCategory !== "all") {
        const isUp = isUpContaSale(item);
        if (selectedCategory === "upconta" && !isUp) return false;
        if (selectedCategory === "firmas" && isUp) return false;
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

  // Sorted Sales for Detalle view & Latest Sale Callout
  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => (b.fecha > a.fecha ? 1 : b.fecha < a.fecha ? -1 : 0));
  }, [filteredSales]);

  const latestSale = sortedSales.length > 0 ? sortedSales[0] : null;

  // Breakdown metrics for KPI cards (3 rows of 3 matching brand guidelines)
  const totalVentasMonto = useMemo(() => filteredSales.reduce((acc, curr) => acc + curr.totalSinIva, 0), [filteredSales]);
  const totalVentasSinIva = totalVentasMonto;
  const cantidadVentas = filteredSales.length;
  const ticketPromedio = cantidadVentas > 0 ? totalVentasMonto / cantidadVentas : 0;

  const salesUpConta = useMemo(() => filteredSales.filter(isUpContaSale), [filteredSales]);
  const salesFirmas = useMemo(() => filteredSales.filter(s => !isUpContaSale(s)), [filteredSales]);

  const totalVentasUpConta = useMemo(() => salesUpConta.reduce((acc, curr) => acc + curr.totalSinIva, 0), [salesUpConta]);
  const cantidadUpConta = salesUpConta.length;
  const ticketPromedioUpConta = cantidadUpConta > 0 ? totalVentasUpConta / cantidadUpConta : 0;

  const totalVentasFirmas = useMemo(() => salesFirmas.reduce((acc, curr) => acc + curr.totalSinIva, 0), [salesFirmas]);
  const cantidadFirmas = salesFirmas.length;
  const ticketPromedioFirmas = cantidadFirmas > 0 ? totalVentasFirmas / cantidadFirmas : 0;

  // Dynamic Commission Pool
  const valorComisionTotal = useMemo(() => {
    let totalCom = 0;
    const adviserTotals: Record<string, { upconta: number; firmas: number; total: number }> = {};

    filteredSales.forEach(s => {
      if (!adviserTotals[s.asesor]) adviserTotals[s.asesor] = { upconta: 0, firmas: 0, total: 0 };
      if (isUpContaSale(s)) {
        adviserTotals[s.asesor].upconta += s.totalSinIva;
      } else {
        adviserTotals[s.asesor].firmas += s.totalSinIva;
      }
      adviserTotals[s.asesor].total += s.totalSinIva;
    });

    Object.values(adviserTotals).forEach(adv => {
      let comm = 0;
      if (adv.total >= 5000) comm = adv.total * 0.047;
      else if (adv.total >= 4000) comm = adv.total * 0.0345;
      else if (adv.total >= 3000) comm = adv.total * 0.0035;
      totalCom += comm;
    });

    return totalCom;
  }, [filteredSales]);

  // Dynamic Chart 1: Adviser Chart (Uses salesForChartsAndCommissions)
  const adviserChartData = useMemo(() => {
    const map: Record<string, { name: string; ventas: number; cantidad: number; upconta: number; firmas: number }> = {};
    
    allAdvisers.forEach(name => {
      map[name] = { name, ventas: 0, cantidad: 0, upconta: 0, firmas: 0 };
    });

    salesForChartsAndCommissions.forEach(s => {
      if (!map[s.asesor]) {
        map[s.asesor] = { name: s.asesor, ventas: 0, cantidad: 0, upconta: 0, firmas: 0 };
      }
      map[s.asesor].ventas += s.totalSinIva;
      map[s.asesor].cantidad += 1;
      if (isUpContaSale(s)) {
        map[s.asesor].upconta += s.totalSinIva;
      } else {
        map[s.asesor].firmas += s.totalSinIva;
      }
    });

    return Object.values(map).sort((a, b) => b.ventas - a.ventas);
  }, [salesForChartsAndCommissions, allAdvisers]);

  // Dynamic Chart 2: Product Chart (Uses salesForChartsAndCommissions)
  const productChartData = useMemo(() => {
    const map: Record<string, { producto: string; linea: string; monto: number; cantidad: number }> = {};

    salesForChartsAndCommissions.forEach(s => {
      const prodName = s.producto || "Otros";
      if (!map[prodName]) {
        const isUp = isUpContaSale(s);
        map[prodName] = { producto: prodName, linea: isUp ? "UpConta" : "Firmas", monto: 0, cantidad: 0 };
      }
      map[prodName].monto += s.totalSinIva;
      map[prodName].cantidad += 1;
    });

    return Object.values(map).sort((a, b) => b.monto - a.monto);
  }, [salesForChartsAndCommissions]);

  // 3 NEW WEEKLY QUANTITY CHARTS (General, UpConta, Firmas)
  const weeklyDataGeneral = useMemo(() => {
    const weeks = [1, 2, 3, 4, 5].map(w => ({
      semana: `Semana ${w}`,
      weekNum: w,
      cantidadVentas: 0,
      cantidadProductos: 0
    }));

    salesForChartsAndCommissions.forEach(s => {
      const wInfo = getFridayToThursdayWeek(s.fecha);
      const idx = wInfo.weekNumber - 1;
      if (weeks[idx]) {
        weeks[idx].cantidadVentas += 1;
        weeks[idx].cantidadProductos += 1;
      }
    });

    return weeks;
  }, [salesForChartsAndCommissions]);

  const weeklyDataUpConta = useMemo(() => {
    const weeks = [1, 2, 3, 4, 5].map(w => ({
      semana: `Semana ${w}`,
      weekNum: w,
      cantidadVentas: 0,
      cantidadProductos: 0
    }));

    salesForChartsAndCommissions.filter(isUpContaSale).forEach(s => {
      const wInfo = getFridayToThursdayWeek(s.fecha);
      const idx = wInfo.weekNumber - 1;
      if (weeks[idx]) {
        weeks[idx].cantidadVentas += 1;
        weeks[idx].cantidadProductos += 1;
      }
    });

    return weeks;
  }, [salesForChartsAndCommissions]);

  const weeklyDataFirmas = useMemo(() => {
    const weeks = [1, 2, 3, 4, 5].map(w => ({
      semana: `Semana ${w}`,
      weekNum: w,
      cantidadVentas: 0,
      cantidadProductos: 0
    }));

    salesForChartsAndCommissions.filter(s => !isUpContaSale(s)).forEach(s => {
      const wInfo = getFridayToThursdayWeek(s.fecha);
      const idx = wInfo.weekNumber - 1;
      if (weeks[idx]) {
        weeks[idx].cantidadVentas += 1;
        weeks[idx].cantidadProductos += 1;
      }
    });

    return weeks;
  }, [salesForChartsAndCommissions]);

  // 4th COMPARATIVE MODULE BETWEEN MONTHS, WEEKS AND DATE RANGES
  const comparativeMetrics = useMemo(() => {
    let salesA: SaleTransaction[] = [];
    let salesB: SaleTransaction[] = [];
    let labelA = "";
    let labelB = "";

    const matchesCategory = (item: SaleTransaction) => {
      if (compCategory !== "all") {
        const isUp = isUpContaSale(item);
        if (compCategory === "upconta" && !isUp) return false;
        if (compCategory === "firmas" && isUp) return false;
      }
      return true;
    };

    if (compFilterMode === "mes_semana") {
      labelA = `${getSpanishMonthLabel(compMonthA)}${compWeek !== "all" ? ` (Sem ${compWeek})` : ""}`;
      labelB = `${getSpanishMonthLabel(compMonthB)}${compWeek !== "all" ? ` (Sem ${compWeek})` : ""}`;

      const filterFn = (item: SaleTransaction, targetMonth: string) => {
        if (!matchesCategory(item)) return false;
        if (!matchMonthFilter(item, targetMonth)) return false;
        if (compWeek !== "all") {
          const wInfo = getFridayToThursdayWeek(item.fecha);
          if (wInfo.weekNumber !== parseInt(compWeek, 10)) return false;
        }
        return true;
      };

      salesA = baseSales.filter(s => filterFn(s, compMonthA));
      salesB = baseSales.filter(s => filterFn(s, compMonthB));
    } else {
      // Custom Date Range Comparison
      const formatDisplayDate = (dStr: string) => {
        if (!dStr) return "";
        const [y, m, d] = dStr.split("-");
        return `${d}/${m}/${y}`;
      };

      labelA = compStartDateA && compEndDateA
        ? `Rango A (${formatDisplayDate(compStartDateA)} - ${formatDisplayDate(compEndDateA)})`
        : "Período A";
      labelB = compStartDateB && compEndDateB
        ? `Rango B (${formatDisplayDate(compStartDateB)} - ${formatDisplayDate(compEndDateB)})`
        : "Período B";

      const filterRange = (item: SaleTransaction, start: string, end: string) => {
        if (!matchesCategory(item)) return false;
        const f = item.fecha || "";
        if (start && f < start) return false;
        if (end && f > end) return false;
        return true;
      };

      salesA = baseSales.filter(s => filterRange(s, compStartDateA, compEndDateA));
      salesB = baseSales.filter(s => filterRange(s, compStartDateB, compEndDateB));
    }

    const getStats = (salesList: SaleTransaction[]) => {
      const up = salesList.filter(isUpContaSale);
      const fir = salesList.filter(s => !isUpContaSale(s));
      const totalMonto = salesList.reduce((acc, curr) => acc + curr.totalSinIva, 0);
      const totalUpMonto = up.reduce((acc, curr) => acc + curr.totalSinIva, 0);
      const totalFirMonto = fir.reduce((acc, curr) => acc + curr.totalSinIva, 0);
      const qtyTotal = salesList.length;
      const qtyUp = up.length;
      const qtyFir = fir.length;
      const ticket = qtyTotal > 0 ? totalMonto / qtyTotal : 0;

      return {
        totalMonto,
        totalUpMonto,
        totalFirMonto,
        qtyTotal,
        qtyUp,
        qtyFir,
        ticket
      };
    };

    const statsA = getStats(salesA);
    const statsB = getStats(salesB);

    return {
      labelA,
      labelB,
      statsA,
      statsB,
      chartData: [
        {
          metric: "UpConta ($)",
          periodoA: statsA.totalUpMonto,
          periodoB: statsB.totalUpMonto,
          [compMonthA]: statsA.totalUpMonto,
          [compMonthB]: statsB.totalUpMonto
        },
        {
          metric: "Firmas.ec ($)",
          periodoA: statsA.totalFirMonto,
          periodoB: statsB.totalFirMonto,
          [compMonthA]: statsA.totalFirMonto,
          [compMonthB]: statsB.totalFirMonto
        },
        {
          metric: "Ventas Totales ($)",
          periodoA: statsA.totalMonto,
          periodoB: statsB.totalMonto,
          [compMonthA]: statsA.totalMonto,
          [compMonthB]: statsB.totalMonto
        }
      ]
    };
  }, [
    sales,
    compFilterMode,
    compMonthA,
    compMonthB,
    compWeek,
    compCategory,
    compStartDateA,
    compEndDateA,
    compStartDateB,
    compEndDateB
  ]);

  // Advisers columns for dynamic report tables based on companyMode
  const activeReportAdvisers = useMemo(() => {
    if (companyMode === "upconta") {
      return [
        { key: "karlaHaro", name: "Karla Haro" },
        { key: "davidSantander", name: "David Santander" },
      ];
    }
    if (companyMode === "firmas") {
      return [
        { key: "salomeEstrella", name: "Salomé Estrella" },
        { key: "ismeniaEscalona", name: "Ismenia Escalona" },
        { key: "evelynNarvaez", name: "Evelyn Narváez" },
      ];
    }
    return [
      { key: "karlaHaro", name: "Karla Haro" },
      { key: "ismeniaEscalona", name: "Ismenia Escalona" },
      { key: "salomeEstrella", name: "Salomé Estrella" },
      { key: "evelynNarvaez", name: "Evelyn Narváez" },
      { key: "davidSantander", name: "David Santander" },
    ];
  }, [companyMode]);

  // Dynamic Table 1: Reporte por Producto Table (Sorted FIRMAS first, UPCONTA second)
  const dynamicReportProduct = useMemo(() => {
    const map: Record<string, { linea: "UPCONTA" | "FIRMAS"; producto: string; karlaHaro: number; ismeniaEscalona: number; salomeEstrella: number; evelynNarvaez: number; davidSantander: number; total: number }> = {};

    filteredSales.forEach(s => {
      const prodName = s.producto || "Otros";
      const isUp = isUpContaSale(s);
      const lineaStr: "UPCONTA" | "FIRMAS" = isUp ? "UPCONTA" : "FIRMAS";
      const key = `${lineaStr}_${prodName}`;

      if (!map[key]) {
        map[key] = {
          linea: lineaStr,
          producto: prodName,
          karlaHaro: 0,
          ismeniaEscalona: 0,
          salomeEstrella: 0,
          evelynNarvaez: 0,
          davidSantander: 0,
          total: 0
        };
      }

      const advClean = s.asesor.toLowerCase();
      if (advClean.includes("karla")) map[key].karlaHaro += s.totalSinIva;
      else if (advClean.includes("ismenia")) map[key].ismeniaEscalona += s.totalSinIva;
      else if (advClean.includes("salom")) map[key].salomeEstrella += s.totalSinIva;
      else if (advClean.includes("evelyn")) map[key].evelynNarvaez += s.totalSinIva;
      else if (advClean.includes("david")) map[key].davidSantander += s.totalSinIva;

      map[key].total += s.totalSinIva;
    });

    // Sort: FIRMAS products FIRST, UPCONTA products SECOND
    return Object.values(map).sort((a, b) => {
      if (a.linea !== b.linea) {
        return a.linea === "FIRMAS" ? -1 : 1;
      }
      return b.total - a.total;
    });
  }, [filteredSales]);

  // Dynamic Table 2: Reporte de Comisiones Table (Uses salesForChartsAndCommissions)
  const dynamicCommissionsReport = useMemo(() => {
    const advMap: Record<string, { upconta: number; firmas: number; total: number; comision: number }> = {
      "Karla Haro": { upconta: 0, firmas: 0, total: 0, comision: 0 },
      "Ismenia Escalona": { upconta: 0, firmas: 0, total: 0, comision: 0 },
      "Salomé Estrella": { upconta: 0, firmas: 0, total: 0, comision: 0 },
      "Evelyn Narváez": { upconta: 0, firmas: 0, total: 0, comision: 0 },
      "David Santander": { upconta: 0, firmas: 0, total: 0, comision: 0 }
    };

    salesForChartsAndCommissions.forEach(s => {
      let matchedKey = "";
      const advClean = s.asesor.toLowerCase();
      if (advClean.includes("karla")) matchedKey = "Karla Haro";
      else if (advClean.includes("ismenia")) matchedKey = "Ismenia Escalona";
      else if (advClean.includes("salom")) matchedKey = "Salomé Estrella";
      else if (advClean.includes("evelyn")) matchedKey = "Evelyn Narváez";
      else if (advClean.includes("david")) matchedKey = "David Santander";

      if (matchedKey) {
        if (isUpContaSale(s)) {
          advMap[matchedKey].upconta += s.totalSinIva;
        } else {
          advMap[matchedKey].firmas += s.totalSinIva;
        }
        advMap[matchedKey].total += s.totalSinIva;
      }
    });

    let totalComPool = 0;
    Object.keys(advMap).forEach(key => {
      const up = advMap[key].upconta;
      const fir = advMap[key].firmas;
      const tot = advMap[key].total;
      let comm = 0;
      if (tot >= 6000) {
        comm = Math.round((up * 0.06 + fir * 0.050755) * 100) / 100;
      } else if (tot >= 4500) {
        comm = Math.round((up * 0.05 + fir * 0.038485) * 100) / 100;
      } else if (tot >= 3500) {
        comm = Math.round((up * 0.03 + fir * 0.00857) * 100) / 100;
      } else if (tot >= 3000) {
        comm = Math.round((up * 0.02 + fir * 0.001145) * 100) / 100;
      } else {
        comm = 0;
      }

      advMap[key].comision = comm;
      totalComPool += comm;
    });

    const totalUpconta = Object.values(advMap).reduce((a, b) => a + b.upconta, 0);
    const totalFirmas = Object.values(advMap).reduce((a, b) => a + b.firmas, 0);
    const grandTotalSales = Object.values(advMap).reduce((a, b) => a + b.total, 0);

    return {
      advisers: advMap,
      totalUpconta,
      totalFirmas,
      grandTotalSales,
      totalComPool
    };
  }, [salesForChartsAndCommissions]);

  // Formatters
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* ================= COMPANY PROFILE BANNER ================= */}
      {companyMode === "upconta" ? (
        <div className="bg-gradient-to-r from-[#0B2545] via-[#003566] to-[#0B2545] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-orange-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500 text-white font-black shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Dashboard Comercial UpConta (Planes &amp; ERP)
                </h2>
                <span className="bg-orange-500 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Empresa: UpConta (170622)
                </span>
              </div>
              <p className="text-xs text-orange-200/90 font-medium mt-0.5">
                Métricas exclusivas de la línea UpConta • Asesores asignados: <strong className="text-white">Karla Haro</strong> y <strong className="text-white">David Santander</strong>
              </p>
            </div>
          </div>
        </div>
      ) : companyMode === "firmas" ? (
        <div className="bg-gradient-to-r from-[#0B2545] via-[#003566] to-[#0B2545] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-amber-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 font-black shadow-sm">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Dashboard Comercial ANF AC (Firmas Electrónicas)
                </h2>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Empresa: ANF AC (123456)
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                Métricas exclusivas de Firmas Electrónicas • Asesoras asignadas: <strong className="text-white">Salomé Estrella</strong>, <strong className="text-white">Ismenia Escalona</strong> y <strong className="text-white">Evelyn Narváez</strong>
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#0B2545] via-[#003566] to-[#0B2545] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-blue-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500 text-white font-black shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Dashboard Ejecutivo Consolidado (UpConta &amp; ANF AC)
                </h2>
                <span className="bg-blue-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Vista Total / Super Admin (0000)
                </span>
              </div>
              <p className="text-xs text-blue-200/90 font-medium mt-0.5">
                Visualización consolidada de todas las empresas, líneas de productos y equipo comercial completo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOP SYNC BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sincronizado Google Sheets
          </span>
          {lastSyncTime && (
            <span className="text-slate-500 text-xs flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Última sinc: {lastSyncTime}
            </span>
          )}
        </div>

        <button
          onClick={fetchGoogleSheetData}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Actualizando..." : "Refrescar Google Sheets"}</span>
        </button>
      </div>

      {/* ================= CONTROLS & FILTERS BAR ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-black text-slate-800 text-sm uppercase tracking-wider">
            <Filter className="w-4 h-4 text-orange-500" />
            <span>Filtros Integrados de Análisis</span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Mostrando <strong className="text-slate-900">{filteredSales.length}</strong> ventas registradas
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Filter 1: Filtro MES */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span>Mes</span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              {allAvailableMonthsOptions.map((mStr) => {
                const [mName, year] = mStr.split(" ");
                const spanishName = MONTH_TRANSLATIONS[mName] || mName;
                const isCurrent = mStr === currentMonthString;
                return (
                  <option key={mStr} value={mStr}>
                    {spanishName} {year} {isCurrent ? "(Actual)" : ""}
                  </option>
                );
              })}
              <option value="all_year">Todo el Año (2026)</option>
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

          {/* Filter 3: Conditional Week / Date Range */}
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
              disabled={companyMode === "upconta" || companyMode === "firmas"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none disabled:opacity-80"
            >
              {companyMode === "upconta" ? (
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

      {/* ================= 9 EXECUTIVE KPI SCORECARDS (3 ROWS OF 3 MATCHING BRAND COLORS) ================= */}
      <div className="space-y-4">
        {/* ROW 1: TOTAL GENERAL METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Ventas */}
          <div className="bg-gradient-to-br from-slate-900 via-[#0B2545] to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden group hover:border-orange-500/50 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Total Ventas (Sin IVA)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatCurrency(totalVentasMonto)}
                </div>
              </div>
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Cantidad de Ventas */}
          <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-md border border-slate-200 relative overflow-hidden group hover:border-blue-400 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Cantidad de Ventas
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {cantidadVentas} <span className="text-xs font-extrabold text-slate-500">transacciones</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Layers className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Ticket Promedio General */}
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
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                <Calculator className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: LÍNEA UPCONTA (NARANJA Y AZUL) - Shown for UpConta and All modes */}
        {(companyMode === "upconta" || companyMode === "all" || companyMode === "locked") && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 4: Total Ventas UpConta */}
            <div className="bg-gradient-to-br from-[#0B2545] via-[#003566] to-[#0B2545] text-white rounded-2xl p-5 shadow-md border border-blue-500/40 relative overflow-hidden group hover:border-orange-400 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-orange-400" />
                    Total Ventas UpConta
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {formatCurrency(totalVentasUpConta)}
                  </div>
                </div>
                <div className="p-2.5 bg-orange-500/20 border border-orange-400/30 rounded-xl text-orange-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 5: Cantidad Ventas UpConta */}
            <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-sm border border-orange-200 relative overflow-hidden group hover:border-orange-400 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  Cantidad Ventas UpConta
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {cantidadUpConta} <span className="text-xs font-extrabold text-slate-500">transacciones</span>
                </div>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            {/* Card 6: Ticket Promedio UpConta */}
            <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-sm border border-blue-200 relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-blue-600" />
                  Ticket Prom. UpConta
                </span>
                <div className="text-2xl font-black text-blue-950 tracking-tight">
                  {formatCurrency(ticketPromedioUpConta)}
                </div>
              </div>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* ROW 3: LÍNEA FIRMAS ELECTRÓNICAS.EC (AZUL Y AMARILLO) - Shown for Firmas and All modes */}
        {(companyMode === "firmas" || companyMode === "all" || companyMode === "locked") && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 7: Total Ventas Firmas */}
            <div className="bg-gradient-to-br from-[#003366] via-[#002244] to-[#003366] text-white rounded-2xl p-5 shadow-md border border-amber-400/40 relative overflow-hidden group hover:border-amber-300 transition-all">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    Total Ventas Firmas
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-100 tracking-tight">
                    {formatCurrency(totalVentasFirmas)}
                  </div>
                </div>
                <div className="p-2.5 bg-amber-400/20 border border-amber-300/30 rounded-xl text-amber-300">
                  <FileCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 8: Cantidad Ventas Firmas */}
            <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-sm border border-amber-200 relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  Cantidad Ventas Firmas
                </span>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {cantidadFirmas} <span className="text-xs font-extrabold text-slate-500">firmas</span>
                </div>
              </div>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Card 9: Ticket Promedio Firmas */}
            <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  Ticket Prom. Firmas
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(ticketPromedioFirmas)}
                </div>
              </div>
              <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= SUB-NAVIGATION TABS FOR DASHBOARD VIEWS ================= */}
      <div className="flex items-center bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/80 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveViewTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeViewTab === "overview"
              ? "bg-[#0B2545] text-white shadow-md"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-300/60"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-orange-400" />
          <span>Vista General (Gráficos)</span>
        </button>

        <button
          onClick={() => setActiveViewTab("producto")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeViewTab === "producto"
              ? "bg-[#0B2545] text-white shadow-md"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-300/60"
          }`}
        >
          <PieChartIcon className="w-4 h-4 text-emerald-400" />
          <span>Reporte por Producto ($ y #)</span>
        </button>

        <button
          onClick={() => setActiveViewTab("comisiones")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeViewTab === "comisiones"
              ? "bg-[#0B2545] text-white shadow-md"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-300/60"
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Reporte Comisiones ($)</span>
        </button>

        <button
          onClick={() => setActiveViewTab("detalle")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeViewTab === "detalle"
              ? "bg-[#0B2545] text-white shadow-md"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-300/60"
          }`}
        >
          <Table className="w-4 h-4 text-blue-400" />
          <span>Detalle de Ventas ({filteredSales.length})</span>
        </button>
      </div>

      {/* ================= VIEW 1: OVERVIEW CHARTS ================= */}
      {activeViewTab === "overview" && (
        <div className="space-y-8">
          {/* Chart 1: Ventas por Asesor */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Ventas por Asesor Comercial ($ USD y Cantidad)
                </h3>
                <p className="text-xs text-slate-500">
                  Comparativa directa de facturación lograda por cada integrante del equipo.
                </p>
              </div>
              <span className="bg-orange-50 text-orange-700 font-extrabold text-xs px-3 py-1 rounded-full border border-orange-200">
                Top Asesor: {adviserChartData[0]?.name || "Evelyn Narváez"}
              </span>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adviserChartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: "bold", fill: "#334155" }} interval={0} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip content={<CustomBarTooltip formatCurrency={formatCurrency} />} />
                  <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px", fontWeight: "bold" }} />
                  <Bar yAxisId="left" dataKey="upconta" name="Línea UpConta ($)" fill="#0B2545" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="left" dataKey="firmas" name="Línea Firmas ($)" fill="#EAB308" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="right" dataKey="cantidad" name="Cantidad Ventas (#)" fill="#F97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid of 2 Charts: Product Distribution & Commission Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 2: Distribución por Producto */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-500" />
                  Participación por Producto ($)
                </h3>
                <p className="text-xs text-slate-500">Monto acumulado por tipo de servicio ofrecido.</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productChartData}
                      dataKey="monto"
                      nameKey="producto"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {productChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Valor a Comisionar por Asesor */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Comisiones Ganadas por Asesor ($ USD)
                </h3>
                <p className="text-xs text-slate-500">Valor a comisionar derivado del volumen de ventas.</p>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(dynamicCommissionsReport.advisers).map(([name, data]) => ({ name, comision: (data as { comision: number }).comision }))} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: "bold" }} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Bar dataKey="comision" name="Valor a Comisionar ($)" fill="#10B981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ================= 3 NUEVOS GRÁFICOS: CANTIDAD DE VENTAS Y PRODUCTOS VENDIDOS POR SEMANA ================= */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-black text-slate-900">Análisis Semanal de Cantidades (# Ventas y # Productos)</h3>
            </div>
            
            <div className={`grid grid-cols-1 ${companyMode === 'all' || companyMode === 'locked' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
              {/* Chart A: Semanal General */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-slate-700" />
                    1. Cantidad Semanal - {companyMode === "upconta" ? "UpConta" : companyMode === "firmas" ? "Firmas.ec" : "General"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {companyMode === "upconta"
                      ? "Ventas y productos de sistemas"
                      : companyMode === "firmas"
                      ? "Firmas electrónicas emitidas"
                      : "UpConta & Firmas combinados"}
                  </p>
                </div>
                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={companyMode === "upconta" ? weeklyDataUpConta : companyMode === "firmas" ? weeklyDataFirmas : weeklyDataGeneral}
                      margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="semana" tick={{ fontSize: 10, fontWeight: "bold" }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                      <Bar
                        dataKey="cantidadVentas"
                        name={companyMode === "firmas" ? "Firmas Emitidas" : "Ventas (#)"}
                        fill={companyMode === "firmas" ? "#EAB308" : "#0B2545"}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="cantidadProductos"
                        name="Productos (#)"
                        fill={companyMode === "upconta" ? "#3B82F6" : companyMode === "firmas" ? "#003366" : "#F97316"}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart B: Semanal UpConta */}
              {(companyMode === "upconta" || companyMode === "all" || companyMode === "locked") && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-orange-500" />
                      2. Cantidad Semanal - UpConta
                    </h4>
                    <p className="text-[11px] text-slate-500">Sistemas &amp; Planes ERP</p>
                  </div>
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyDataUpConta} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="semana" tick={{ fontSize: 10, fontWeight: "bold" }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                        <Bar dataKey="cantidadVentas" name="Ventas UpConta" fill="#0B2545" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cantidadProductos" name="Productos" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Chart C: Semanal Firmas */}
              {(companyMode === "firmas" || companyMode === "all" || companyMode === "locked") && (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      3. Cantidad Semanal - Firmas.ec
                    </h4>
                    <p className="text-[11px] text-slate-500">Certificados SRI e Imprenta</p>
                  </div>
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyDataFirmas} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="semana" tick={{ fontSize: 10, fontWeight: "bold" }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                        <Bar dataKey="cantidadVentas" name="Firmas Emitidas" fill="#EAB308" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cantidadProductos" name="Productos" fill="#003366" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= 4TO GRÁFICO / MÓDULO: COMPARATIVO ENTRE MESES, SEMANAS Y RANGOS ================= */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 pt-6 border-t-2 border-t-orange-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  4. Módulo Comparativo Dinámico (Meses, Semanas y Rangos de Fechas)
                </h3>
                <p className="text-xs text-slate-500">
                  Compara el rendimiento comercial entre dos períodos: por meses calendario con desglose semanal o especificando rangos de fechas exactos.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-900 font-extrabold text-xs px-3 py-1 rounded-full border border-blue-200">
                  {compFilterMode === "mes_semana" ? "Comparativa por Mes/Semana" : "Comparativa por Rangos de Fecha"}
                </span>
              </div>
            </div>

            {/* Controls for 4th Comparative Module */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              {/* Row 1: Mode Switcher & Category selector */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCompFilterMode("mes_semana")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      compFilterMode === "mes_semana"
                        ? "bg-[#0B2545] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Por Meses y Semanas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCompFilterMode("rango_fechas")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      compFilterMode === "rango_fechas"
                        ? "bg-orange-500 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Por Rangos de Fechas</span>
                  </button>
                </div>

                {/* Línea de Producto Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Línea de Producto:</label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B2545]"
                  >
                    <option value="all">Ambas Líneas</option>
                    <option value="upconta">Solo UpConta</option>
                    <option value="firmas">Solo Firmas.ec</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Dynamic Controls based on selected mode */}
              {compFilterMode === "mes_semana" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#0B2545]"></span>
                      Mes A (Base)
                    </label>
                    <select
                      value={compMonthA}
                      onChange={(e) => setCompMonthA(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B2545]"
                    >
                      {allAvailableMonthsOptions.map((mStr) => {
                        const [mName, year] = mStr.split(" ");
                        const spanishName = MONTH_TRANSLATIONS[mName] || mName;
                        return (
                          <option key={`a-${mStr}`} value={mStr}>
                            {spanishName} {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#F97316]"></span>
                      Mes B (Comparar)
                    </label>
                    <select
                      value={compMonthB}
                      onChange={(e) => setCompMonthB(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                    >
                      {allAvailableMonthsOptions.map((mStr) => {
                        const [mName, year] = mStr.split(" ");
                        const spanishName = MONTH_TRANSLATIONS[mName] || mName;
                        return (
                          <option key={`b-${mStr}`} value={mStr}>
                            {spanishName} {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Filtrar por Semana</label>
                    <select
                      value={compWeek}
                      onChange={(e) => setCompWeek(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="all">Todas las Semanas</option>
                      <option value="1">Semana 1 (Vie a Jue)</option>
                      <option value="2">Semana 2 (Vie a Jue)</option>
                      <option value="3">Semana 3 (Vie a Jue)</option>
                      <option value="4">Semana 4 (Vie a Jue)</option>
                      <option value="5">Semana 5 (Vie a Jue)</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Date Range Mode Controls */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Período A */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#0B2545] flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0B2545]"></span>
                          Período A (Base)
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">Desde - Hasta</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Fecha Inicio:</label>
                          <input
                            type="date"
                            value={compStartDateA}
                            onChange={(e) => setCompStartDateA(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B2545]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Fecha Fin:</label>
                          <input
                            type="date"
                            value={compEndDateA}
                            onChange={(e) => setCompEndDateA(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B2545]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Período B */}
                    <div className="bg-white p-3 rounded-xl border border-orange-200 bg-orange-50/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-orange-600 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                          Período B (Comparar)
                        </label>
                        <span className="text-[10px] text-slate-500 font-medium">Desde - Hasta</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Fecha Inicio:</label>
                          <input
                            type="date"
                            value={compStartDateB}
                            onChange={(e) => setCompStartDateB(e.target.value)}
                            className="w-full bg-slate-50 border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Fecha Fin:</label>
                          <input
                            type="date"
                            value={compEndDateB}
                            onChange={(e) => setCompEndDateB(e.target.value)}
                            className="w-full bg-slate-50 border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Visual Bar Chart Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativeMetrics.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: "bold" }} />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any, name: any) => [formatCurrency(Number(v)), name]} />
                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    <Bar dataKey="periodoA" name={comparativeMetrics.labelA} fill="#0B2545" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="periodoB" name={comparativeMetrics.labelB} fill="#F97316" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table Summary for Comparative */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Métrica</th>
                      <th className="p-2.5 text-right">{comparativeMetrics.labelA}</th>
                      <th className="p-2.5 text-right bg-orange-600">{comparativeMetrics.labelB}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                    <tr>
                      <td className="p-2.5">Total Ventas ($)</td>
                      <td className="p-2.5 text-right">{formatCurrency(comparativeMetrics.statsA.totalMonto)}</td>
                      <td className="p-2.5 text-right text-orange-600">{formatCurrency(comparativeMetrics.statsB.totalMonto)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2.5">UpConta ($)</td>
                      <td className="p-2.5 text-right">{formatCurrency(comparativeMetrics.statsA.totalUpMonto)}</td>
                      <td className="p-2.5 text-right text-orange-600">{formatCurrency(comparativeMetrics.statsB.totalUpMonto)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Firmas.ec ($)</td>
                      <td className="p-2.5 text-right">{formatCurrency(comparativeMetrics.statsA.totalFirMonto)}</td>
                      <td className="p-2.5 text-right text-orange-600">{formatCurrency(comparativeMetrics.statsB.totalFirMonto)}</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2.5">Cantidad (#)</td>
                      <td className="p-2.5 text-right">{comparativeMetrics.statsA.qtyTotal} ventas</td>
                      <td className="p-2.5 text-right text-orange-600">{comparativeMetrics.statsB.qtyTotal} ventas</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Ticket Prom. ($)</td>
                      <td className="p-2.5 text-right">{formatCurrency(comparativeMetrics.statsA.ticket)}</td>
                      <td className="p-2.5 text-right text-orange-600">{formatCurrency(comparativeMetrics.statsB.ticket)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: REPORTE POR PRODUCTO TABLE ================= */}
      {activeViewTab === "producto" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                Reporte por Producto ($ USD) - Dinámico
              </h3>
              <p className="text-xs text-slate-500">
                Resumen reactivo que se ajusta automáticamente según la línea de producto, semana y período filtrado.
              </p>
            </div>
            <span className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
              Total Filtrado: {formatCurrency(totalVentasMonto)}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0B2545] text-white uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-3">Línea</th>
                  <th className="p-3">Producto / Plan</th>
                  {activeReportAdvisers.map(adv => (
                    <th key={adv.key} className="p-3 text-right">{adv.name}</th>
                  ))}
                  <th className="p-3 text-right bg-orange-600">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {dynamicReportProduct.length > 0 ? (
                  dynamicReportProduct.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100"}>
                      <td className="p-3 font-bold text-slate-900">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          row.linea === "UPCONTA" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-900"
                        }`}>
                          {row.linea}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">{row.producto}</td>
                      {activeReportAdvisers.map(adv => (
                        <td key={adv.key} className="p-3 text-right">
                          {formatCurrency(((row as any)[adv.key] || 0))}
                        </td>
                      ))}
                      <td className="p-3 text-right font-black text-slate-900 bg-orange-50">{formatCurrency(row.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3 + activeReportAdvisers.length} className="p-8 text-center text-slate-500 font-bold">
                      No hay registros de productos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-black text-xs">
                <tr>
                  <td colSpan={2} className="p-3 text-right uppercase tracking-wider">TOTAL GENERAL FILTRADO</td>
                  {activeReportAdvisers.map(adv => (
                    <td key={adv.key} className="p-3 text-right text-amber-300">
                      {formatCurrency(dynamicReportProduct.reduce((a, b) => a + ((b as any)[adv.key] || 0), 0))}
                    </td>
                  ))}
                  <td className="p-3 text-right bg-orange-500 text-white font-black">{formatCurrency(totalVentasMonto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: REPORTE COMISIONES TABLE ================= */}
      {activeViewTab === "comisiones" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Reporte de Comisiones Equipo Comercial ($) - Dinámico
              </h3>
              <p className="text-xs text-slate-500">
                Resumen consolidado reactivo que se recalcula dinámicamente según la línea y el período seleccionado.
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-300 px-4 py-1.5 rounded-2xl text-emerald-900 text-xs font-black flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Fondo a Comisionar: <strong>{formatCurrency(dynamicCommissionsReport.totalComPool)} USD</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            {/* Title Banner */}
            <div className="bg-[#E65100] text-white font-black text-center text-sm py-2.5 uppercase tracking-wider">
              REPORTE COMISIONES EQUIPO COMERCIAL
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-[#002855] text-white uppercase text-[11px] font-black tracking-wider">
                <tr>
                  <th className="p-3 border-r border-slate-700">PRODUCTO</th>
                  {activeReportAdvisers.map(adv => (
                    <th key={adv.key} className="p-3 text-right border-r border-slate-700">{adv.name}</th>
                  ))}
                  <th className="p-3 text-right bg-[#001D3D] text-amber-300 font-extrabold">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
                {(companyMode === "upconta" || companyMode === "all") && (
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                      UpConta
                    </td>
                    {activeReportAdvisers.map(adv => (
                      <td key={adv.key} className="p-3 text-right border-r border-slate-200">
                        {formatCurrency(dynamicCommissionsReport.advisers[adv.name]?.upconta || 0)}
                      </td>
                    ))}
                    <td className="p-3 text-right font-black bg-slate-100 text-slate-900">{formatCurrency(dynamicCommissionsReport.totalUpconta)}</td>
                  </tr>
                )}
                {(companyMode === "firmas" || companyMode === "all") && (
                  <tr className="bg-slate-50/50 hover:bg-slate-100/50">
                    <td className="p-3 font-extrabold text-slate-900 border-r border-slate-200">
                      Firmas
                    </td>
                    {activeReportAdvisers.map(adv => (
                      <td key={adv.key} className="p-3 text-right border-r border-slate-200">
                        {formatCurrency(dynamicCommissionsReport.advisers[adv.name]?.firmas || 0)}
                      </td>
                    ))}
                    <td className="p-3 text-right font-black bg-slate-100 text-slate-900">{formatCurrency(dynamicCommissionsReport.totalFirmas)}</td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                  <td className="p-3 uppercase border-r border-slate-300">TOTAL</td>
                  {activeReportAdvisers.map(adv => (
                    <td key={adv.key} className="p-3 text-right border-r border-slate-300">
                      {formatCurrency(dynamicCommissionsReport.advisers[adv.name]?.total || 0)}
                    </td>
                  ))}
                  <td className="p-3 text-right bg-slate-200 text-slate-900">{formatCurrency(dynamicCommissionsReport.grandTotalSales)}</td>
                </tr>
                <tr className="bg-[#00BCD4]/15 font-black text-cyan-950 text-xs border-t border-cyan-300">
                  <td className="p-3.5 uppercase border-r border-cyan-200 text-cyan-900">
                    COMISION
                  </td>
                  {activeReportAdvisers.map(adv => (
                    <td key={adv.key} className="p-3.5 text-right border-r border-cyan-200">
                      {formatCurrency(dynamicCommissionsReport.advisers[adv.name]?.comision || 0)}
                    </td>
                  ))}
                  <td className="p-3.5 text-right bg-[#00ACC1] text-white font-extrabold">{formatCurrency(dynamicCommissionsReport.totalComPool)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: GRANULAR DETALLE DE VENTAS TABLE ================= */}
      {activeViewTab === "detalle" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Table className="w-5 h-5 text-blue-600" />
                Registro Granular de Ventas ({filteredSales.length} resultados)
              </h3>
              <p className="text-xs text-slate-500">
                Listado de transacciones individuales ordenadas con la última venta destacada.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600">
              Total Filtrado: <strong className="text-emerald-600 text-sm">{formatCurrency(totalVentasMonto)}</strong>
            </div>
          </div>

          {/* DESTACADO: ÚLTIMA VENTA REGISTRADA */}
          {latestSale && (
            <div className="bg-gradient-to-r from-[#0B2545] via-[#003566] to-[#0B2545] text-white rounded-2xl p-4 sm:p-5 shadow-md border border-orange-500/40 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>ÚLTIMA VENTA REGISTRADA</span>
                </span>
                <span className="text-xs font-mono text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Fecha de Cierre: {latestSale.fecha}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-700/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Asesor Comercial</span>
                  <span className="text-sm font-extrabold text-white">{latestSale.asesor}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente / RUC</span>
                  <span className="text-sm font-bold text-slate-200 truncate block">{latestSale.nombre} ({latestSale.ruc})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Producto / Plan</span>
                  <span className="text-sm font-bold text-orange-300 truncate block">{latestSale.producto} {latestSale.plan ? `- ${latestSale.plan}` : ''}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Total (Sin IVA)</span>
                  <span className="text-lg font-black text-emerald-400">{formatCurrency(latestSale.totalSinIva)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Asesor</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">RUC</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3 text-right">Total Sin IVA ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {sortedSales.slice(0, 1000).map((row, idx) => (
                  <tr key={idx} className={idx === 0 ? "bg-amber-50/80 hover:bg-amber-100/80 border-l-4 border-l-orange-500 font-bold" : idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50 hover:bg-slate-100"}>
                    <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-600">{row.fecha}</td>
                    <td className="p-3 font-bold text-slate-900">{row.asesor}</td>
                    <td className="p-3 max-w-xs truncate font-semibold">{row.nombre}</td>
                    <td className="p-3 font-mono text-slate-600">{row.ruc}</td>
                    <td className="p-3 font-bold text-blue-900">{row.producto}</td>
                    <td className="p-3">{row.plan}</td>
                    <td className="p-3 text-right font-black text-emerald-600">{formatCurrency(row.totalSinIva)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sortedSales.length > 1000 && (
            <div className="text-center text-xs text-slate-500 pt-2">
              Mostrando las primeras 1000 de {sortedSales.length} transacciones filtradas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
