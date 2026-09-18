import React, { useState, useEffect } from "react";
import { Lock, KeyRound, ArrowRight, AlertTriangle, Building2, FileCheck, Eye, EyeOff, Bell, Sparkles, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import {
  SaleTransaction,
  getStoredSales,
  mergeRemoteSalesWithLocal,
  normalizeDateString,
  getMonthFromDate,
  calculateCurrentMonthTotals,
  getSpanishCurrentMonthLabel
} from "../utils/salesStorage";

interface CommercialLockScreenProps {
  onUnlock: (code: string) => boolean;
}

export function CommercialLockScreen({ onUnlock }: CommercialLockScreenProps) {
  const [codeInput, setCodeInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate initial totals strictly for the current month from stored sales
  const initialCurrentMonth = calculateCurrentMonthTotals(getStoredSales());

  const [salesTotals, setSalesTotals] = useState<{
    upconta: number;
    firmas: number;
    total: number;
    monthLabel: string;
  }>({
    upconta: initialCurrentMonth.upconta,
    firmas: initialCurrentMonth.firmas,
    total: initialCurrentMonth.total,
    monthLabel: initialCurrentMonth.monthLabel || getSpanishCurrentMonthLabel()
  });

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

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardSales() {
      try {
        let csvText = "";

        // 1. Try server proxy (like DashboardModule)
        try {
          const res = await fetch(`/api/sheets?t=${Date.now()}`);
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

        if (csvText) {
          const parsed = parseCSVToTransactions(csvText);
          if (parsed.length > 0) {
            const merged = mergeRemoteSalesWithLocal(parsed);
            const currentMonthTotals = calculateCurrentMonthTotals(merged);
            if (isMounted) {
              setSalesTotals({
                upconta: currentMonthTotals.upconta,
                firmas: currentMonthTotals.firmas,
                total: currentMonthTotals.total,
                monthLabel: currentMonthTotals.monthLabel
              });
            }
            return;
          }
        }

        // Fallback to local stored sales
        const stored = getStoredSales();
        const currentTotals = calculateCurrentMonthTotals(stored);
        if (isMounted) {
          setSalesTotals({
            upconta: currentTotals.upconta,
            firmas: currentTotals.firmas,
            total: currentTotals.total,
            monthLabel: currentTotals.monthLabel
          });
        }
      } catch (err) {
        console.error("Error loading dashboard sales in home screen:", err);
      }
    }

    loadDashboardSales();

    // Auto-refresh periodically every 60 seconds to keep in sync with Google Sheets
    const intervalId = setInterval(loadDashboardSales, 60000);

    // Also refresh when tab regains focus
    const handleFocus = () => {
      loadDashboardSales();
    };
    window.addEventListener("focus", handleFocus);

    // Listen for sales updates from other components
    const handleSalesUpdate = () => {
      const stored = getStoredSales();
      const currentTotals = calculateCurrentMonthTotals(stored);
      setSalesTotals({
        upconta: currentTotals.upconta,
        firmas: currentTotals.firmas,
        total: currentTotals.total,
        monthLabel: currentTotals.monthLabel
      });
    };

    window.addEventListener("sales_data_updated", handleSalesUpdate);
    window.addEventListener("storage", handleSalesUpdate);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("sales_data_updated", handleSalesUpdate);
      window.removeEventListener("storage", handleSalesUpdate);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      setErrorMessage("Por favor ingresa un código de acceso.");
      return;
    }

    setIsSubmitting(true);
    const success = onUnlock(codeInput.trim());
    if (!success) {
      setErrorMessage("Código no válido. Solicita tu código al administrador.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0B2545] to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-white drop-shadow-sm">
            INTRANET UPCONTA Y ANF
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Portal Comercial Seguro</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto my-6 sm:my-8 space-y-6">
        
        {/* 1. Recuadro de Noticias y Novedades - Ancho Completo */}
        <div className="w-full bg-slate-900/90 border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5 shadow-sm">
              <Bell className="w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-amber-500/25 text-amber-300 border border-amber-500/50 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Noticias &amp; Novedades
                </span>
                <span className="text-sm font-extrabold text-slate-100">
                  Plataforma Comercial UpConta &amp; ANF
                </span>
              </div>

              {/* Noticias en cuadrícula responsiva para aprovechar todo el ancho */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm text-slate-200 font-medium">
                <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/70 p-3 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">
                    <strong className="text-amber-300">Brochures Oficiales:</strong> Se cargaron los brochures de cada plan (Facturación, ERP, Contadores y Socios) con descarga de PDFs oficiales.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/70 p-3 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">
                    <strong className="text-emerald-300">Artes Visuales:</strong> Se integraron las artes oficiales en la sección de planes para Facturación, ERP y Contadores.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/70 p-3 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">
                    <strong className="text-blue-300">Simulador de Cotizaciones:</strong> Se dejó predeterminado el logo y el formato ejecutivo en propuestas.
                  </span>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/70 p-3 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-200">
                    <strong className="text-cyan-300">Data en Vivo:</strong> Conexión continua con el registro de ventas de Google Sheets para métricas al instante.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Fila Inferior: Total Ventas del Mes Actual (Izquierda) + Código de Acceso (Derecha) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
          
          {/* Recuadro Total Ventas - Solo Mes Actual y Solo UpConta y Firmas */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"></div>

            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">
                      Total Ventas (Sin IVA)
                    </h2>
                    <p className="text-xs text-emerald-400 font-bold">
                      Mes Actual ({salesTotals.monthLabel}) • Sin IVA
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  En Vivo
                </span>
              </div>

              {/* Data solicitada: Solo total de ventas de UpConta y Firmas del mes actual (Sin IVA) */}
              <div className="space-y-3.5">
                {/* Ventas UpConta (Mes Actual - Sin IVA) */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                        Ventas UpConta (Sin IVA)
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        ERP &amp; Facturación
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                      ${salesTotals.upconta.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Ventas Firmas (Mes Actual - Sin IVA) */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></div>
                    <div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                        Ventas Firmas (Sin IVA)
                      </span>
                      <span className="text-sm font-semibold text-slate-200">
                        Firmas Electrónicas ANF
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      ${salesTotals.firmas.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Gran Total Consolidado (Mes Actual - Sin IVA) */}
                <div className="bg-gradient-to-r from-emerald-950/50 to-slate-950/70 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      Total Consolidado (Sin IVA)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                      ${salesTotals.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie informativo conciso */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 font-medium">
              Ventas netas sin IVA acumuladas de {salesTotals.monthLabel}
            </div>
          </div>

          {/* Recuadro Código de Acceso Comercial (Derecha) */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>

            <div className="space-y-4">
              <div className="border-b border-slate-800/80 pb-4">
                <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <span>Código de Acceso</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Ingresa tus credenciales para ingresar al sistema
                </p>
              </div>

              {/* Access Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Clave de Acceso
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Ingresa tu código..."
                      autoFocus
                      className="w-full bg-slate-950/80 border border-slate-700 text-white font-mono text-center text-lg sm:text-xl font-black tracking-widest px-4 py-3 rounded-2xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 placeholder:text-slate-500 placeholder:font-sans placeholder:text-sm placeholder:tracking-normal transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      title={showPassword ? "Ocultar código" : "Mostrar código"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-2 text-rose-400 bg-rose-950/60 border border-rose-800/80 px-3 py-2 rounded-xl text-xs font-bold animate-shake">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 active:scale-98 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300"
                >
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 font-black" />
                </button>
              </form>
            </div>

            {/* Commercial Lines Footer Note */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-around text-center text-[11px] text-slate-400 font-bold">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Línea UpConta ERP</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Línea Firmas ANF</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-3 text-xs text-slate-500 font-medium">
        <p>UpConta & Firmas Electrónicas.ec © 2026. Todos los derechos reservados.</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Acceso estrictamente monitoreado y confidencial para la fuerza de ventas.
        </p>
      </footer>
    </div>
  );
}
