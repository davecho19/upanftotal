import React, { useState, useEffect, useMemo } from "react";
import {
  Lock,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  Building2,
  FileCheck,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  Trophy,
  Users,
  RefreshCw,
  Clock,
  ShieldCheck
} from "lucide-react";
import {
  SaleTransaction,
  getStoredSales,
  mergeRemoteSalesWithLocal,
  normalizeDateString,
  getMonthFromDate,
  calculateCurrentMonthTotals,
  getSpanishCurrentMonthLabel,
  getCurrentMonthString,
  matchMonth,
  isUpContaSale
} from "../utils/salesStorage";

// Helper functions to get canonical clean product and plan names
function getCleanUpContaPlan(s: SaleTransaction): string {
  let plan = s.plan || s.producto || "Otros";
  plan = plan.replace(/\s*\(\$[\d,\.]+\)/g, "").trim();
  if (s.producto === "Plan Contador" && !plan.toLowerCase().includes("contador")) {
    return `Plan Contador - ${plan}`;
  }
  if (plan.toUpperCase().includes("START") || plan.toUpperCase().includes("STAR")) {
    return "ERP UPCONTA START (ERP STAR)";
  }
  return plan.toUpperCase();
}

function getCleanFirmasPlan(s: SaleTransaction): string {
  const prod = s.producto || "Firma Natural";
  let plan = s.plan || "";
  plan = plan.replace(/\s*\(\$[\d,\.]+\)/g, "").trim();
  if (plan) {
    return `${prod} - ${plan}`;
  }
  return prod;
}

interface CommercialLockScreenProps {
  onUnlock: (code: string) => boolean;
}

