import React, { useState } from "react";
import { MessageSquare, Copy, Check, Send, UserCheck, Briefcase, Edit3, RotateCcw } from "lucide-react";

export interface MensajeTemplate {
  id: string;
  categoria: "PLAN CONTADOR" | "MENSAJE INICIAL";
  subtitulo?: string;
  texto: string;
  destinatario?: string;
}

export const MENSAJES_DATA: MensajeTemplate[] = [
  // PLAN CONTADOR
  {
    id: "pc-1",
    categoria: "PLAN CONTADOR",
    subtitulo: "1. Saludo Inicial y Diagnóstico de Clientes",
    destinatario: "Contadores y Despachos Contables",
    texto: `Hola, un gusto saludarte. Te escribe David, ejecutivo de UPCONTA.

Me contacto para brindarte información sobre nuestros planes para contadores y despachos contables.

Actualmente, ¿cuántos clientes manejas? Y respecto a la contabilidad e impuestos, ¿trabajas con algún sistema o llevas parte del proceso en Excel?

Quedo atento a tus comentarios.`
  },
  {
    id: "pc-2",
    categoria: "PLAN CONTADOR",
    subtitulo: "2. Explicación del Concepto y Escalabilidad",
    destinatario: "Explicación de Versiones Limitada / Ilimitada",
    texto: `Perfecto. Nuestro Plan Contador está diseñado para ayudarte a gestionar de forma eficiente la contabilidad y las obligaciones tributarias de tus clientes desde una sola plataforma.

Contamos con versiones Limitada e Ilimitada, ambas escalables, lo que te permite incorporar módulos adicionales según las necesidades de cada empresa que administres. De esta forma, puedes adaptar la solución a distintos tipos de negocios sin cambiar de sistema.`
  },
  {
    id: "pc-3",
    categoria: "PLAN CONTADOR",
    subtitulo: "3. Ejemplo Práctico (5-6 empresas + Extensión SRI)",
    destinatario: "Ejemplo de Cotización y Flexibilidad",
    texto: `hagamos un ejemplo: 
si tuviera alrededor de 5 empresas, podrías empezar con nuestro plan de 6 empresas por $150 al año.

Con esto ya tienes Contabilidad e Impuestos, además de la facilidad de cargar masivamente los comprobantes mediante nuestra extensión enlazada directamente con el SRI.

Y aquí viene lo interesante del Plan Contador 👇

No necesitas contratar lo mismo para todas tus empresas. Tú decides qué necesita cada cliente y vas agregando únicamente los módulos que realmente requiera.`
  },
  {
    id: "pc-4",
    categoria: "PLAN CONTADOR",
    subtitulo: "4. Módulos Adicionales y 30% de Comisión/Cashback",
    destinatario: "Beneficio Económico o Descuento para el Contador",
    texto: `Por ejemplo, puedes agregar planes de facturación desde $10 hasta $55 anuales, y también módulos adicionales como Tesorería, Nómina, Activos Fijos, Restaurantes, entre otros.

Todos estos valores son anuales, pero lo mejor es que tienes dos alternativas como contadora:

👉 Obtener hasta un 30% de cashback/comisión sobre esos adicionales que se pagan a fin de mes.

👉 O utilizar ese 30% como descuento para tus clientes, haciendo más atractiva tu propuesta de servicios contables.`
  },
  {
    id: "pc-5",
    categoria: "PLAN CONTADOR",
    subtitulo: "5. Resumen de Valor, Ecosistema y Firmas Electrónicas",
    destinatario: "Cierre de Propuesta y Alianza Integral",
    texto: `En otras palabras, no solo tienes un sistema para llevar la contabilidad, sino una herramienta que te permite ampliar lo que ofreces a tus clientes y generar un beneficio adicional por cada empresa que incorpores.

Y además tienes otro plus: una plataforma para distribuir firmas electrónicas a precio preferencial, sin costo adicional, para que puedas cubrir también uno de los requerimientos más habituales de tus clientes desde el mismo ecosistema.

La idea es que empieces con lo que realmente necesitas hoy y puedas escalar conforme crezca tu cartera de clientes, sin pagar de más desde el principio.`
  },

  // MENSAJE INICIAL
  {
    id: "mi-1",
    categoria: "MENSAJE INICIAL",
    subtitulo: "1. Saludo Inicial Comercial (Actividad y Facturación)",
    destinatario: "Clientes Nuevos / Prospectos Generales",
    texto: `Hola, un gusto saludarte. Te saluda el equipo comercial de UPCONTA.

Para recomendarte el plan más adecuado para tu negocio, ¿me podrías comentar a qué actividad te dedicas y aproximadamente cuántas facturas emites al mes?

Quedamos atentos👍`
  },
  {
    id: "mi-2",
    categoria: "MENSAJE INICIAL",
    subtitulo: "2. Saludo de Asesoría Integral (Facturación o ERP)",
    destinatario: "Prospectos Indecisos sobre Plan",
    texto: `Hola, un gusto saludarte. Te saluda el equipo comercial de UPCONTA.

Me contacto contigo para ayudarte con la información del plan de facturación o sistema contable que mejor se adapte a tu negocio. ¿Me cuentas un poco qué necesitas para orientarte mejor?

Quedo atento 👍`
  },
  {
    id: "mi-3",
    categoria: "MENSAJE INICIAL",
    subtitulo: "3. Saludo Personalizado David (Contador vs Múltiples Empresas)",
    destinatario: "Filtro: Contador o Dueño de Negocio",
    texto: `Hola, un gusto saludarte. Te escribe David, ejecutivo de UPCONTA.

Me contacto contigo para ayudarte con la información de nuestros planes ¿Me cuentas un poco qué necesitas para orientarte mejor? Eres contador y requieres llevar el control de tus clientes, o es para llevar tus multiples empresas

Quedo atento 👍`
  },
  {
    id: "mi-4",
    categoria: "MENSAJE INICIAL",
    subtitulo: "4. Diagnóstico Detallado para Propuesta Exacta",
    destinatario: "Consulta de Módulos Complementarios",
    texto: `Si gustas podemos hacer un ejercio para enviarte una propuesta mas exacta

de tus empresas cuantos consideras que deben manejar complementariamente el tema de:
* facturación 
* tesoreria
* nomina
* activos fijos`
  }
];

