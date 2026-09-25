import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Filter,
  Search,
  ShoppingBag,
  DollarSign,
  Layers,
  Calculator,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { SaleTransaction, normalizeDateString, isUpContaSale } from "../utils/salesStorage";

export interface ProductSummaryTableProps {
  sales: SaleTransaction[];
  companyMode?: "all" | "upconta" | "firmas" | "locked";
  allAdvisers?: string[];
  formatCurrency?: (val: number) => string;
}

interface ProductDetailRow {
  key: string;
  nombreDetallado: string;
  categoriaPrincipal: string;
  modalidad: string;
  linea: "UPCONTA" | "FIRMAS";
  cantidad: number;
  montoSinIva: number;
  montoConIva: number;
  ticketSinIva: number;
  ticketConIva: number;
  porcentajeMonto: number;
  porcentajeCantidad: number;
  asesoresStr: string;
}

const SPANISH_MONTH_NAMES: Record<string, string> = {
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

// Friday-to-Thursday week calculation helper
function getFridayToThursdayWeek(dateStr: string) {
  if (!dateStr) return { weekNumber: 1, label: "Semana 1" };
  const norm = normalizeDateString(dateStr);
  const parts = norm.split("-");
  if (parts.length !== 3) return { weekNumber: 1, label: "Semana 1" };

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { weekNumber: 1, label: "Semana 1" };
  }

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
  return { weekNumber: weekNum, label: `Semana ${weekNum}` };
}

