import React, { useState, useEffect, useMemo } from "react";
import { 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Users, 
  Layers, 
  TrendingUp, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  ChevronRight, 
  BarChart3, 
  Building2, 
  ShieldCheck, 
  Edit3,
  DollarSign,
  FileSpreadsheet
} from "lucide-react";
import { jsPDF } from "jspdf";
import { INITIAL_OFFLINE_SALES } from "../salesData";
import { SaleTransaction, getStoredSales } from "../utils/salesStorage";

export interface ReporteGerencialModuleProps {
  empresa: "upconta" | "firmas";
}

// Canonical products and plan cleaners for UpConta and Firmas
export const CANONICAL_UPCONTA_PRODUCTS = [
  "UP LIGHT",
  "UP POWER",
  "UP INICIAL",
  "UP INTERMEDIO",
  "UP IDEAL PLUS",
  "UP BASE",
  "UP PROFESIONAL PLUS",
  "UP ULTRA",
  "ERP UPCONTA START (ERP STAR)",
  "ERP UPCONTA PLUS",
  "ERP UPCONTA PREMIUN",
  "Plan Contador - 1 EMPRESA",
  "Plan Contador - 3 EMPRESAS",
  "Plan Contador - ILIMITADO"
];

export const CANONICAL_FIRMAS_PRODUCTS = [
  "Firma Natural - 15 Días",
  "Firma Natural - 1 Año",
  "Firma Natural - 2 Años",
  "Firma Natural - 3 Años",
  "Firma Natural - 4 Años",
  "Firma Natural - 5 Años",
  "Firma Natural con RUC - 1 Año",
  "Firma Natural con RUC - 2 Años",
  "Firma Natural con RUC - 3 Años",
  "Firma Natural con RUC - 4 Años",
  "Firma Natural con RUC - 5 Años",
  "Promo Emprende - 1 Año",
  "Promo Emprende - 2 Años",
  "Firma Jurídica - 1 Año",
  "Firma Jurídica - 2 Años",
  "Firma Jurídica - 3 Años",
  "Firma Jurídica - 5 Años"
];