export function CommercialLockScreen({ onUnlock }: CommercialLockScreenProps) {
  const [codeInput, setCodeInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("En vivo");

  // Raw sales transactions for calculating metrics
  const [salesTransactions, setSalesTransactions] = useState<SaleTransaction[]>(() => getStoredSales());
  const [ivaViewMode, setIvaViewMode] = useState<"sin_iva" | "con_iva">("sin_iva");

  // Dynamically calculate month totals (Sin IVA and Con IVA) strictly synced with salesTransactions
  const salesTotals = useMemo(() => {
    return calculateCurrentMonthTotals(salesTransactions);
  }, [salesTransactions]);

  // Top 5 Productos más vendidos en Firmas y Sistemas (Mes Vigente)
  const topProductsCurrentMonth = useMemo(() => {
    const currentMonthStr = getCurrentMonthString();
    const countFirmas: Record<string, number> = {};
    const countSistemas: Record<string, number> = {};
    let totalUnidadesFirmas = 0;
    let totalUnidadesSistemas = 0;

    salesTransactions.forEach((s) => {
      if (matchMonth(s, currentMonthStr)) {
        const isUp = isUpContaSale(s);
        const qty = Number((s as any).cantidad) || 1;
        if (isUp) {
          const key = getCleanUpContaPlan(s);
          countSistemas[key] = (countSistemas[key] || 0) + qty;
          totalUnidadesSistemas += qty;
        } else {
          const key = getCleanFirmasPlan(s);
          countFirmas[key] = (countFirmas[key] || 0) + qty;
          totalUnidadesFirmas += qty;
        }
      }
    });

    const topFirmas = Object.entries(countFirmas)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    const topSistemas = Object.entries(countSistemas)
      .map(([name, cantidad]) => ({ name, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    return {
      topFirmas,
      topSistemas,
      totalUnidadesFirmas,
      totalUnidadesSistemas
    };
  }, [salesTransactions]);

  // Ranking de Asesores Comerciales con el Monto Vendido de Cada Uno (Mes Vigente)
  const advisorRankingCurrentMonth = useMemo(() => {
    const currentMonthStr = getCurrentMonthString();
    const map: Record<string, {
      name: string;
      totalSinIva: number;
      totalConIva: number;
      ventasCount: number;
      sistemasSinIva: number;
      firmasSinIva: number;
      sistemasCount: number;
      firmasCount: number;
      mainCategory: "upconta" | "firmas" | "mixto";
    }> = {};

    let grandTotalMesSinIva = 0;
    let grandTotalMesConIva = 0;

    salesTransactions.forEach((s) => {
      if (matchMonth(s, currentMonthStr)) {
        const rawName = (s.asesor || "").trim();
        if (!rawName) return;

        if (!map[rawName]) {
          map[rawName] = {
            name: rawName,
            totalSinIva: 0,
            totalConIva: 0,
            ventasCount: 0,
            sistemasSinIva: 0,
            firmasSinIva: 0,
            sistemasCount: 0,
            firmasCount: 0,
            mainCategory: "mixto"
          };
        }

        const isUp = isUpContaSale(s);
        const sinIva = Number(s.totalSinIva) || (Number(s.total) ? Number((s.total / 1.15).toFixed(2)) : 0);
        const conIva = Number(s.total) || 0;

        map[rawName].totalSinIva += sinIva;
        map[rawName].totalConIva += conIva;
        map[rawName].ventasCount += 1;
        grandTotalMesSinIva += sinIva;
        grandTotalMesConIva += conIva;

        if (isUp) {
          map[rawName].sistemasSinIva += sinIva;
          map[rawName].sistemasCount += 1;
        } else {
          map[rawName].firmasSinIva += sinIva;
          map[rawName].firmasCount += 1;
        }
      }
    });

    const list = Object.values(map).map((adv) => {
      let mainCat: "upconta" | "firmas" | "mixto" = "mixto";
      if (adv.sistemasCount > 0 && adv.firmasCount === 0) mainCat = "upconta";
      else if (adv.firmasCount > 0 && adv.sistemasCount === 0) mainCat = "firmas";
      const totalAmount = ivaViewMode === "con_iva" ? adv.totalConIva : adv.totalSinIva;
      const grandTotal = ivaViewMode === "con_iva" ? grandTotalMesConIva : grandTotalMesSinIva;
      return {
        ...adv,
        mainCategory: mainCat,
        percentageOfTotal: grandTotal > 0 ? (totalAmount / grandTotal) * 100 : 0
      };
    });

    // Ordenar de mayor a menor según el modo seleccionado (Sin IVA o Con IVA)
    list.sort((a, b) => (ivaViewMode === "con_iva" ? b.totalConIva - a.totalConIva : b.totalSinIva - a.totalSinIva));

    const maxLeaderTotal = list.length > 0
      ? (ivaViewMode === "con_iva" ? list[0].totalConIva : list[0].totalSinIva)
      : 1;

    return {
      list,
      maxLeaderTotal,
      grandTotalMesSinIva,
      grandTotalMesConIva
    };
  }, [salesTransactions, ivaViewMode]);

  // Helper parser for Google Sheets CSV matching DashboardModule
  const parseCSVToTransactions = (text: string): SaleTransaction[] => {
    const lines = text.split(/\r?\n/);
    const result: SaleTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols: string[] = [];
      let current = "";
      let inQuotes = false;
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
        const totalSinIva = parseFloat((cols[12] || "0").replace(/\$/g, "").replace(/,/g, "")) || (total > 0 ? parseFloat((total / 1.15).toFixed(2)) : 0);

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

  const loadDashboardSales = async (force: boolean = false) => {
    setIsRefreshing(true);
    try {
      let csvText = "";

      // 1. Try server proxy (instant memory cache + force option)
      try {
        const res = await fetch(`/api/sheets?t=${Date.now()}${force ? "&force=true" : ""}`);
        if (res.ok) {
          const t = await res.text();
          if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
            csvText = t;
          }
        }
      } catch (e) {
        console.warn("Proxy fetch error:", e);
      }

      // 2. Try direct Google Sheets export if proxy empty
      if (!csvText) {
        try {
          const res0 = await fetch(
            "https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000"
          );
          if (res0.ok) {
            const t = await res0.text();
            if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
              csvText = t;
            }
          }
        } catch (e) {
          console.warn("Direct fetch error:", e);
        }
      }

      // 3. Try Google Visualization API (gviz)
      if (!csvText) {
        try {
          const resGviz = await fetch(
            "https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/gviz/tq?tqx=out:csv&gid=0"
          );
          if (resGviz.ok) {
            const t = await resGviz.text();
            if (t && !t.trim().startsWith("<") && (t.includes("ASESOR") || t.includes('"ASESOR"'))) {
              csvText = t;
            }
          }
        } catch (e) {
          console.warn("Gviz fetch error:", e);
        }
      }

      // 4. Try CORS proxies
      if (!csvText) {
        const proxies = [
          "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000"),
          "https://corsproxy.io/?" + encodeURIComponent("https://docs.google.com/spreadsheets/d/1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA/export?format=csv&gid=0&range=A1:Z10000")
        ];
        for (const pUrl of proxies) {
          try {
            const resCors = await fetch(pUrl);
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
        const parsed = parseCSVToTransactions(csvText);
        if (parsed.length > 0) {
          const merged = mergeRemoteSalesWithLocal(parsed);
          setSalesTransactions(merged);
          setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
          return;
        }
      }

      // Safe fallback: use current stored sales
      const stored = getStoredSales();
      setSalesTransactions(stored);
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Error loading dashboard sales in home screen:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardSales(false);

    const intervalId = setInterval(() => loadDashboardSales(false), 60000);

    const handleFocus = () => {
      loadDashboardSales(false);
    };
    window.addEventListener("focus", handleFocus);

    const handleSalesUpdate = () => {
      const stored = getStoredSales();
      setSalesTransactions(stored);
      setLastSyncTime(new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };

    window.addEventListener("sales_data_updated", handleSalesUpdate);
    window.addEventListener("storage", handleSalesUpdate);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("sales_data_updated", handleSalesUpdate);
      window.removeEventListener("storage", handleSalesUpdate);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      setErrorMessage("Ingresa tu clave de acceso.");
      return;
    }

    setIsSubmitting(true);
    const success = onUnlock(codeInput.trim());
    if (!success) {
      setErrorMessage("Clave no válida. Solicita autorización a gerencia.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#07172B] to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none font-sans">
      {/* Top Header Ejecutivo */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
              <span>INTRANET GERENCIAL</span>
              <span className="text-orange-400 font-extrabold">UPCONTA</span>
              <span className="text-slate-500 font-normal">&amp;</span>
              <span className="text-amber-400 font-extrabold">ANF AC</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Consola Comercial de Rendimiento • Ecuador 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardSales(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-200 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
            title="Sincronizar datos en vivo con Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isRefreshing ? "Sincronizando..." : "Sincronizar Sheets"}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 shadow-sm">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Acceso Protegido</span>
          </div>
        </div>
      </header>

      {/* Main Container Ejecutivo */}
      <main className="max-w-7xl w-full mx-auto my-5 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. SECCIÓN SUPERIOR: INGRESO DE CLAVE (IZQ) + TOTALES CONSOLIDADOS (DER) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
          
          {/* Tarjeta 1: Ingreso de Clave de Acceso (Sin códigos expuestos) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>

            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Autenticación de Acceso</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Ingresa tu credencial para habilitar módulos y cotizador
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Formulario de Código Limpio y Seguro */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                    Clave de Autorización
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="••••••"
                      autoFocus
                      className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-center text-lg sm:text-xl font-black tracking-widest px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 placeholder:text-slate-700 transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                      title={showPassword ? "Ocultar" : "Mostrar"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-1.5 text-rose-400 bg-rose-950/60 border border-rose-800/80 px-3 py-1.5 rounded-lg text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300/40"
                >
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950 font-black" />
                </button>
              </form>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Módulos Comerciales • Cotizador Oficial</span>
              <span className="text-amber-400/80 font-mono">Confidencial</span>
            </div>
          </div>

          {/* Tarjeta 2: Resumen Ejecutivo de Ventas del Mes Vigente (8 columnas) */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl p-5 sm:p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"></div>

            <div className="space-y-3.5">
              {/* Header de Ventas */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                      Ventas Mes Vigente ({salesTotals.monthLabel})
                    </h2>
                    <p className="text-[11px] text-emerald-400 font-semibold">
                      Valores Netos Facturados Sin IVA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Selector Sin IVA / Con IVA (Total Sheet) */}
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700/80 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setIvaViewMode("sin_iva")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        ivaViewMode === "sin_iva"
                          ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Valores netos facturados sin IVA"
                    >
                      Sin IVA
                    </button>
                    <button
                      type="button"
                      onClick={() => setIvaViewMode("con_iva")}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        ivaViewMode === "con_iva"
                          ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Valores con IVA (Columna TOTAL de Google Sheets)"
                    >
                      Con IVA (Sheets)
                    </button>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Sheets En Vivo</span>
                  </span>
                </div>
              </div>

              {/* Grid 3 KPIs Ejecutivos: UpConta, Firmas, Total */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. Ventas UpConta ERP */}
                <div className="bg-slate-950/80 border border-orange-500/30 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-orange-500"></div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-wider">
                          UpConta ERP
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-orange-300 bg-orange-500/20 px-1.5 py-0.5 rounded font-mono">
                        {topProductsCurrentMonth.totalUnidadesSistemas} u.
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-orange-400 font-mono tracking-tight">
                      ${(ivaViewMode === "con_iva" ? salesTotals.upcontaConIva : salesTotals.upconta).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-orange-400/90 font-medium">
                      {ivaViewMode === "con_iva" ? "Con IVA" : "Sin IVA"}
                    </span>
                    <span className="text-slate-500">
                      {ivaViewMode === "con_iva"
                        ? `Sin IVA: $${salesTotals.upconta.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `Con IVA: $${salesTotals.upcontaConIva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>

                {/* 2. Ventas Firmas Electrónicas ANF */}
                <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400"></div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-wider">
                          Firmas ANF
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                        {topProductsCurrentMonth.totalUnidadesFirmas} u.
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-amber-400 font-mono tracking-tight">
                      ${(ivaViewMode === "con_iva" ? salesTotals.firmasConIva : salesTotals.firmas).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-amber-400/90 font-medium">
                      {ivaViewMode === "con_iva" ? "Con IVA" : "Sin IVA"}
                    </span>
                    <span className="text-slate-500">
                      {ivaViewMode === "con_iva"
                        ? `Sin IVA: $${salesTotals.firmas.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `Con IVA: $${salesTotals.firmasConIva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>

                {/* 3. Gran Total Consolidado */}
                <div className="bg-gradient-to-br from-emerald-950/70 to-slate-950 border border-emerald-500/40 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-400"></div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-300 font-black uppercase tracking-wider">
                          Total Mes
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                        {salesTotals.totalCount} ops
                      </span>
                    </div>
                    <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight">
                      ${(ivaViewMode === "con_iva" ? salesTotals.totalConIva : salesTotals.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-400/90 font-bold">
                      {ivaViewMode === "con_iva" ? "Con IVA (Total Sheet)" : "Sin IVA (Neto)"}
                    </span>
                    <span className="text-slate-400">
                      {ivaViewMode === "con_iva"
                        ? `Sin IVA: $${salesTotals.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `Con IVA: $${salesTotals.totalConIva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Sub-footer informativo */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-medium">
                Base Histórica: <strong className="text-slate-200 font-mono">{salesTransactions.length}</strong> ventas auditadas
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-500">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Última sincronización: {lastSyncTime}</span>
              </span>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. FILA HORIZONTAL DE 3 TABLAS EJECUTIVAS:                              */}
        {/*    [1] MÁS VENDIDOS FIRMAS | [2] MÁS VENDIDOS SISTEMAS | [3] TOP ASESORES */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          
          {/* ======================================================================= */}
          {/* TABLA 1: PRODUCTOS MÁS VENDIDOS FIRMAS ELECTRÓNICAS (TOP 5)              */}
          {/* ======================================================================= */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Más Vendidos Firmas
                    </h3>
                    <span className="text-[10px] text-amber-400 font-bold block">
                      Top 5 Demanda • {salesTotals.monthLabel}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  {topProductsCurrentMonth.totalUnidadesFirmas} u.
                </span>
              </div>

              {/* Lista Top Firmas */}
              <div className="space-y-2">
                {topProductsCurrentMonth.topFirmas.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Sin ventas registradas en el mes.
                  </div>
                ) : (
                  topProductsCurrentMonth.topFirmas.map((item, idx) => {
                    const maxCount = topProductsCurrentMonth.topFirmas[0]?.cantidad || 1;
                    const pctOfMax = Math.round((item.cantidad / maxCount) * 100);

                    return (
                      <div
                        key={item.name}
                        className="group relative bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2.5 transition-all overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-amber-500/10 pointer-events-none"
                          style={{ width: `${pctOfMax}%` }}
                        ></div>

                        <div className="relative flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                idx === 0
                                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-950 font-bold"
                                  : idx === 2
                                  ? "bg-amber-700 text-amber-100 font-bold"
                                  : "bg-slate-800 text-slate-400 font-semibold"
                              }`}
                            >
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                            </span>

                            <span className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                              {item.name}
                            </span>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-xs font-black text-amber-300 font-mono bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded">
                              {item.cantidad} <span className="text-[9px] font-semibold text-amber-200/80">u.</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between font-mono">
              <span>Firmas Electrónicas ANF AC</span>
              <span>Ecuador</span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* TABLA 2: PRODUCTOS MÁS VENDIDOS SISTEMAS UPCONTA (TOP 5)                 */}
          {/* ======================================================================= */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500"></div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Más Vendidos Sistemas
                    </h3>
                    <span className="text-[10px] text-orange-400 font-bold block">
                      Top 5 Demanda • {salesTotals.monthLabel}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono">
                  {topProductsCurrentMonth.totalUnidadesSistemas} u.
                </span>
              </div>

              {/* Lista Top Sistemas */}
              <div className="space-y-2">
                {topProductsCurrentMonth.topSistemas.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Sin ventas registradas en el mes.
                  </div>
                ) : (
                  topProductsCurrentMonth.topSistemas.map((item, idx) => {
                    const maxCount = topProductsCurrentMonth.topSistemas[0]?.cantidad || 1;
                    const pctOfMax = Math.round((item.cantidad / maxCount) * 100);

                    return (
                      <div
                        key={item.name}
                        className="group relative bg-slate-950/70 border border-slate-800 hover:border-orange-500/40 rounded-xl p-2.5 transition-all overflow-hidden"
                      >
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-orange-500/10 pointer-events-none"
                          style={{ width: `${pctOfMax}%` }}
                        ></div>

                        <div className="relative flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                idx === 0
                                  ? "bg-orange-500 text-white font-black shadow-sm"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-950 font-bold"
                                  : idx === 2
                                  ? "bg-amber-700 text-amber-100 font-bold"
                                  : "bg-slate-800 text-slate-400 font-semibold"
                              }`}
                            >
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                            </span>

                            <span className="text-xs font-bold text-slate-200 truncate group-hover:text-orange-300 transition-colors">
                              {item.name}
                            </span>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-xs font-black text-orange-300 font-mono bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded">
                              {item.cantidad} <span className="text-[9px] font-semibold text-orange-200/80">u.</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between font-mono">
              <span>UpConta ERP &amp; Facturación SRI</span>
              <span>Plataforma</span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* TABLA 3: RANKING DE ASESORES COMERCIALES (A LA DERECHA)                  */}
          {/* ======================================================================= */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl p-4 sm:p-5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Ranking Asesores
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      Monto Vendido • {salesTotals.monthLabel}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>{advisorRankingCurrentMonth.list.length}</span>
                </span>
              </div>

              {/* Lista Ranking Asesores */}
              <div className="space-y-2">
                {advisorRankingCurrentMonth.list.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Sin ventas de asesores en el mes.
                  </div>
                ) : (
                  advisorRankingCurrentMonth.list.slice(0, 5).map((adv, idx) => {
                    const pctOfLeader = advisorRankingCurrentMonth.maxLeaderTotal > 0
                      ? Math.round((adv.totalSinIva / advisorRankingCurrentMonth.maxLeaderTotal) * 100)
                      : 0;

                    const isFirst = idx === 0;
                    const isSecond = idx === 1;
                    const isThird = idx === 2;

                    return (
                      <div
                        key={adv.name}
                        className={`group relative border rounded-xl p-2.5 transition-all overflow-hidden ${
                          isFirst
                            ? "bg-slate-950/90 border-amber-500/40 shadow-sm"
                            : isSecond
                            ? "bg-slate-950/80 border-slate-400/30"
                            : isThird
                            ? "bg-slate-950/80 border-amber-700/30"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {/* Barra de progreso de fondo */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 pointer-events-none opacity-15 ${
                            isFirst ? "bg-amber-400" : isSecond ? "bg-slate-300" : isThird ? "bg-amber-600" : "bg-emerald-400"
                          }`}
                          style={{ width: `${pctOfLeader}%` }}
                        ></div>

                        <div className="relative flex items-center justify-between gap-2.5">
                          {/* Asesor info */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                                isFirst
                                  ? "bg-amber-400 text-slate-950 font-black shadow-sm"
                                  : isSecond
                                  ? "bg-slate-300 text-slate-950 font-bold"
                                  : isThird
                                  ? "bg-amber-700 text-amber-100 font-bold"
                                  : "bg-slate-800 text-slate-400 font-semibold"
                              }`}
                            >
                              {isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : idx + 1}
                            </span>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {adv.name}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                <span>{adv.ventasCount} ventas</span>
                                <span className="text-slate-600">•</span>
                                <span className={adv.mainCategory === "upconta" ? "text-orange-400" : "text-amber-400"}>
                                  {adv.mainCategory === "upconta" ? "ERP" : "Firmas"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Monto Asesor (Sin IVA y Con IVA) */}
                          <div className="shrink-0 text-right">
                            <div className={`text-xs sm:text-sm font-black font-mono ${
                              isFirst ? "text-amber-300" : isSecond ? "text-slate-200" : "text-emerald-400"
                            }`}>
                              ${(ivaViewMode === "con_iva" ? adv.totalConIva : adv.totalSinIva).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {ivaViewMode === "con_iva"
                                ? `Sin IVA: $${adv.totalSinIva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `Con IVA: $${adv.totalConIva.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between font-mono">
              <span>Auditoría de Ventas</span>
              <span className="text-emerald-400 font-bold">{ivaViewMode === "con_iva" ? "Con IVA (Total Sheet)" : "Total Sin IVA (Neto)"}</span>
            </div>
          </div>

        </div>

      </main>

      {/* Footer Ejecutivo */}
      <footer className="max-w-7xl w-full mx-auto text-center py-2.5 text-[11px] text-slate-500 font-medium border-t border-white/5 mt-2">
        <p>UpConta &amp; Firmas Electrónicas ANF AC © 2026 • Acceso Estrictamente Confidencial para Fuerza Comercial y Gerencia</p>
      </footer>
    </div>
  );
}
