import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Flag,
  Flame,
  Clock,
  RefreshCw,
  CheckCircle2,
  Target,
  Users,
  User
} from "lucide-react";
import { INITIAL_OFFLINE_SALES } from "../salesData";
import { 
  getStoredSales, 
  mergeRemoteSalesWithLocal, 
  SaleTransaction 
} from "../utils/salesStorage";

export interface SellerRallyConfig {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
  color: string;
  accentColor: string;
  bgColor: string;
  carIcon: string;
  metaFija: number;
  metaFinal: number;
}

export const SELLERS_CONFIG: SellerRallyConfig[] = [
  {
    id: "evelyn",
    name: "Evelyn Narváez",
    shortName: "Evelyn",
    avatar: "EN",
    color: "#E11D48", // Rose / Red
    accentColor: "#BE123C",
    bgColor: "bg-rose-50 text-rose-700 border-rose-200",
    carIcon: "🏎️",
    metaFija: 2500,
    metaFinal: 8000,
  },
  {
    id: "ismenia",
    name: "Ismenia Escalona",
    shortName: "Isme",
    avatar: "IE",
    color: "#7C3AED", // Violet
    accentColor: "#6D28D9",
    bgColor: "bg-purple-50 text-purple-700 border-purple-200",
    carIcon: "🏍️",
    metaFija: 2500,
    metaFinal: 8000,
  },
  {
    id: "salome",
    name: "Salomé Estrella",
    shortName: "Salo",
    avatar: "SE",
    color: "#EA580C", // Orange
    accentColor: "#C2410C",
    bgColor: "bg-orange-50 text-orange-700 border-orange-200",
    carIcon: "🚙",
    metaFija: 3000,
    metaFinal: 10000,
  },
  {
    id: "karla",
    name: "Karla Haro",
    shortName: "Karla",
    avatar: "KH",
    color: "#0284C7", // Sky Blue
    accentColor: "#0369A1",
    bgColor: "bg-sky-50 text-sky-700 border-sky-200",
    carIcon: "🏎️",
    metaFija: 3000,
    metaFinal: 10000,
  },
  {
    id: "david",
    name: "David Santander",
    shortName: "David",
    avatar: "DS",
    color: "#059669", // Emerald
    accentColor: "#047857",
    bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    carIcon: "🚚",
    metaFija: 6000,
    metaFinal: 14000,
  }
];

