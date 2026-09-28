import React, { useState, useEffect, useMemo } from "react";
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Send, 
  Tag, 
  ShieldCheck, 
  Sparkles, 
  CreditCard,
  Percent,
  Layers,
  HelpCircle,
  Clock,
  Award,
  Handshake
} from "lucide-react";
import { UpContaLogo, AnfLogo, CoBrandLogo } from "./GodiLogo";
import { INITIAL_OFFLINE_SALES } from "../salesData";
import { saveCustomRegisteredSale, SaleTransaction, getMonthFromDate, normalizeDateString } from "../utils/salesStorage";
import {
  getStoredSocios,
  getStoredDistribuidores,
  saveNewSocio,
  saveNewDistribuidor,
  fetchRemoteSocios,
  fetchRemoteDistribuidores,
  APPS_SCRIPT_SOURCE_CODE,
  getSheetWebAppUrl,
  setSheetWebAppUrl
} from "../utils/partnersStorage";

// Google Apps Script WebApp Endpoint URL
const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwN0DLNum5dfWe9CIUNaxwPjpjplh48HNdBjDR9GC-Tr32UFyo0jyq19tCJIGQpqMkv/exec";

// IVA factor for adicionales (1.15 = 15% IVA)
const IVA_FACTOR = 1.15;

const ADICIONALES_PRECIOS: Record<string, number> = {
  "IMPUESTOS": 40 * IVA_FACTOR,
  "CONTABILIDAD": 75 * IVA_FACTOR,
  "NOMINA": 75 * IVA_FACTOR,
  "TESORERIA": 75 * IVA_FACTOR,
  "ACTIVOS FIJOS": 75 * IVA_FACTOR,
  "RESTAURANTES": 75 * IVA_FACTOR,
  "UP LIGHT": 10 * IVA_FACTOR,
  "BASE": 25 * IVA_FACTOR,
  "POWER": 55 * IVA_FACTOR,
};

const ADICIONALES_BASE = ["IMPUESTOS", "CONTABILIDAD", "NOMINA", "TESORERIA", "ACTIVOS FIJOS", "RESTAURANTES"];
const ADICIONALES_CONTADOR = ["UP LIGHT", "BASE", "POWER"];

const ASESORES: Record<string, string> = {
  salome: "Salomé Estrella",
  karla: "Karla Haro",
  ismenia: "Ismenia Escalona",
  evelyn: "Evelyn Narváez",
  david: "David Santander",
};

interface PlanOption {
  label: string;
  precio: number;
}

interface ProductCatalogItem {
  label: string;
  planes?: PlanOption[];
  planesNuevo?: PlanOption[];
  planesRenovacion?: PlanOption[];
}

