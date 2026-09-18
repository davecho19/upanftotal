import React, { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface BrochureItem {
  nombre: string;
  categoria: "Facturación" | "ERP" | "Contador" | "Socios";
  archivo: string;
}

const BROCHURES_DATA: BrochureItem[] = [
  // 1. Facturación
  {
    categoria: "Facturación",
    nombre: "Brochure General Facturación 2026.pdf",
    archivo: "Brochure General Facturación 2026.pdf"
  },
  {
    categoria: "Facturación",
    nombre: "Brochure UpConta Plan Profesional.pdf",
    archivo: "Brochure UpConta Plan Profesional.pdf"
  },
  {
    categoria: "Facturación",
    nombre: "Brochure UpConta Plan Ultra.pdf",
    archivo: "Brochure UpConta Plan Ultra.pdf"
  },

  // 2. ERP
  {
    categoria: "ERP",
    nombre: "Brochure General Plan ERP 2026.pdf",
    archivo: "Brochure General Plan ERP 2026.pdf"
  },
  {
    categoria: "ERP",
    nombre: "Brochure ERP UpConta Plan Start 2026.pdf",
    archivo: "Brochure ERP UpConta Plan Start 2026.pdf"
  },
  {
    categoria: "ERP",
    nombre: "Brochure ERP UpConta Plan Plus 2026.pdf",
    archivo: "Brochure ERP UpConta Plan Plus 2026.pdf"
  },
  {
    categoria: "ERP",
    nombre: "Brochure UpConta Plan Premium 2026.pdf",
    archivo: "Brochure UpConta Plan Premium 2026.pdf"
  },
  {
    categoria: "ERP",
    nombre: "Brochure UpConta ERP Plan Cloude.pdf",
    archivo: "Brochure UpConta ERP Plan Cloude.pdf"
  },
  {
    categoria: "ERP",
    nombre: "Brochure UpConta Plan Cloude Enterprise.pdf",
    archivo: "Brochure UpConta Plan Cloude Enterprise.pdf"
  },

  // 3. Contador
  {
    categoria: "Contador",
    nombre: "Brochure General Plan Contadores 2026.pdf",
    archivo: "Brochure General Plan Contadores 2026.pdf"
  },
  {
    categoria: "Contador",
    nombre: "Brochure Contador Ilimitado 2026.pdf",
    archivo: "Brochure Contador Ilimitado 2026.pdf"
  },
  {
    categoria: "Contador",
    nombre: "Brochure Contador TAX 2026.pdf",
    archivo: "Brochure Contador TAX 2026.pdf"
  },

  // 4. Socios
  {
    categoria: "Socios",
    nombre: "Brochure General Socios AGOSTO 2026.pdf",
    archivo: "Brochure General Socios AGOSTO 2026.pdf"
  }
];

const CATEGORY_COLORS: Record<string, string> = {
  Facturación: "bg-blue-50 text-blue-800 border-blue-200",
  ERP: "bg-orange-50 text-orange-800 border-orange-200",
  Contador: "bg-amber-50 text-amber-900 border-amber-200",
  Socios: "bg-emerald-50 text-emerald-800 border-emerald-200"
};

export function BrochuresModule() {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownload = async (item: BrochureItem) => {
    setDownloadingFile(item.archivo);
    try {
      const url = `/brochures/${encodeURIComponent(item.archivo)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener el archivo");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = item.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback
      window.open(`/brochures/${encodeURIComponent(item.archivo)}`, "_blank");
    } finally {
      setTimeout(() => {
        setDownloadingFile(null);
      }, 500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in py-1">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4 w-32">Categoría</th>
                <th className="py-2.5 px-4">Nombre del Brochure</th>
                <th className="py-2.5 px-4 text-right w-36">Descarga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {BROCHURES_DATA.map((item) => {
                const isDownloading = downloadingFile === item.archivo;

                return (
                  <tr key={item.archivo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border ${
                          CATEGORY_COLORS[item.categoria] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{item.nombre}</span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1.5 py-1 px-3 bg-[#0B2545] hover:bg-[#003566] active:scale-95 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-70"
                        title={`Descargar ${item.nombre}`}
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Descargando...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
