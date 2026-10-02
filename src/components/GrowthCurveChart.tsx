import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Users,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Percent,
  Table as TableIcon
} from "lucide-react";
import { SaleTransaction, normalizeDateString } from "../utils/salesStorage";

interface GrowthCurveChartProps {
  sales: SaleTransaction[];
  companyMode?: "all" | "upconta" | "firmas" | "locked";
  allAdvisers?: string[];
  formatCurrency?: (val: number) => string;
}

export const MONTHS_CONFIG = [
  { index: 1, name: "Enero", short: "Ene", full: "Enero 2026", en: "january" },
  { index: 2, name: "Febrero", short: "Feb", full: "Febrero 2026", en: "february" },
  { index: 3, name: "Marzo", short: "Mar", full: "Marzo 2026", en: "march" },
  { index: 4, name: "Abril", short: "Abr", full: "Abril 2026", en: "april" },
  { index: 5, name: "Mayo", short: "May", full: "Mayo 2026", en: "may" },
  { index: 6, name: "Junio", short: "Jun", full: "Junio 2026", en: "june" },
  { index: 7, name: "Julio", short: "Jul", full: "Julio 2026", en: "july" },
  { index: 8, name: "Agosto", short: "Ago", full: "Agosto 2026", en: "august" },
  { index: 9, name: "Septiembre", short: "Sep", full: "Septiembre 2026", en: "september" },
  { index: 10, name: "Octubre", short: "Oct", full: "Octubre 2026", en: "october" },
  { index: 11, name: "Noviembre", short: "Nov", full: "Noviembre 2026", en: "november" },
  { index: 12, name: "Diciembre", short: "Dic", full: "Diciembre 2026", en: "december" }
];