export function getCleanUpContaPlan(s: SaleTransaction): string {
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

export function getCleanFirmasPlan(s: SaleTransaction): string {
  const prod = s.producto || "Firma Natural";
  let plan = s.plan || "";
  plan = plan.replace(/\s*\(\$[\d,\.]+\)/g, "").trim();
  if (plan) {
    return `${prod} - ${plan}`;
  }
  return prod;
}

// Normalización de nombres de asesores para coincidencia robusta
export function normalizeAdviser(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Extracción robusta del monto en dólares ($) de cada venta
export function getSaleAmount(s: SaleTransaction): number {
  if (typeof s.totalSinIva === "number" && !isNaN(s.totalSinIva) && s.totalSinIva > 0) {
    return s.totalSinIva;
  }
  if (typeof s.total === "number" && !isNaN(s.total) && s.total > 0) {
    return s.total;
  }
  if (typeof s.valorPlan === "number" && !isNaN(s.valorPlan) && s.valorPlan > 0) {
    return s.valorPlan;
  }
  return Number((s as any).monto) || Number((s as any).valor) || Number((s as any).precioFinal) || 0;
}

// Cálculo de semanas de Lunes a Domingo para cualquier mes y año
export function getWeekRangeForMonthAndWeek(year: number, month: number, weekNum: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstOfMonth.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado

  // Primer domingo del mes (cierre del primer ciclo semanal)
  // Si el día 1 es domingo (0), el primer domingo es el día 1.
  // Si el día 1 es lunes (1), el primer domingo es el día 7.
  const firstSunday = firstDayOfWeek === 0 ? 1 : 1 + (7 - firstDayOfWeek);

  let startDay = 1;
  let endDay = daysInMonth;

  if (firstSunday === 7) {
    // El mes comenzó exactamente en Lunes
    startDay = 1 + (weekNum - 1) * 7;
    endDay = weekNum === 5 ? daysInMonth : Math.min(startDay + 6, daysInMonth);
  } else {
    // El mes comenzó en otro día de la semana
    if (weekNum === 1) {
      startDay = 1;
      endDay = firstSunday; // Cierra en el primer domingo
    } else {
      // Semana 2, 3, 4, 5 siempre inician en Lunes
      startDay = firstSunday + 1 + (weekNum - 2) * 7;
      if (weekNum === 5) {
        endDay = daysInMonth;
      } else {
        endDay = Math.min(startDay + 6, daysInMonth); // Cierra en Domingo
      }
    }
  }

  // Asegurar límites válidos
  if (startDay > daysInMonth) startDay = daysInMonth;
  if (endDay > daysInMonth) endDay = daysInMonth;
  if (endDay < startDay) endDay = startDay;

  return {
    startDay,
    endDay,
    startDate: `${year}-${pad(month)}-${pad(startDay)}`,
    endDate: `${year}-${pad(month)}-${pad(endDay)}`,
    label: `${pad(startDay)} al ${pad(endDay)}`
  };
}

// Función para determinar en qué semana (1 a 5) cae el día de hoy dentro del mes
export function getCurrentWeekForMonth(year: number, month: number): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (year !== currentYear || month !== currentMonth) {
    return 1;
  }

  for (let w = 1; w <= 5; w++) {
    const range = getWeekRangeForMonthAndWeek(year, month, w);
    if (currentDay >= range.startDay && currentDay <= range.endDay) {
      return w;
    }
  }
  return 1;
}

// 8 Etapas Oficiales solicitadas por el usuario:
// Asignar, interactuar, presentar, reservar, negociar, ganar, perder, pendiente de pago
export const ETAPAS_EMBUDO = [
  { key: "asignar", label: "1. ASIGNAR", enProceso: true },
  { key: "interactuar", label: "2. INTERACTUAR", enProceso: true },
  { key: "presentar", label: "3. PRESENTAR", enProceso: true },
  { key: "reservar", label: "4. RESERVAR", enProceso: true },
  { key: "negociar", label: "5. NEGOCIAR", enProceso: true },
  { key: "ganar", label: "6. GANAR", enProceso: false, esGanado: true },
  { key: "perder", label: "7. PERDER", enProceso: false, esPerdido: true },
  { key: "pendiente_pago", label: "8. PENDIENTE DE PAGO", enProceso: true }
] as const;

export type EtapaKey = typeof ETAPAS_EMBUDO[number]["key"];

interface VendedorConfig {
  key: string;
  nombre: string;
  rol: string;
  cantidad: number;
  especialidad: string;
  responsabilidad: string;
}

const VENDEDORES_UPCONTA: VendedorConfig[] = [
  {
    key: "david",
    nombre: "David Santander",
    rol: "Pre Senior",
    cantidad: 1,
    especialidad: "Control UpConta",
    responsabilidad: "Prospección clientes B2C y B2B"
  },
  {
    key: "karla",
    nombre: "Karla Haro",
    rol: "Junior",
    cantidad: 1,
    especialidad: "UpConta",
    responsabilidad: "Prospección clientes B2C"
  }
];

const VENDEDORES_FIRMAS: VendedorConfig[] = [
  {
    key: "evelyn",
    nombre: "Evelyn Narváez",
    rol: "Junior",
    cantidad: 1,
    especialidad: "Firmas",
    responsabilidad: "Prospección clientes B2C"
  },
  {
    key: "ismenia",
    nombre: "Ismenia Escalona",
    rol: "Junior",
    cantidad: 1,
    especialidad: "Firmas",
    responsabilidad: "Prospección clientes B2C"
  },
  {
    key: "salome",
    nombre: "Salomé Estrella",
    rol: "Junior",
    cantidad: 1,
    especialidad: "Control Firmas",
    responsabilidad: "Supervisión, Prospección clientes B2C"
  }
];

// Indicadores semanales
interface SemanaIndicador {
  semana: string;
  periodo: string;
  mql: number;
  sql: number;
  hitRate: number; // Porcentaje
  lostRate: number; // Porcentaje
}

const DEFAULT_SEMANAS: SemanaIndicador[] = [
  { semana: "SEMANA 1", periodo: "01/08 - 02/08/2026", mql: 0, sql: 0, hitRate: 0.0, lostRate: 0.0 },
  { semana: "SEMANA 2", periodo: "03/08 - 09/08/2026", mql: 0, sql: 0, hitRate: 0.0, lostRate: 0.0 },
  { semana: "SEMANA 3", periodo: "10/08 - 16/08/2026", mql: 0, sql: 0, hitRate: 0.0, lostRate: 0.0 },
  { semana: "SEMANA 4", periodo: "17/08 - 23/08/2026", mql: 0, sql: 0, hitRate: 0.0, lostRate: 0.0 },
  { semana: "SEMANA 5", periodo: "24/08 - 31/08/2026", mql: 0, sql: 0, hitRate: 0.0, lostRate: 0.0 },
];

export function ReporteGerencialModule({ empresa }: ReporteGerencialModuleProps) {
  const esUpConta = empresa === "upconta";
  const nombreEmpresa = esUpConta ? "Upconta Ecuador" : "Firmas Electrónicas.ec by: ANF AC";
  const subTituloEmpresa = esUpConta ? "Upconta Ecuador" : "Firmas Electrónicas.ec";
  const vendedores = esUpConta ? VENDEDORES_UPCONTA : VENDEDORES_FIRMAS;

  // Paleta de Colores Corporativos:
  // - Firmas Electrónicas: Azul (#0B2545 / #102A43) y Amarillo (#F59E0B / #EAB308 / #FACC15)
  // - UpConta: Azul (#0B2545 / #102A43) y Naranja (#EA580C)
  const theme = {
    accentText: esUpConta ? "text-orange-600" : "text-amber-500",
    accentHoverText: esUpConta ? "hover:text-orange-700" : "hover:text-amber-600",
    accentBg: esUpConta ? "bg-orange-500" : "bg-amber-400",
    accentBorder: esUpConta ? "border-orange-500" : "border-amber-400",
    accentLightBg: esUpConta ? "bg-orange-50" : "bg-amber-50",
    accentLightBorder: esUpConta ? "border-orange-200" : "border-amber-200",
    accentBadgeBg: esUpConta ? "bg-orange-100" : "bg-amber-100",
    accentBadgeText: esUpConta ? "text-orange-800" : "text-amber-800",
    bannerValText: esUpConta ? "text-orange-400" : "text-amber-300",
    focusBorder: esUpConta ? "focus:border-orange-500" : "focus:border-amber-400",
  };

  // 1. Estados de Filtros (Siempre inicia en el mes actual por requerimiento)
  const now = new Date();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, "0");
  const currentYearStr = String(now.getFullYear());
  const currentWeekNum = getCurrentWeekForMonth(now.getFullYear(), now.getMonth() + 1);
  const currentRange = getWeekRangeForMonthAndWeek(now.getFullYear(), now.getMonth() + 1, currentWeekNum);

  const [tipoFiltro, setTipoFiltro] = useState<"semanal" | "mes" | "rango">("semanal");
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>(String(currentWeekNum));
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(currentMonthStr);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>(currentYearStr);
  const [fechaDesde, setFechaDesde] = useState<string>(currentRange.startDate);
  const [fechaHasta, setFechaHasta] = useState<string>(currentRange.endDate);
  const [guardadoExito, setGuardadoExito] = useState<boolean>(false);

  // Vista activa de diapositiva / sección
  const [diapositivaActiva, setDiapositivaActiva] = useState<"todas" | "portada" | "estructura" | "embudo" | "indicadores" | "cantidad_ventas">("todas");

  // Período formateado dinámicamente
  const periodoTexto = useMemo(() => {
    const mesesNombres: Record<string, string> = {
      "01": "Enero", "02": "Febrero", "03": "Marzo", "04": "Abril",
      "05": "Mayo", "06": "Junio", "07": "Julio", "08": "Agosto",
      "09": "Septiembre", "10": "Octubre", "11": "Noviembre", "12": "Diciembre"
    };

    if (tipoFiltro === "semanal") {
      const yr = parseInt(anioSeleccionado, 10) || now.getFullYear();
      const m = parseInt(mesSeleccionado, 10) || (now.getMonth() + 1);
      const w = parseInt(semanaSeleccionada, 10) || 1;
      const wRange = getWeekRangeForMonthAndWeek(yr, m, w);
      return `${wRange.label} de ${mesesNombres[mesSeleccionado] || "Septiembre"}`;
    }

    if (tipoFiltro === "mes") {
      return `Mes Completo de ${mesesNombres[mesSeleccionado] || "Septiembre"} ${anioSeleccionado}`;
    }

    // Rango personalizado
    return `Del ${fechaDesde} al ${fechaHasta}`;
  }, [tipoFiltro, semanaSeleccionada, mesSeleccionado, anioSeleccionado, fechaDesde, fechaHasta]);

  const mesAnioTexto = useMemo(() => {
    const mesesNombresMin: Record<string, string> = {
      "01": "enero", "02": "febrero", "03": "marzo", "04": "abril",
      "05": "mayo", "06": "junio", "07": "julio", "08": "agosto",
      "09": "septiembre", "10": "octubre", "11": "noviembre", "12": "diciembre"
    };
    return `${mesesNombresMin[mesSeleccionado] || "agosto"}-${anioSeleccionado}`;
  }, [mesSeleccionado, anioSeleccionado]);

  // Nombre del mes en mayúsculas
  const MESES_MAP: Record<string, { es: string; en: string }> = {
    "01": { es: "Enero", en: "January" },
    "02": { es: "Febrero", en: "February" },
    "03": { es: "Marzo", en: "March" },
    "04": { es: "Abril", en: "April" },
    "05": { es: "Mayo", en: "May" },
    "06": { es: "Junio", en: "June" },
    "07": { es: "Julio", en: "July" },
    "08": { es: "Agosto", en: "August" },
    "09": { es: "Septiembre", en: "September" },
    "10": { es: "Octubre", en: "October" },
    "11": { es: "Noviembre", en: "November" },
    "12": { es: "Diciembre", en: "December" },
  };
  const nombreMesSeleccionado = MESES_MAP[mesSeleccionado]?.es || "Septiembre";

  const weekRange = useMemo(() => {
    const yr = parseInt(anioSeleccionado, 10) || now.getFullYear();
    const m = parseInt(mesSeleccionado, 10) || (now.getMonth() + 1);
    const w = parseInt(semanaSeleccionada, 10) || 1;
    return getWeekRangeForMonthAndWeek(yr, m, w);
  }, [anioSeleccionado, mesSeleccionado, semanaSeleccionada]);

  // Base de datos de ventas real / offline sincronizada con el Dashboard
  const [sales, setSales] = useState<SaleTransaction[]>(getStoredSales);

  // Escuchar y recargar de localStorage si Dashboard o Registro de Ventas actualiza datos
  useEffect(() => {
    const reloadSales = () => {
      setSales(getStoredSales());
    };
    reloadSales();
    window.addEventListener("storage", reloadSales);
    window.addEventListener("sales_data_updated", reloadSales);
    return () => {
      window.removeEventListener("storage", reloadSales);
      window.removeEventListener("sales_data_updated", reloadSales);
    };
  }, []);

  // Identificador de ventas de UpConta vs Firmas
  const isUpContaSale = (item: SaleTransaction) => {
    const prod = (item.producto || "").toLowerCase();
    const plan = (item.plan || "").toLowerCase();
    return (
      prod.includes("plan") ||
      prod.includes("factura") ||
      prod.includes("erp") ||
      prod.includes("contador") ||
      prod.includes("upconta") ||
      plan.includes("erp") ||
      plan.includes("contador")
    );
  };

  // Ventas base filtradas por empresa y por los asesores pertenecientes al equipo comercial
  const companySales = useMemo(() => {
    return sales.filter((item) => {
      const isUp = isUpContaSale(item);
      const advNorm = normalizeAdviser(item.asesor);
      const belongsToCompany = vendedores.some((v) => {
        const vNorm = normalizeAdviser(v.nombre);
        const vFirstName = vNorm.split(" ")[0];
        return advNorm.includes(v.key) || advNorm.includes(vFirstName);
      });
      if (esUpConta) {
        return isUp && belongsToCompany;
      } else {
        return !isUp && belongsToCompany;
      }
    });
  }, [sales, esUpConta, vendedores]);

  // Ventas de TODO el mes seleccionado
  const salesDelMesCompleto = useMemo(() => {
    const monthInfo = MESES_MAP[mesSeleccionado];
    const prefix = `${anioSeleccionado}-${mesSeleccionado}`;
    return companySales.filter((item) => {
      const f = item.fecha || "";
      if (f.startsWith(prefix)) return true;
      const m = (item.mes || "").toLowerCase();
      if (monthInfo) {
        if (m.includes(monthInfo.en.toLowerCase()) && m.includes(anioSeleccionado)) return true;
        if (m.includes(monthInfo.es.toLowerCase()) && m.includes(anioSeleccionado)) return true;
      }
      return false;
    });
  }, [companySales, mesSeleccionado, anioSeleccionado]);

  // Ventas del período seleccionado (Semana, Mes o Rango)
  const salesDelPeriodo = useMemo(() => {
    if (tipoFiltro === "mes") {
      return salesDelMesCompleto;
    }
    if (tipoFiltro === "semanal") {
      return companySales.filter((item) => {
        const f = item.fecha || "";
        return f >= weekRange.startDate && f <= weekRange.endDate;
      });
    }
    // tipoFiltro === "rango"
    return companySales.filter((item) => {
      const f = item.fecha || "";
      if (fechaDesde && f < fechaDesde) return false;
      if (fechaHasta && f > fechaHasta) return false;
      return true;
    });
  }, [tipoFiltro, salesDelMesCompleto, companySales, weekRange, fechaDesde, fechaHasta]);

  // Métricas automáticas desde Dashboard para Banner 1 y Banner 2
  const totalPeriodoCantidad = salesDelPeriodo.length;
  const totalPeriodoMonto = useMemo(() => {
    return salesDelPeriodo.reduce((acc, s) => acc + getSaleAmount(s), 0);
  }, [salesDelPeriodo]);

  const totalMesCantidad = salesDelMesCompleto.length;
  const totalMesMonto = useMemo(() => {
    return salesDelMesCompleto.reduce((acc, s) => acc + getSaleAmount(s), 0);
  }, [salesDelMesCompleto]);

  // Títulos dinámicos solicitados por el usuario
  const banner1Titulo = useMemo(() => {
    if (tipoFiltro === "semanal") {
      return `VENTAS REGISTRADAS DE LA SEMANA ${semanaSeleccionada} (${weekRange.label.toUpperCase()} DE ${nombreMesSeleccionado.toUpperCase()})`;
    }
    if (tipoFiltro === "mes") {
      return `VENTAS REGISTRADAS TODO ${nombreMesSeleccionado.toUpperCase()} ${anioSeleccionado}`;
    }
    return `VENTAS REGISTRADAS DEL ${fechaDesde} AL ${fechaHasta}`;
  }, [tipoFiltro, semanaSeleccionada, weekRange, nombreMesSeleccionado, fechaDesde, fechaHasta]);

  const banner2Titulo = `VENTAS REGISTRADAS TODO ${nombreMesSeleccionado.toUpperCase()}`;

  const banner3Titulo = useMemo(() => {
    if (tipoFiltro === "semanal") {
      return `VENTAS REGISTRADAS POR FACTURACIÓN ${weekRange.label.toUpperCase()} DE ${nombreMesSeleccionado.toUpperCase()}`;
    }
    if (tipoFiltro === "mes") {
      return `VENTAS REGISTRADAS POR FACTURACIÓN TODO ${nombreMesSeleccionado.toUpperCase()}`;
    }
    return `VENTAS REGISTRADAS POR FACTURACIÓN DEL ${fechaDesde} AL ${fechaHasta}`;
  }, [tipoFiltro, weekRange, nombreMesSeleccionado, fechaDesde, fechaHasta]);

  const banner4Titulo = `VENTAS REGISTRADAS POR FACTURACIÓN TODO ${nombreMesSeleccionado.toUpperCase()}`;

  // -------------------------------------------------------------
  // REGISTRO MANUAL DE FACTURACIÓN (Banners 3 y 4)
  // -------------------------------------------------------------
  interface FacturacionManualState {
    corteCantidad: number;
    corteValor: number;
    mesCantidad: number;
    mesValor: number;
  }

  const storageKeyFacturacion = `reporte_facturacion_manual_${empresa}_${anioSeleccionado}_${mesSeleccionado}_sem${semanaSeleccionada}`;

  const getDefaultFacturacion = (): FacturacionManualState => {
    if (esUpConta) {
      return {
        corteCantidad: 24,
        corteValor: 840.50,
        mesCantidad: 24,
        mesValor: 840.50
      };
    }
    return {
      corteCantidad: 57,
      corteValor: 1619.85,
      mesCantidad: 57,
      mesValor: 1619.85
    };
  };

  const [facturacionManual, setFacturacionManual] = useState<FacturacionManualState>(() => {
    try {
      const saved = localStorage.getItem(storageKeyFacturacion);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return getDefaultFacturacion();
  });

  const [editandoFacturacion, setEditandoFacturacion] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyFacturacion);
      if (saved) {
        setFacturacionManual(JSON.parse(saved));
      } else {
        setFacturacionManual(getDefaultFacturacion());
      }
    } catch (e) {
      setFacturacionManual(getDefaultFacturacion());
    }
  }, [storageKeyFacturacion, empresa]);

  const handleUpdateFacturacion = (key: keyof FacturacionManualState, valStr: string) => {
    const val = parseFloat(valStr);
    const safeVal = isNaN(val) ? 0 : val;
    setFacturacionManual((prev) => {
      const updated = { ...prev, [key]: safeVal };
      try {
        localStorage.setItem(storageKeyFacturacion, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSaveFacturacion = () => {
    try {
      localStorage.setItem(storageKeyFacturacion, JSON.stringify(facturacionManual));
      setGuardadoExito(true);
      setEditandoFacturacion(false);
      setTimeout(() => setGuardadoExito(false), 2000);
    } catch (e) {}
  };

  // -------------------------------------------------------------
  // HOJA: MATRIZ DE MONTO DE VENTAS ($) POR PRODUCTO Y ASESOR
  // -------------------------------------------------------------
  const matrixMontoVentasPorProducto = useMemo(() => {
    const canonical = esUpConta ? CANONICAL_UPCONTA_PRODUCTS : CANONICAL_FIRMAS_PRODUCTS;
    const cleanFn = esUpConta ? getCleanUpContaPlan : getCleanFirmasPlan;

    const amounts: Record<string, Record<string, number> & { total: number }> = {};
    canonical.forEach((p) => {
      amounts[p] = { total: 0 };
      vendedores.forEach((v) => {
        amounts[p][v.key] = 0;
      });
    });

    salesDelPeriodo.forEach((s) => {
      const prodKey = cleanFn(s);
      if (!amounts[prodKey]) {
        amounts[prodKey] = { total: 0 };
        vendedores.forEach((v) => {
          amounts[prodKey][v.key] = 0;
        });
      }

      const advNorm = normalizeAdviser(s.asesor);
      const matched = vendedores.find((v) => {
        const vNorm = normalizeAdviser(v.nombre);
        const vFirstName = vNorm.split(" ")[0];
        return advNorm.includes(v.key) || advNorm.includes(vFirstName);
      });
      const valorVenta = getSaleAmount(s);
      if (matched) {
        amounts[prodKey][matched.key] = (amounts[prodKey][matched.key] || 0) + valorVenta;
        amounts[prodKey].total = (amounts[prodKey].total || 0) + valorVenta;
      }
    });

    const rows = Object.keys(amounts).map((prodKey) => ({
      producto: prodKey,
      adviserAmounts: amounts[prodKey],
      total: amounts[prodKey].total
    }));

    // Ordenar: productos con mayor monto de ventas primero, o por nombre
    rows.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.producto.localeCompare(b.producto);
    });

    const columnTotals: Record<string, number> = { total: 0 };
    vendedores.forEach((v) => {
      columnTotals[v.key] = rows.reduce((acc, r) => acc + (r.adviserAmounts[v.key] || 0), 0);
      columnTotals.total += columnTotals[v.key];
    });

    return { rows, columnTotals };
  }, [salesDelPeriodo, esUpConta, vendedores]);

  // 2. Estado de Embudo de Leads Manual (Matriz: EtapaKey -> VendedorKey -> Cantidad)
  // Iniciado estrictamente en 0 para todos los productos y etapas según requerimiento
  const storageKeyEmbudo = `reporte_embudo_v2_${empresa}_${anioSeleccionado}_${mesSeleccionado}_sem${semanaSeleccionada}`;

  const getInitialEmbudo = () => {
    const initial: Record<string, Record<string, number>> = {};
    ETAPAS_EMBUDO.forEach((etapa) => {
      initial[etapa.key] = {};
      vendedores.forEach((v) => {
        initial[etapa.key][v.key] = 0;
      });
    });
    return initial;
  };

  const [embudoData, setEmbudoData] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem(storageKeyEmbudo);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return getInitialEmbudo();
  });

  // Al cambiar período o empresa, cargar datos guardados si existen o reiniciar en 0
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyEmbudo);
      if (saved) {
        setEmbudoData(JSON.parse(saved));
      } else {
        setEmbudoData(getInitialEmbudo());
      }
    } catch (e) {
      setEmbudoData(getInitialEmbudo());
    }
  }, [storageKeyEmbudo, empresa]);

  const handleCellChange = (etapaKey: string, vendedorKey: string, valStr: string) => {
    const val = parseInt(valStr, 10);
    const safeVal = isNaN(val) || val < 0 ? 0 : val;
    setEmbudoData((prev) => ({
      ...prev,
      [etapaKey]: {
        ...(prev[etapaKey] || {}),
        [vendedorKey]: safeVal
      }
    }));
  };

  const handleSaveEmbudo = () => {
    try {
      localStorage.setItem(storageKeyEmbudo, JSON.stringify(embudoData));
      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetEmbudo = () => {
    const initial = getInitialEmbudo();
    setEmbudoData(initial);
    try {
      localStorage.setItem(storageKeyEmbudo, JSON.stringify(initial));
    } catch (e) {}
  };

  // Cálculos dinámicos del embudo
  const totalesPorEtapa = useMemo(() => {
    const res: Record<string, number> = {};
    ETAPAS_EMBUDO.forEach((etapa) => {
      let sum = 0;
      vendedores.forEach((v) => {
        sum += embudoData[etapa.key]?.[v.key] || 0;
      });
      res[etapa.key] = sum;
    });
    return res;
  }, [embudoData, vendedores]);

  const totalesPorVendedor = useMemo(() => {
    const res: Record<string, number> = {};
    vendedores.forEach((v) => {
      let sum = 0;
      ETAPAS_EMBUDO.forEach((etapa) => {
        sum += embudoData[etapa.key]?.[v.key] || 0;
      });
      res[v.key] = sum;
    });
    return res;
  }, [embudoData, vendedores]);

  const totalGeneralLeads = useMemo(() => {
    return (Object.values(totalesPorEtapa) as number[]).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
  }, [totalesPorEtapa]);

  const totalCerrados = totalesPorEtapa["ganar"] || 0;
  const totalPerdidos = totalesPorEtapa["perder"] || 0;
  const totalPorCerrar = useMemo(() => {
    return ETAPAS_EMBUDO
      .filter((e) => e.enProceso)
      .reduce((acc, e) => acc + (totalesPorEtapa[e.key] || 0), 0);
  }, [totalesPorEtapa]);

  // 3. Indicadores Comerciales Clave
  // - MQL: Total de leads recibidos
  // - SQL: interactuar + presentar + reservar + negociar + pendiente de pago
  // - Hit Rate: % Ganados sobre Total de Leads (ganar / totalLeads * 100)
  // - Lost Rate: % Perdidos sobre Total de Leads (perder / totalLeads * 100)
  const calcularMetricasEmbudo = (data: Record<string, Record<string, number>> | null) => {
    if (!data) {
      return { mql: 0, sql: 0, hitRate: 0, lostRate: 0, totalLeads: 0, ganar: 0, perder: 0 };
    }
    let totalLeads = 0;
    let interactuar = 0;
    let presentar = 0;
    let reservar = 0;
    let negociar = 0;
    let ganar = 0;
    let perder = 0;
    let pendiente_pago = 0;

    ETAPAS_EMBUDO.forEach((etapa) => {
      const stageObj = data[etapa.key] || {};
      const sumStage = Object.values(stageObj).reduce((acc: number, v: number) => acc + (Number(v) || 0), 0);
      totalLeads += sumStage;
      if (etapa.key === "interactuar") interactuar += sumStage;
      else if (etapa.key === "presentar") presentar += sumStage;
      else if (etapa.key === "reservar") reservar += sumStage;
      else if (etapa.key === "negociar") negociar += sumStage;
      else if (etapa.key === "ganar") ganar += sumStage;
      else if (etapa.key === "perder") perder += sumStage;
      else if (etapa.key === "pendiente_pago") pendiente_pago += sumStage;
    });

    const mql = totalLeads;
    const sql = interactuar + presentar + reservar + negociar + pendiente_pago;
    const hitRate = totalLeads > 0 ? (ganar / totalLeads) * 100 : 0;
    const lostRate = totalLeads > 0 ? (perder / totalLeads) * 100 : 0;

    return { mql, sql, hitRate, lostRate, totalLeads, ganar, perder };
  };

  const indicadoresSemanas = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const numSemanas = 5;
    const items: (SemanaIndicador & { totalLeads: number; ganar: number; perder: number })[] = [];

    for (let sem = 1; sem <= numSemanas; sem++) {
      const wRange = getWeekRangeForMonthAndWeek(Number(anioSeleccionado), Number(mesSeleccionado), sem);
      const periodoStr = `${pad(wRange.startDay)}/${mesSeleccionado} - ${pad(wRange.endDay)}/${mesSeleccionado}/${anioSeleccionado}`;

      let dataSemana: Record<string, Record<string, number>> | null = null;
      if (String(sem) === String(semanaSeleccionada)) {
        dataSemana = embudoData;
      } else {
        try {
          const keySem = `reporte_embudo_v2_${empresa}_${anioSeleccionado}_${mesSeleccionado}_sem${sem}`;
          const saved = localStorage.getItem(keySem);
          if (saved) {
            dataSemana = JSON.parse(saved);
          }
        } catch (e) {}
      }

      const metricas = calcularMetricasEmbudo(dataSemana);
      items.push({
        semana: `SEMANA ${sem}`,
        periodo: periodoStr,
        mql: metricas.mql,
        sql: metricas.sql,
        hitRate: metricas.hitRate,
        lostRate: metricas.lostRate,
        totalLeads: metricas.totalLeads,
        ganar: metricas.ganar,
        perder: metricas.perder
      });
    }

    return items;
  }, [anioSeleccionado, mesSeleccionado, semanaSeleccionada, embudoData, empresa]);

  const totalMesIndicadores = useMemo(() => {
    const sumMql = indicadoresSemanas.reduce((acc, s) => acc + s.mql, 0);
    const sumSql = indicadoresSemanas.reduce((acc, s) => acc + s.sql, 0);
    const sumLeads = indicadoresSemanas.reduce((acc, s) => acc + s.totalLeads, 0);
    const sumGanar = indicadoresSemanas.reduce((acc, s) => acc + s.ganar, 0);
    const sumPerder = indicadoresSemanas.reduce((acc, s) => acc + s.perder, 0);

    const hitRate = sumLeads > 0 ? (sumGanar / sumLeads) * 100 : 0;
    const lostRate = sumLeads > 0 ? (sumPerder / sumLeads) * 100 : 0;

    return {
      mql: sumMql,
      sql: sumSql,
      hitRate,
      lostRate,
      totalLeads: sumLeads
    };
  }, [indicadoresSemanas]);

  // Sincronizar datos con el Dashboard en tiempo real
  const handleSincronizarDashboard = () => {
    try {
      const cached = localStorage.getItem("sales_data_db");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSales(parsed);
        }
      }
      setGuardadoExito(true);
      setTimeout(() => setGuardadoExito(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. GENERACIÓN DE PDF OFICIAL (A4 Horizontal / Landscape 297x210mm)
  const handleExportarPDF = () => {
    const pdf = new jsPDF("landscape", "mm", "a4");
    const W = 297;
    const H = 210;

    // Colores corporativos según la empresa:
    // Firmas: Azul [11, 37, 69] y Amarillo [234, 179, 8] (#EAB308)
    // UpConta: Azul [11, 37, 69] y Naranja [234, 88, 12] (#EA580C)
    const primaryRgb: [number, number, number] = [11, 37, 69];
    const accentRgb: [number, number, number] = esUpConta ? [234, 88, 12] : [234, 179, 8];

    // Helper: Dibujar barras decorativas superior e inferior
    const drawDecorations = () => {
      // Barra superior: Azul marino y color de acento
      pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      pdf.rect(0, 0, W, 4.5, "F");
      pdf.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      pdf.rect(10, 4.5, W - 20, 2, "F");

      // Barra inferior: Color de acento y azul marino
      pdf.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      pdf.rect(10, H - 6.5, W - 20, 2, "F");
      pdf.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      pdf.rect(0, H - 4.5, W, 4.5, "F");
    };

    // ==========================================
    // DIAPOSITIVA 1: PORTADA
    // ==========================================
    drawDecorations();

    // Título Grande: REPORTE COMERCIAL
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(38);
    pdf.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    pdf.text("REPORTE", 24, 52);

    pdf.setFontSize(44);
    pdf.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    pdf.text("COMERCIAL", 24, 70);

    // Barra de acento bajo el título
    pdf.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    pdf.rect(24, 76, 120, 3, "F");

    // Subtítulo y Período
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(14);
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${mesAnioTexto}  |  Reporte Mensual`, 24, 94);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`Período: ${periodoTexto}`, 24, 112);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);
    pdf.text(`|   ${nombreEmpresa}`, 115, 112);

    // Pie de página de portada
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Elaborado por: Área Comercial   |   Clasificación: Confidencial", 24, 185);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(11, 37, 69);
    pdf.text(`${mesAnioTexto.replace("-", " ")}`, W - 58, 185);

    // ==========================================
    // DIAPOSITIVA 2: ESTRUCTURA ORGANIZACIONAL
    // ==========================================
    pdf.addPage("a4", "landscape");
    drawDecorations();

    // Título Diapositiva
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Estructura Organizacional Comercial", W / 2, 24, { align: "center" });

    // Tabla de Vendedores
    const startY = 38;
    const colX = [20, 75, 125, 150, 195, W - 20];
    const rowH = 14;

    // Encabezado
    pdf.setFillColor(16, 42, 67); // Azul profundo
    pdf.rect(colX[0], startY, colX[5] - colX[0], 12, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Vendedor", colX[0] + 5, startY + 8);
    pdf.text("Rol Vendedor", colX[1] + 5, startY + 8);
    pdf.text("Cantidad", colX[2] + 4, startY + 8);
    pdf.text("Especialidad", colX[3] + 5, startY + 8);
    pdf.text("Responsabilidad", colX[4] + 5, startY + 8);

    // Filas
    vendedores.forEach((vend, idx) => {
      const y = startY + 12 + idx * rowH;
      // Fondo alternado
      if (idx % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
      } else {
        pdf.setFillColor(241, 245, 249);
      }
      pdf.rect(colX[0], y, colX[5] - colX[0], rowH, "F");

      // Líneas sutiles
      pdf.setDrawColor(226, 232, 240);
      pdf.line(colX[0], y + rowH, colX[5], y + rowH);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(vend.nombre, colX[0] + 5, y + 9);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text(vend.rol, colX[1] + 5, y + 9);

      pdf.setFont("helvetica", "bold");
      pdf.text(`${vend.cantidad}`, colX[2] + 10, y + 9);

      pdf.setFont("helvetica", "normal");
      pdf.text(vend.especialidad, colX[3] + 5, y + 9);
      pdf.text(vend.responsabilidad, colX[4] + 5, y + 9);
    });

    // Banner inferior Naranja
    const bannerY = 158;
    pdf.setFillColor(234, 88, 12);
    pdf.rect(20, bannerY, W - 40, 16, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      `Vendedores: ${vendedores.length} Directos (${vendedores.map(v => v.nombre.split(" ")[0]).join(", ")})`,
      W / 2,
      bannerY + 11,
      { align: "center" }
    );

    // ==========================================
    // DIAPOSITIVA 3: CANTIDAD LEADS POR EMBUDO COMERCIAL
    // (Con las 8 etapas solicitadas: Asignar, interactuar, presentar, reservar, negociar, ganar, perder, pendiente de pago)
    // ==========================================
    pdf.addPage("a4", "landscape");
    drawDecorations();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(15, 23, 42);
    pdf.text("CANTIDAD LEADS POR EMBUDO COMERCIAL", W / 2, 22, { align: "center" });

    // Tabla de Embudo
    const eStartY = 30;
    const numVends = vendedores.length;
    const stageColW = 90;
    const totalColW = 40;
    const vendColW = (W - 40 - stageColW - totalColW) / numVends;
    const eRowH = 9.5;

    // Header de Embudo
    pdf.setFillColor(16, 42, 67);
    pdf.rect(20, eStartY, W - 40, 10, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Lead stage (Etapa)", 25, eStartY + 7);

    vendedores.forEach((v, i) => {
      const vx = 20 + stageColW + i * vendColW;
      pdf.text(v.nombre.split(" ")[0].toUpperCase(), vx + vendColW / 2, eStartY + 7, { align: "center" });
    });

    const totalX = 20 + stageColW + numVends * vendColW;
    pdf.text("Total general", totalX + totalColW / 2, eStartY + 7, { align: "center" });

    // Filas de las 8 etapas
    ETAPAS_EMBUDO.forEach((etapa, idx) => {
      const y = eStartY + 10 + idx * eRowH;

      // Estilo especial para Ganar (verde claro) y Perder (rojo claro)
      if (etapa.key === "ganar") {
        pdf.setFillColor(240, 253, 244); // light green
      } else if (etapa.key === "perder") {
        pdf.setFillColor(254, 242, 242); // light red
      } else if (idx % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252);
      }
      pdf.rect(20, y, W - 40, eRowH, "F");

      // Borde inferior
      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, y + eRowH, W - 20, y + eRowH);

      pdf.setFont("helvetica", etapa.key === "ganar" || etapa.key === "perder" ? "bold" : "normal");
      pdf.setFontSize(9);
      if (etapa.key === "ganar") {
        pdf.setTextColor(22, 101, 52); // green 800
      } else if (etapa.key === "perder") {
        pdf.setTextColor(153, 27, 27); // red 800
      } else {
        pdf.setTextColor(15, 23, 42);
      }
      pdf.text(etapa.label, 25, y + 6.5);

      // Valores por vendedor
      vendedores.forEach((v, vi) => {
        const vx = 20 + stageColW + vi * vendColW;
        const val = embudoData[etapa.key]?.[v.key] || 0;
        pdf.text(`${val}`, vx + vendColW / 2, y + 6.5, { align: "center" });
      });

      // Total fila
      const tRow = totalesPorEtapa[etapa.key] || 0;
      pdf.setFont("helvetica", "bold");
      pdf.text(`${tRow}`, totalX + totalColW / 2, y + 6.5, { align: "center" });
    });

    // Fila Total General
    const totalY = eStartY + 10 + 8 * eRowH;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(20, totalY, W - 40, 10, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Total general", 25, totalY + 7);

    vendedores.forEach((v, vi) => {
      const vx = 20 + stageColW + vi * vendColW;
      const tVend = totalesPorVendedor[v.key] || 0;
      pdf.text(`${tVend}`, vx + vendColW / 2, totalY + 7, { align: "center" });
    });
    pdf.text(`${totalGeneralLeads}`, totalX + totalColW / 2, totalY + 7, { align: "center" });

    // 4 TARJETAS KPI AL PIE (LEADS, CERRADOS, PERDIDOS, POR CERRAR)
    const kpiY = 142;
    const kpiW = (W - 40 - 30) / 4;
    const kpiH = 30;

    const cards = [
      { label: "LEADS", value: totalGeneralLeads, bg: [234, 88, 12] },
      { label: "CERRADOS", value: totalCerrados, bg: [234, 88, 12] },
      { label: "PERDIDOS", value: totalPerdidos, bg: [234, 88, 12] },
      { label: "POR CERRAR", value: totalPorCerrar, bg: [234, 88, 12] }
    ];

    cards.forEach((c, ci) => {
      const cx = 20 + ci * (kpiW + 10);
      pdf.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
      pdf.rect(cx, kpiY, kpiW, kpiH, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${c.value}`, cx + kpiW / 2, kpiY + 13, { align: "center" });

      pdf.setFontSize(11);
      pdf.text(c.label, cx + kpiW / 2, kpiY + 23, { align: "center" });
    });

    // ==========================================
    // DIAPOSITIVA 4: MONTO DE VENTAS POR PRODUCTO Y ASESOR
    // ==========================================
    pdf.addPage("a4", "landscape");
    drawDecorations();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(11, 37, 69);
    pdf.text("MONTO DE VENTAS", W / 2, 22, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Desglose de valores vendidos ($) por tipo de producto y asesor | Período: ${periodoTexto}`, W / 2, 28, { align: "center" });

    const mRows = matrixMontoVentasPorProducto.rows;
    const mTotals = matrixMontoVentasPorProducto.columnTotals;
    const numAdv = vendedores.length;
    const prodColW = esUpConta ? 100 : 85;
    const advColW = esUpConta ? 50 : 40;
    const totColW = esUpConta ? 50 : 40;
    const totalTableW = prodColW + numAdv * advColW + totColW;
    const tableStartX = (W - totalTableW) / 2;
    const tableStartY = 35;
    
    // Scale row height so all rows fit nicely
    const maxRows = mRows.length;
    const availableHeight = 150; // mm
    const mRowH = Math.min(8.0, Math.max(5.6, availableHeight / (maxRows + 2)));

    // Header row
    pdf.setFillColor(16, 42, 67); // Navy #102A43
    pdf.rect(tableStartX, tableStartY, totalTableW, mRowH + 1.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TIPO DE PRODUCTO / PLAN", tableStartX + 5, tableStartY + mRowH * 0.7);

    vendedores.forEach((v, vi) => {
      const vx = tableStartX + prodColW + vi * advColW;
      pdf.text(v.nombre.split(" ")[0].toUpperCase(), vx + advColW / 2, tableStartY + mRowH * 0.7, { align: "center" });
    });

    const totX = tableStartX + prodColW + numAdv * advColW;
    pdf.text("TOTAL ($)", totX + totColW / 2, tableStartY + mRowH * 0.7, { align: "center" });

    // Table rows
    mRows.forEach((r, ri) => {
      const y = tableStartY + mRowH + 1.5 + ri * mRowH;
      if (ri % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252);
      }
      pdf.rect(tableStartX, y, totalTableW, mRowH, "F");

      pdf.setDrawColor(226, 232, 240);
      pdf.line(tableStartX, y + mRowH, tableStartX + totalTableW, y + mRowH);

      pdf.setFont("helvetica", r.total > 0 ? "bold" : "normal");
      pdf.setFontSize(mRowH < 7 ? 7.5 : 8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(r.producto, tableStartX + 5, y + mRowH * 0.7);

      vendedores.forEach((v, vi) => {
        const vx = tableStartX + prodColW + vi * advColW;
        const val = r.adviserAmounts[v.key] || 0;
        pdf.setFont("helvetica", val > 0 ? "bold" : "normal");
        if (val > 0) {
          pdf.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
        } else {
          pdf.setTextColor(148, 163, 184); // Slate 400
        }
        const valStr = val > 0 ? `$ ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$ 0.00";
        pdf.text(valStr, vx + advColW / 2, y + mRowH * 0.7, { align: "center" });
      });

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      const totalStr = `$ ${r.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      pdf.text(totalStr, totX + totColW / 2, y + mRowH * 0.7, { align: "center" });
    });

    // Total row
    const mTotY = tableStartY + mRowH + 1.5 + mRows.length * mRowH;
    pdf.setFillColor(11, 37, 69); // #0B2545
    pdf.rect(tableStartX, mTotY, totalTableW, mRowH + 1.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL GENERAL ($)", tableStartX + 5, mTotY + mRowH * 0.7);

    vendedores.forEach((v, vi) => {
      const vx = tableStartX + prodColW + vi * advColW;
      const val = mTotals[v.key] || 0;
      pdf.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      const advTotalStr = `$ ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      pdf.text(advTotalStr, vx + advColW / 2, mTotY + mRowH * 0.7, { align: "center" });
    });

    pdf.setTextColor(255, 255, 255);
    const grandTotalStr = `$ ${mTotals.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    pdf.text(grandTotalStr, totX + totColW / 2, mTotY + mRowH * 0.7, { align: "center" });

    // ==========================================
    // DIAPOSITIVA 5: INDICADORES COMERCIALES CLAVE (AL FINAL)
    // ==========================================
    pdf.addPage("a4", "landscape");
    drawDecorations();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(15, 23, 42);
    pdf.text("INDICADORES COMERCIALES CLAVE", W / 2, 22, { align: "center" });

    // Tabla de Indicadores Semanales
    const indStartY = 30;
    const iColX = [30, 75, 140, 175, 205, 240, W - 30];
    const iRowH = 8;

    pdf.setFillColor(16, 42, 67);
    pdf.rect(iColX[0], indStartY, iColX[6] - iColX[0], 9, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Semana", iColX[0] + 5, indStartY + 6);
    pdf.text("Período", iColX[1] + 5, indStartY + 6);
    pdf.text("MQL", iColX[2] + 5, indStartY + 6);
    pdf.text("SQL", iColX[3] + 5, indStartY + 6);
    pdf.text("HIT RATE", iColX[4] + 3, indStartY + 6);
    pdf.text("LOST RATE", iColX[5] + 3, indStartY + 6);

    indicadoresSemanas.forEach((sem, sIdx) => {
      const y = indStartY + 9 + sIdx * iRowH;
      if (sIdx % 2 === 0) {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(248, 250, 252);
      }
      pdf.rect(iColX[0], y, iColX[6] - iColX[0], iRowH, "F");

      pdf.setDrawColor(226, 232, 240);
      pdf.line(iColX[0], y + iRowH, iColX[6], y + iRowH);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(sem.semana, iColX[0] + 5, y + 5.5);
      pdf.text(sem.periodo, iColX[1] + 5, y + 5.5);
      pdf.text(`${sem.mql}`, iColX[2] + 8, y + 5.5);
      pdf.text(`${sem.sql}`, iColX[3] + 8, y + 5.5);
      pdf.text(`${sem.hitRate.toFixed(1)}%`, iColX[4] + 5, y + 5.5);
      pdf.text(`${sem.lostRate.toFixed(1)}%`, iColX[5] + 5, y + 5.5);
    });

    // Fila Total Mes
    const totIndY = indStartY + 9 + indicadoresSemanas.length * iRowH;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(iColX[0], totIndY, iColX[6] - iColX[0], 9, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text("Total mes", iColX[1] + 5, totIndY + 6);

    pdf.text(`${totalMesIndicadores.mql}`, iColX[2] + 8, totIndY + 6);
    pdf.text(`${totalMesIndicadores.sql}`, iColX[3] + 8, totIndY + 6);
    pdf.text(`${totalMesIndicadores.hitRate.toFixed(1)}%`, iColX[4] + 5, totIndY + 6);
    pdf.text(`${totalMesIndicadores.lostRate.toFixed(1)}%`, iColX[5] + 5, totIndY + 6);

    // 4 BANNERS HORIZONTALES DE INDICADORES FINANCIEROS (AL FINAL)
    const bStartY = 96;
    const bRowH = 17;
    const bW = W - 60;
    const banners = [
      {
        count: totalPeriodoCantidad,
        text: banner1Titulo,
        val: totalPeriodoMonto
      },
      {
        count: totalMesCantidad,
        text: banner2Titulo,
        val: totalMesMonto
      },
      {
        count: facturacionManual.corteCantidad,
        text: banner3Titulo,
        val: facturacionManual.corteValor
      },
      {
        count: facturacionManual.mesCantidad,
        text: banner4Titulo,
        val: facturacionManual.mesValor
      }
    ];

    banners.forEach((b, bi) => {
      const by = bStartY + bi * (bRowH + 4);

      // Barra Azul Marino
      pdf.setFillColor(11, 37, 69);
      pdf.rect(30, by, bW, bRowH, "F");

      // Número izquierdo
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${b.count}`, 45, by + 11.5);

      // Texto central
      pdf.setFontSize(10.5);
      pdf.text(b.text, 68, by + 11.5);

      // Valor en Dólares a la derecha (Color de Acento: Naranja o Amarillo)
      pdf.setFontSize(16);
      pdf.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      pdf.text(`$ ${b.val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, W - 42, by + 11.5, { align: "right" });
    });

    // Guardar archivo
    const safePeriodo = periodoTexto.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    pdf.save(`Reporte_Comercial_${empresa.toUpperCase()}_${safePeriodo}.pdf`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR DE CONTROL Y FILTROS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Título & Insignia de Empresa */}
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${theme.accentBadgeBg} ${theme.accentBadgeText} border ${theme.accentLightBorder}`}>
                Módulo Gerencial 0000
              </span>
              <span className="text-xs text-slate-500 font-bold">
                Presentación y Reporte Oficial
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B2545] mt-1 flex items-center gap-2">
              <BarChart3 className={`w-6 h-6 ${theme.accentText}`} />
              <span>Reporte Comercial {esUpConta ? "UpConta" : "Firmas Electrónicas"}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Formato de presentación de diapositivas corporativas con embudo editable y exportación directa en PDF.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSincronizarDashboard}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Actualizar métricas de ventas desde el Dashboard"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${theme.accentText}`} />
              <span>Sincronizar con Dashboard</span>
            </button>

            <button
              onClick={handleSaveEmbudo}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                guardadoExito
                  ? "bg-emerald-600 text-white"
                  : "bg-[#0B2545] hover:bg-[#103460] text-white"
              }`}
            >
              {guardadoExito ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡Datos Guardados!</span>
                </>
              ) : (
                <>
                  <Save className={`w-3.5 h-3.5 ${esUpConta ? "text-orange-400" : "text-amber-300"}`} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportarPDF}
              className={`px-4 py-2 ${
                esUpConta
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20"
                  : "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 shadow-amber-400/20 font-black"
              } rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Descargar PDF</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros (Semanal, Por Mes, Por Rango) */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Tipo de Filtro */}
          <div className="md:col-span-4 flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTipoFiltro("semanal")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all text-center cursor-pointer ${
                tipoFiltro === "semanal"
                  ? "bg-[#0B2545] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setTipoFiltro("mes")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all text-center cursor-pointer ${
                tipoFiltro === "mes"
                  ? "bg-[#0B2545] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Por Mes
            </button>
            <button
              onClick={() => setTipoFiltro("rango")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all text-center cursor-pointer ${
                tipoFiltro === "rango"
                  ? "bg-[#0B2545] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Por Rango
            </button>
          </div>

          {/* Opciones según tipo de filtro */}
          <div className="md:col-span-5 flex items-center gap-2">
            {tipoFiltro === "semanal" && (
              <div className="flex items-center gap-2 w-full">
                <select
                  value={semanaSeleccionada}
                  onChange={(e) => setSemanaSeleccionada(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer flex-1`}
                >
                  {[1, 2, 3, 4, 5].map((w) => {
                    const r = getWeekRangeForMonthAndWeek(Number(anioSeleccionado), Number(mesSeleccionado), w);
                    return (
                      <option key={w} value={String(w)}>
                        Semana {w} (Lunes a Domingo): {r.label}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer w-28`}
                >
                  <option value="01">Enero</option>
                  <option value="02">Febrero</option>
                  <option value="03">Marzo</option>
                  <option value="04">Abril</option>
                  <option value="05">Mayo</option>
                  <option value="06">Junio</option>
                  <option value="07">Julio</option>
                  <option value="08">Agosto</option>
                  <option value="09">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>

                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer w-20`}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            )}

            {tipoFiltro === "mes" && (
              <div className="flex items-center gap-2 w-full">
                <select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer flex-1`}
                >
                  <option value="01">Enero</option>
                  <option value="02">Febrero</option>
                  <option value="03">Marzo</option>
                  <option value="04">Abril</option>
                  <option value="05">Mayo</option>
                  <option value="06">Junio</option>
                  <option value="07">Julio</option>
                  <option value="08">Agosto</option>
                  <option value="09">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>

                <select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer w-24`}
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            )}

            {tipoFiltro === "rango" && (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer flex-1`}
                />
                <span className="text-xs text-slate-400 font-bold">a</span>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none ${theme.focusBorder} cursor-pointer flex-1`}
                />
              </div>
            )}
          </div>

          {/* Resumen del Período */}
          <div className="md:col-span-3 text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Período Activo:
            </span>
            <span className={`text-xs font-black text-[#0B2545] ${theme.accentLightBg} px-2.5 py-1 rounded-lg border ${theme.accentLightBorder} inline-block`}>
              {periodoTexto}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DIAPOSITIVAS EN FORMATO EXACTO (COMO EN EL PDF) */}
      {/* ========================================================================= */}

      {/* -------------------- DIAPOSITIVA 1: PORTADA -------------------- */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden relative">
        {/* Rayas de diseño superior */}
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
        <div className={`h-1 ${theme.accentBg} mx-4`}></div>

        <div className="p-8 sm:p-14 min-h-[340px] flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h1 className={`text-4xl sm:text-5xl font-black ${theme.accentText} tracking-tight leading-none`}>
                REPORTE
              </h1>
              <h1 className="text-4xl sm:text-5xl font-black text-[#0B2545] tracking-tight leading-none mt-1">
                COMERCIAL
              </h1>
              <div className={`w-48 h-1.5 ${theme.accentBg} mt-4`}></div>
            </div>

            <div className="pt-4 space-y-1">
              <p className="text-sm font-semibold italic text-slate-500">
                {mesAnioTexto} | Reporte Mensual
              </p>
              <p className="text-base font-bold text-slate-800">
                Período: <span className="text-black">{periodoTexto}</span>{" "}
                <span className="text-slate-400 font-normal">|</span>{" "}
                <span className="text-slate-600">{nombreEmpresa}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-10 text-xs text-slate-500 border-t border-slate-100 gap-2">
            <div>
              Elaborado por: <span className="font-bold text-slate-700">Área Comercial</span> | Clasificación: <span className="font-bold text-slate-700">Confidencial</span>
            </div>
            <div className="font-bold text-[#0B2545] capitalize">
              {mesAnioTexto.replace("-", " ")}
            </div>
          </div>
        </div>

        {/* Rayas de diseño inferior */}
        <div className={`h-1 ${theme.accentBg} mx-4`}></div>
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
      </div>

      {/* -------------------- DIAPOSITIVA 2: ESTRUCTURA ORGANIZACIONAL -------------------- */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden relative">
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
        <div className={`h-1 ${theme.accentBg} mx-4`}></div>

        <div className="p-6 sm:p-10 space-y-6">
          <h3 className="text-center text-xl sm:text-2xl font-black text-slate-900">
            Estructura Organizacional Comercial
          </h3>

          {/* Tabla de Vendedores */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white text-xs font-black tracking-wider">
                  <th className="py-3 px-4">Vendedor</th>
                  <th className="py-3 px-4">Rol Vendedor</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4">Especialidad</th>
                  <th className="py-3 px-4">Responsabilidad</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-medium text-slate-700">
                {vendedores.map((vend, idx) => (
                  <tr key={vend.key} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {vend.nombre}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      {vend.rol}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {vend.cantidad}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">
                      {vend.especialidad}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {vend.responsabilidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Banner Inferior */}
          <div className={`${esUpConta ? "bg-orange-600 text-white" : "bg-amber-400 text-slate-950 font-black"} rounded-xl py-4 px-6 text-center shadow-sm`}>
            <h4 className="text-base sm:text-lg font-black tracking-wide">
              Vendedores: {vendedores.length} Directos ({vendedores.map(v => v.nombre.split(" ")[0]).join(", ")})
            </h4>
          </div>
        </div>

        <div className={`h-1 ${theme.accentBg} mx-4`}></div>
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
      </div>

      {/* -------------------- DIAPOSITIVA 3: CANTIDAD LEADS POR EMBUDO COMERCIAL -------------------- */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden relative">
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
        <div className={`h-1 ${theme.accentBg} mx-4`}></div>

        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              CANTIDAD LEADS POR EMBUDO COMERCIAL
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <Edit3 className={`w-3 h-3 ${theme.accentText}`} />
                <span>Celdas editables manualmente</span>
              </span>
              <button
                onClick={handleResetEmbudo}
                className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                title="Poner todos los leads en 0"
              >
                Poner en Cero (0)
              </button>
            </div>
          </div>

          {/* Tabla de Embudo Comercial Editable */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white text-xs font-black tracking-wider">
                  <th className="py-3 px-4">Lead stage (Etapa)</th>
                  {vendedores.map((v) => (
                    <th key={v.key} className="py-3 px-4 text-center">
                      {v.nombre.split(" ")[0].toUpperCase()}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center">Total general</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-medium text-slate-700">
                {ETAPAS_EMBUDO.map((etapa, idx) => {
                  const isGanar = etapa.key === "ganar";
                  const isPerder = etapa.key === "perder";

                  return (
                    <tr
                      key={etapa.key}
                      className={
                        isGanar
                          ? "bg-emerald-50/60 font-bold"
                          : isPerder
                          ? "bg-rose-50/60 font-bold"
                          : idx % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center justify-between">
                        <span className={isGanar ? "text-emerald-800" : isPerder ? "text-rose-800" : "text-slate-800"}>
                          {etapa.label}
                        </span>
                        {isGanar && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-black">
                            Cerrado
                          </span>
                        )}
                        {isPerder && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 font-black">
                            Perdido
                          </span>
                        )}
                      </td>

                      {/* Input por Vendedor */}
                      {vendedores.map((v) => {
                        const currentVal = embudoData[etapa.key]?.[v.key] ?? 0;
                        return (
                          <td key={v.key} className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={currentVal}
                              onChange={(e) => handleCellChange(etapa.key, v.key, e.target.value)}
                              className={`w-20 text-center py-1 px-2 rounded-lg font-bold text-xs border focus:outline-none focus:ring-2 transition-all ${
                                isGanar
                                  ? "bg-white border-emerald-300 text-emerald-900 focus:ring-emerald-400"
                                  : isPerder
                                  ? "bg-white border-rose-300 text-rose-900 focus:ring-rose-400"
                                  : `bg-white border-slate-200 text-slate-900 ${theme.focusBorder}`
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Total Fila */}
                      <td className="py-2.5 px-4 text-center font-black text-slate-900 text-sm">
                        {totalesPorEtapa[etapa.key] || 0}
                      </td>
                    </tr>
                  );
                })}

                {/* Fila Total General */}
                <tr className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-4 uppercase">Total general</td>
                  {vendedores.map((v) => (
                    <td key={v.key} className="py-3 px-4 text-center text-sm">
                      {totalesPorVendedor[v.key] || 0}
                    </td>
                  ))}
                  <td className={`py-3 px-4 text-center text-base ${theme.accentText} font-black`}>
                    {totalGeneralLeads}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4 TARJETAS KPI AL PIE (LEADS, CERRADOS, PERDIDOS, POR CERRAR) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className={`${esUpConta ? "bg-orange-600 text-white" : "bg-amber-400 text-slate-950"} p-4 rounded-xl text-center shadow-xs font-black`}>
              <span className="text-2xl sm:text-3xl font-black block leading-none">
                {totalGeneralLeads}
              </span>
              <span className="text-xs font-black uppercase tracking-wider mt-2 block">
                LEADS
              </span>
            </div>

            <div className={`${esUpConta ? "bg-orange-600 text-white" : "bg-amber-400 text-slate-950"} p-4 rounded-xl text-center shadow-xs font-black`}>
              <span className="text-2xl sm:text-3xl font-black block leading-none">
                {totalCerrados}
              </span>
              <span className="text-xs font-black uppercase tracking-wider mt-2 block">
                CERRADOS
              </span>
            </div>

            <div className={`${esUpConta ? "bg-orange-600 text-white" : "bg-amber-400 text-slate-950"} p-4 rounded-xl text-center shadow-xs font-black`}>
              <span className="text-2xl sm:text-3xl font-black block leading-none">
                {totalPerdidos}
              </span>
              <span className="text-xs font-black uppercase tracking-wider mt-2 block">
                PERDIDOS
              </span>
            </div>

            <div className={`${esUpConta ? "bg-orange-600 text-white" : "bg-amber-400 text-slate-950"} p-4 rounded-xl text-center shadow-xs font-black`}>
              <span className="text-2xl sm:text-3xl font-black block leading-none">
                {totalPorCerrar}
              </span>
              <span className="text-xs font-black uppercase tracking-wider mt-2 block">
                POR CERRAR
              </span>
            </div>
          </div>
        </div>

        <div className={`h-1 ${theme.accentBg} mx-4`}></div>
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
      </div>

      {/* -------------------- DIAPOSITIVA 4: MONTO DE VENTAS ($) -------------------- */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden relative">
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
        <div className={`h-1 ${theme.accentBg} mx-4`}></div>

        <div className="p-6 sm:p-10 space-y-6">
          {/* Header de la Diapositiva 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <FileSpreadsheet className={`w-6 h-6 ${theme.accentText}`} />
                <span>MONTO DE VENTAS</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Desglose de valores vendidos ($) por tipo de producto y asesor | Período: <span className="font-bold text-slate-800">{periodoTexto}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Total Monto Vendido:{" "}
                <span className={`${theme.accentText} font-black ml-1 font-mono`}>
                  $ {matrixMontoVentasPorProducto.columnTotals.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </span>
            </div>
          </div>

          {/* Matriz: Filas = Producto/Plan, Columnas = Vendedores */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#102A43] text-white">
                    <th className="py-3 px-4 font-black uppercase tracking-wider text-xs">
                      TIPO DE PRODUCTO / PLAN
                    </th>
                    {vendedores.map((v) => (
                      <th
                        key={v.key}
                        className="py-3 px-4 font-black uppercase tracking-wider text-xs text-center border-l border-slate-700"
                      >
                        <div className="font-bold">{v.nombre.split(" ")[0]}</div>
                        <div className={`text-[10px] ${esUpConta ? "text-orange-300" : "text-amber-300"} font-normal`}>{v.rol}</div>
                      </th>
                    ))}
                    <th className="py-3 px-4 font-black uppercase tracking-wider text-xs text-center border-l border-slate-700 bg-[#0B2545]">
                      TOTAL ($)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixMontoVentasPorProducto.rows.map((row, idx) => {
                    const tieneVentas = row.total > 0;
                    return (
                      <tr
                        key={row.producto}
                        className={`transition-colors ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                        } hover:bg-slate-100/60`}
                      >
                        <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tieneVentas ? theme.accentBg : "bg-slate-300"
                            }`}
                          ></span>
                          <span className={tieneVentas ? "font-bold text-slate-900" : "text-slate-600"}>
                            {row.producto}
                          </span>
                        </td>

                        {vendedores.map((v) => {
                          const val = row.adviserAmounts[v.key] || 0;
                          return (
                            <td
                              key={v.key}
                              className="py-2.5 px-4 text-center border-l border-slate-100 font-mono"
                            >
                              {val > 0 ? (
                                <span className={`inline-block px-2.5 py-0.5 rounded-md ${theme.accentBadgeBg} ${theme.accentBadgeText} font-bold border ${theme.accentLightBorder}`}>
                                  $ {val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-normal">$ 0.00</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-2.5 px-4 text-center border-l border-slate-100 font-mono font-black text-slate-900 bg-slate-50/50">
                          {row.total > 0 ? (
                            <span className="text-slate-900 font-black">
                              $ {row.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">$ 0.00</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Fila Total General */}
                  <tr className="bg-[#0B2545] text-white font-black">
                    <td className="py-3 px-4 font-black tracking-wider text-xs">
                      TOTAL GENERAL ($)
                    </td>
                    {vendedores.map((v) => (
                      <td
                        key={v.key}
                        className="py-3 px-4 text-center border-l border-slate-700 font-mono text-xs text-white"
                      >
                        $ {(matrixMontoVentasPorProducto.columnTotals[v.key] || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    ))}
                    <td className={`py-3 px-4 text-center border-l border-slate-700 font-mono text-sm ${theme.bannerValText} bg-[#071a33]`}>
                      $ {matrixMontoVentasPorProducto.columnTotals.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Nota de sincronización */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Matriz actualizada dinámicamente con montos en dólares ($) según las ventas del CRM.
            </span>
            <span className="font-bold text-slate-600">
              {esUpConta ? "Asesores: Karla Haro y David Santander" : "Asesoras: Evelyn, Ismenia y Salomé"}
            </span>
          </div>
        </div>

        <div className={`h-1 ${theme.accentBg} mx-4`}></div>
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
      </div>

      {/* -------------------- DIAPOSITIVA 5: INDICADORES COMERCIALES CLAVE -------------------- */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden relative">
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
        <div className={`h-1 ${theme.accentBg} mx-4`}></div>

        <div className="p-6 sm:p-10 space-y-6">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              INDICADORES COMERCIALES CLAVE
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 max-w-3xl mx-auto">
              <span className="font-bold text-slate-700">MQL:</span> Total de leads recibidos |{" "}
              <span className="font-bold text-slate-700">SQL:</span> Leads calificados (Interactuar, Presentar, Reservar, Negociar y Pendiente de pago) |{" "}
              <span className="font-bold text-emerald-700">Hit Rate:</span> % Ganado / Total Leads |{" "}
              <span className="font-bold text-rose-700">Lost Rate:</span> % Perdido / Total Leads
            </p>
          </div>

          {/* Tabla de Indicadores Semanales */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#102A43] text-white text-xs font-black tracking-wider">
                  <th className="py-3 px-4">Semana</th>
                  <th className="py-3 px-4">Período</th>
                  <th className="py-3 px-4 text-center">MQL</th>
                  <th className="py-3 px-4 text-center">SQL</th>
                  <th className="py-3 px-4 text-center">HIT RATE</th>
                  <th className="py-3 px-4 text-center">LOST RATE</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100 font-medium text-slate-700">
                {indicadoresSemanas.map((sem, sIdx) => (
                  <tr key={sem.semana} className={sIdx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="py-2.5 px-4 font-black text-slate-900">{sem.semana}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-semibold">{sem.periodo}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800">{sem.mql}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800">{sem.sql}</td>
                    <td className="py-2.5 px-4 text-center font-black text-emerald-700">{sem.hitRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-center font-black text-rose-700">{sem.lostRate.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-black text-xs text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-4 uppercase">Total mes</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-center font-black">
                    {totalMesIndicadores.mql}
                  </td>
                  <td className="py-3 px-4 text-center font-black">
                    {totalMesIndicadores.sql}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-800 font-black">
                    {totalMesIndicadores.hitRate.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center text-rose-800 font-black">
                    {totalMesIndicadores.lostRate.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* BANNERS INFERIORES DE VENTAS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Resumen Comparativo de Ventas y Facturación
              </span>
              <button
                onClick={() => {
                  if (editandoFacturacion) {
                    handleSaveFacturacion();
                  } else {
                    setEditandoFacturacion(true);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  editandoFacturacion
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {editandoFacturacion ? (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Guardar Facturación Manual</span>
                  </>
                ) : (
                  <>
                    <Edit3 className={`w-3 h-3 ${theme.accentText}`} />
                    <span>Editar Facturación Manual</span>
                  </>
                )}
              </button>
            </div>

            {/* BANNER 1: CRM Cerradas de la Semana / Período (Actualizado desde Dashboard) */}
            <div className="bg-[#0B2545] text-white p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm border border-slate-700/50">
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <span className={`text-xl sm:text-2xl font-black ${theme.bannerValText} font-mono w-10 text-center shrink-0`}>
                  {totalPeriodoCantidad}
                </span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide truncate block">
                    {banner1Titulo}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                    ● Sincronizado con Dashboard (CRM Cerradas)
                  </span>
                </div>
              </div>
              <div className={`text-base sm:text-xl font-black ${theme.bannerValText} font-mono shrink-0`}>
                $ {totalPeriodoMonto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* BANNER 2: Ventas Registradas TODO el Mes (Actualizado desde Dashboard) */}
            <div className="bg-[#0B2545] text-white p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm border border-slate-700/50">
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <span className={`text-xl sm:text-2xl font-black ${theme.bannerValText} font-mono w-10 text-center shrink-0`}>
                  {totalMesCantidad}
                </span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide truncate block">
                    {banner2Titulo}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">
                    ● Total Acumulado Mes ({nombreMesSeleccionado})
                  </span>
                </div>
              </div>
              <div className={`text-base sm:text-xl font-black ${theme.bannerValText} font-mono shrink-0`}>
                $ {totalMesMonto.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* BANNER 3: Ventas por Facturación Corte (Registro Manual) */}
            <div className="bg-[#0B2545] text-white p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm border border-slate-700/50">
              <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                {editandoFacturacion ? (
                  <input
                    type="number"
                    value={facturacionManual.corteCantidad}
                    onChange={(e) => handleUpdateFacturacion("corteCantidad", e.target.value)}
                    className={`w-16 bg-slate-800 border ${theme.accentLightBorder} rounded-lg px-2 py-1 text-base font-black ${theme.bannerValText} font-mono text-center focus:outline-none shrink-0`}
                  />
                ) : (
                  <span className={`text-xl sm:text-2xl font-black ${theme.bannerValText} font-mono w-10 text-center shrink-0`}>
                    {facturacionManual.corteCantidad}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide truncate block">
                    {banner3Titulo}
                  </span>
                  <span className={`text-[10px] ${esUpConta ? "text-orange-300" : "text-amber-300"} font-bold block uppercase tracking-wider`}>
                    ★ Registro Manual Facturación
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {editandoFacturacion ? (
                  <div className="flex items-center gap-1">
                    <span className={`${theme.accentText} font-bold font-mono`}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={facturacionManual.corteValor}
                      onChange={(e) => handleUpdateFacturacion("corteValor", e.target.value)}
                      className={`w-28 bg-slate-800 border ${theme.accentLightBorder} rounded-lg px-2 py-1 text-sm font-black ${theme.bannerValText} font-mono text-right focus:outline-none`}
                    />
                  </div>
                ) : (
                  <div className={`text-base sm:text-xl font-black ${theme.bannerValText} font-mono`}>
                    $ {facturacionManual.corteValor.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>

            {/* BANNER 4: Ventas por Facturación TODO el Mes (Registro Manual) */}
            <div className="bg-[#0B2545] text-white p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm border border-slate-700/50">
              <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                {editandoFacturacion ? (
                  <input
                    type="number"
                    value={facturacionManual.mesCantidad}
                    onChange={(e) => handleUpdateFacturacion("mesCantidad", e.target.value)}
                    className={`w-16 bg-slate-800 border ${theme.accentLightBorder} rounded-lg px-2 py-1 text-base font-black ${theme.bannerValText} font-mono text-center focus:outline-none shrink-0`}
                  />
                ) : (
                  <span className={`text-xl sm:text-2xl font-black ${theme.bannerValText} font-mono w-10 text-center shrink-0`}>
                    {facturacionManual.mesCantidad}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wide truncate block">
                    {banner4Titulo}
                  </span>
                  <span className={`text-[10px] ${esUpConta ? "text-orange-300" : "text-amber-300"} font-bold block uppercase tracking-wider`}>
                    ★ Registro Manual Facturación
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {editandoFacturacion ? (
                  <div className="flex items-center gap-1">
                    <span className={`${theme.accentText} font-bold font-mono`}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={facturacionManual.mesValor}
                      onChange={(e) => handleUpdateFacturacion("mesValor", e.target.value)}
                      className={`w-28 bg-slate-800 border ${theme.accentLightBorder} rounded-lg px-2 py-1 text-sm font-black ${theme.bannerValText} font-mono text-right focus:outline-none`}
                    />
                  </div>
                ) : (
                  <div className={`text-base sm:text-xl font-black ${theme.bannerValText} font-mono`}>
                    $ {facturacionManual.mesValor.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`h-1 ${theme.accentBg} mx-4`}></div>
        <div className="h-1.5 bg-[#0B2545] w-full"></div>
      </div>
    </div>
  );
}