const PRODUCTOS: Record<string, ProductCatalogItem> = {
  facturacion: {
    label: "Planes Facturación",
    planes: [
      { label: "UP LIGHT", precio: 11.50 },
      { label: "UP BASE", precio: 28.75 },
      { label: "UP POWER", precio: 63.25 },
      { label: "UP INICIAL", precio: 11.50 },
      { label: "UP INTERMEDIO", precio: 17.25 },
      { label: "UP IDEAL PLUS", precio: 28.75 },
      { label: "UP PROFESIONAL PLUS", precio: 92.00 },
      { label: "UP ULTRA", precio: 172.50 },
    ],
  },
  contador: {
    label: "Plan Contador",
    planes: [
      { label: "ILIMITADO", precio: 345.00 },
      { label: "TAX", precio: 115.00 },
      { label: "1 EMPRESA", precio: 57.50 },
      { label: "3 EMPRESAS", precio: 115.00 },
      { label: "6 EMPRESAS", precio: 172.50 },
      { label: "10 EMPRESAS", precio: 230.00 },
    ],
  },
  erp: {
    label: "Planes ERP Contable",
    planes: [
      { label: "ERP UPCONTA START", precio: 473.52 },
      { label: "ERP UPCONTA PLUS", precio: 690.00 },
      { label: "ERP UPCONTA PREMIUN", precio: 1102.64 },
    ],
  },
  natural: {
    label: "Firma Natural",
    planesNuevo: [
      { label: "15 Días", precio: 4.49 },
      { label: "1 Año", precio: 18.20 },
      { label: "2 Años", precio: 22.20 },
      { label: "3 Años", precio: 33.28 },
      { label: "4 Años", precio: 44.36 },
      { label: "5 Años", precio: 55.41 },
    ],
    planesRenovacion: [
      { label: "15 Días", precio: 4.14 },
      { label: "1 Año", precio: 16.80 },
      { label: "2 Años", precio: 20.50 },
      { label: "3 Años", precio: 30.72 },
      { label: "4 Años", precio: 40.95 },
      { label: "5 Años", precio: 51.15 },
    ],
  },
  natural_ruc: {
    label: "Firma Natural con RUC",
    planesNuevo: [
      { label: "15 Días", precio: 4.49 },
      { label: "1 Año", precio: 18.20 },
      { label: "2 Años", precio: 22.20 },
      { label: "3 Años", precio: 33.28 },
      { label: "4 Años", precio: 44.36 },
      { label: "5 Años", precio: 55.41 },
    ],
    planesRenovacion: [
      { label: "15 Días", precio: 4.14 },
      { label: "1 Año", precio: 16.80 },
      { label: "2 Años", precio: 20.50 },
      { label: "3 Años", precio: 30.72 },
      { label: "4 Años", precio: 40.95 },
      { label: "5 Años", precio: 51.15 },
    ],
  },
  juridica: {
    label: "Firma Jurídica",
    planesNuevo: [
      { label: "1 Año", precio: 21.84 },
      { label: "2 Años", precio: 25.84 },
      { label: "3 Años", precio: 38.22 },
      { label: "4 Años", precio: 50.93 },
      { label: "5 Años", precio: 63.12 },
    ],
    planesRenovacion: [
      { label: "1 Año", precio: 20.16 },
      { label: "2 Años", precio: 23.86 },
      { label: "3 Años", precio: 35.28 },
      { label: "4 Años", precio: 47.01 },
      { label: "5 Años", precio: 58.26 },
    ],
  },
  emprende: {
    label: "Promo Emprende",
    planes: [
      { label: "1 Año", precio: 24.00 },
      { label: "2 Años", precio: 30.00 },
      { label: "3 Años", precio: 38.00 },
    ],
  },
};