export function GrowthCurveChart({
  sales,
  companyMode = "all",
  allAdvisers = [],
  formatCurrency = (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}: GrowthCurveChartProps) {
  // Filters & display state
  const [metricMode, setMetricMode] = useState<"sin_iva" | "con_iva">("sin_iva");
  const [chartStyle, setChartStyle] = useState<"area" | "line" | "acumulado">("area");
  const [selectedAdviser, setSelectedAdviser] = useState<string>("all");
  const [selectedLine, setSelectedLine] = useState<"all" | "upconta" | "firmas">("all");
  const [showTable, setShowTable] = useState<boolean>(true);

  // Filter sales according to user selections
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      // 1. Advisor filter
      if (selectedAdviser !== "all") {
        if ((item.asesor || "").trim().toLowerCase() !== selectedAdviser.trim().toLowerCase()) {
          return false;
        }
      }

      // 2. Commercial line filter (UpConta vs Firmas)
      if (selectedLine !== "all") {
        const prod = (item.producto || "").toLowerCase();
        const plan = (item.plan || "").toLowerCase();
        const isUpconta =
          prod.includes("erp") ||
          prod.includes("factura") ||
          prod.includes("contador") ||
          plan.includes("erp") ||
          plan.includes("upconta");

        if (selectedLine === "upconta" && !isUpconta) return false;
        if (selectedLine === "firmas" && isUpconta) return false;
      }

      return true;
    });
  }, [sales, selectedAdviser, selectedLine]);

  // Aggregate monthly data for the 12 months of 2026
  const monthlyData = useMemo(() => {
    const rawMap: Record<number, {
      nuevasSinIva: number;
      nuevasConIva: number;
      nuevasOps: number;
      renovacionesSinIva: number;
      renovacionesConIva: number;
      renovacionesOps: number;
      totalSinIva: number;
      totalConIva: number;
      totalOps: number;
    }> = {};

    MONTHS_CONFIG.forEach(m => {
      rawMap[m.index] = {
        nuevasSinIva: 0,
        nuevasConIva: 0,
        nuevasOps: 0,
        renovacionesSinIva: 0,
        renovacionesConIva: 0,
        renovacionesOps: 0,
        totalSinIva: 0,
        totalConIva: 0,
        totalOps: 0
      };
    });

    for (const item of filteredSales) {
      const fecha = normalizeDateString(item.fecha || "");
      let monthIndex: number | null = null;

      // Extract month from 2026-MM-DD
      if (fecha.startsWith("2026-")) {
        const parts = fecha.split("-");
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          if (m >= 1 && m <= 12) monthIndex = m;
        }
      }

      // Fallback to item.mes if fecha doesn't explicitly start with 2026
      if (!monthIndex && item.mes) {
        const mesLower = item.mes.toLowerCase();
        if (mesLower.includes("2026") || !mesLower.match(/\d{4}/)) {
          const found = MONTHS_CONFIG.find(
            mc => mesLower.includes(mc.en) || mesLower.includes(mc.name.toLowerCase())
          );
          if (found) monthIndex = found.index;
        }
      }

      if (monthIndex && rawMap[monthIndex]) {
        const bucket = rawMap[monthIndex];
        const conIva = Number(item.total) || 0;
        const sinIva = Number(item.totalSinIva) || (conIva ? conIva / 1.15 : 0);
        const isRenovacion = (item.tipo || "").toLowerCase().includes("renovaci");

        bucket.totalSinIva += sinIva;
        bucket.totalConIva += conIva;
        bucket.totalOps += 1;

        if (isRenovacion) {
          bucket.renovacionesSinIva += sinIva;
          bucket.renovacionesConIva += conIva;
          bucket.renovacionesOps += 1;
        } else {
          bucket.nuevasSinIva += sinIva;
          bucket.nuevasConIva += conIva;
          bucket.nuevasOps += 1;
        }
      }
    }

    let runningAcumTotal = 0;
    let runningAcumNuevas = 0;
    let runningAcumRenov = 0;
    let prevTotal = 0;

    return MONTHS_CONFIG.map((mc, idx) => {
      const b = rawMap[mc.index];
      const nuevasVal = metricMode === "sin_iva" ? b.nuevasSinIva : b.nuevasConIva;
      const renovVal = metricMode === "sin_iva" ? b.renovacionesSinIva : b.renovacionesConIva;
      const totalVal = metricMode === "sin_iva" ? b.totalSinIva : b.totalConIva;

      runningAcumTotal += totalVal;
      runningAcumNuevas += nuevasVal;
      runningAcumRenov += renovVal;

      let growthPct = 0;
      if (idx > 0 && prevTotal > 0) {
        growthPct = ((totalVal - prevTotal) / prevTotal) * 100;
      }
      prevTotal = totalVal;

      const pctRenov = totalVal > 0 ? (renovVal / totalVal) * 100 : 0;
      const pctNuevas = totalVal > 0 ? (nuevasVal / totalVal) * 100 : 0;

      return {
        monthNum: mc.index,
        monthName: mc.name,
        monthShort: mc.short,
        label: `${mc.short} 2026`,
        nuevas: Number(nuevasVal.toFixed(2)),
        nuevasOps: b.nuevasOps,
        renovaciones: Number(renovVal.toFixed(2)),
        renovacionesOps: b.renovacionesOps,
        total: Number(totalVal.toFixed(2)),
        totalOps: b.totalOps,
        pctRenovacion: Number(pctRenov.toFixed(1)),
        pctNuevas: Number(pctNuevas.toFixed(1)),
        growthMoM: Number(growthPct.toFixed(1)),
        acumuladoTotal: Number(runningAcumTotal.toFixed(2)),
        acumuladoNuevas: Number(runningAcumNuevas.toFixed(2)),
        acumuladoRenov: Number(runningAcumRenov.toFixed(2))
      };
    });
  }, [filteredSales, metricMode]);

  // Executive Totals & KPIs
  const kpis = useMemo(() => {
    let totNuevas = 0;
    let totNuevasOps = 0;
    let totRenov = 0;
    let totRenovOps = 0;
    let maxMonthVal = 0;
    let maxMonthName = "N/A";

    monthlyData.forEach(d => {
      totNuevas += d.nuevas;
      totNuevasOps += d.nuevasOps;
      totRenov += d.renovaciones;
      totRenovOps += d.renovacionesOps;

      if (d.total > maxMonthVal) {
        maxMonthVal = d.total;
        maxMonthName = d.monthName;
      }
    });

    const grandTotal = totNuevas + totRenov;
    const grandOps = totNuevasOps + totRenovOps;
    const shareNuevas = grandTotal > 0 ? (totNuevas / grandTotal) * 100 : 0;
    const shareRenov = grandTotal > 0 ? (totRenov / grandTotal) * 100 : 0;

    // Average per active month (months with sales)
    const activeMonths = monthlyData.filter(d => d.total > 0).length || 1;
    const avgMonthly = grandTotal / activeMonths;

    return {
      grandTotal,
      grandOps,
      totNuevas,
      totNuevasOps,
      totRenov,
      totRenovOps,
      shareNuevas,
      shareRenov,
      maxMonthVal,
      maxMonthName,
      avgMonthly
    };
  }, [monthlyData]);

  // Custom polished Tooltip
  const CustomGrowthTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataItem = payload[0]?.payload;
    if (!dataItem) return null;

    const isAcum = chartStyle === "acumulado";

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 min-w-[240px] space-y-2.5 text-xs">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <span className="font-black text-sm text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-orange-400" />
            {dataItem.monthName} 2026
          </span>
          {dataItem.growthMoM !== 0 && !isAcum && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-0.5 ${
                dataItem.growthMoM > 0
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {dataItem.growthMoM > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {dataItem.growthMoM > 0 ? `+${dataItem.growthMoM}%` : `${dataItem.growthMoM}%`}
            </span>
          )}
        </div>

        {/* Breakdown Items */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-bold text-emerald-300">Ventas Nuevas:</span>
            </div>
            <div className="text-right">
              <div className="font-black text-emerald-100">
                {formatCurrency(isAcum ? dataItem.acumuladoNuevas : dataItem.nuevas)}
              </div>
              <div className="text-[10px] text-emerald-400/80 font-semibold">
                {dataItem.nuevasOps} ops ({dataItem.pctNuevas}%)
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-bold text-amber-300">Renovaciones:</span>
            </div>
            <div className="text-right">
              <div className="font-black text-amber-100">
                {formatCurrency(isAcum ? dataItem.acumuladoRenov : dataItem.renovaciones)}
              </div>
              <div className="text-[10px] text-amber-400/80 font-semibold">
                {dataItem.renovacionesOps} ops ({dataItem.pctRenovacion}%)
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="font-black text-slate-200">
                {isAcum ? "Total Acumulado:" : "Total del Mes:"}
              </span>
            </div>
            <div className="text-right">
              <div className="font-black text-white text-sm">
                {formatCurrency(isAcum ? dataItem.acumuladoTotal : dataItem.total)}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {dataItem.totalOps} operaciones totales
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header with Title and Mode Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-md text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Curva de Crecimiento de Ventas 2026</span>
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Ene - Dic
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Evolución de ventas mes a mes separando <strong>Ventas Nuevas</strong> vs <strong>Renovaciones</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Base Imponible Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setMetricMode("sin_iva")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                metricMode === "sin_iva"
                  ? "bg-[#0B2545] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sin IVA (Base)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("con_iva")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                metricMode === "con_iva"
                  ? "bg-[#0B2545] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Total con IVA
            </button>
          </div>

          {/* Chart View Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setChartStyle("area")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                chartStyle === "area"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Área Suave
            </button>
            <button
              type="button"
              onClick={() => setChartStyle("line")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                chartStyle === "line"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Líneas
            </button>
            <button
              type="button"
              onClick={() => setChartStyle("acumulado")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                chartStyle === "acumulado"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Acumulado
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row: Advisor & Line Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-black text-slate-700">Filtros de Análisis:</span>
          </div>

          {/* Commercial Line Filter */}
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="all">🏢 Todas las Líneas (Consolidado)</option>
            <option value="upconta">💼 Línea UpConta (ERP y Facturación)</option>
            <option value="firmas">🛡️ Línea Firmas Electrónicas</option>
          </select>

          {/* Advisor Filter */}
          <select
            value={selectedAdviser}
            onChange={(e) => setSelectedAdviser(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
          >
            <option value="all">👥 Todo el Equipo Comercial</option>
            {allAdvisers.map((adv) => (
              <option key={adv} value={adv}>
                👤 Asesor: {adv}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Data Table button */}
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
        >
          <TableIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>{showTable ? "Ocultar Tabla Mensual" : "Ver Tabla Mensual"}</span>
        </button>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Facturado 2026 */}
        <div className="bg-gradient-to-br from-[#0B2545] to-[#133A68] text-white p-5 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Total Ventas 2026 ({metricMode === "sin_iva" ? "Sin IVA" : "Con IVA"})
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
            {formatCurrency(kpis.grandTotal)}
          </div>
          <div className="text-[11px] text-slate-300 font-semibold mt-1 flex items-center gap-1">
            <span>{kpis.grandOps} transacciones registradas</span>
          </div>
        </div>

        {/* KPI 2: Ventas Nuevas 2026 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-200 relative overflow-hidden group hover:border-emerald-400 transition-all">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Ventas Nuevas
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            {formatCurrency(kpis.totNuevas)}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center justify-between">
            <span>{kpis.totNuevasOps} operaciones</span>
            <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {kpis.shareNuevas.toFixed(1)}% del total
            </span>
          </div>
        </div>

        {/* KPI 3: Renovaciones 2026 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-200 relative overflow-hidden group hover:border-amber-400 transition-all">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Renovaciones
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            {formatCurrency(kpis.totRenov)}
          </div>
          <div className="text-[11px] text-amber-700 font-bold mt-1 flex items-center justify-between">
            <span>{kpis.totRenovOps} operaciones</span>
            <span className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {kpis.shareRenov.toFixed(1)}% del total
            </span>
          </div>
        </div>

        {/* KPI 4: Mes Pico & Promedio */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-orange-400 transition-all">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Mes Récord 2026
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            {kpis.maxMonthName}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center justify-between">
            <span>Pico: <strong className="text-slate-800">{formatCurrency(kpis.maxMonthVal)}</strong></span>
            <span>Prom: {formatCurrency(kpis.avgMonthly)}/mes</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Growth Curve */}
      <div className="pt-2">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === "area" ? (
              <AreaChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  {/* Nuevas Gradient */}
                  <linearGradient id="colorNuevas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>

                  {/* Renovaciones Gradient */}
                  <linearGradient id="colorRenovaciones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.02} />
                  </linearGradient>

                  {/* Total Gradient */}
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B2545" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0B2545" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  tick={{ fontSize: 12, fontWeight: "bold", fill: "#334155" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip content={<CustomGrowthTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "20px", fontSize: "12px", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="nuevas"
                  name="Ventas Nuevas ($)"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorNuevas)"
                  activeDot={{ r: 6, fill: "#10B981", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="renovaciones"
                  name="Renovaciones ($)"
                  stroke="#F97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRenovaciones)"
                  activeDot={{ r: 6, fill: "#F97316", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Consolidado ($)"
                  stroke="#0B2545"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  fill="none"
                  activeDot={{ r: 5, fill: "#0B2545", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            ) : chartStyle === "line" ? (
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  tick={{ fontSize: 12, fontWeight: "bold", fill: "#334155" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip content={<CustomGrowthTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "20px", fontSize: "12px", fontWeight: "bold" }}
                />
                <Line
                  type="monotone"
                  dataKey="nuevas"
                  name="Ventas Nuevas ($)"
                  stroke="#10B981"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: "#10B981", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#10B981", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="renovaciones"
                  name="Renovaciones ($)"
                  stroke="#F97316"
                  strokeWidth={3.5}
                  dot={{ r: 4, fill: "#F97316", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: "#F97316", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Consolidado ($)"
                  stroke="#0B2545"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#0B2545" }}
                  activeDot={{ r: 7, fill: "#0B2545" }}
                />
              </LineChart>
            ) : (
              /* Acumulado Anual */
              <AreaChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorAcumTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B2545" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0B2545" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthShort"
                  tick={{ fontSize: 12, fontWeight: "bold", fill: "#334155" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <YAxis
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5e1" }}
                />
                <Tooltip content={<CustomGrowthTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: "20px", fontSize: "12px", fontWeight: "bold" }}
                />
                <Area
                  type="monotone"
                  dataKey="acumuladoNuevas"
                  name="Acumulado Nuevas ($)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="#10B981"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="acumuladoRenov"
                  name="Acumulado Renovaciones ($)"
                  stroke="#F97316"
                  strokeWidth={2.5}
                  fill="#F97316"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="acumuladoTotal"
                  name="Acumulado Total 2026 ($)"
                  stroke="#0B2545"
                  strokeWidth={3.5}
                  fill="url(#colorAcumTotal)"
                  activeDot={{ r: 7, fill: "#0B2545", stroke: "#ffffff", strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabular Month-by-Month Breakdown */}
      {showTable && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TableIcon className="w-4 h-4 text-emerald-600" />
              Desglose Mensual Oficial 2026 (Enero a Diciembre)
            </h4>
            <span className="text-[11px] text-slate-500 font-semibold">
              Valores calculados en base {metricMode === "sin_iva" ? "Sin IVA" : "Con IVA"}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B2545] text-white uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Mes (2026)</th>
                  <th className="py-3 px-3 text-right">Ventas Nuevas ($)</th>
                  <th className="py-3 px-2 text-center"># Nuevas</th>
                  <th className="py-3 px-3 text-right">Renovaciones ($)</th>
                  <th className="py-3 px-2 text-center"># Renov</th>
                  <th className="py-3 px-3 text-right">Total Facturado ($)</th>
                  <th className="py-3 px-2 text-center"># Total</th>
                  <th className="py-3 px-3 text-center">% Renovación</th>
                  <th className="py-3 px-3 text-center">Crecimiento MoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.map((row, idx) => (
                  <tr
                    key={row.monthNum}
                    className={`hover:bg-slate-50 transition-colors ${
                      row.total > 0 ? "font-bold text-slate-800" : "text-slate-400"
                    } ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="py-2.5 px-3.5 font-black text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      {row.monthName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(row.nuevas)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                      {row.nuevasOps}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                      {formatCurrency(row.renovaciones)}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                      {row.renovacionesOps}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                      {row.totalOps}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.total > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                          {row.pctRenovacion}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.total > 0 && idx > 0 ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-0.5 ${
                            row.growthMoM > 0
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              : row.growthMoM < 0
                              ? "bg-rose-100 text-rose-900 border border-rose-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.growthMoM > 0 ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : <ArrowDownRight className="w-3 h-3 text-rose-600" />}
                          {row.growthMoM > 0 ? `+${row.growthMoM}%` : `${row.growthMoM}%`}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300 text-xs">
                <tr>
                  <td className="py-3 px-3.5">TOTAL ACUMULADO 2026</td>
                  <td className="py-3 px-3 text-right text-emerald-800">
                    {formatCurrency(kpis.totNuevas)}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-700">
                    {kpis.totNuevasOps}
                  </td>
                  <td className="py-3 px-3 text-right text-amber-800">
                    {formatCurrency(kpis.totRenov)}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-700">
                    {kpis.totRenovOps}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-950 text-sm">
                    {formatCurrency(kpis.grandTotal)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {kpis.grandOps}
                  </td>
                  <td className="py-3 px-3 text-center text-amber-900">
                    {kpis.shareRenov.toFixed(1)}%
                  </td>
                  <td className="py-3 px-3 text-center text-slate-500">
                    Prom: {formatCurrency(kpis.avgMonthly)}/mes
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