export function MensajesModule() {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "PLAN CONTADOR" | "MENSAJE INICIAL">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Custom edited messages state: Record<id, currentText>
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    MENSAJES_DATA.forEach((m) => {
      initial[m.id] = m.texto;
    });
    return initial;
  });

  const handleTextChange = (id: string, newText: string) => {
    setEditedTexts((prev) => ({
      ...prev,
      [id]: newText,
    }));
  };

  const handleReset = (id: string, originalText: string) => {
    setEditedTexts((prev) => ({
      ...prev,
      [id]: originalText,
    }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredMensajes = MENSAJES_DATA.filter((m) => {
    const currentText = editedTexts[m.id] ?? m.texto;
    const matchCat = selectedCategory === "ALL" || m.categoria === selectedCategory;
    const matchSearch =
      searchTerm === "" ||
      currentText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.subtitulo && m.subtitulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.destinatario && m.destinatario.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-[#0B2545] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Todos ({MENSAJES_DATA.length})
          </button>
          <button
            onClick={() => setSelectedCategory("PLAN CONTADOR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === "PLAN CONTADOR"
                ? "bg-amber-500 text-slate-900 font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Plan Contador (5)</span>
          </button>
          <button
            onClick={() => setSelectedCategory("MENSAJE INICIAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === "MENSAJE INICIAL"
                ? "bg-orange-500 text-white font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mensaje Inicial (4)</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative sm:w-72">
          <input
            type="text"
            placeholder="Buscar por texto clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMensajes.map((msg) => {
          const isCopied = copiedId === msg.id;
          const isPlanContador = msg.categoria === "PLAN CONTADOR";
          const currentText = editedTexts[msg.id] ?? msg.texto;
          const isModified = currentText !== msg.texto;

          return (
            <div
              key={msg.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-orange-300 transition-all group"
            >
              <div className="space-y-3">
                {/* Badge and Tag */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                        isPlanContador
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : "bg-orange-50 text-orange-900 border-orange-300"
                      }`}
                    >
                      {msg.categoria}
                    </span>
                    {msg.destinatario && (
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>{msg.destinatario}</span>
                      </span>
                    )}
                    {isModified && (
                      <span className="px-2 py-0.5 rounded-md text-[9.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                        Modificado
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-black text-slate-400 font-mono">
                    #{msg.id.toUpperCase()}
                  </span>
                </div>

                {/* Subtitle */}
                {msg.subtitulo && (
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-800 leading-snug">
                      {msg.subtitulo}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Edit3 className="w-3 h-3 text-orange-500" />
                      <span>Editable</span>
                    </div>
                  </div>
                )}

                {/* Editable Message Textarea */}
                <div className="relative">
                  <textarea
                    rows={6}
                    value={currentText}
                    onChange={(e) => handleTextChange(msg.id, e.target.value)}
                    placeholder="Escribe o personaliza el mensaje..."
                    className="w-full bg-slate-50 hover:bg-slate-50/80 focus:bg-white p-3.5 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-sans text-xs text-slate-800 leading-relaxed transition-all resize-y outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentText.length} caracteres
                  </span>
                  {isModified && (
                    <button
                      onClick={() => handleReset(msg.id, msg.texto)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Restablecer mensaje al original"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Restablecer</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(msg.id, currentText)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                    isCopied
                      ? "bg-emerald-600 text-white shadow-emerald-200"
                      : "bg-[#0B2545] hover:bg-[#003566] text-white hover:scale-[1.02]"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>¡Mensaje Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-300" />
                      <span>Copiar Mensaje</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

