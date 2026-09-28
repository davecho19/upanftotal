import React, { useState, useMemo } from "react";
import {
  Layers,
  Sparkles,
  RefreshCw,
  Handshake,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  TrendingUp,
  Calculator,
  Building2,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";
import { SaleTransaction, isUpContaSale } from "../utils/salesStorage";

export interface ProductModalitiesTablesProps {
  sales: SaleTransaction[];
  formatCurrency?: (val: number) => string;
  companyMode?: "all" | "upconta" | "firmas" | "locked";
}

export type ModalidadTipo = "Nuevo" | "Renovación" | "Socio" | "Distribuidor";

export function classifySaleType(item: SaleTransaction): ModalidadTipo {
  const t = (item.tipo || "").toLowerCase().trim();
  if (t.includes("distrib")) return "Distribuidor";
  if (t.includes("socio")) return "Socio";
  if (t.includes("renov") || t.includes("reov")) return "Renovación";
  return "Nuevo";
}

export function getCleanSpecificProduct(s: SaleTransaction): string {
  const isUp = isUpContaSale(s);
  let plan = (s.plan || s.producto || "Otros").trim();
  plan = plan.replace(/\s*\(\$[\d,\.]+\)/g, "").trim();

  if (isUp) {
    if (s.producto === "Plan Contador" && !plan.toLowerCase().includes("contador")) {
      return `Plan Contador - ${plan}`;
    }
    if (plan.toUpperCase().includes("START") || plan.toUpperCase().includes("STAR")) {
      return "ERP UPCONTA START";
    }
    return plan.toUpperCase() || "PLAN GENERAL UPCONTA";
  } else {
    const prod = s.producto || "Firma Natural";
    if (plan && plan !== prod) {
      return `${prod} - ${plan}`;
    }
    return prod;
  }
}

interface ModalitySummaryItem {
  key: ModalidadTipo;
  label: string;
  cantidad: number;
  monto: number;
  ticketPromedio: number;
  porcentajeMonto: number;
  porcentajeCantidad: number;
  topProducto: string;
  topProductoUds: number;
}

interface SpecificProductItem {
  key: string;
  producto: string;
  linea: "UPCONTA" | "FIRMAS";
  modalidad: ModalidadTipo;
  cantidad: number;
  monto: number;
  ticketPromedio: number;
  porcentajeMonto: number;
}

export function ProductModalitiesTables({
  sales,
  formatCurrency = (v: number) => `$${v.toFixed(2)}`,
  companyMode = "all"
}: ProductModalitiesTablesProps) {
  // Filter states for Table 2
  const [selectedModalidadFilter, setSelectedModalidadFilter] = useState<"todas" | ModalidadTipo>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"cantidad" | "monto" | "ticket" | "producto">("cantidad");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 1. CALCULATE CONSOLIDATED MODALITY DATA (TABLA 1)
  const { summaryRows, grandTotal } = useMemo(() => {
    const counts: Record<ModalidadTipo, { cantidad: number; monto: number; productsMap: Record<string, number> }> = {
      "Nuevo": { cantidad: 0, monto: 0, productsMap: {} },
      "Renovación": { cantidad: 0, monto: 0, productsMap: {} },
      "Socio": { cantidad: 0, monto: 0, productsMap: {} },
      "Distribuidor": { cantidad: 0, monto: 0, productsMap: {} }
    };

    let totalMontoAll = 0;
    let totalCantidadAll = 0;

    sales.forEach((s) => {
      const tipo = classifySaleType(s);
      const val = Number(s.totalSinIva) || 0;
      const prod = getCleanSpecificProduct(s);

      counts[tipo].cantidad += 1;
      counts[tipo].monto += val;
      counts[tipo].productsMap[prod] = (counts[tipo].productsMap[prod] || 0) + 1;

      totalMontoAll += val;
      totalCantidadAll += 1;
    });

    const modalitiesConfig: { key: ModalidadTipo; label: string }[] = [
      { key: "Nuevo", label: "Ventas Nuevas" },
      { key: "Renovación", label: "Ventas por Renovación" },
      { key: "Socio", label: "Ventas por Socio" },
      { key: "Distribuidor", label: "Ventas por Distribuidor" }
    ];

    const rows: ModalitySummaryItem[] = modalitiesConfig.map(({ key, label }) => {
      const item = counts[key];
      const ticket = item.cantidad > 0 ? item.monto / item.cantidad : 0;
      const pctMonto = totalMontoAll > 0 ? (item.monto / totalMontoAll) * 100 : 0;
      const pctCant = totalCantidadAll > 0 ? (item.cantidad / totalCantidadAll) * 100 : 0;

      // Find top product for this modality
      const topP = Object.entries(item.productsMap).sort((a, b) => b[1] - a[1])[0];
      const topProducto = topP ? topP[0] : "Sin ventas registradas";
      const topProductoUds = topP ? topP[1] : 0;

      return {
        key,
        label,
        cantidad: item.cantidad,
        monto: item.monto,
        ticketPromedio: ticket,
        porcentajeMonto: pctMonto,
        porcentajeCantidad: pctCant,
        topProducto,
        topProductoUds
      };
    });

    return {
      summaryRows: rows,
      grandTotal: {
        cantidad: totalCantidadAll,
        monto: totalMontoAll,
        ticketPromedio: totalCantidadAll > 0 ? totalMontoAll / totalCantidadAll : 0
      }
    };
  }, [sales]);

  // 2. CALCULATE SPECIFIC PRODUCT BREAKDOWN (TABLA 2)
  const specificProducts = useMemo(() => {
    const map: Record<string, SpecificProductItem> = {};

    sales.forEach((s) => {
      const prod = getCleanSpecificProduct(s);
      const mod = classifySaleType(s);
      const isUp = isUpContaSale(s);
      const linea: "UPCONTA" | "FIRMAS" = isUp ? "UPCONTA" : "FIRMAS";
      const key = `${prod}__${mod}`;
      const val = Number(s.totalSinIva) || 0;

      if (!map[key]) {
        map[key] = {
          key,
          producto: prod,
          linea,
          modalidad: mod,
          cantidad: 0,
          monto: 0,
          ticketPromedio: 0,
          porcentajeMonto: 0
        };
      }

      map[key].cantidad += 1;
      map[key].monto += val;
    });

    const list = Object.values(map).map((p) => {
      return {
        ...p,
        ticketPromedio: p.cantidad > 0 ? p.monto / p.cantidad : 0,
        porcentajeMonto: grandTotal.monto > 0 ? (p.monto / grandTotal.monto) * 100 : 0
      };
    });

    return list;
  }, [sales, grandTotal.monto]);

  // Filter and sort specific products
  const filteredSpecificProducts = useMemo(() => {
    return specificProducts
      .filter((item) => {
        // Modalidad filter
        if (selectedModalidadFilter !== "todas" && item.modalidad !== selectedModalidadFilter) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!item.producto.toLowerCase().includes(q) && !item.modalidad.toLowerCase().includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === "cantidad") {
          comp = b.cantidad - a.cantidad;
        } else if (sortBy === "monto") {
          comp = b.monto - a.monto;
        } else if (sortBy === "ticket") {
          comp = b.ticketPromedio - a.ticketPromedio;
        } else if (sortBy === "producto") {
          comp = a.producto.localeCompare(b.producto);
        }

        return sortOrder === "asc" ? -comp : comp;
      });
  }, [specificProducts, selectedModalidadFilter, searchQuery, sortBy, sortOrder]);

  const handleSort = (column: "cantidad" | "monto" | "ticket" | "producto") => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Helper styles for modality badges
  const getModalidadBadge = (mod: ModalidadTipo) => {
    switch (mod) {
      case "Nuevo":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <Sparkles className="w-3 h-3 text-emerald-600" />,
          label: "Venta Nueva"
        };
      case "Renovación":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <RefreshCw className="w-3 h-3 text-blue-600" />,
          label: "Renovación"
        };
      case "Socio":
        return {
          bg: "bg-amber-50 text-amber-900 border-amber-300 font-extrabold",
          icon: <Handshake className="w-3 h-3 text-amber-700" />,
          label: "Venta Socio"
        };
      case "Distribuidor":
        return {
          bg: "bg-purple-50 text-purple-900 border-purple-300 font-extrabold",
          icon: <Building2 className="w-3 h-3 text-purple-700" />,
          label: "Venta Distribuidor"
        };
    }
  };

  return (
    <div className="space-y-8 mt-6">
      {/* ========================================================================= */}
      {/* TABLA 1: CONSOLIDADO POR MODALIDAD (NUEVAS, RENOVACIÓN, SOCIO)           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-500/20">
                <Layers className="w-5 h-5 text-orange-600" />
              </span>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                1. Consolidado por Modalidad de Venta
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Resumen acumulado de cantidad, facturación neta y ticket promedio desglosado en: Ventas Nuevas, Renovaciones y Socios.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <span>Total Transacciones:</span>
            <span className="font-black text-slate-900 font-mono">{grandTotal.cantidad}</span>
          </div>
        </div>

        {/* 3 Modality Scorecard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryRows.map((row) => {
            const badge = getModalidadBadge(row.key);
            const isSocio = row.key === "Socio";
            const isRenov = row.key === "Renovación";

            return (
              <div
                key={row.key}
                className={`rounded-2xl border p-4.5 space-y-3 transition-all relative overflow-hidden ${
                  isSocio
                    ? "bg-amber-50/50 border-amber-200 hover:border-amber-400"
                    : isRenov
                    ? "bg-blue-50/40 border-blue-200 hover:border-blue-400"
                    : "bg-emerald-50/40 border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${badge.bg}`}>
                    {badge.icon}
                    <span>{row.label}</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {row.porcentajeMonto.toFixed(1)}% del total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Cantidad
                    </span>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {row.cantidad}{" "}
                      <span className="text-xs font-bold text-slate-500">uds</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Monto Sin IVA
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">
                      {formatCurrency(row.monto)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Ticket Promedio:</span>
                  <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    {formatCurrency(row.ticketPromedio)}
                  </span>
                </div>

                <div className="text-[11px] font-medium text-slate-600 truncate" title={`Top Producto: ${row.topProducto}`}>
                  <span className="font-bold">Top Producto:</span>{" "}
                  <span className="font-extrabold text-slate-800">{row.topProducto}</span>{" "}
                  {row.topProductoUds > 0 && <span className="text-slate-500">({row.topProductoUds} uds)</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modalidad Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B2545] text-white uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-3 w-48">Modalidad de Venta</th>
                <th className="p-3 text-right">Cantidad (#)</th>
                <th className="p-3 text-right bg-orange-700/50">Monto Sin IVA ($)</th>
                <th className="p-3 text-right">Ticket Promedio ($)</th>
                <th className="p-3 text-center">% Cuota Facturación</th>
                <th className="p-3 text-center">% Cuota Unidades</th>
                <th className="p-3">Producto con Mayor Demanda</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {summaryRows.map((row, idx) => {
                const badge = getModalidadBadge(row.key);

                return (
                  <tr
                    key={row.key}
                    className={idx % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/60 hover:bg-slate-100"}
                  >
                    <td className="p-3 font-bold">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${badge.bg}`}>
                        {badge.icon}
                        <span>{row.label}</span>
                      </span>
                    </td>

                    <td className="p-3 text-right font-black text-slate-900 font-mono">
                      <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                        {row.cantidad} uds
                      </span>
                    </td>

                    <td className="p-3 text-right font-black text-emerald-600 bg-orange-50/40 text-sm">
                      {formatCurrency(row.monto)}
                    </td>

                    <td className="p-3 text-right font-black text-purple-700">
                      {formatCurrency(row.ticketPromedio)}
                    </td>

                    <td className="p-3 text-center font-bold">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-xs">{row.porcentajeMonto.toFixed(1)}%</span>
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.key === "Nuevo" ? "bg-emerald-500" : row.key === "Renovación" ? "bg-blue-600" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, row.porcentajeMonto))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-center font-bold text-slate-600 font-mono">
                      {row.porcentajeCantidad.toFixed(1)}%
                    </td>

                    <td className="p-3 font-extrabold text-slate-800">
                      {row.topProducto}{" "}
                      {row.topProductoUds > 0 && (
                        <span className="text-[11px] font-bold text-slate-500">
                          ({row.topProductoUds} ventas)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-orange-500">
              <tr>
                <td className="p-3 uppercase tracking-wider text-slate-300">
                  TOTAL GENERAL CONSOLIDADO
                </td>
                <td className="p-3 text-right font-black text-amber-300 text-sm">
                  {grandTotal.cantidad} uds
                </td>
                <td className="p-3 text-right bg-orange-600 text-white font-black text-sm">
                  {formatCurrency(grandTotal.monto)}
                </td>
                <td className="p-3 text-right font-black text-purple-300 text-sm">
                  {formatCurrency(grandTotal.ticketPromedio)}
                </td>
                <td className="p-3 text-center text-emerald-400 font-black">
                  100.0%
                </td>
                <td className="p-3 text-center text-slate-300 font-black">
                  100.0%
                </td>
                <td className="p-3 text-slate-400 font-normal text-[11px]">
                  {sales.length} transacciones auditadas
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLA 2: PRODUCTOS MÁS VENDIDOS POR NUEVAS, RENOVACIÓN Y SOCIO           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-5 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </span>
              <h4 className="text-lg font-black text-slate-900 tracking-tight">
                2. Ranking Específico de Productos por Modalidad (Nuevas, Renovación y Socio)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Desglose detallado por producto específico (ej: Plan Light, ERP Start, Plan Contador) identificando qué productos se vendieron más en cada modalidad con su cantidad, monto y ticket promedio.
            </p>
          </div>

          <span className="bg-orange-100 text-orange-800 text-xs font-black px-3 py-1 rounded-full border border-orange-200">
            {filteredSpecificProducts.length} registros específicos
          </span>
        </div>

        {/* Control & Filter Strip */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          {/* Quick Tab Filters for Modality */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedModalidadFilter("todas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedModalidadFilter === "todas"
                  ? "bg-[#0B2545] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Todos los Productos ({specificProducts.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedModalidadFilter("Nuevo")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedModalidadFilter === "Nuevo"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Más Vendidos por Nuevas</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModalidadFilter("Renovación")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedModalidadFilter === "Renovación"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-200" />
              <span>Más Vendidos por Renovación</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModalidadFilter("Socio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedModalidadFilter === "Socio"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Handshake className="w-3.5 h-3.5 text-amber-200" />
              <span>Más Vendidos por Socio</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedModalidadFilter("Distribuidor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                selectedModalidadFilter === "Distribuidor"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-200" />
              <span>Más Vendidos por Distribuidor</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar plan específico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0B2545] text-white uppercase text-[10px] font-black tracking-wider select-none">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-24">Línea</th>

                {/* Sortable: PRODUCTO */}
                <th
                  onClick={() => handleSort("producto")}
                  className="p-3 cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Producto Específico (Plan / Modalidad)</span>
                    {sortBy === "producto" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-orange-400" /> : <ArrowDown className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* MODALIDAD */}
                <th className="p-3 w-36">Modalidad</th>

                {/* Sortable: CANTIDAD */}
                <th
                  onClick={() => handleSort("cantidad")}
                  className="p-3 text-right cursor-pointer hover:bg-slate-800 transition-colors w-28"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Cantidad (#)</span>
                    {sortBy === "cantidad" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-orange-400" /> : <ArrowDown className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* Sortable: MONTO */}
                <th
                  onClick={() => handleSort("monto")}
                  className="p-3 text-right cursor-pointer hover:bg-slate-800 transition-colors bg-orange-700/50 w-36"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Monto Sin IVA ($)</span>
                    {sortBy === "monto" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-amber-300" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-300" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-amber-300/70" />
                    )}
                  </div>
                </th>

                {/* Sortable: TICKET PROMEDIO */}
                <th
                  onClick={() => handleSort("ticket")}
                  className="p-3 text-right cursor-pointer hover:bg-slate-800 transition-colors w-32"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Ticket Promedio ($)</span>
                    {sortBy === "ticket" ? (
                      sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-orange-400" /> : <ArrowDown className="w-3.5 h-3.5 text-orange-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* Cuota de Participación */}
                <th className="p-3 text-center w-28">% Cuota Facturación</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredSpecificProducts.length > 0 ? (
                filteredSpecificProducts.map((row, idx) => {
                  const badge = getModalidadBadge(row.modalidad);

                  return (
                    <tr
                      key={row.key}
                      className={
                        idx === 0
                          ? "bg-amber-50/50 hover:bg-amber-100/50"
                          : idx % 2 === 0
                          ? "bg-white hover:bg-slate-50"
                          : "bg-slate-50/60 hover:bg-slate-100/60"
                      }
                    >
                      {/* Index */}
                      <td className="p-3 text-center font-bold text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Línea */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                            row.linea === "UPCONTA"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : "bg-amber-100 text-amber-900 border border-amber-200"
                          }`}
                        >
                          {row.linea === "UPCONTA" ? (
                            <Building2 className="w-3 h-3 text-blue-700" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-amber-700" />
                          )}
                          <span>{row.linea}</span>
                        </span>
                      </td>

                      {/* Producto Específico */}
                      <td className="p-3">
                        <div className="font-black text-slate-900 text-xs">
                          {row.producto}
                        </div>
                      </td>

                      {/* Modalidad de Venta */}
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-black border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Cantidad */}
                      <td className="p-3 text-right">
                        <span className="inline-block bg-slate-100 border border-slate-200 text-slate-900 font-black px-2.5 py-1 rounded-xl text-xs font-mono">
                          {row.cantidad} <span className="text-[10px] text-slate-500 font-bold">uds</span>
                        </span>
                      </td>

                      {/* Monto Sin IVA */}
                      <td className="p-3 text-right bg-orange-50/40 font-black">
                        <div className="text-sm font-black text-emerald-600">
                          {formatCurrency(row.monto)}
                        </div>
                      </td>

                      {/* Ticket Promedio */}
                      <td className="p-3 text-right font-black">
                        <div className="text-xs font-black text-purple-700">
                          {formatCurrency(row.ticketPromedio)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">
                          / unidad
                        </div>
                      </td>

                      {/* % Cuota Facturación */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-700 text-center font-mono">
                            {row.porcentajeMonto.toFixed(1)}%
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                row.modalidad === "Nuevo"
                                  ? "bg-emerald-500"
                                  : row.modalidad === "Renovación"
                                  ? "bg-blue-600"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(3, row.porcentajeMonto))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 space-y-1">
                    <p className="font-extrabold text-xs text-slate-700">
                      No se encontraron registros para la modalidad o búsqueda seleccionada.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Prueba seleccionando &quot;Todos los Productos&quot; o cambiando los filtros superiores.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals for the filtered list */}
            {filteredSpecificProducts.length > 0 && (
              <tfoot className="bg-slate-900 text-white font-black text-xs border-t-2 border-orange-500">
                <tr>
                  <td colSpan={4} className="p-3 uppercase tracking-wider text-slate-300">
                    SUBTOTAL DE PRODUCTOS MOSTRADOS ({filteredSpecificProducts.length} Registros)
                  </td>
                  <td className="p-3 text-right font-black text-amber-300 text-sm">
                    {filteredSpecificProducts.reduce((a, b) => a + b.cantidad, 0)} uds
                  </td>
                  <td className="p-3 text-right bg-orange-600 text-white font-black text-sm">
                    {formatCurrency(filteredSpecificProducts.reduce((a, b) => a + b.monto, 0))}
                  </td>
                  <td className="p-3 text-right font-black text-purple-300 text-sm">
                    {formatCurrency(
                      filteredSpecificProducts.reduce((a, b) => a + b.cantidad, 0) > 0
                        ? filteredSpecificProducts.reduce((a, b) => a + b.monto, 0) / filteredSpecificProducts.reduce((a, b) => a + b.cantidad, 0)
                        : 0
                    )}
                  </td>
                  <td className="p-3 text-center text-emerald-400 font-black">
                    {filteredSpecificProducts.reduce((a, b) => a + b.porcentajeMonto, 0).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