function normalizeName(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function matchSeller(advisorString: string): SellerRallyConfig | null {
  if (!advisorString) return null;
  const n = normalizeName(advisorString);
  if (n.includes("evelyn") || n.includes("narvaez")) return SELLERS_CONFIG[0];
  if (n.includes("ismenia") || n.includes("isme") || n.includes("escalona")) return SELLERS_CONFIG[1];
  if (n.includes("salome") || n.includes("salo") || n.includes("estrella")) return SELLERS_CONFIG[2];
  if (n.includes("karla") || n.includes("haro")) return SELLERS_CONFIG[3];
  if (n.includes("david") || n.includes("santander")) return SELLERS_CONFIG[4];
  return null;
}

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

const matchMonthFilter = (item: SaleTransaction, monthFilterValue: string) => {
  if (monthFilterValue === "all_time" || monthFilterValue === "all") return true;
  
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
  if (mLower.includes("august") || mLower.includes("agosto")) {
    return itemMesLower.includes("august") || itemMesLower.includes("agosto") || dateStr.startsWith("2026-08");
  }
  if (mLower.includes("september") || mLower.includes("septiembre") || mLower.includes("setiembre")) {
    return itemMesLower.includes("september") || itemMesLower.includes("septiembre") || itemMesLower.includes("setiembre") || dateStr.startsWith("2026-09");
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

  return itemMesLower.includes(mLower);
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

const getCurrentMonthString = (): string => {
  const now = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

export interface RallyModuleProps {
  companyMode?: "all" | "upconta" | "firmas" | "locked";
}

export function RallyModule({ companyMode = "all" }: RallyModuleProps = {}) {
  const currentMonthStr = getCurrentMonthString();
  const [sales, setSales] = useState<SaleTransaction[]>(getStoredSales);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedPilot, setSelectedPilot] = useState<string>("all"); // "all" or seller.id
  const [lastSyncTime, setLastSyncTime] = useState<string>("En vivo");

  // Real-time listener for sales updates
  useEffect(() => {
    const handleSalesUpdate = () => {
      setSales(getStoredSales());
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    window.addEventListener("sales_data_updated", handleSalesUpdate);
    window.addEventListener("storage", handleSalesUpdate);
    return () => {
      window.removeEventListener("sales_data_updated", handleSalesUpdate);
      window.removeEventListener("storage", handleSalesUpdate);
    };
  }, []);

  // Fetch live sales data from Google Sheets / API
  const fetchSales = async () => {
    setIsLoading(true);
    try {
      let csvText = "";
      try {
        const res = await fetch("/api/sheets");
        if (res.ok) {
          const t = await res.text();
          if (t && !t.trim().startsWith("<")) csvText = t;
        }
      } catch (e) {}

      if (!csvText) {
        try {
          const primaryUrl = "https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z5000";
          const res0 = await fetch(primaryUrl);
          if (res0.ok) {
            const t = await res0.text();
            if (t && !t.trim().startsWith("<")) csvText = t;
          }
        } catch (e) {}
      }

      if (!csvText) {
        try {
          const corsUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z5000");
          const resCors = await fetch(corsUrl);
          if (resCors.ok) {
            const t = await resCors.text();
            if (t && !t.trim().startsWith("<")) csvText = t;
          }
        } catch (e) {}
      }

      if (csvText) {
        const lines = csvText.split("\n");
        const parsed: SaleTransaction[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols: string[] = [];
          let inQuotes = false;
          let current = "";
          for (let c = 0; c < line.length; c++) {
            const char = line[c];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              cols.push(current.trim().replace(/^"/, "").replace(/"$/, ""));
              current = "";
            } else {
              current += char;
            }
          }
          cols.push(current.trim().replace(/^"/, "").replace(/"$/, ""));
          if (cols.length >= 12 && cols[0] && cols[0].toUpperCase() !== "ASESOR") {
            const fecha = normalizeDateString(cols[1] || "");
            const total = parseFloat((cols[11] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0;
            const parsedSinIva = parseFloat((cols[12] || "0").replace(/\$/g, "").replace(/,/g, ""));
            const totalSinIva = !isNaN(parsedSinIva) && parsedSinIva > 0 ? parsedSinIva : (total > 0 ? total / 1.15 : 0);
            
            let rawMes = cols[13] ? cols[13].trim() : "";
            let mes = rawMes;
            if (!mes || mes === "Desconocido") {
              mes = getMonthFromDate(fecha);
            }

            parsed.push({
              asesor: cols[0],
              fecha,
              ruc: cols[2] || "",
              nombre: cols[3] || "",
              tipo: cols[4] || "",
              producto: cols[5] || "",
              plan: cols[6] || "",
              adicionales: cols[7] || "",
              valorPlan: parseFloat((cols[8] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0,
              valorAdicional: parseFloat((cols[9] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0,
              descuento: parseFloat((cols[10] || "0").replace(/\$/g, "").replace(/,/g, "")) || 0,
              total,
              totalSinIva,
              mes
            });
          }
        }
        if (parsed.length > 0) {
          const merged = mergeRemoteSalesWithLocal(parsed);
          setSales(merged);
        }
      }
    } catch (err) {
      console.warn("Rally fallback to local offline data:", err);
      const fallback = mergeRemoteSalesWithLocal(INITIAL_OFFLINE_SALES);
      setSales(fallback);
    } finally {
      setIsLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Available unique months from dataset, ensuring all 12 calendar months for the year are present
  const availableMonths = useMemo(() => {
    const monthsFullYear = [
      "January 2026", "February 2026", "March 2026", "April 2026",
      "May 2026", "June 2026", "July 2026", "August 2026",
      "September 2026", "October 2026", "November 2026", "December 2026"
    ];

    const set = new Set<string>();
    // Add full year sequence first
    monthsFullYear.forEach(m => set.add(m));
    // Add current month in case year is different
    set.add(currentMonthStr);
    // Add any existing months from sales data
    sales.forEach(s => {
      if (s.mes && s.mes.trim()) set.add(s.mes.trim());
    });

    return Array.from(set);
  }, [sales, currentMonthStr]);

  // Keep selectedMonth updated to current month automatically if month rolls over
  useEffect(() => {
    const interval = setInterval(() => {
      const nowMonth = getCurrentMonthString();
      if (nowMonth !== currentMonthStr) {
        setSelectedMonth(nowMonth);
      }
    }, 60000); // check periodically every minute

    return () => clearInterval(interval);
  }, [currentMonthStr]);

  // Compute stats per seller for the selected month/period using official totalSinIva
  const sellerStats = useMemo(() => {
    const filteredSales = sales.filter(s => matchMonthFilter(s, selectedMonth));

    return SELLERS_CONFIG.map(seller => {
      const sellerSales = filteredSales.filter(s => {
        const matched = matchSeller(s.asesor);
        return matched && matched.id === seller.id;
      });

      // Primary sales metric: totalSinIva (Base Imponible Sin IVA)
      const totalSinIva = sellerSales.reduce((acc, s) => acc + (s.totalSinIva || 0), 0);
      const totalConIva = sellerSales.reduce((acc, s) => acc + (s.total || 0), 0);
      const count = sellerSales.length;

      // Base metric used for goal progress is totalSinIva
      const totalAmount = totalSinIva;

      const pctFija = Math.min(100, Math.round((totalAmount / seller.metaFija) * 100));
      const pctFinal = Math.min(100, Math.round((totalAmount / seller.metaFinal) * 100));

      // Overall Progress 0 to 100 along the race track:
      // 0 to 50% represents reaching the Meta Fija ($2,500 / $3,000 / $6,000)
      // 50% to 100% represents going from Meta Fija to Meta Final ($8,000 / $10,000 / $14,000)
      let trackProgress = 0;
      if (totalAmount <= seller.metaFija) {
        trackProgress = (totalAmount / seller.metaFija) * 50;
      } else {
        const remainingToFinal = seller.metaFinal - seller.metaFija;
        const extraAmount = Math.min(remainingToFinal, totalAmount - seller.metaFija);
        trackProgress = 50 + (extraAmount / remainingToFinal) * 50;
      }
      trackProgress = Math.max(2, Math.min(100, trackProgress));

      const isFijaReached = totalAmount >= seller.metaFija;
      const isFinalReached = totalAmount >= seller.metaFinal;

      let stageLabel = "Etapa 1: Salida Sea Camp";
      if (trackProgress >= 100) stageLabel = "🏆 ¡Llegada Triunfal Dammam!";
      else if (trackProgress >= 75) stageLabel = "Etapa 5: Dunas de Riyadh (Hacia Meta Final)";
      else if (trackProgress >= 50) stageLabel = "🚩 ¡Meta Fija Alcanzada! (Rumbo a Meta Final)";
      else if (trackProgress >= 30) stageLabel = "Etapa 3: Al-Qassim (Desierto Central)";
      else if (trackProgress >= 15) stageLabel = "Etapa 2: Madinah & Ha'il";

      return {
        ...seller,
        totalAmount,
        totalSinIva,
        totalConIva,
        count,
        pctFija,
        pctFinal,
        trackProgress,
        isFijaReached,
        isFinalReached,
        stageLabel,
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [sales, selectedMonth]);

  // Active pilots to show on map (either all or the single selected one)
  const mapPilots = useMemo(() => {
    if (selectedPilot === "all") return sellerStats;
    return sellerStats.filter(s => s.id === selectedPilot);
  }, [sellerStats, selectedPilot]);

  // Overall Rally totals
  const totalRallySales = useMemo(() => {
    return sellerStats.reduce((acc, s) => acc + s.totalSinIva, 0);
  }, [sellerStats]);

  const totalRallyTransactions = useMemo(() => {
    return sellerStats.reduce((acc, s) => acc + s.count, 0);
  }, [sellerStats]);

  // Track coordinates for SVG drawing (Dakar rally shape matching the reference)
  const trackPathD = "M 90,400 C 70,280 70,140 120,80 C 170,30 250,40 280,120 C 300,180 280,240 360,250 C 450,260 560,260 660,310 C 780,370 890,450 940,400 C 970,350 900,290 800,250 C 720,220 670,160 720,110 C 740,90 770,90 790,100";

  // Checkpoints along the track (progress %: 0%, 25%, 50%, 75%, 100%)
  const checkpoints = [
    { name: "SEA CAMP", subtitle: "Salida ($0)", pct: 0, x: 90, y: 400, icon: "🚩" },
    { name: "MADINAH / HA'IL", subtitle: "25% Meta Base", pct: 25, x: 260, y: 80, icon: "🏜️" },
    { name: "META FIJA", subtitle: "Base Camp (50%)", pct: 50, x: 480, y: 260, icon: "⭐" },
    { name: "RIYADH DUNES", subtitle: "75% Meta Final", pct: 75, x: 880, y: 370, icon: "⚡" },
    { name: "DAMMAM FINISH", subtitle: "Meta Final (100%)", pct: 100, x: 790, y: 100, icon: "🏁" }
  ];

  // Map progress to coordinate approximation along Dakar track
  const getProgressCoordinates = (pct: number) => {
    const points = [
      { p: 0, x: 90, y: 400 },
      { p: 10, x: 80, y: 290 },
      { p: 20, x: 100, y: 150 },
      { p: 30, x: 170, y: 60 },
      { p: 40, x: 270, y: 110 },
      { p: 50, x: 340, y: 245 },
      { p: 60, x: 500, y: 260 },
      { p: 70, x: 670, y: 310 },
      { p: 80, x: 860, y: 410 },
      { p: 90, x: 900, y: 310 },
      { p: 95, x: 760, y: 200 },
      { p: 100, x: 790, y: 100 }
    ];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (pct >= p1.p && pct <= p2.p) {
        const factor = (pct - p1.p) / (p2.p - p1.p);
        return {
          x: p1.x + (p2.x - p1.x) * factor,
          y: p1.y + (p2.y - p1.y) * factor
        };
      }
    }
    return { x: 790, y: 100 };
  };

  return (
    <div id="rally-root" className="space-y-6 animate-fade-in pb-16">
      
      {/* Top Banner Header: Desert Dakar Atmosphere */}
      <section className="bg-gradient-to-br from-[#1c130d] via-[#2c1d11] to-[#0f172a] rounded-3xl p-5 sm:p-7 text-white border-2 border-red-500/40 shadow-xl relative overflow-hidden">
        
        {/* Background Desert Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/15 via-red-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-red-600 text-white font-black text-xs uppercase px-3 py-1 rounded-full tracking-widest flex items-center gap-1.5 shadow-lg shadow-red-600/40 animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-white text-white" />
                RALLY COMERCIAL DAKAR
              </span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Carrera de Ventas por Metas
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Gran Rally de Ventas</span>
              <span className="text-red-500 font-extrabold text-base sm:text-xl bg-red-950/60 border border-red-500/40 px-2.5 py-0.5 rounded-xl">
                UPCONTA & ANF
              </span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Supera la <span className="text-amber-400 font-bold">Meta Fija</span> para asegurar la base y acelera al máximo para conquistar la <span className="text-red-400 font-bold">Meta Final</span>.
            </p>

            {/* Quick Goals Legend Pill Box - Single Row */}
            <div className="pt-1 flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11px] flex-nowrap overflow-x-auto scrollbar-none w-full">
              <span className="bg-slate-800/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                🎯 <strong>Evelyn & Isme:</strong> Fija <span className="text-amber-300 font-bold">$2,500</span> | Final <span className="text-red-400 font-bold">$8,000</span>
              </span>
              <span className="bg-slate-800/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                🎯 <strong>Salo & Karla:</strong> Fija <span className="text-amber-300 font-bold">$3,000</span> | Final <span className="text-red-400 font-bold">$10,000</span>
              </span>
              <span className="bg-slate-800/80 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                🎯 <strong>David:</strong> Fija <span className="text-amber-300 font-bold">$6,000</span> | Final <span className="text-red-400 font-bold">$14,000</span>
              </span>
            </div>
          </div>

          {/* Right Side Rally Global Metrics */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl shadow-xl w-full lg:w-auto min-w-[240px] space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-amber-400 uppercase tracking-wider text-[10px]">
                <Clock className="w-3.5 h-3.5" /> Sincronización: {lastSyncTime}
              </span>
              <button
                onClick={fetchSales}
                disabled={isLoading}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Actualizar datos en vivo"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-red-400" : ""}`} />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total Cierres</span>
              <span className="text-lg font-black text-white mt-0.5 block">
                {totalRallyTransactions} ventas
              </span>
            </div>

            {/* Filter Period Selector inside Banner */}
            <div className="pt-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Periodo de Carrera:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {availableMonths.map((m) => {
                  const [mName, yr] = m.split(" ");
                  const spanName = MONTH_TRANSLATIONS[mName] || mName;
                  return (
                    <option key={m} value={m}>
                      {spanName} {yr || ""} {m === currentMonthStr ? " (Mes Actual)" : ""}
                    </option>
                  );
                })}
                <option value="all_time">Todo el Año (Acumulado Total)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. RECUADRO DE RUTA OFICIAL RALLY CON SELECTOR DE ASESOR / TODOS          */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-[#d8c29d] via-[#c9af85] to-[#a4865e] p-4 sm:p-5 rounded-2xl border-2 border-[#8c6f45] shadow-lg relative overflow-hidden">
        
        {/* Topographical desert subtle background */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#5a4224_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        {/* Map Header & Pilot Selector Bar */}
        <div className="relative z-10 space-y-2.5 mb-3">
          
          <div className="flex flex-wrap justify-between items-center gap-3 bg-[#23180f]/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#d4af37]/40 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-600 text-white rounded-lg shadow-sm">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm tracking-wide text-amber-300 uppercase flex items-center gap-2">
                  <span>Ruta Oficial Rally Dakar UpConta</span>
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded-full font-bold">En Vivo</span>
                </h3>
              </div>
            </div>

            {/* Quick summary status of the active filter */}
            <div className="text-[11px] text-slate-300 font-bold flex items-center gap-2">
              <span>Vista de Pista:</span>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-md font-extrabold uppercase text-[10px]">
                {selectedPilot === "all" ? "Todos los Pilotos" : SELLERS_CONFIG.find(s => s.id === selectedPilot)?.name}
              </span>
            </div>
          </div>

          {/* PILOT SELECTOR: "Todos" + Individual Advisors */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 bg-[#1a120b]/70 backdrop-blur-md p-1.5 rounded-xl border border-[#8c6f45]/60 shadow-inner">
            <button
              onClick={() => setSelectedPilot("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedPilot === "all"
                  ? "bg-red-600 text-white shadow-md ring-2 ring-red-400/60 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Todos los Pilotos</span>
            </button>

            {SELLERS_CONFIG.map((seller) => {
              const currentStat = sellerStats.find(s => s.id === seller.id);
              const isSelected = selectedPilot === seller.id;

              return (
                <button
                  key={seller.id}
                  onClick={() => setSelectedPilot(seller.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "text-white shadow-md ring-2 ring-white/80 scale-[1.02] font-black"
                      : "bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700"
                  }`}
                  style={{
                    backgroundColor: isSelected ? seller.color : undefined
                  }}
                >
                  <span>{seller.carIcon}</span>
                  <span>{seller.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                    isSelected ? "bg-black/30 text-white" : "bg-slate-800 text-amber-300"
                  }`}>
                    ${Math.round(currentStat?.totalSinIva || 0)}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* Compact SVG Map Canvas */}
        <div className="relative w-full aspect-[2.4/1] min-h-[300px] max-h-[400px] h-[370px] bg-[#dfcca7]/40 rounded-xl border border-[#8c6f45]/50 overflow-hidden shadow-inner flex items-center justify-center">
          
          {/* Topography Text labels */}
          <div className="absolute top-4 left-8 text-[#7d5f38] font-black text-[10px] tracking-widest uppercase opacity-60 select-none">
            TABUK
          </div>
          <div className="absolute top-8 left-1/3 text-[#7d5f38] font-black text-[10px] tracking-widest uppercase opacity-60 select-none">
            HA'IL
          </div>
          <div className="absolute top-1/3 left-1/4 text-[#7d5f38] font-black text-[10px] tracking-widest uppercase opacity-60 select-none">
            MADINAH
          </div>
          <div className="absolute top-1/4 left-[42%] text-[#7d5f38] font-black text-[10px] tracking-widest uppercase opacity-60 select-none">
            AL-QASSIM
          </div>
          <div className="absolute bottom-8 left-1/2 text-[#7d5f38] font-black text-[10px] tracking-widest uppercase opacity-60 select-none">
            RIYADH
          </div>
          <div className="absolute bottom-4 right-1/4 text-[#7d5f38] font-black text-[10px] tracking-widest uppercase opacity-60 select-none">
            EASTERN PROVINCE
          </div>

          <svg viewBox="0 0 1000 460" className="w-full h-full drop-shadow-sm">
            <defs>
              <filter id="rallyGlowCompact" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <pattern id="checkeredPatternCompact" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="4" height="4" fill="#fff" />
                <rect x="4" width="4" height="4" fill="#991b1b" />
                <rect y="4" width="4" height="4" fill="#991b1b" />
                <rect x="4" y="4" width="4" height="4" fill="#fff" />
              </pattern>
            </defs>

            {/* Track Outline */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#573d1c"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
            />

            {/* Dark Golden Track Border */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#b45309"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Yellow Dakar Track Core */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#facc15"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#rallyGlowCompact)"
            />

            {/* Racing Chevrons */}
            <path
              d={trackPathD}
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="4 20"
              strokeLinecap="round"
            />

            {/* START BOX (SEA CAMP) */}
            <g transform="translate(40, 365)">
              <rect x="0" y="0" width="95" height="42" rx="6" fill="#1e1b18" stroke="#dc2626" strokeWidth="1.5" />
              <rect x="5" y="5" width="32" height="32" rx="5" fill="#dc2626" />
              <polygon points="16,14 26,21 16,28" fill="#ffffff" />
              <text x="42" y="19" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">SEA CAMP</text>
              <text x="42" y="31" fill="#fca5a5" fontSize="8" fontWeight="700" fontFamily="sans-serif">SALIDA $0</text>
            </g>

            {/* BASE CAMP / META FIJA CHECKPOINT */}
            <g transform="translate(425, 230)">
              <rect x="0" y="0" width="110" height="42" rx="6" fill="#1e1b18" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="21" cy="21" r="12" fill="#f59e0b" />
              <text x="21" y="25" textAnchor="middle" fill="#000000" fontSize="10" fontWeight="900">⭐</text>
              <text x="38" y="18" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">META FIJA</text>
              <text x="38" y="30" fill="#fde68a" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">Campamento Base</text>
            </g>

            {/* FINISH BOX (DAMMAM FINISH) */}
            <g transform="translate(735, 60)">
              <rect x="0" y="0" width="125" height="50" rx="8" fill="#1e1b18" stroke="#ffffff" strokeWidth="1.5" />
              <rect x="6" y="6" width="38" height="38" rx="5" fill="url(#checkeredPatternCompact)" stroke="#ffffff" strokeWidth="1" />
              <text x="50" y="21" fill="#ffffff" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">DAMMAM</text>
              <text x="50" y="33" fill="#f87171" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">META FINAL</text>
              <text x="50" y="44" fill="#fde047" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">🏆 Llegada Triunfal</text>
            </g>

            {/* Checkpoint Milestones along path */}
            {checkpoints.map((cp, idx) => (
              <g key={idx} transform={`translate(${cp.x}, ${cp.y})`}>
                <circle cx="0" cy="0" r="7" fill="#1e1b18" stroke="#facc15" strokeWidth="2" />
                <circle cx="0" cy="0" r="3.5" fill="#dc2626" />
              </g>
            ))}

            {/* PILOTS POSITIONED ON MAP */}
            {mapPilots.map((seller, idx) => {
              const coords = getProgressCoordinates(seller.trackProgress);
              // If only one pilot is selected, center them vertically on the track, else stagger slightly
              const yOffset = selectedPilot === "all" ? (idx - 2) * 12 : 0;
              const isSingleView = selectedPilot !== "all";

              return (
                <g 
                  key={seller.id} 
                  transform={`translate(${coords.x}, ${coords.y + yOffset})`}
                  className="transition-transform duration-500"
                >
                  {/* Glowing ring if single view */}
                  {isSingleView && (
                    <circle cx="0" cy="0" r="22" fill="none" stroke={seller.color} strokeWidth="3" opacity="0.6" className="animate-ping" />
                  )}

                  {/* Vehicle Body Pin */}
                  <circle cx="0" cy="0" r={isSingleView ? 17 : 14} fill={seller.color} stroke="#ffffff" strokeWidth="2.5" />
                  
                  {/* Vehicle Icon */}
                  <text x="0" y={isSingleView ? 5 : 4} textAnchor="middle" fontSize={isSingleView ? "13" : "11"} fontWeight="bold">
                    {seller.carIcon}
                  </text>

                  {/* Driver Tag Badge */}
                  <g transform={`translate(0, ${isSingleView ? -26 : -22})`}>
                    <rect 
                      x={isSingleView ? "-55" : "-42"} 
                      y="-12" 
                      width={isSingleView ? "110" : "84"} 
                      height="20" 
                      rx="5" 
                      fill="#0f172a" 
                      stroke={seller.color} 
                      strokeWidth="1.5" 
                    />
                    <text 
                      x="0" 
                      y="2" 
                      textAnchor="middle" 
                      fill="#ffffff" 
                      fontSize={isSingleView ? "9.5" : "8"} 
                      fontWeight="900" 
                      fontFamily="sans-serif"
                    >
                      {seller.shortName} (${Math.round(seller.totalSinIva).toLocaleString()})
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TABLA ÚNICA: RUTAS DE CARRERA INDIVIDUALES POR ASESOR                   */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Header Section */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-800">
                Rutas de Carrera Individuales por Vendedor
              </h2>
              <p className="text-[11px] text-slate-500">
                Progreso oficial hacia la Meta Fija y Meta Final (Base Imponible Sin IVA).
              </p>
            </div>
          </div>
          <span className="text-xs bg-red-50 text-red-700 border border-red-200 font-bold px-2.5 py-1 rounded-lg">
            {sellerStats.length} Pilotos en Competencia
          </span>
        </div>

        {/* Unified Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="p-3.5 pl-4">Asesor / Piloto</th>
                <th className="p-3.5 min-w-[200px]">Progreso del Recorrido</th>
                <th className="p-3.5 text-right">Ventas</th>
                <th className="p-3.5 text-center">Cierres</th>
                <th className="p-3.5 text-center">Salida</th>
                <th className="p-3.5 min-w-[160px]">Meta Fija</th>
                <th className="p-3.5 min-w-[160px]">Meta Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellerStats.map((seller) => {
                const remainingToFija = Math.max(0, seller.metaFija - seller.totalAmount);
                const remainingToFinal = Math.max(0, seller.metaFinal - seller.totalAmount);

                return (
                  <tr key={seller.id} className="hover:bg-slate-50/90 transition-colors">
                    
                    {/* 1. Asesor / Piloto */}
                    <td className="p-3.5 pl-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs shrink-0"
                          style={{ backgroundColor: seller.color }}
                        >
                          {seller.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {seller.name}
                            </span>
                            <span className="text-sm">{seller.carIcon}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            📍 {seller.stageLabel}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Progreso del Recorrido */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-600">Tramo Rally</span>
                          <span className="text-red-600 font-black">{Math.round(seller.trackProgress)}%</span>
                        </div>
                        <div className="relative w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          {/* 50% Meta Fija Divider */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300 z-10" title="50% Meta Fija"></div>
                          <div
                            className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1 text-[8px]"
                            style={{
                              width: `${seller.trackProgress}%`,
                              background: seller.isFinalReached
                                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                : seller.isFijaReached
                                ? "linear-gradient(90deg, #10b981, #059669)"
                                : "linear-gradient(90deg, #3b82f6, #f59e0b)"
                            }}
                          >
                            {seller.carIcon}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Ventas Totales (Sin IVA) */}
                    <td className="p-3.5 text-right font-black text-slate-900 text-sm">
                      ${seller.totalSinIva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 4. Cierres */}
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-xs font-black">
                        {seller.count}
                      </span>
                    </td>

                    {/* 5. Salida */}
                    <td className="p-3.5 text-center">
                      <div className="inline-block bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-left">
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Sea Camp</span>
                        <span className="text-[11px] font-black text-emerald-600">✓ $0.00</span>
                      </div>
                    </td>

                    {/* 6. Meta Fija */}
                    <td className="p-3.5">
                      <div className={`p-2 rounded-xl border ${
                        seller.isFijaReached
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-amber-50/70 border-amber-200 text-amber-900"
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs">${seller.metaFija.toLocaleString()}</span>
                          {seller.isFijaReached && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <span className="text-[10px] font-bold block mt-0.5">
                          {seller.isFijaReached ? "🎉 ¡Alcanzada!" : `Faltan $${remainingToFija.toFixed(2)}`}
                        </span>
                      </div>
                    </td>

                    {/* 7. Meta Final */}
                    <td className="p-3.5">
                      <div className={`p-2 rounded-xl border ${
                        seller.isFinalReached
                          ? "bg-red-50 border-red-300 text-red-900 ring-1 ring-red-400"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs">${seller.metaFinal.toLocaleString()}</span>
                          {seller.isFinalReached && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <span className="text-[10px] font-bold block mt-0.5">
                          {seller.isFinalReached ? "🏆 ¡Campeón!" : `Faltan $${remainingToFinal.toFixed(2)}`}
                        </span>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}
