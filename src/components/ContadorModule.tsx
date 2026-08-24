import React, { useState } from "react";
import { 
  Calculator, 
  Send, 
  Sparkles, 
  Building2, 
  Layers, 
  CheckCircle2, 
  DollarSign, 
  Award, 
  ShieldCheck, 
  Users, 
  FileText,
  FileDown,
  Printer,
  MessageSquare,
  HelpCircle,
  Briefcase,
  TrendingUp,
  Boxes
} from "lucide-react";
import { jsPDF } from "jspdf";

interface Asesor {
  nombre: string;
  telefono: string;
}

const ASESORES: Record<string, Asesor> = {
  salome: { nombre: "Salomé Estrella", telefono: "593990388493" },
  karla: { nombre: "Karla Haro", telefono: "593989347443" },
  ismenia: { nombre: "Ismenia Escalona", telefono: "593999122519" },
  evelyn: { nombre: "Evelyn Narváez", telefono: "593981947894" },
  david: { nombre: "David Santander", telefono: "593980690459" },
};

export function ContadorModule() {
  // Form state
  const [asesorKey, setAsesorKey] = useState<string>("");
  const [tipoEmpresaBase, setTipoEmpresaBase] = useState<string>("0");

  // Facturación e Inventarios
  const [cant70, setCant70] = useState<number>(0);
  const [cant500, setCant500] = useState<number>(0);
  const [cantIlim, setCantIlim] = useState<number>(0);

  // Módulos Corporativos
  const [mTesoreriaCant, setMTesoreriaCant] = useState<number>(0);
  const [mNominaCant, setMNominaCant] = useState<number>(0);
  const [mActivosCant, setMActivosCant] = useState<number>(0);
  const [mRestaurantesCant, setMRestaurantesCant] = useState<number>(0);
  const [mContabilidadCant, setMContabilidadCant] = useState<number>(0);

  // Prices
  const getBaseEmpresasPrice = (tipo: string): number => {
    switch (tipo) {
      case "1": return 50;
      case "3": return 100;
      case "6": return 150;
      case "10": return 200;
      case "tax_ilimitado": return 100;
      case "ilimitadas": return 300;
      default: return 0;
    }
  };

  const precioBaseEmpresas = getBaseEmpresasPrice(tipoEmpresaBase);

  // Facturación packages total
  const totalComprobantes = (cant70 * 10) + (cant500 * 25) + (cantIlim * 55);

  // Módulos corporativos total
  const totalModulosCantidad = mTesoreriaCant + mNominaCant + mActivosCant + mRestaurantesCant + mContabilidadCant;
  const totalModulos = totalModulosCantidad * 75;

  // Subtotal, IVA, Total
  const subtotal = precioBaseEmpresas + totalComprobantes + totalModulos;
  const iva = subtotal * 0.15;
  const totalAnual = subtotal + iva;

  // Quantity counts
  const totalPlanesFactura = cant70 + cant500 + cantIlim;

  // Exact Calculation Rule logic requested by user:
  // "donde solo si la cantidad de planes de facturacion son mayores a los adicionales, estos planes de facturacion se suman y se dividen para el total,
  // en el caso que los adicionales sean mayores a los planes de facturación, solo divides la cantidad maxima para el total"
  let divisor = 0;
  let descPromedio = "";

  if (tipoEmpresaBase === "tax_ilimitado") {
    if (totalPlanesFactura > totalModulosCantidad) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor promedio anual por cada uno de tus ${divisor} planes de facturación`;
    } else if (totalModulosCantidad > totalPlanesFactura) {
      divisor = totalModulosCantidad;
      descPromedio = `Valor por cada uno de tus ${divisor} módulos corporativos`;
    } else if (totalPlanesFactura > 0 && totalPlanesFactura === totalModulosCantidad) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor promedio anual por cada uno de tus ${divisor} ítems contratados`;
    } else {
      divisor = 0;
      descPromedio = "Agrega planes de facturación o módulos corporativos para calcular";
    }
  } else if (tipoEmpresaBase === "ilimitadas") {
    if (totalPlanesFactura > totalModulosCantidad) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor por cada uno de tus ${divisor} planes de facturación. (Empresas contables ilimitadas)`;
    } else if (totalModulosCantidad > totalPlanesFactura) {
      divisor = totalModulosCantidad;
      descPromedio = `Valor por cada uno de tus ${divisor} módulos corporativos. (Empresas contables ilimitadas)`;
    } else if (totalPlanesFactura > 0 && totalPlanesFactura === totalModulosCantidad) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor por cada uno de tus ${divisor} ítems contratados. (Empresas contables ilimitadas)`;
    } else {
      divisor = 0;
      descPromedio = "Agrega planes de facturación o módulos corporativos. ¡Empresas bases sin costo extra!";
    }
  } else if (["1", "3", "6", "10"].includes(tipoEmpresaBase)) {
    const numEmpresas = parseInt(tipoEmpresaBase, 10);
    if (totalPlanesFactura > totalModulosCantidad && totalPlanesFactura > numEmpresas) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor promedio anual por cada uno de tus ${divisor} planes de facturación`;
    } else if (totalModulosCantidad > totalPlanesFactura && totalModulosCantidad > numEmpresas) {
      divisor = totalModulosCantidad;
      descPromedio = `Valor promedio por cada uno de tus ${divisor} módulos corporativos`;
    } else {
      divisor = numEmpresas;
      descPromedio = `Valor de tu plan base dividido entre las ${numEmpresas} empresas incluidas`;
    }
  } else {
    if (totalPlanesFactura > totalModulosCantidad) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor promedio por cada uno de tus ${divisor} planes de facturación`;
    } else if (totalModulosCantidad > totalPlanesFactura) {
      divisor = totalModulosCantidad;
      descPromedio = `Valor promedio por cada uno de tus ${divisor} módulos corporativos`;
    } else if (totalPlanesFactura > 0) {
      divisor = totalPlanesFactura;
      descPromedio = `Valor por cada uno de tus ${divisor} ítems contratados`;
    } else {
      divisor = 0;
      descPromedio = "Selecciona un plan base o módulos para calcular";
    }
  }

  const valPromedio = divisor > 0 ? totalAnual / divisor : 0;

  const formatMoney = (val: number) => {
    return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // OFFICIAL TECHNICAL SHEET PDF GENERATION FOR PLAN CONTADOR
  const handleGenerarFichaPlanContadorPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MX = 14;
    const CONTENT_W = PAGE_W - (MX * 2); // 182mm

    // Draw clean white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PAGE_W, PAGE_H, "F");

    // Top Header: UpConta Logo on Left
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 520;
      canvas.height = 130;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 520, 130);
        ctx.font = "900 102px system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif";
        ctx.fillStyle = "#FF5500";
        ctx.fillText("Up", 10, 92);

        ctx.fillStyle = "#0B2545";
        ctx.fillText("Conta", 152, 92);

        ctx.save();
        ctx.translate(426, 12);
        ctx.strokeStyle = "#FF5500";
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(12, 50);
        ctx.lineTo(52, 50);
        ctx.arcTo(68, 50, 68, 34, 16);
        ctx.lineTo(68, 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(50, 22);
        ctx.lineTo(68, 4);
        ctx.lineTo(86, 22);
        ctx.stroke();
        ctx.restore();

        const logoData = canvas.toDataURL("image/png");
        pdf.addImage(logoData, "PNG", MX, 11, 48, 12);
      }
    } catch {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(255, 85, 0);
      pdf.text("Up", MX, 21);
      pdf.setTextColor(11, 37, 69);
      pdf.text("Conta", MX + 12, 21);
    }

    // Top Header: Right aligned Official Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(11, 37, 69);
    pdf.text("FICHA TÉCNICA OFICIAL DE PLAN", PAGE_W - MX, 14, { align: "right" });

    const getPlanContadorTitle = () => {
      switch (tipoEmpresaBase) {
        case "1": return "PLAN CONTADOR 1 EMPRESA";
        case "3": return "PLAN CONTADOR 3 EMPRESAS";
        case "6": return "PLAN CONTADOR 6 EMPRESAS";
        case "10": return "PLAN CONTADOR 10 EMPRESAS";
        case "tax_ilimitado": return "PLAN TAX ILIMITADO";
        case "ilimitadas": return "PLAN SOCIO ESTRATÉGICO ILIMITADO";
        default: return "PLAN CONTADOR UPCONTA";
      }
    };

    pdf.setFontSize(14);
    pdf.setTextColor(11, 37, 69);
    pdf.text(getPlanContadorTitle(), PAGE_W - MX, 20.5, { align: "right" });

    const todayFormatted = new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`UPCONTA • ECUADOR • ${todayFormatted}`, PAGE_W - MX, 25.5, { align: "right" });

    // Blue Accent separator line
    pdf.setDrawColor(11, 37, 69);
    pdf.setLineWidth(0.7);
    pdf.line(MX, 28.5, PAGE_W - MX, 28.5);

    // ==========================================
    // 2 TOP BOXES SIDE BY SIDE (y = 31.5)
    // ==========================================
    const boxTopY = 31.5;
    const boxW = (CONTENT_W - 6) / 2; // 88mm
    const boxH = 43;
    const box1X = MX;
    const box2X = MX + boxW + 6;

    // BOX 1: ESPECIFICACIONES & LÍMITES
    pdf.setFillColor(11, 37, 69);
    pdf.rect(box1X, boxTopY, boxW, 6.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("ESPECIFICACIONES & LÍMITES", box1X + (boxW / 2), boxTopY + 4.5, { align: "center" });

    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(box1X, boxTopY, boxW, boxH, "S");

    const getEmpresasLimit = () => {
      switch (tipoEmpresaBase) {
        case "1": return "1 Empresa / RUC";
        case "3": return "3 Empresas / RUCs";
        case "6": return "6 Empresas / RUCs";
        case "10": return "10 Empresas / RUCs";
        case "tax_ilimitado": return "Tax Ilimitado";
        case "ilimitadas": return "Empresas Ilimitadas";
        default: return "A convenir";
      }
    };

    const getFacturacionDetail = () => {
      if (totalPlanesFactura === 0) return "Opcional / Sin paquetes";
      const parts = [];
      if (cant70 > 0) parts.push(`70: ${cant70} ud`);
      if (cant500 > 0) parts.push(`500: ${cant500} ud`);
      if (cantIlim > 0) parts.push(`Ilim: ${cantIlim} ud`);
      return parts.join(" | ");
    };

    const specRows = [
      { label: "Plan:", value: getPlanContadorTitle() },
      { label: "Categoría / Tier:", value: "CONTADOR / ESTUDIO CONTABLE" },
      { label: "Límite Empresas / RUC:", value: getEmpresasLimit() },
      { label: "Facturación e Inventarios:", value: getFacturacionDetail() },
      { label: "Módulos Corporativos:", value: totalModulosCantidad > 0 ? `${totalModulosCantidad} Módulos ($75 c/u)` : "0 Módulos adicionales" }
    ];

    let rowY = boxTopY + 11.5;
    specRows.forEach((r, idx) => {
      if (idx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(box1X + 0.5, rowY - 3.5, boxW - 1, 6.8, "F");
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(11, 37, 69);
      pdf.text(r.label, box1X + 3.5, rowY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(r.value, box1X + boxW - 3.5, rowY, { align: "right" });

      rowY += 7;
    });

    // BOX 2: DESGLOSE FINANCIERO OFICIAL
    pdf.setFillColor(11, 37, 69);
    pdf.rect(box2X, boxTopY, boxW, 6.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("DESGLOSE FINANCIERO OFICIAL", box2X + (boxW / 2), boxTopY + 4.5, { align: "center" });

    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(box2X, boxTopY, boxW, boxH, "S");

    const finRows = [
      { label: "Precio Base Plan:", value: `$${subtotal.toFixed(2)} USD` },
      { label: "Modalidad de Pago:", value: "Pago Anual" },
      { label: "IVA Ecuador (15%):", value: `$${iva.toFixed(2)} USD` }
    ];

    let finY = boxTopY + 13;
    finRows.forEach((r, idx) => {
      if (idx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(box2X + 0.5, finY - 3.5, boxW - 1, 7.5, "F");
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(11, 37, 69);
      pdf.text(r.label, box2X + 3.5, finY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(r.value, box2X + boxW - 3.5, finY, { align: "right" });

      finY += 7.5;
    });

    // Highlight Total Bar at bottom of box 2
    const totalBarY = boxTopY + boxH - 7.5;
    pdf.setFillColor(11, 37, 69);
    pdf.rect(box2X, totalBarY, boxW, 7.5, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TOTAL ESTIMADO CON IVA", box2X + 3.5, totalBarY + 5);

    pdf.setFontSize(9.5);
    pdf.setTextColor(251, 191, 36); // Yellow accent
    pdf.text(`$${totalAnual.toFixed(2)} USD`, box2X + boxW - 3.5, totalBarY + 5, { align: "right" });

    // ==========================================
    // SECTION: DESGLOSE DE MÓDULOS TRONCALES
    // ==========================================
    const modSectionY = boxTopY + boxH + 4; // ~78.5mm
    pdf.setFillColor(11, 37, 69);
    pdf.rect(MX, modSectionY, CONTENT_W, 6.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("DESGLOSE DE MÓDULOS TRONCALES INCLUIDOS EN EL PLAN (PLAN CONTADOR)", PAGE_W / 2, modSectionY + 4.5, { align: "center" });

    const contentStartY = modSectionY + 8.5;
    const colW = (CONTENT_W - 6) / 3; // ~58mm

    // Col 1: Administrativo
    const col1X = MX;
    pdf.setFillColor(11, 37, 69);
    pdf.rect(col1X, contentStartY, colW, 5.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("MÓDULO: ADMINISTRATIVO", col1X + (colW / 2), contentStartY + 3.8, { align: "center" });

    const col1Items = [
      "Dashboard Informativo",
      "Proformas y Cotizaciones",
      "COMPROBANTES ELECTRÓNICOS",
      "Facturación Electrónica SRI",
      "Facturas de reembolso",
      "Facturación por Lote",
      "Comprobantes de retención",
      "Notas de Crédito y Débito",
      "Liquidación de Compras",
      "Guías de Remisión",
      "Notas de Venta y Compras",
      "CONTRATOS / Fact. Recurrente"
    ];
    let c1Y = contentStartY + 9;
    col1Items.forEach(item => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`• ${item}`, col1X + 2.5, c1Y);
      c1Y += 4.1;
    });
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(col1X, contentStartY, colW, 142, "S");

    // Col 2: Impuestos & Producción
    const col2X = MX + colW + 3;
    pdf.setFillColor(11, 37, 69);
    pdf.rect(col2X, contentStartY, colW, 5.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("MÓDULO: IMPUESTOS & TRIBUTARIO", col2X + (colW / 2), contentStartY + 3.8, { align: "center" });

    const col2Items1 = [
      "ATS (Anexo Transaccional SRI)",
      "Formulario 103 (Retenciones)",
      "Formulario 104 (Declaración IVA)",
      "Reporte Tributario Automatizado"
    ];
    let c2Y = contentStartY + 9;
    col2Items1.forEach(item => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`• ${item}`, col2X + 2.5, c2Y);
      c2Y += 4.1;
    });

    // Producción subheader inside col 2
    c2Y += 2;
    pdf.setFillColor(11, 37, 69);
    pdf.rect(col2X, c2Y, colW, 5.2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("MÓDULO: PRODUCCIÓN & INVENTARIOS", col2X + (colW / 2), c2Y + 3.6, { align: "center" });

    const col2Items2 = [
      "Catálogo de productos y servicios",
      "Productos con receta y combos",
      "Multibodega y transferencias",
      "Liquidación de importaciones",
      "Análisis de Rotación e Inventarios",
      "Análisis de Rentabilidad",
      "Órdenes de compra y producción"
    ];
    c2Y += 8.5;
    col2Items2.forEach(item => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`• ${item}`, col2X + 2.5, c2Y);
      c2Y += 4.1;
    });
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(col2X, contentStartY, colW, 142, "S");

    // Col 3: Contabilidad & Módulos Corporativos
    const col3X = MX + (colW * 2) + 6;
    pdf.setFillColor(11, 37, 69);
    pdf.rect(col3X, contentStartY, colW, 5.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("MÓDULO: CONTABILIDAD", col3X + (colW / 2), contentStartY + 3.8, { align: "center" });

    const col3Items1 = [
      "Plan de Cuentas NIIF flexible",
      "Centro de costos departamentales",
      "Reglas Contables y Asientos aut.",
      "Balance de Comprobación",
      "Balance General Consolidado",
      "Estado de Pérdidas y Ganancias (P&L)"
    ];
    let c3Y = contentStartY + 9;
    col3Items1.forEach(item => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`• ${item}`, col3X + 2.5, c3Y);
      c3Y += 4.1;
    });

    // Módulos corporativos subheader inside col 3
    c3Y += 2;
    pdf.setFillColor(11, 37, 69);
    pdf.rect(col3X, c3Y, colW, 5.2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("MÓDULOS CORPORATIVOS", col3X + (colW / 2), c3Y + 3.6, { align: "center" });

    const corpList = [];
    if (mTesoreriaCant > 0) corpList.push(`Tesorería y Bancos (${mTesoreriaCant} ud)`);
    else corpList.push("Tesorería y Bancos (Opcional)");
    if (mNominaCant > 0) corpList.push(`Nómina y Roles (${mNominaCant} ud)`);
    else corpList.push("Nómina y Roles (Opcional)");
    if (mActivosCant > 0) corpList.push(`Activos Fijos (${mActivosCant} ud)`);
    else corpList.push("Activos Fijos (Opcional)");
    if (mRestaurantesCant > 0) corpList.push(`Restaurantes y Mesas (${mRestaurantesCant} ud)`);
    else corpList.push("Restaurantes y Comandas (Opc.)");
    if (mContabilidadCant > 0) corpList.push(`Contabilidad Avanzada (${mContabilidadCant} ud)`);
    else corpList.push("Contabilidad Avanzada (Opc.)");

    c3Y += 8.5;
    corpList.forEach(item => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`• ${item}`, col3X + 2.5, c3Y);
      c3Y += 4.1;
    });
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(col3X, contentStartY, colW, 142, "S");

    // ==========================================
    // BOX: DATOS DEL ASESOR COMERCIAL ASIGNADO (AL FINAL DE LA HOJA)
    // ==========================================
    const asesorObj = asesorKey && ASESORES[asesorKey] ? ASESORES[asesorKey] : null;
    const asesorBoxY = 241;
    const asesorBoxH = 34;

    pdf.setFillColor(11, 37, 69);
    pdf.rect(MX, asesorBoxY, CONTENT_W, 6.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text("DATOS DEL ASESOR COMERCIAL ASIGNADO — UPCONTA ECUADOR", PAGE_W / 2, asesorBoxY + 4.5, { align: "center" });

    pdf.setFillColor(248, 250, 252);
    pdf.rect(MX, asesorBoxY + 6.5, CONTENT_W, asesorBoxH - 6.5, "F");
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.rect(MX, asesorBoxY, CONTENT_W, asesorBoxH, "S");

    const colAsesorW = (CONTENT_W - 4) / 3;

    // Asesor Column 1: Asesor y Cargo
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(11, 37, 69);
    pdf.text("Asesor Comercial:", MX + 4, asesorBoxY + 12);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(234, 88, 12); // Orange
    pdf.text(asesorObj ? asesorObj.nombre : "Equipo Comercial UpConta", MX + 4, asesorBoxY + 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Especialista en Soluciones Contables y ERP", MX + 4, asesorBoxY + 22);
    pdf.text("UpConta Software Cloud Ecuador", MX + 4, asesorBoxY + 26);

    // Asesor Column 2: WhatsApp y Atención
    const colA2X = MX + colAsesorW + 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(11, 37, 69);
    pdf.text("Contacto & WhatsApp:", colA2X + 2, asesorBoxY + 12);

    const phoneStr = asesorObj ? `+${asesorObj.telefono.replace(/(\d{3})(\d{2})(\d{3})(\d{4})/, "$1 $2 $3 $4")}` : "+593 99 038 8493";
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(phoneStr, colA2X + 2, asesorBoxY + 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Horario: Lunes a Viernes 08:30 - 18:00", colA2X + 2, asesorBoxY + 22);
    pdf.text("Atención personalizada y soporte continuo", colA2X + 2, asesorBoxY + 26);

    // Asesor Column 3: Garantía y Emisión
    const colA3X = MX + (colAsesorW * 2) + 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(11, 37, 69);
    pdf.text("Soporte & Garantía:", colA3X + 2, asesorBoxY + 12);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(30, 41, 59);
    pdf.text("• www.upconta.com", colA3X + 2, asesorBoxY + 16.5);
    pdf.text("• Soporte técnico incluido 100% Cloud", colA3X + 2, asesorBoxY + 20.5);
    pdf.text("• Actualizaciones tributarias SRI garantizadas", colA3X + 2, asesorBoxY + 24.5);
    pdf.text("• Validez de cotización: 15 días calendario", colA3X + 2, asesorBoxY + 28.5);

    // ==========================================
    // FOOTER
    // ==========================================
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.4);
    pdf.line(MX, 280, PAGE_W - MX, 280);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(11, 37, 69);
    pdf.text("UPCONTA — PLATAFORMA INTEGRAL DE SOFTWARE CONTABLE Y ERP", PAGE_W / 2, 285, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Documento oficial emitido por UpConta para distribución y demostración técnica", PAGE_W / 2, 289, { align: "center" });

    const safeTitle = getPlanContadorTitle().replace(/[^a-zA-Z0-9]/g, "-");
    pdf.save(`Ficha-Tecnica-${safeTitle}.pdf`);
  };

  // WhatsApp Sender
  const handleEnviarWhatsApp = () => {
    if (!asesorKey || !ASESORES[asesorKey]) {
      alert("Por favor elige un asesor comercial asignado antes de enviar.");
      return;
    }

    const asesorObj = ASESORES[asesorKey];
    let mensaje = `¡Hola ${asesorObj.nombre}! 👋\n\n`;

    if (tipoEmpresaBase === "ilimitadas") {
      mensaje += `🔥 *¡QUIERO SER ALIADO ESTRATÉGICO!*\nHe configurado mi Plan Ilimitado en la calculadora UpConta y deseo conocer los beneficios de distribución de firmas y comisiones.\n\n`;
    } else {
      mensaje += `He configurado mi plan contable en el Entorno UpConta y deseo contratar:\n\n`;
    }

    const getPlanBaseText = () => {
      switch (tipoEmpresaBase) {
        case "1": return "1 EMPRESA ($50)";
        case "3": return "3 EMPRESAS ($100)";
        case "6": return "6 EMPRESAS ($150)";
        case "10": return "10 EMPRESAS ($200)";
        case "tax_ilimitado": return "TAX ILIMITADO ($100)";
        case "ilimitadas": return "ILIMITADAS SOCIO ESTRATÉGICO ($300)";
        default: return "Sin selección";
      }
    };

    mensaje += `💎 1. Plan Base Seleccionado: ${getPlanBaseText()}\n\n`;
    mensaje += `💎 2. Paquetes de Facturación:\n`;
    mensaje += `* Paquetes UP LIGHT 70: ${cant70} ud.\n`;
    mensaje += `* Paquetes UP BASE 500: ${cant500} ud.\n`;
    mensaje += `* Paquetes UP POWER Ilimitado: ${cantIlim} ud.\n\n`;

    mensaje += `💎 3. Módulos Corporativos:\n`;
    mensaje += `* Tesorería: ${mTesoreriaCant} ud.\n`;
    mensaje += `* Nómina: ${mNominaCant} ud.\n`;
    mensaje += `* Activos Fijos: ${mActivosCant} ud.\n`;
    mensaje += `* Restaurantes: ${mRestaurantesCant} ud.\n`;
    mensaje += `* Contabilidad: ${mContabilidadCant} ud.\n\n`;

    mensaje += `💎 RESUMEN ECONÓMICO ANUAL:\n`;
    mensaje += `* Subtotal: $${formatMoney(subtotal)}\n`;
    mensaje += `* IVA (15%): $${formatMoney(iva)}\n`;
    mensaje += `* TOTAL ANUAL PROYECTADO: $${formatMoney(totalAnual)}\n\n`;

    mensaje += `💎 ANÁLISIS DE EFICIENCIA:\n`;
    mensaje += `* ${descPromedio}: $${formatMoney(valPromedio)} / año`;

    window.open(`https://api.whatsapp.com/send?phone=${asesorObj.telefono}&text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Main Grid: Configurator Left, Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Configurator Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            
            {/* Asesor & Plan Base */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Ajustes de Plan &amp; Asesor</h3>
                  <p className="text-xs text-slate-500">Selecciona el asesor asignado y la base de empresas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Asesor Asignado <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={asesorKey}
                    onChange={e => setAsesorKey(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  >
                    <option value="">-- Elige un Asesor --</option>
                    {Object.entries(ASESORES).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Empresas Base <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={tipoEmpresaBase}
                    onChange={e => setTipoEmpresaBase(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 text-white font-black text-sm rounded-xl focus:ring-2 focus:ring-orange-400 transition-all"
                  >
                    <option value="0">SELECCIONA...</option>
                    <option value="1">1 EMPRESA ($50.00)</option>
                    <option value="3">3 EMPRESAS ($100.00)</option>
                    <option value="6">6 EMPRESAS ($150.00)</option>
                    <option value="10">10 EMPRESAS ($200.00)</option>
                    <option value="tax_ilimitado">TAX ILIMITADO ($100.00)</option>
                    <option value="ilimitadas">ILIMITADAS SOCIO ESTRATÉGICO ($300.00)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Facturación e Inventarios */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Facturación e Inventarios</h3>
                  <p className="text-xs text-slate-500">Paquetes de comprobantes electrónicos autorizados</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">UP LIGHT 70</span>
                    <span className="bg-orange-100 text-orange-700 font-extrabold text-xs px-2 py-0.5 rounded-md">$10.00</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={cant70}
                    onChange={e => setCant70(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-black text-slate-900 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">UP BASE 500</span>
                    <span className="bg-orange-100 text-orange-700 font-extrabold text-xs px-2 py-0.5 rounded-md">$25.00</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={cant500}
                    onChange={e => setCant500(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-black text-slate-900 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">UP POWER ILIMITADO</span>
                    <span className="bg-orange-100 text-orange-700 font-extrabold text-xs px-2 py-0.5 rounded-md">$55.00</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={cantIlim}
                    onChange={e => setCantIlim(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-black text-slate-900 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Módulos Corporativos */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Módulos Corporativos</h3>
                  <p className="text-xs text-slate-500">Añade tesorería, nómina, activos fijos y más ($75.00 c/u)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">Tesorería ($75)</span>
                  <input
                    type="number"
                    min="0"
                    value={mTesoreriaCant}
                    onChange={e => setMTesoreriaCant(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">Nómina ($75)</span>
                  <input
                    type="number"
                    min="0"
                    value={mNominaCant}
                    onChange={e => setMNominaCant(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">Activos Fijos ($75)</span>
                  <input
                    type="number"
                    min="0"
                    value={mActivosCant}
                    onChange={e => setMActivosCant(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">Restaurantes ($75)</span>
                  <input
                    type="number"
                    min="0"
                    value={mRestaurantesCant}
                    onChange={e => setMRestaurantesCant(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-xs text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 sm:col-span-2">
                  <span className="font-bold text-slate-800 text-xs">Contabilidad Avanzada ($75)</span>
                  <input
                    type="number"
                    min="0"
                    value={mContabilidadCant}
                    onChange={e => setMContabilidadCant(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-center font-black text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Financial Summary Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0B2545] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6 sticky top-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Resumen de Propuesta</h3>
                  <p className="text-xs text-slate-300">Valores sin IVA e IVA incluido (15%)</p>
                </div>
              </div>
              <span className="text-[10px] font-black bg-orange-500 text-white px-2.5 py-1 rounded-full uppercase">
                Anual
              </span>
            </div>

            {/* Financial Line Items */}
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between items-center text-slate-300">
                <span>Plan Base:</span>
                <span className="font-black text-white">${formatMoney(precioBaseEmpresas)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Facturación e Inventarios:</span>
                <span className="font-black text-white">${formatMoney(totalComprobantes)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Módulos Adicionales:</span>
                <span className="font-black text-white">${formatMoney(totalModulos)}</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-slate-200">
                <span className="font-bold">Subtotal:</span>
                <span className="font-black text-white">${formatMoney(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>IVA (15%):</span>
                <span className="font-black text-amber-300">${formatMoney(iva)}</span>
              </div>

              {/* Total Anual Highlight */}
              <div className="pt-3 border-t-2 border-orange-500/40 flex justify-between items-center">
                <div>
                  <span className="text-xs uppercase font-black text-orange-400 tracking-wider block">TOTAL ANUAL</span>
                  <span className="text-xs text-slate-400">Incluye IVA oficial</span>
                </div>
                <span className="text-2xl sm:text-3xl font-black text-orange-400 tracking-tight">
                  ${formatMoney(totalAnual)}
                </span>
              </div>
            </div>

            {/* Partner Alliance Badge (Only for ILIMITADAS) */}
            {tipoEmpresaBase === "ilimitadas" && (
              <div className="bg-gradient-to-br from-emerald-950/90 via-slate-900 to-emerald-950/90 border-2 border-emerald-400/80 p-5 rounded-2xl space-y-2.5 shadow-xl animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                  <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>¡FELICIDADES! SOCIO ESTRATÉGICO</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  Este plan te convierte en <strong className="text-emerald-300 font-bold">SOCIO ESTRATÉGICO</strong> de UpConta.
                </p>
                <div className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-emerald-800/60">
                  <p>🔥 Distribuye <strong>Firmas Electrónicas</strong> junto a nuestra certificadora <strong>ANF</strong> con <strong className="text-amber-300">50% DE DESCUENTO</strong>.</p>
                  <p>💰 Comisiona hasta un <strong className="text-amber-300">30%</strong> por cada plan que refieras.</p>
                </div>
              </div>
            )}

            {/* Analysis Box */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border-l-4 border-orange-500 border-r border-t border-b border-slate-800 space-y-1">
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider block">
                ANÁLISIS DE EFICIENCIA POR EMPRESA
              </span>
              <p className="text-xs text-slate-300 font-medium leading-tight">
                {descPromedio}
              </p>
              <span className="text-2xl font-black text-white block pt-1">
                ${formatMoney(valPromedio)} <span className="text-xs font-normal text-slate-400">/ año</span>
              </span>
            </div>

            {/* Action Buttons: PDF Export & WhatsApp */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleGenerarFichaPlanContadorPDF}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-[#0B2545] font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2.5 border border-slate-200 hover:shadow-lg active:scale-[0.99]"
              >
                <FileDown className="w-5 h-5 text-orange-600 shrink-0" />
                <span className="tracking-wide">Imprimir Ficha Técnica en PDF</span>
              </button>

              <button
                onClick={handleEnviarWhatsApp}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2.5 hover:shadow-lg active:scale-[0.99]"
              >
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span className="tracking-wide">Enviar Cotización por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Dynamic Module Showcase ("Ficha Técnica de tu Plan") */}
      {tipoEmpresaBase !== "0" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  Ficha Técnica de tu Plan
                </h3>
                <p className="text-xs text-slate-500">
                  Módulos y capacidades incluidas en la configuración actual
                </p>
              </div>
            </div>

            <button
              onClick={handleGenerarFichaPlanContadorPDF}
              className="px-4 py-2.5 bg-[#0B2545] hover:bg-[#003566] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Imprimir Ficha PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Módulo Administrativo & Comprobantes */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                Módulo Administrativo
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li>Dashboard Informativo</li>
                <li>Proformas y Cotizaciones</li>
                <li>Facturación Electrónica SRI</li>
                <li>Facturas de reembolso</li>
                <li>Facturación por Lote</li>
                <li>Comprobantes de retención</li>
                <li>Notas de Crédito / Débito</li>
                <li>Liquidación de Compras</li>
                <li>Guías de Remisión</li>
                <li>Notas de Venta / Compras</li>
                <li>Facturación recurrente / Contratos</li>
              </ul>
            </div>

            {/* Módulo de Impuestos */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                Módulo de Impuestos
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li>ATS (Anexo Transaccional Simplificado)</li>
                <li>Formulario 103 (Retenciones)</li>
                <li>Formulario 104 (IVA)</li>
                <li>Reporte SRI automatizado</li>
              </ul>
            </div>

            {/* Módulo Contabilidad */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                Módulo Contabilidad
              </h4>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                <li>Plan de Cuentas flexible</li>
                <li>Centro de costos</li>
                <li>Reglas Contables y Asientos automáticos</li>
                <li>Balance de Comprobación</li>
                <li>Balance General</li>
                <li>Estado de Pérdidas y Ganancias (P&amp;L)</li>
              </ul>
            </div>

            {/* Módulo de Producción (shown if Facturación packages > 0) */}
            {totalPlanesFactura > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                  Módulo de Producción &amp; Inventarios
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li>Catálogo de productos y servicios</li>
                  <li>Productos con receta / combos</li>
                  <li>Multibodega y transferencias</li>
                  <li>Liquidación de importaciones</li>
                  <li>Análisis de Rotación e Inventarios</li>
                  <li>Análisis de rentabilidad</li>
                  <li>Órdenes de compra y producción</li>
                </ul>
              </div>
            )}

            {/* Módulo de Tesorería */}
            {mTesoreriaCant > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                  Módulo de Tesorería
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li>Estado de cuenta proveedores y clientes</li>
                  <li>Histórico de pagos y cobros masivos</li>
                  <li>Anticipos y compensaciones</li>
                  <li>Cuentas bancarias y tarjetas de crédito</li>
                  <li>Cajas chicas y conciliación bancaria</li>
                </ul>
              </div>
            )}

            {/* Módulo de Nómina */}
            {mNominaCant > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                  Módulo de Nómina
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li>Base de datos de empleados y roles de pago</li>
                  <li>Kardex de vacaciones y certificados</li>
                  <li>RDEP, Formulario 107 y gastos personales</li>
                  <li>Cargas familiares, novedades y horas extras</li>
                  <li>Anticipos, préstamos e incremento de sueldos</li>
                </ul>
              </div>
            )}

            {/* Módulo Activos Fijos */}
            {mActivosCant > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                  Módulo Activos Fijos
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li>Ficha detallada de activos</li>
                  <li>Depreciaciones automáticas</li>
                  <li>Kárdex de control</li>
                  <li>Acta de entrega recepción</li>
                </ul>
              </div>
            )}

            {/* Módulo Restaurantes */}
            {mRestaurantesCant > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-orange-600 pb-2 border-b border-slate-200">
                  Módulo Restaurantes
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                  <li>Gestión de meseros y mesas</li>
                  <li>Comandas e impresora de cocina</li>
                  <li>Caja Restaurante y pre-cuenta</li>
                  <li>Informe diario de ventas</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