function getWeekRangesForMonth(selectedMonthStr: string) {
  let year = 2026;
  let month = 9;

  const mLower = (selectedMonthStr || "").toLowerCase();
  if (mLower.includes("june") || mLower.includes("junio")) month = 6;
  else if (mLower.includes("may") || mLower.includes("mayo")) month = 5;
  else if (mLower.includes("april") || mLower.includes("abril")) month = 4;
  else if (mLower.includes("march") || mLower.includes("marzo")) month = 3;
  else if (mLower.includes("february") || mLower.includes("febrero")) month = 2;
  else if (mLower.includes("january") || mLower.includes("enero")) month = 1;
  else if (mLower.includes("july") || mLower.includes("julio")) month = 7;
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

function matchMonth(item: SaleTransaction, targetMonth: string) {
  if (!targetMonth || targetMonth === "all_year" || targetMonth === "all") return true;
  const mLower = targetMonth.toLowerCase().trim();
  const itemMesLower = (item.mes || "").toLowerCase().trim();
  if (itemMesLower && (itemMesLower === mLower || itemMesLower.includes(mLower))) return true;

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
  return false;
}

// -------------------------------------------------------------
// INDIVIDUAL PRODUCT TABLE SECTION (USED FOR UPCONTA AND FIRMAS)
// -------------------------------------------------------------
interface SingleTableProps {
  tipoLinea: "UPCONTA" | "FIRMAS";
  title: string;
  subtitle: string;
  salesData: SaleTransaction[];
  advisersList: string[];
  formatCurrency: (val: number) => string;
}

function SingleProductTableSection({
  tipoLinea,
  title,
  subtitle,
  salesData,
  advisersList,
  formatCurrency
}: SingleTableProps) {
  // Determine latest recorded date in this specific dataset
  const latestDate = useMemo(() => {
    if (!salesData || salesData.length === 0) return "2026-09-24";
    const dates = salesData.map(s => normalizeDateString(s.fecha)).filter(Boolean);
    dates.sort((a, b) => (b > a ? 1 : b < a ? -1 : 0));
    return dates[0] || "2026-09-24";
  }, [salesData]);

  // Dedicated filter state for this table
  const [filterMode, setFilterMode] = useState<"dia" | "semana" | "mes" | "rango">("mes");
  const [selectedDay, setSelectedDay] = useState<string>(latestDate);
  const [selectedMonth, setSelectedMonth] = useState<string>("September 2026");
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("2026-09-01");
  const [endDate, setEndDate] = useState<string>("2026-09-30");
  const [selectedAdviser, setSelectedAdviser] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showIvaMode, setShowIvaMode] = useState<"sin_iva" | "con_iva">("sin_iva");

  // Sorting
  const [sortBy, setSortBy] = useState<"monto" | "cantidad" | "ticket" | "nombre">("monto");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const isUpconta = tipoLinea === "UPCONTA";
  const themeBorder = isUpconta ? "border-blue-500/40" : "border-amber-500/40";
  const themeBadge = isUpconta ? "bg-blue-100 text-blue-900 border-blue-200" : "bg-amber-100 text-amber-900 border-amber-200";
  const themeHeaderBg = isUpconta ? "bg-[#0B2545]" : "bg-[#002244]";
  const themeProgressBar = isUpconta ? "bg-blue-600" : "bg-amber-500";

  // Dynamic week ranges for selectedMonth
  const weekRanges = useMemo(() => {
    return getWeekRangesForMonth(selectedMonth);
  }, [selectedMonth]);

  const availableMonths = [
    "January 2026", "February 2026", "March 2026", "April 2026",
    "May 2026", "June 2026", "July 2026", "August 2026",
    "September 2026", "October 2026", "November 2026", "December 2026"
  ];

  // Formatted day label
  const formattedDayLabel = useMemo(() => {
    if (!selectedDay) return "";
    const parts = selectedDay.split("-");
    if (parts.length !== 3) return selectedDay;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${dayNames[dateObj.getDay()]}, ${d} ${monthNames[m - 1]} ${y}`;
  }, [selectedDay]);

  // Filter this table's sales
  const filteredSales = useMemo(() => {
    return salesData.filter((item) => {
      // Adviser filter
      if (selectedAdviser !== "all" && (item.asesor || "").toLowerCase() !== selectedAdviser.toLowerCase()) {
        return false;
      }

      // Date filtering: DIA / SEMANA / MES / RANGO
      const itemFecha = normalizeDateString(item.fecha);

      if (filterMode === "dia") {
        if (itemFecha !== selectedDay) return false;
      } else if (filterMode === "semana") {
        if (!matchMonth(item, selectedMonth)) return false;
        if (selectedWeek !== "all") {
          const weekInfo = getFridayToThursdayWeek(item.fecha);
          if (weekInfo.weekNumber !== parseInt(selectedWeek, 10)) return false;
        }
      } else if (filterMode === "mes") {
        if (!matchMonth(item, selectedMonth)) return false;
      } else if (filterMode === "rango") {
        if (startDate && itemFecha < startDate) return false;
        if (endDate && itemFecha > endDate) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (item.producto || "").toLowerCase().includes(q) ||
          (item.plan || "").toLowerCase().includes(q) ||
          (item.tipo || "").toLowerCase().includes(q) ||
          (item.asesor || "").toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [salesData, selectedAdviser, filterMode, selectedDay, selectedMonth, selectedWeek, startDate, endDate, searchQuery]);

  // Aggregate by granular product type
  // For UpConta: Plan name (Light, Power, Intermedio, Inicial, Ultra, Ideal Plus, ERP Start, etc.)
  // For Firmas: Producto + Plan (Firma Natural 1 Año, Firma Natural con RUC 2 Años, Firma Jurídica, etc.)
  const { productRows, totals } = useMemo(() => {
    const map: Record<string, {
      key: string;
      nombreDetallado: string;
      categoriaPrincipal: string;
      modalidad: string;
      cantidad: number;
      montoSinIva: number;
      montoConIva: number;
      asesoresMap: Record<string, number>;
    }> = {};

    let sumSinIva = 0;
    let sumConIva = 0;
    let sumCantidad = 0;

    filteredSales.forEach((s) => {
      let key = "";
      let nombreDetallado = "";
      let categoriaPrincipal = "";
      let modalidad = (s.tipo || "Nuevo").trim();

      if (isUpconta) {
        // UPCONTA GRANULAR BREAKDOWN: Light, Power, Intermedio, Ultra, ERP Start, Contador, etc.
        const planRaw = (s.plan || "").trim();
        const prodRaw = (s.producto || "").trim();

        if (planRaw) {
          key = planRaw;
          nombreDetallado = planRaw;
          categoriaPrincipal = prodRaw || "UpConta ERP & Facturación";
        } else {
          key = prodRaw || "Plan General";
          nombreDetallado = prodRaw || "Plan General UpConta";
          categoriaPrincipal = "UpConta";
        }
      } else {
        // FIRMAS GRANULAR BREAKDOWN: 1 Año Natural, 2 Años Natural, RUC Jurídica, etc.
        const prodRaw = (s.producto || "Firma Electrónica").trim();
        const planRaw = (s.plan || "").trim();

        if (planRaw && planRaw !== prodRaw) {
          key = `${prodRaw} — ${planRaw}`;
          nombreDetallado = `${prodRaw} — ${planRaw}`;
          categoriaPrincipal = prodRaw;
        } else {
          key = prodRaw;
          nombreDetallado = prodRaw;
          categoriaPrincipal = "Certificados Digitales";
        }
      }

      if (!map[key]) {
        map[key] = {
          key,
          nombreDetallado,
          categoriaPrincipal,
          modalidad,
          cantidad: 0,
          montoSinIva: 0,
          montoConIva: 0,
          asesoresMap: {}
        };
      }

      const valSinIva = Number(s.totalSinIva) || (Number(s.total) ? Number((s.total / 1.15).toFixed(2)) : 0) || 0;
      const valConIva = Number(s.total) || (valSinIva * 1.15);

      map[key].cantidad += 1;
      map[key].montoSinIva += valSinIva;
      map[key].montoConIva += valConIva;

      const adv = s.asesor ? s.asesor.trim() : "Otro";
      map[key].asesoresMap[adv] = (map[key].asesoresMap[adv] || 0) + 1;

      sumSinIva += valSinIva;
      sumConIva += valConIva;
      sumCantidad += 1;
    });

    const rows: ProductDetailRow[] = Object.values(map).map((item) => {
      const ticketSinIva = item.cantidad > 0 ? item.montoSinIva / item.cantidad : 0;
      const ticketConIva = item.cantidad > 0 ? item.montoConIva / item.cantidad : 0;
      const porcentajeMonto = sumSinIva > 0 ? (item.montoSinIva / sumSinIva) * 100 : 0;
      const porcentajeCantidad = sumCantidad > 0 ? (item.cantidad / sumCantidad) * 100 : 0;

      const topAdvisers = Object.entries(item.asesoresMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name, count]) => `${name} (${count})`)
        .join(", ");

      return {
        key: item.key,
        nombreDetallado: item.nombreDetallado,
        categoriaPrincipal: item.categoriaPrincipal,
        modalidad: item.modalidad,
        linea: tipoLinea,
        cantidad: item.cantidad,
        montoSinIva: item.montoSinIva,
        montoConIva: item.montoConIva,
        ticketSinIva,
        ticketConIva,
        porcentajeMonto,
        porcentajeCantidad,
        asesoresStr: topAdvisers
      };
    });

    // Sorting
    rows.sort((a, b) => {
      let comp = 0;
      if (sortBy === "monto") {
        const valA = showIvaMode === "sin_iva" ? a.montoSinIva : a.montoConIva;
        const valB = showIvaMode === "sin_iva" ? b.montoSinIva : b.montoConIva;
        comp = valB - valA;
      } else if (sortBy === "cantidad") {
        comp = b.cantidad - a.cantidad;
      } else if (sortBy === "ticket") {
        const valA = showIvaMode === "sin_iva" ? a.ticketSinIva : a.ticketConIva;
        const valB = showIvaMode === "sin_iva" ? b.ticketSinIva : b.ticketConIva;
        comp = valB - valA;
      } else if (sortBy === "nombre") {
        comp = a.nombreDetallado.localeCompare(b.nombreDetallado);
      }
      return sortOrder === "asc" ? -comp : comp;
    });

    return {
      productRows: rows,
      totals: {
        totalTipos: rows.length,
        totalCantidad: sumCantidad,
        totalMontoSinIva: sumSinIva,
        totalMontoConIva: sumConIva,
        ticketPromedioSinIva: sumCantidad > 0 ? sumSinIva / sumCantidad : 0,
        ticketPromedioConIva: sumCantidad > 0 ? sumConIva / sumCantidad : 0
      }
    };
  }, [filteredSales, isUpconta, tipoLinea, sortBy, sortOrder, showIvaMode]);

  // Handler to toggle column sorting
  const handleSort = (column: "monto" | "cantidad" | "ticket" | "nombre") => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Export CSV for this specific table
  const handleExportCSV = () => {
    const headers = [
      "Ranking",
      "Tipo de Producto / Plan Detallado",
      "Categoría",
      "Cantidad (#)",
      "Monto Sin IVA ($)",
      "Monto Con IVA ($)",
      "Ticket Promedio Sin IVA ($)",
      "Ticket Promedio Con IVA ($)",
      "% Cuota Facturación",
      "Asesores"
    ];

    const rows = productRows.map((r, idx) => [
      idx + 1,
      `"${r.nombreDetallado.replace(/"/g, '""')}"`,
      `"${r.categoriaPrincipal.replace(/"/g, '""')}"`,
      r.cantidad,
      r.montoSinIva.toFixed(2),
      r.montoConIva.toFixed(2),
      r.ticketSinIva.toFixed(2),
      r.ticketConIva.toFixed(2),
      `${r.porcentajeMonto.toFixed(1)}%`,
      `"${r.asesoresStr.replace(/"/g, '""')}"`
    ]);

    rows.push([
      "TOTAL",
      `"${totals.totalTipos} Tipos de Productos"`,
      "-",
      totals.totalCantidad,
      totals.totalMontoSinIva.toFixed(2),
      totals.totalMontoConIva.toFixed(2),
      totals.ticketPromedioSinIva.toFixed(2),
      totals.ticketPromedioConIva.toFixed(2),
      "100.0%",
      "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tabla_productos_${tipoLinea.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-md space-y-5 ${themeBorder}`}>
      {/* 1. Header of Table */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isUpconta ? "bg-orange-500 text-white" : "bg-amber-400 text-blue-950"} shadow-sm`}>
            {isUpconta ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {title}
              </h3>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${themeBadge}`}>
                {productRows.length} tipos de producto
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setShowIvaMode("sin_iva")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                showIvaMode === "sin_iva" ? "bg-[#0B2545] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sin IVA
            </button>
            <button
              type="button"
              onClick={() => setShowIvaMode("con_iva")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                showIvaMode === "con_iva" ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Con IVA
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Exportar esta tabla a CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Scorecard Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cantidad Total */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              Cantidad Total ({isUpconta ? "Planes" : "Certificados"})
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              {totals.totalCantidad} <span className="text-xs font-bold text-slate-500">unidades</span>
            </span>
          </div>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Monto Total */}
        <div className={`rounded-2xl p-3.5 text-white flex items-center justify-between shadow-xs ${isUpconta ? "bg-gradient-to-r from-[#0B2545] to-[#003566]" : "bg-gradient-to-r from-[#002244] to-[#003366]"}`}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-300 block">
              Facturación {showIvaMode === "sin_iva" ? "Sin IVA" : "Con IVA"}
            </span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {formatCurrency(showIvaMode === "sin_iva" ? totals.totalMontoSinIva : totals.totalMontoConIva)}
            </span>
            <span className="text-[10px] font-bold text-slate-300 block">
              {showIvaMode === "sin_iva"
                ? `Con IVA: ${formatCurrency(totals.totalMontoConIva)}`
                : `Sin IVA: ${formatCurrency(totals.totalMontoSinIva)}`}
            </span>
          </div>
          <div className="p-2 bg-white/10 rounded-xl text-amber-300 border border-white/10">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
              Ticket Promedio
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-950">
              {formatCurrency(showIvaMode === "sin_iva" ? totals.ticketPromedioSinIva : totals.ticketPromedioConIva)}
            </span>
            <span className="text-[10px] font-bold text-slate-500 block">
              Por unidad comercializada
            </span>
          </div>
          <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
            <Calculator className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. INDEPENDENT FILTER BAR FOR THIS TABLE */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3">
        {/* Row A: Date Filter Mode Buttons + Adviser Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
          {/* Date Mode Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterMode("dia")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterMode === "dia" ? "bg-[#0B2545] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Día</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("semana")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterMode === "semana" ? "bg-[#0B2545] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3 h-3 text-blue-400" />
              <span>Semana</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("mes")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterMode === "mes" ? "bg-[#0B2545] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Mes</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("rango")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                filterMode === "rango" ? "bg-orange-500 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3 h-3 text-white" />
              <span>Rango</span>
            </button>
          </div>

          {/* Adviser Dropdown */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Asesor:</label>
            <select
              value={selectedAdviser}
              onChange={(e) => setSelectedAdviser(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 w-full sm:w-48"
            >
              <option value="all">Todos los Asesores ({advisersList.length})</option>
              {advisersList.map((adv) => (
                <option key={adv} value={adv}>
                  {adv}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row B: Dynamic Controls for Chosen Filter Mode */}
        {filterMode === "dia" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600">Fecha del Día:</span>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900"
            />
            {latestDate && (
              <button
                type="button"
                onClick={() => setSelectedDay(latestDate)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border cursor-pointer ${
                  selectedDay === latestDate ? "bg-orange-500 text-white border-orange-500" : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                Última venta ({latestDate})
              </button>
            )}
            <span className="sm:ml-auto text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {formattedDayLabel}
            </span>
          </div>
        )}

        {filterMode === "semana" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Mes:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
              >
                {availableMonths.map((mStr) => {
                  const [mName, year] = mStr.split(" ");
                  return (
                    <option key={mStr} value={mStr}>
                      {SPANISH_MONTH_NAMES[mName] || mName} {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Semana:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-900"
              >
                <option value="all">Todas las Semanas</option>
                {weekRanges.map((wr) => (
                  <option key={wr.weekNum} value={String(wr.weekNum)}>
                    {wr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filterMode === "mes" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Mes Calendario:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs font-bold text-slate-900 w-full sm:w-60"
            >
              <option value="all_year">⭐ Todo el Año / Histórico Completo</option>
              {availableMonths.map((mStr) => {
                const [mName, year] = mStr.split(" ");
                return (
                  <option key={mStr} value={mStr}>
                    {SPANISH_MONTH_NAMES[mName] || mName} {year}
                  </option>
                );
              })}
            </select>
            <div className="flex items-center gap-1.5 sm:ml-auto">
              <button
                type="button"
                onClick={() => setSelectedMonth("September 2026")}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
              >
                Septiembre 2026
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonth("all_year")}
                className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 cursor-pointer"
              >
                Todo el Año
              </button>
            </div>
          </div>
        )}

        {filterMode === "rango" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
            />
            <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
            />
          </div>
        )}

        {/* Search Input for this table */}
        <div className="relative">
          <input
            type="text"
            placeholder={isUpconta ? "Buscar plan (Light, Power, Intermedio, ERP...)" : "Buscar firma (1 año, 2 años, natural, jurídica...)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* 4. THE PRODUCTS TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className={`${themeHeaderBg} text-white uppercase text-[10px] font-black tracking-wider select-none`}>
            <tr>
              <th className="p-3 w-10 text-center">#</th>
              {/* Product Column */}
              <th
                onClick={() => handleSort("nombre")}
                className="p-3 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tipo de Producto / Plan Detallado</span>
                  {sortBy === "nombre" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Cantidad Column */}
              <th
                onClick={() => handleSort("cantidad")}
                className="p-3 text-right cursor-pointer hover:bg-slate-800 transition-colors w-28"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Cantidad (#)</span>
                  {sortBy === "cantidad" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              {/* Monto Column */}
              <th
                onClick={() => handleSort("monto")}
                className="p-3 text-right cursor-pointer hover:bg-slate-800 transition-colors bg-orange-700/40 w-36"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Monto ({showIvaMode === "sin_iva" ? "Sin IVA" : "Con IVA"})</span>
                  {sortBy === "monto" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-amber-300" /> : <ArrowDown className="w-3 h-3 text-amber-300" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-amber-300/70" />
                  )}
                </div>
              </th>

              {/* Ticket Promedio */}
              <th
                onClick={() => handleSort("ticket")}
                className="p-3 text-right cursor-pointer hover:bg-slate-800 transition-colors w-32"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Ticket Promedio</span>
                  {sortBy === "ticket" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3 text-orange-400" /> : <ArrowDown className="w-3 h-3 text-orange-400" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>

              {/* % Cuota Facturación */}
              <th className="p-3 text-center w-28">% Participación</th>

              {/* Asesores */}
              <th className="p-3 w-40">Asesores</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {productRows.length > 0 ? (
              productRows.map((row, idx) => {
                const montoDisplay = showIvaMode === "sin_iva" ? row.montoSinIva : row.montoConIva;
                const ticketDisplay = showIvaMode === "sin_iva" ? row.ticketSinIva : row.ticketConIva;

                return (
                  <tr
                    key={row.key}
                    className={`transition-colors ${
                      idx === 0
                        ? "bg-amber-50/50 hover:bg-amber-100/50"
                        : idx % 2 === 0
                        ? "bg-white hover:bg-slate-50"
                        : "bg-slate-50/70 hover:bg-slate-100/70"
                    }`}
                  >
                    {/* Index */}
                    <td className="p-3 text-center font-bold text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    {/* Nombre Detallado */}
                    <td className="p-3">
                      <div className="font-black text-slate-900 text-xs">
                        {row.nombreDetallado}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        {row.categoriaPrincipal}
                      </div>
                    </td>

                    {/* Cantidad */}
                    <td className="p-3 text-right">
                      <span className="inline-block bg-slate-100 border border-slate-200 text-slate-900 font-black px-2.5 py-1 rounded-xl text-xs">
                        {row.cantidad} <span className="text-[10px] text-slate-500 font-bold">uds</span>
                      </span>
                    </td>

                    {/* Monto */}
                    <td className="p-3 text-right bg-orange-50/40 font-black">
                      <div className="text-sm font-black text-emerald-600">
                        {formatCurrency(montoDisplay)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {showIvaMode === "sin_iva"
                          ? `Con IVA: ${formatCurrency(row.montoConIva)}`
                          : `Sin IVA: ${formatCurrency(row.montoSinIva)}`}
                      </div>
                    </td>

                    {/* Ticket Promedio */}
                    <td className="p-3 text-right font-black">
                      <div className="text-xs font-black text-purple-700">
                        {formatCurrency(ticketDisplay)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        / unidad
                      </div>
                    </td>

                    {/* % Participación */}
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-700 text-center">
                          {row.porcentajeMonto.toFixed(1)}%
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${themeProgressBar}`}
                            style={{ width: `${Math.min(100, Math.max(3, row.porcentajeMonto))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Asesores */}
                    <td className="p-3 text-[11px] text-slate-600 font-semibold truncate max-w-xs">
                      {row.asesoresStr || "Equipo comercial"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 space-y-1">
                  <ShoppingBag className="w-7 h-7 text-slate-400 mx-auto opacity-50" />
                  <p className="font-extrabold text-xs text-slate-700">
                    No se encontraron registros de productos para los filtros seleccionados
                  </p>
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer Totals */}
          <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-orange-500">
            <tr>
              <td colSpan={2} className="p-3 uppercase tracking-wider text-slate-300">
                TOTAL {title.toUpperCase()} ({totals.totalTipos} Tipos)
              </td>
              <td className="p-3 text-right font-black text-amber-300 text-sm">
                {totals.totalCantidad} <span className="text-xs text-slate-300 font-bold">uds</span>
              </td>
              <td className="p-3 text-right bg-orange-600 text-white font-black text-sm">
                <div>
                  {formatCurrency(showIvaMode === "sin_iva" ? totals.totalMontoSinIva : totals.totalMontoConIva)}
                </div>
                <div className="text-[10px] font-bold text-orange-200">
                  {showIvaMode === "sin_iva"
                    ? `Con IVA: ${formatCurrency(totals.totalMontoConIva)}`
                    : `Sin IVA: ${formatCurrency(totals.totalMontoSinIva)}`}
                </div>
              </td>
              <td className="p-3 text-right font-black text-purple-300 text-sm">
                {formatCurrency(showIvaMode === "sin_iva" ? totals.ticketPromedioSinIva : totals.ticketPromedioConIva)}
              </td>
              <td className="p-3 text-center text-emerald-400 font-black">
                100.0%
              </td>
              <td className="p-3 text-slate-400 text-[11px] font-normal">
                {filteredSales.length} ventas
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MAIN CONTAINER: TWO SEPARATE TABLES (UPCONTA AND FIRMAS)
// -------------------------------------------------------------
export function ProductSummaryTable({
  sales,
  companyMode = "all",
  allAdvisers = [],
  formatCurrency = (v: number) => `$${v.toFixed(2)}`
}: ProductSummaryTableProps) {
  // Separate UpConta and Firmas sales
  const salesUpconta = useMemo(() => sales.filter(isUpContaSale), [sales]);
  const salesFirmas = useMemo(() => sales.filter(s => !isUpContaSale(s)), [sales]);

  // Unique advisers per category
  const advisersUpconta = useMemo(() => {
    const set = new Set<string>();
    salesUpconta.forEach(s => { if (s.asesor) set.add(s.asesor); });
    const list = Array.from(set);
    return list.length > 0 ? list : ["Karla Haro", "David Santander"];
  }, [salesUpconta]);

  const advisersFirmas = useMemo(() => {
    const set = new Set<string>();
    salesFirmas.forEach(s => { if (s.asesor) set.add(s.asesor); });
    const list = Array.from(set);
    return list.length > 0 ? list : ["Salomé Estrella", "Ismenia Escalona", "Evelyn Narváez"];
  }, [salesFirmas]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-6">
      {/* Top Banner indicating the two distinct tables */}
      <div className="bg-gradient-to-r from-[#0B2545] via-[#002b4d] to-[#0B2545] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-orange-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500 text-white">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-black text-white">
              Consolidado por Productos: UpConta y Firmas Electrónicas por Separado
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Dos tablas independientes con detalle individual de planes y tipos de producto, cada una con su propio filtro de fechas (día, semana, mes, rango) y asesor.
          </p>
        </div>

        {/* Quick jump anchor links */}
        {(companyMode === "all" || companyMode === "locked") && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <a
              href="#tabla-upconta"
              className="px-3 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ir a UpConta</span>
            </a>
            <a
              href="#tabla-firmas"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ir a Firmas.ec</span>
            </a>
          </div>
        )}
      </div>

      {/* ================= TABLA 1: UPCONTA ================= */}
      {(companyMode === "upconta" || companyMode === "all" || companyMode === "locked") && (
        <div id="tabla-upconta" className="scroll-mt-6">
          <SingleProductTableSection
            tipoLinea="UPCONTA"
            title="1. Tabla de Productos UpConta (Planes & ERP)"
            subtitle="Detalle individual por plan: Light, Power, Intermedio, Inicial, Base, Ultra, Ideal Plus, ERP UpConta Start/Plus/Premium, Plan Contador, etc."
            salesData={salesUpconta}
            advisersList={advisersUpconta}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {/* ================= TABLA 2: FIRMAS ELECTRÓNICAS ================= */}
      {(companyMode === "firmas" || companyMode === "all" || companyMode === "locked") && (
        <div id="tabla-firmas" className="scroll-mt-6">
          <SingleProductTableSection
            tipoLinea="FIRMAS"
            title="2. Tabla de Productos Firmas Electrónicas.ec"
            subtitle="Detalle individual por vigencia y personería: 1 Año Natural, 2 Años Natural, RUC Jurídica, Token, 15 Días, 3 y 5 Años, etc."
            salesData={salesFirmas}
            advisersList={advisersFirmas}
            formatCurrency={formatCurrency}
          />
        </div>
      )}
    </div>
  );
}
