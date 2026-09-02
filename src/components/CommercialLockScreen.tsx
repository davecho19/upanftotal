import React, { useState } from "react";
import { Lock, ShieldAlert, KeyRound, ArrowRight, AlertTriangle, Building2, FileCheck, Eye, EyeOff } from "lucide-react";
import { UpContaLogo, AnfLogo } from "./GodiLogo";

interface CommercialLockScreenProps {
  onUnlock: (code: string) => boolean;
}

export function CommercialLockScreen({ onUnlock }: CommercialLockScreenProps) {
  const [codeInput, setCodeInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      {/* Top Bar with Brand Logos */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-md backdrop-blur-md">
            <UpContaLogo size="sm" />
          </div>
          <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-md backdrop-blur-md">
            <AnfLogo size="sm" />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Portal Comercial Seguro</span>
        </div>
      </header>

      {/* Main Lock Card */}
      <main className="max-w-lg w-full mx-auto my-8">
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle top accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500"></div>

          {/* Alert Header Box */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 mb-6 text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/40 shadow-inner">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="inline-block bg-rose-600 text-white text-[11px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full shadow-xs">
                Acceso Restringido
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                ¡ALTO AHÍ!
              </h1>
            </div>

            <p className="text-sm font-extrabold text-slate-100 leading-relaxed">
              Esta plataforma es de uso exclusivo para el equipo comercial.
            </p>

            <p className="text-xs font-semibold text-rose-200/90 leading-normal">
              No puedes acceder sin el código asignado por la dirección o gerencia comercial.
            </p>
          </div>

          {/* Access Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Código de Acceso Comercial</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="Ingresa tu código de acceso..."
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-700 text-white font-mono text-center text-lg sm:text-xl font-black tracking-widest px-4 py-3.5 rounded-2xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 placeholder:text-slate-500 placeholder:font-sans placeholder:text-xs placeholder:tracking-normal transition-all"
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

          {/* Commercial Lines Footer Note */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-around text-center text-[11px] text-slate-400 font-bold">
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
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-3 text-xs text-slate-500 font-medium">
        <p>UpConta & Firmas Electrónicas.ec © 2026. Todos los derechos reservados.</p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Acceso estrictamente monitoreado y confidencial para la fuerza de ventas.
        </p>
      </footer>
    </div>
  );
}