interface AdicionalItem {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentasModuleProps {
  companyMode?: "all" | "upconta" | "firmas" | "locked";
  accessProfile?: "180890" | "1998" | "070926" | "0000" | "170622" | "123456" | null;
}

export function VentasModule({ companyMode, accessProfile }: VentasModuleProps = {}) {
  const mode =
    companyMode ||
    (accessProfile === "180890" || accessProfile === "170622"
      ? "upconta"
      : accessProfile === "1998" || accessProfile === "070926" || accessProfile === "123456"
      ? "firmas"
      : "all");

  const availableAsesores = useMemo(() => {
    if (mode === "upconta") {
      return {
        karla: "Karla Haro",
        david: "David Santander",
      };
    }
    if (mode === "firmas") {
      return {
        salome: "Salomé Estrella",
        ismenia: "Ismenia Escalona",
        evelyn: "Evelyn Narváez",
      };
    }
    return ASESORES;
  }, [mode]);

  const availableProducts = useMemo(() => {
    if (mode === "upconta") {
      return {
        facturacion: PRODUCTOS.facturacion,
        erp: PRODUCTOS.erp,
        contador: PRODUCTOS.contador,
      };
    }
    if (mode === "firmas") {
      return {
        natural: PRODUCTOS.natural,
        natural_ruc: PRODUCTOS.natural_ruc,
        juridica: PRODUCTOS.juridica,
        emprende: PRODUCTOS.emprende,
      };
    }
    return PRODUCTOS;
  }, [mode]);

  // Form State
  const [ruc, setRuc] = useState<string>("");
  const [nombre, setNombre] = useState<string>("");
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [asesor, setAsesor] = useState<string>("");
  const [productoKey, setProductoKey] = useState<string>("");
  const [tipoVenta, setTipoVenta] = useState<"Nuevo" | "Renovación" | "Socio" | "Distribuidor" | "Upseling">("Nuevo");

  // Socio y Distribuidor solo permitidos en UpConta
  const isUpcontaPartnerAllowed =
    mode === "upconta" ||
    companyMode === "upconta" ||
    ["facturacion", "erp", "contador"].includes(productoKey);

  // Socio / Distribuidor Selection State
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [sociosList, setSociosList] = useState<string[]>(() => getStoredSocios());
  const [distribuidoresList, setDistribuidoresList] = useState<string[]>(() => getStoredDistribuidores());
  const [isCreatingNewPartner, setIsCreatingNewPartner] = useState<boolean>(false);
  const [newPartnerName, setNewPartnerName] = useState<string>("");
  const [isSavingPartner, setIsSavingPartner] = useState<boolean>(false);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [webappUrlInput, setWebappUrlInput] = useState<string>(() => getSheetWebAppUrl());
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);
  const [urlTestResult, setUrlTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Sincronizar listas desde las pestañas de Google Sheet al cargar
    fetchRemoteSocios().then(list => {
      if (list && list.length > 0) setSociosList(list);
    });
    fetchRemoteDistribuidores().then(list => {
      if (list && list.length > 0) setDistribuidoresList(list);
    });

    const handleSociosUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setSociosList(e.detail);
    };
    const handleDistUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setDistribuidoresList(e.detail);
    };

    window.addEventListener("socios_updated", handleSociosUpdated);
    window.addEventListener("distribuidores_updated", handleDistUpdated);
    return () => {
      window.removeEventListener("socios_updated", handleSociosUpdated);
      window.removeEventListener("distribuidores_updated", handleDistUpdated);
    };
  }, []);

  useEffect(() => {
    if (!isUpcontaPartnerAllowed && (tipoVenta === "Socio" || tipoVenta === "Distribuidor")) {
      setTipoVenta("Nuevo");
      setSelectedPartner("");
    }
  }, [isUpcontaPartnerAllowed, tipoVenta]);

  // Upseling solo permitido en el perfil de firmas con clave 1998 o 123456
  const isFirmasUpselingAllowed =
    (mode === "firmas" || companyMode === "firmas") &&
    (accessProfile === "1998" || accessProfile === "123456");

  useEffect(() => {
    if (!isFirmasUpselingAllowed && tipoVenta === "Upseling") {
      setTipoVenta("Nuevo");
    }
  }, [isFirmasUpselingAllowed, tipoVenta]);
  
  // Selected Plan Index or Value
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [montoRegistrado, setMontoRegistrado] = useState<number>(0);
  const [descuento, setDescuento] = useState<number>(0);

  // Adicionales
  const [adicionales, setAdicionales] = useState<AdicionalItem[]>([]);
  const [selectedAdicionalNombre, setSelectedAdicionalNombre] = useState<string>("");
  const [adicionalCantidad, setAdicionalCantidad] = useState<number>(1);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reset asesor/producto if mode changes
  useEffect(() => {
    setAsesor("");
    setProductoKey("");
    setAdicionales([]);
    setMontoRegistrado(0);
  }, [mode]);

  // Format currency helpers
  const formatMoney = (val: number) => {
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Determine available planes list based on product & tipoVenta
  const getPlanesList = (): PlanOption[] => {
    if (!productoKey || !PRODUCTOS[productoKey]) return [];
    const prod = PRODUCTOS[productoKey];
    if (prod.planesNuevo && prod.planesRenovacion) {
      return tipoVenta === "Renovación" ? prod.planesRenovacion : prod.planesNuevo;
    }
    return prod.planes || [];
  };

  const planesList = getPlanesList();

  // Show/Hide rules
  const productosConAdicionales = ["facturacion", "contador"];
  const productosConTipoVentaPlan = ["erp", "natural", "natural_ruc", "juridica", "emprende"];
  
  const showAdicionales = productosConAdicionales.includes(productoKey);
  const showTipoVentaPlan = productosConTipoVentaPlan.includes(productoKey);
  const showTipoVentaAdicionales = productosConAdicionales.includes(productoKey);

  // Populate default plan price whenever product or tipoVenta changes
  useEffect(() => {
    const planes = getPlanesList();
    if (planes.length > 0) {
      setSelectedPlanIndex(0);
      setMontoRegistrado(planes[0].precio);
    } else {
      setMontoRegistrado(0);
    }

    // Default select first available adicional option if showing
    if (showAdicionales) {
      const list = productoKey === "contador" ? [...ADICIONALES_BASE, ...ADICIONALES_CONTADOR] : ADICIONALES_BASE;
      if (list.length > 0) setSelectedAdicionalNombre(list[0]);
    }
  }, [productoKey, tipoVenta]);

  // Handle plan dropdown selection
  const handlePlanChange = (index: number) => {
    setSelectedPlanIndex(index);
    const planes = getPlanesList();
    if (planes[index]) {
      setMontoRegistrado(planes[index].precio);
    }
  };

  // Add Adicional Line Item
  const handleAddAdicional = () => {
    if (!selectedAdicionalNombre || adicionalCantidad <= 0) return;
    const precioUnitario = ADICIONALES_PRECIOS[selectedAdicionalNombre];
    if (!precioUnitario) return;

    const subtotal = cantidad => cantidad * precioUnitario;
    const newItem: AdicionalItem = {
      nombre: selectedAdicionalNombre,
      cantidad: adicionalCantidad,
      precioUnitario,
      subtotal: subtotal(adicionalCantidad),
    };

    setAdicionales(prev => [...prev, newItem]);
    setAdicionalCantidad(1);
  };

  // Remove Adicional Item
  const handleRemoveAdicional = (index: number) => {
    setAdicionales(prev => prev.filter((_, i) => i !== index));
  };

  // Total calculation
  const totalAdicionales = adicionales.reduce((acc, item) => acc + item.subtotal, 0);
  const totalInvertir = Math.max(0, montoRegistrado - descuento + totalAdicionales);

  // Sanitized RUC input
  const handleRucChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 13);
    setRuc(clean);
  };

  // Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    // Validation checks
    if (!ruc || ruc.length < 10 || ruc.length > 13) {
      setStatusMessage({
        type: "error",
        text: "El RUC, Cédula o Pasaporte debe tener entre 10 y 13 caracteres alfanuméricos.",
      });
      return;
    }

    if (!nombre.trim()) {
      setStatusMessage({ type: "error", text: "Por favor ingresa el Nombre o Razón Social del cliente." });
      return;
    }

    if (!asesor) {
      setStatusMessage({ type: "error", text: "Por favor selecciona un asesor comercial." });
      return;
    }

    if (!productoKey) {
      setStatusMessage({ type: "error", text: "Por favor selecciona un producto de venta." });
      return;
    }

    const currentPlanes = getPlanesList();
    const selectedPlanObj = currentPlanes[selectedPlanIndex];
    const planLabel = selectedPlanObj ? `${selectedPlanObj.label} ($${formatMoney(selectedPlanObj.precio)})` : "";

    if (!planLabel) {
      setStatusMessage({ type: "error", text: "Por favor selecciona un plan válido." });
      return;
    }

    if ((tipoVenta === "Socio" || tipoVenta === "Distribuidor") && !selectedPartner.trim()) {
      setStatusMessage({
        type: "error",
        text: `Por favor selecciona o crea un ${tipoVenta} de la lista oficial.`
      });
      return;
    }

    const adicionalesTexto = adicionales.map(a => `${a.nombre} x${a.cantidad}`).join(", ");
    const finalTipoVenta = showTipoVentaPlan || showTipoVentaAdicionales || mode === "firmas" ? tipoVenta : "";
    const partnerName = (tipoVenta === "Socio" || tipoVenta === "Distribuidor") ? selectedPartner.trim() : "";
    const cleanDate = normalizeDateString(fecha || new Date().toISOString().split("T")[0]);
    const mesCalculado = getMonthFromDate(cleanDate);

    const payload = {
      asesor: ASESORES[asesor] || asesor,
      fecha: cleanDate,
      ruc: ruc,
      nombre: nombre,
      producto: PRODUCTOS[productoKey]?.label || productoKey,
      plan: planLabel,
      adicionales: adicionalesTexto,
      valorPlan: montoRegistrado,
      valorAdicional: totalAdicionales,
      descuento: descuento,
      total: totalInvertir,
      tipoVenta: finalTipoVenta,
      tipo: finalTipoVenta,
      mes: mesCalculado,
      "SOCIO / DISTRIBUIDOR": partnerName,
      socioDistribuidor: partnerName,
      socio_distribuidor: partnerName,
      socio: partnerName,
      distribuidor: partnerName,
    };

    setIsSubmitting(true);

    try {
      const params = new URLSearchParams();
      Object.entries(payload).forEach(([k, v]) => params.append(k, String(v)));

      const activeWebappUrl = getSheetWebAppUrl();
      await fetch(activeWebappUrl + "?" + params.toString(), {
        method: "GET",
        mode: "no-cors",
      });

      // Guardar también en el almacenamiento persistente para actualizar instantáneamente los reportes y dashboards
      try {
        const cleanDate = normalizeDateString(fecha || new Date().toISOString().split("T")[0]);
        const mesCalculado = getMonthFromDate(cleanDate);

        const newSaleItem: SaleTransaction = {
          asesor: ASESORES[asesor] || asesor,
          fecha: cleanDate,
          ruc: ruc,
          nombre: nombre,
          tipo: finalTipoVenta || "Nuevo",
          producto: PRODUCTOS[productoKey]?.label || productoKey,
          plan: planLabel,
          adicionales: adicionalesTexto,
          valorPlan: Number(montoRegistrado) || 0,
          valorAdicional: Number(totalAdicionales) || 0,
          descuento: Number(descuento) || 0,
          total: Number(totalInvertir) || 0,
          totalSinIva: Number((totalInvertir / 1.15).toFixed(2)),
          mes: mesCalculado,
          socioDistribuidor: partnerName
        };

        saveCustomRegisteredSale(newSaleItem);
      } catch (cacheErr) {
        console.warn("No se pudo cachear localmente la venta:", cacheErr);
      }

      setStatusMessage({
        type: "success",
        text: "¡Venta registrada exitosamente en el sistema de Ventas UpConta & ANF!",
      });

      // Reset form
      setRuc("");
      setNombre("");
      setDescuento(0);
      setAdicionales([]);
      setFecha(new Date().toISOString().split("T")[0]);
      setSelectedPartner("");
      setIsCreatingNewPartner(false);
      setNewPartnerName("");
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: "Ocurrió un error al registrar la venta. Verifica tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndSelectNewPartner = async () => {
    if (!newPartnerName.trim()) return;
    setIsSavingPartner(true);
    try {
      const name = newPartnerName.trim().toUpperCase();
      if (tipoVenta === "Socio") {
        const updated = await saveNewSocio(name);
        setSociosList(updated);
        setSelectedPartner(name);
      } else {
        const updated = await saveNewDistribuidor(name);
        setDistribuidoresList(updated);
        setSelectedPartner(name);
      }
      setIsCreatingNewPartner(false);
      setNewPartnerName("");
    } catch (err) {
      console.error("Error creating partner:", err);
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleSaveWebappUrl = () => {
    if (webappUrlInput.trim()) {
      setSheetWebAppUrl(webappUrlInput.trim());
      setUrlTestResult({ success: true, message: "URL actualizada exitosamente en el sistema." });
    }
  };

  const handleTestWebappUrl = async () => {
    setIsTestingUrl(true);
    setUrlTestResult(null);
    try {
      const url = webappUrlInput.trim() || getSheetWebAppUrl();
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.status === "ok") {
        setUrlTestResult({
          success: true,
          message: `¡Conexión verificada! Hoja vinculada: ${data.hoja || "GENERAL"}. Destino: fila ${data.filaDestino || ""}`
        });
      } else {
        setUrlTestResult({
          success: false,
          message: "El servidor respondió pero no devolvió el formato esperado."
        });
      }
    } catch (err: any) {
      setUrlTestResult({
        success: false,
        message: "No se pudo conectar con la WebApp. Verifica que en Google Apps Script esté configurado 'Quién tiene acceso: Cualquier usuario' (Anyone)."
      });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const listaAdicionalesOpciones = productoKey === "contador" ? [...ADICIONALES_BASE, ...ADICIONALES_CONTADOR] : ADICIONALES_BASE;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Helper Bar for Google Sheets synchronization */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">
            Sincronización en vivo con Google Sheets (Pestañas: <strong>GENERAL</strong>, <strong>SOCIOS</strong> y <strong>DISTRIBUIDORES</strong>)
          </span>
        </div>
        {accessProfile === "180890" && (
          <button
            type="button"
            onClick={() => setShowScriptModal(true)}
            className="text-xs font-black text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>⚙️ Actualizar Script Google Sheets (Columna O)</span>
          </button>
        )}
      </div>

      {/* Modal con instrucciones y código Apps Script para Columna O, Socios y Distribuidores */}
      {showScriptModal && accessProfile === "180890" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>⚙️ Código de Apps Script para Google Sheets</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Habilita la Columna O (SOCIO / DISTRIBUIDOR) y el guardado en las pestañas SOCIOS y DISTRIBUIDORES
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
              <strong className="block font-black">Pasos para actualizar tu Google Sheet (1 minuto):</strong>
              <ol className="list-decimal pl-4 space-y-1 font-medium">
                <li>En tu Google Sheet ve al menú superior: <strong>Extensiones &gt; Apps Script</strong>.</li>
                <li>Reemplaza todo el contenido del archivo con el código de abajo.</li>
                <li>Haz clic en el botón <strong>Guardar (ícono de disco)</strong>.</li>
                <li>Haz clic en <strong>Implementar &gt; Administrar implementaciones</strong>, pulsa el <strong>ícono de lápiz (Editar)</strong>, en Versión selecciona <strong>Nueva versión</strong> y haz clic en <strong>Implementar</strong>.</li>
                <li>Si creaste una nueva implementación y cambió la URL de la WebApp, puedes pegarla aquí abajo para vincularla de inmediato.</li>
              </ol>
            </div>

            {/* URL Configuration Input & Tester */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>URL Activa de la WebApp de Google Sheets:</span>
                <span className="text-[10px] text-slate-500 font-normal">Termina en /exec</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webappUrlInput}
                  onChange={(e) => setWebappUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleSaveWebappUrl}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black transition-colors cursor-pointer"
                >
                  Guardar URL
                </button>
                <button
                  type="button"
                  disabled={isTestingUrl}
                  onClick={handleTestWebappUrl}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-black transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isTestingUrl ? "Probando..." : "Probar Conexión"}
                </button>
              </div>

              {urlTestResult && (
                <div
                  className={`p-2 rounded-lg text-xs font-bold border ${
                    urlTestResult.success
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-rose-50 text-rose-800 border-rose-300"
                  }`}
                >
                  {urlTestResult.message}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-700">Código Google Apps Script (doGet):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 3000);
                  }}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-black transition-colors cursor-pointer shadow-xs"
                >
                  {copiedScript ? "¡Copiado al Portapapeles! ✓" : "Copiar Código"}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-auto flex-1 border border-slate-800 select-all">
                {APPS_SCRIPT_SOURCE_CODE}
              </pre>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Message Banner if present */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-900 text-emerald-100 border-emerald-500/50 shadow-md"
              : "bg-rose-900 text-rose-100 border-rose-500/50 shadow-md"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Form Content: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Client Data & Product/Plan Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Client & Asesor Data */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Datos del Cliente &amp; Asesor</h3>
                <p className="text-xs text-slate-500">Identificación y fecha de la transacción</p>
              </div>
            </div>

            {/* RUC / Cédula */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                RUC o Cédula / Pasaporte <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={ruc}
                  maxLength={13}
                  onChange={handleRucChange}
                  placeholder="Ej: 1792345678001 (10 a 13 caracteres)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all uppercase"
                />
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nombre / Empresa <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Razón Social o Nombre Completo"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Fecha & Asesor Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Fecha <span className="text-orange-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Asesor Comercial <span className="text-orange-600">*</span>
                </label>
                <select
                  value={asesor}
                  onChange={e => setAsesor(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                >
                  <option value="">Selecciona un asesor</option>
                  {Object.entries(availableAsesores).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Producto Selection */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Elige tu Producto de Venta <span className="text-orange-600">*</span>
              </label>
              <select
                value={productoKey}
                onChange={e => setProductoKey(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-800 rounded-xl font-bold text-sm focus:ring-2 focus:ring-orange-400 transition-all"
              >
                <option value="">Selecciona un producto</option>
                {mode === "upconta" ? (
                  <optgroup label="Software Contable & ERP (UpConta)">
                    <option value="facturacion">Planes Facturación</option>
                    <option value="erp">Planes ERP Contable</option>
                    <option value="contador">Plan Contador</option>
                  </optgroup>
                ) : mode === "firmas" ? (
                  <optgroup label="Firma Electrónica & Promociones (ANF AC)">
                    <option value="natural">Firma Natural</option>
                    <option value="natural_ruc">Firma Natural con RUC</option>
                    <option value="juridica">Firma Jurídica</option>
                    <option value="emprende">Promo Emprende</option>
                  </optgroup>
                ) : (
                  <>
                    <optgroup label="Software Contable & ERP (UpConta)">
                      <option value="facturacion">Planes Facturación</option>
                      <option value="erp">Planes ERP Contable</option>
                      <option value="contador">Plan Contador</option>
                    </optgroup>
                    <optgroup label="Firma Electrónica & Promociones (ANF AC)">
                      <option value="natural">Firma Natural</option>
                      <option value="natural_ruc">Firma Natural con RUC</option>
                      <option value="juridica">Firma Jurídica</option>
                      <option value="emprende">Promo Emprende</option>
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Card 2: Plan Selector, Tipo de Venta & Adicionales (Moved below Client & Asesor group) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Plan Seleccionado &amp; Adicionales</h3>
                <p className="text-xs text-slate-500">Configura la modalidad y módulos opcionales</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Plan Seleccionado <span className="text-orange-600">*</span>
              </label>
              <select
                value={selectedPlanIndex}
                onChange={e => handlePlanChange(Number(e.target.value))}
                disabled={!productoKey}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-extrabold text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all disabled:opacity-50"
              >
                {!productoKey ? (
                  <option value={0}>Selecciona un producto primero</option>
                ) : (
                  planesList.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.label} — (${formatMoney(p.precio)})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Tipo de Venta Radios */}
            {(showTipoVentaPlan || showTipoVentaAdicionales || mode === "firmas") && (
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tipo de Venta:
                </label>
                <div className="flex items-center gap-6 pt-1 flex-wrap">
                  <label className="inline-flex items-center gap-2 font-bold text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoVentaRadio"
                      value="Nuevo"
                      checked={tipoVenta === "Nuevo"}
                      onChange={() => setTipoVenta("Nuevo")}
                      className="text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Nuevo</span>
                  </label>
                  <label className="inline-flex items-center gap-2 font-bold text-sm text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoVentaRadio"
                      value="Renovación"
                      checked={tipoVenta === "Renovación"}
                      onChange={() => setTipoVenta("Renovación")}
                      className="text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Renovación</span>
                  </label>
                  {isUpcontaPartnerAllowed && (
                    <label className="inline-flex items-center gap-2 font-bold text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoVentaRadio"
                        value="Socio"
                        checked={tipoVenta === "Socio"}
                        onChange={() => {
                          setTipoVenta("Socio");
                          setSelectedPartner("");
                          setIsCreatingNewPartner(false);
                        }}
                        className="text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Socio</span>
                    </label>
                  )}
                  {isUpcontaPartnerAllowed && (
                    <label className="inline-flex items-center gap-2 font-bold text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoVentaRadio"
                        value="Distribuidor"
                        checked={tipoVenta === "Distribuidor"}
                        onChange={() => {
                          setTipoVenta("Distribuidor");
                          setSelectedPartner("");
                          setIsCreatingNewPartner(false);
                        }}
                        className="text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Distribuidor</span>
                    </label>
                  )}
                  {isFirmasUpselingAllowed && (
                    <label className="inline-flex items-center gap-2 font-bold text-sm text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="tipoVentaRadio"
                        value="Upseling"
                        checked={tipoVenta === "Upseling"}
                        onChange={() => {
                          setTipoVenta("Upseling");
                          setSelectedPartner("");
                          setIsCreatingNewPartner(false);
                        }}
                        className="text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="flex items-center gap-1.5">
                        <span>Upseling</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                          Firmas
                        </span>
                      </span>
                    </label>
                  )}
                </div>

                {/* Desplegable de Socios / Distribuidores */}
                {(tipoVenta === "Socio" || tipoVenta === "Distribuidor") && (
                  <div className="mt-3.5 p-4 bg-orange-50/90 border-2 border-orange-200 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        {tipoVenta === "Socio" ? (
                          <Handshake className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Building className="w-4 h-4 text-orange-600" />
                        )}
                        <span>
                          {tipoVenta === "Socio" ? "Listado Oficial de Socios *" : "Listado Oficial de Distribuidores *"}
                        </span>
                      </label>

                      {!isCreatingNewPartner && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewPartner(true);
                            setNewPartnerName("");
                          }}
                          className="px-2.5 py-1 text-xs font-black text-orange-800 bg-orange-200/80 hover:bg-orange-200 rounded-lg border border-orange-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Crear Nuevo {tipoVenta}</span>
                        </button>
                      )}
                    </div>

                    {!isCreatingNewPartner ? (
                      <div className="space-y-2">
                        <select
                          value={selectedPartner}
                          onChange={(e) => {
                            if (e.target.value === "__NEW__") {
                              setIsCreatingNewPartner(true);
                              setNewPartnerName("");
                            } else {
                              setSelectedPartner(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:border-orange-500 shadow-2xs"
                        >
                          <option value="">
                            -- Selecciona un {tipoVenta} ({tipoVenta === "Socio" ? sociosList.length : distribuidoresList.length} disponibles) --
                          </option>
                          {(tipoVenta === "Socio" ? sociosList : distribuidoresList).map((item, idx) => (
                            <option key={idx} value={item}>
                              {item}
                            </option>
                          ))}
                          <option value="__NEW__">➕ Crear y agregar nuevo {tipoVenta}...</option>
                        </select>

                        {selectedPartner ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
                            <span>
                              Seleccionado: <strong className="text-slate-900 font-black">{selectedPartner}</strong>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Columna: SOCIO / DISTRIBUIDOR
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] font-semibold text-amber-800">
                            * Se registrará en la columna <strong>SOCIO / DISTRIBUIDOR</strong> de Google Sheets y en los reportes locales.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-orange-300 p-3.5 rounded-xl space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            Crear Nuevo {tipoVenta} (se agregará a la pestaña {tipoVenta === "Socio" ? "socios" : "distribuidor"} de Google Sheets):
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsCreatingNewPartner(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                          >
                            ✕ Cancelar
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder={`Nombre completo del nuevo ${tipoVenta}...`}
                            value={newPartnerName}
                            onChange={(e) => setNewPartnerName(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs uppercase focus:bg-white focus:border-orange-500"
                          />
                          <button
                            type="button"
                            disabled={isSavingPartner || !newPartnerName.trim()}
                            onClick={handleSaveAndSelectNewPartner}
                            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {isSavingPartner ? "Guardando..." : "Guardar y Seleccionar"}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Se agregará inmediatamente al listado local y se sincronizará con la pestaña {tipoVenta === "Socio" ? "socios" : "distribuidor"} de Google Sheets.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Adicionales Module Adder */}
            {showAdicionales && (
              <div className="pt-2 space-y-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Agregar Módulos Adicionales:
                </label>
                <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                  <select
                    value={selectedAdicionalNombre}
                    onChange={e => setSelectedAdicionalNombre(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold text-xs focus:bg-white focus:border-orange-500"
                  >
                    {listaAdicionalesOpciones.map(nom => (
                      <option key={nom} value={nom}>
                        {nom} (${formatMoney(ADICIONALES_PRECIOS[nom])})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={adicionalCantidad}
                    onChange={e => setAdicionalCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-black text-xs text-slate-900"
                  />

                  <button
                    type="button"
                    onClick={handleAddAdicional}
                    className="bg-[#0B2545] hover:bg-[#123866] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-orange-400" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Summary & Submit Action */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Calculation & Submit Card */}
          <div className="bg-[#0B2545] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6 sticky top-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Monto Registrado</h3>
                  <p className="text-xs text-slate-300">Desglose de valores e IVA</p>
                </div>
              </div>
              <span className="text-xs font-extrabold bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full border border-orange-500/30">
                USD ($)
              </span>
            </div>

            {/* Price Inputs */}
            <div className="space-y-3 text-sm font-medium">
              <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Monto Registrado:</span>
                <div className="relative w-36">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={montoRegistrado || ""}
                    onChange={e => setMontoRegistrado(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-right font-black text-white text-base focus:border-orange-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-300 font-bold">Descuento ($):</span>
                <div className="relative w-36">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={descuento || ""}
                    onChange={e => setDescuento(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-right font-black text-emerald-400 text-base focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Added Adicionales Breakdown Lines */}
              {adicionales.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wider block">
                    Módulos Adicionales:
                  </span>
                  {adicionales.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/80 px-3 py-2 rounded-lg text-xs">
                      <span className="text-slate-200 font-bold">
                        {item.nombre} <span className="text-orange-400 font-extrabold">x{item.cantidad}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white">${formatMoney(item.subtotal)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdicional(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          title="Eliminar adicional"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-800" />

            {/* Total Highlight */}
            <div className="bg-gradient-to-r from-orange-600/30 via-orange-500/20 to-amber-500/30 p-4 rounded-2xl border border-orange-500/40 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-black text-orange-300 tracking-wider block">TOTAL A INVERTIR</span>
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  ${formatMoney(totalInvertir)}
                </span>
              </div>
              <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>

            {/* Action Submit Button inside Monto Registrado card */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40 uppercase tracking-wider disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-white" />
              <span>{isSubmitting ? "REGISTRANDO..." : "REGISTRAR VENTA"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
