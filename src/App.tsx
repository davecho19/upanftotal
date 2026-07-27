import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Layers, 
  HelpCircle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Globe, 
  Bookmark, 
  Briefcase, 
  Check,
  Copy,
  AlertCircle,
  Database,
  ArrowRight,
  Sparkles,
  Info,
  User,
  Users,
  FileSpreadsheet,
  Building2,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Percent,
  Mail,
  Phone,
  Calculator,
  Download,
  Image,
  Share2,
  Send,
  Sliders,
  Shield,
  FileCheck,
  Palette,
  Key,
  Smartphone,
  Cloud,
  Award,
  Lock,
  ShieldCheck,
  Zap,
  Flame,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  PLANES_DATA, 
  MODULOS_POR_TIER, 
  DETALLE_SUBMODULOS, 
  NICHOS_DATA, 
  ASESORES_DATA, 
  ADICIONALES_ESTANDAR, 
  ADICIONALES_CONTADOR, 
  COMPROBANTES_ADICIONALES_CONTADOR,
  Plan,
  AsesorInfo,
  FIRMAS_DATA,
  FirmaElectronica
} from "./data";
import { jsPDF } from "jspdf";
import { AdminModuleMockups } from "./components/AdminModuleMockups";
import { ColorPickerDialog } from "./components/ColorPickerDialog";
import { DynamicBrandLogo, UpContaLogo, AnfLogo, CoBrandLogo } from "./components/GodiLogo";
import { VentasModule } from "./components/VentasModule";
import { ContadorModule } from "./components/ContadorModule";
import { DashboardModule } from "./components/DashboardModule";

export default function App() {
  // Main Tab State: "plan", "explorador", "simulador", "firmas", "ventas", "contador", "dashboard"
  const [activeTab, setActiveTab] = useState<"plan" | "explorador" | "simulador" | "firmas" | "ventas" | "contador" | "dashboard">("plan");

  // Category tab state
  const [tipoPlan, setTipoPlan] = useState<"facturacion" | "erp" | "contador">("facturacion");
  
  // Selected plan inside active category
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");

  // Selected electronic signatures in quoter
  const [selectedSignatures, setSelectedSignatures] = useState<Array<{
    tipo: string;
    vigencia: string;
    precio: number;
    cantidad: number;
  }>>([]);

  // Billing Cycle: monthly or annual (annual gets a 10% discount)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // Selected administrative module in showcase list
  const [selectedAdminModule, setSelectedAdminModule] = useState<string>("Punto de venta");

  // Active module for deep technical breakdown (drill-down list)
  const [activeModule, setActiveModule] = useState<string>("ADMINISTRATIVO");

  // Search filter for modules or features
  const [moduleSearchQuery, setModuleSearchQuery] = useState<string>("");

  // Default proposal notes requested by user
  const DEFAULT_CLIENT_NOTES = "Nuestra solución se adapta a las necesidades de su empresa, integrando únicamente los módulos que aportan valor a su operación. De esta manera, podrá administrar todos sus procesos desde una única plataforma, optimizando tiempo, recursos y productividad.";

  // Live Calculator States
  const [clientName, setClientName] = useState<string>("");
  const [clientRuc, setClientRuc] = useState<string>("");
  const [clientNotes, setClientNotes] = useState<string>(DEFAULT_CLIENT_NOTES);
  const [calcQuantity, setCalcQuantity] = useState<number>(1);
  
  // Manual Advisor States (editable)
  const [advisorName, setAdvisorName] = useState<string>("");
  const [advisorEmail, setAdvisorEmail] = useState<string>("");
  const [advisorPhone, setAdvisorPhone] = useState<string>("");

  // Selected electronic signature type tab state
  const [selectedSigType, setSelectedSigType] = useState<"PERSONA NATURAL" | "PERSONA NATURAL RUC" | "PERSONA JURIDICA" | "PROMO EMPRENDE">("PERSONA NATURAL");

  // Custom Client Logo
  const [customLogo, setCustomLogo] = useState<string>("");
  const [customLogoName, setCustomLogoName] = useState<string>("");
  const [customPlanPrice, setCustomPlanPrice] = useState<number | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>(null);

  // Custom PDF Background Image (Watermark)
  const [pdfBgImage, setPdfBgImage] = useState<string>("");
  const [pdfBgImageName, setPdfBgImageName] = useState<string>("");
  const [pdfBgOpacity, setPdfBgOpacity] = useState<number>(0.15); // Default 15% watermark opacity

  // Customizable PDF Colors & Titles
  const [pdfBgColor, setPdfBgColor] = useState<string>("#0b2545");
  const [pdfTitleColor, setPdfTitleColor] = useState<string>("#0b2545");
  const [pdfSubtitleColor, setPdfSubtitleColor] = useState<string>("#475569");

  // State for Color Picker Dialog ("Abanico de Colores")
  const [colorPickerTarget, setColorPickerTarget] = useState<"bg" | "title" | "sub" | null>(null);

  // State for Firmas Electrónicas Tab Widget
  const [firmaTypeSelect, setFirmaTypeSelect] = useState<string>("PERSONA NATURAL");
  const [firmaVigenciaSelect, setFirmaVigenciaSelect] = useState<string>("1 AÑO");
  const [firmaQtySelect, setFirmaQtySelect] = useState<number>(1);
  const [copiedRequirements, setCopiedRequirements] = useState<boolean>(false);

  const handleCopyRequirements = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRequirements(true);
    setTimeout(() => setCopiedRequirements(false), 2500);
  };

  const handleAddSignatureDirect = (tipo: string, vigencia: string, precio: number, qty: number = 1) => {
    const existingIndex = selectedSignatures.findIndex(s => s.tipo === tipo && s.vigencia === vigencia);
    if (existingIndex > -1) {
      const updated = [...selectedSignatures];
      updated[existingIndex].cantidad += qty;
      setSelectedSignatures(updated);
    } else {
      setSelectedSignatures([...selectedSignatures, { tipo, vigencia, precio, cantidad: qty }]);
    }
  };

  // Extra modules / Add-ons added to quotation
  const [selectedAddons, setSelectedAddons] = useState<Array<{
    nombre: string;
    precio: number;
    cantidad: number;
  }>>([]);

  const [selectedProposalPlans, setSelectedProposalPlans] = useState<Array<{
    id: string;
    tipoPlan: "facturacion" | "erp" | "contador";
    nombre: string;
    precioBase: number;
    precioPersonalizado: number | null;
    cantidad: number;
    billingCycle: "monthly" | "annual";
    cycleLabel: string;
  }>>([]);

  const [planDiscountPct, setPlanDiscountPct] = useState<number>(0);
  const [quoteCopied, setQuoteCopied] = useState<boolean>(false);
  const [quoteShared, setQuoteShared] = useState<boolean>(false);
  const [pdfSuccess, setPdfSuccess] = useState<boolean>(false);

  // Auto-select first plan when category changes - disabled by user request so no plan is selected by default
  useEffect(() => {
    if (tipoPlan !== "erp") {
      setBillingCycle("annual");
    }
  }, [tipoPlan]);

  // Reset custom plan price whenever plan selection or cycle changes
  useEffect(() => {
    setCustomPlanPrice(null);
  }, [selectedPlanName, billingCycle, tipoPlan]);

  const activePlanList = PLANES_DATA[tipoPlan] || [];
  const viewedPlanObj = (selectedPlanName && activePlanList.find(p => p.nombre === selectedPlanName)) || activePlanList[0] || null;

  // Sync active module when plan changes based on its tier modules
  useEffect(() => {
    if (viewedPlanObj) {
      const tierModules = MODULOS_POR_TIER[viewedPlanObj.tier] || [];
      if (tierModules.length > 0 && !tierModules.includes(activeModule)) {
        setActiveModule(tierModules[0]);
      }
    }
  }, [viewedPlanObj]);

  // Extract components like Users count and Vouchers count from the modulos list
  const extractQuickMetrics = (modulosList: string[]) => {
    const userItem = modulosList.find(m => /usuario/i.test(m)) || "Usuarios Ilimitados";
    let voucherItem = modulosList.find(m => /comprobante/i.test(m));
    if (!voucherItem) {
      voucherItem = tipoPlan === "contador" ? "No incluye comprobantes" : "Comprobantes Ilimitados";
    }
    const companyItem = modulosList.find(m => /empresa/i.test(m)) || "";
    
    return {
      usuarios: userItem,
      comprobantes: voucherItem,
      empresas: companyItem
    };
  };

  // Default base price calculation for currently selected dropdown plan
  let defaultBasePrice = 0;
  let cycleLabel = "/mes";
  if (viewedPlanObj) {
    if (tipoPlan === "erp") {
      if (billingCycle === "annual") {
        defaultBasePrice = viewedPlanObj.precioAnual || (viewedPlanObj.precio * 12);
        cycleLabel = "/año";
      } else {
        defaultBasePrice = viewedPlanObj.precio;
        cycleLabel = "/mes";
      }
    } else {
      defaultBasePrice = viewedPlanObj.precio;
      cycleLabel = "/mes";
    }
  }

  // Handle Proposal Plans Management
  const handleAddProposalPlan = (overridePlanObj?: typeof viewedPlanObj) => {
    const planToUse = overridePlanObj || viewedPlanObj;
    if (!planToUse) return;

    let defaultPrice = planToUse.precio;
    let cycleLbl = "/mes";
    if (tipoPlan === "erp") {
      if (billingCycle === "annual") {
        defaultPrice = planToUse.precioAnual || (planToUse.precio * 12);
        cycleLbl = "/año";
      } else {
        defaultPrice = planToUse.precio;
        cycleLbl = "/mes";
      }
    }

    const priceToUse = customPlanPrice !== null ? customPlanPrice : defaultPrice;
    const qtyToUse = calcQuantity || 1;

    const existingIndex = selectedProposalPlans.findIndex(
      p => p.tipoPlan === tipoPlan && p.nombre === planToUse.nombre && p.billingCycle === billingCycle
    );

    if (existingIndex >= 0) {
      setSelectedProposalPlans(prev => prev.map((item, idx) => 
        idx === existingIndex ? { ...item, cantidad: item.cantidad + qtyToUse } : item
      ));
    } else {
      setSelectedProposalPlans(prev => [
        ...prev,
        {
          id: `${tipoPlan}-${planToUse.nombre}-${billingCycle}-${Date.now()}`,
          tipoPlan,
          nombre: planToUse.nombre,
          precioBase: defaultPrice,
          precioPersonalizado: customPlanPrice !== null ? customPlanPrice : null,
          cantidad: qtyToUse,
          billingCycle,
          cycleLabel: cycleLbl
        }
      ]);
    }
  };

  const handleRemoveProposalPlan = (id: string) => {
    setSelectedProposalPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateProposalPlanQty = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveProposalPlan(id);
    } else {
      setSelectedProposalPlans(prev => prev.map(p => p.id === id ? { ...p, cantidad: qty } : p));
    }
  };

  const handleUpdateProposalPlanPrice = (id: string, newPrice: number) => {
    setSelectedProposalPlans(prev => prev.map(p => p.id === id ? { ...p, precioPersonalizado: newPrice } : p));
  };

  // Financial calculations
  const planSubtotal = selectedProposalPlans.reduce((sum, item) => {
    const unitPrice = item.precioPersonalizado !== null ? item.precioPersonalizado : item.precioBase;
    return sum + (unitPrice * item.cantidad);
  }, 0);

  const planDiscountAmount = planSubtotal * (planDiscountPct / 100);
  const planNetTotal = planSubtotal - planDiscountAmount;

  // Addons subtotal fixed price
  const isErpAnnual = tipoPlan === "erp" && billingCycle === "annual";
  const addonsSubtotal = selectedAddons.reduce((acc, addon) => acc + (addon.precio * addon.cantidad), 0);
  const addonsNetTotal = addonsSubtotal;

  const signaturesSubtotal = selectedSignatures.reduce((acc, sig) => acc + (sig.precio * sig.cantidad), 0);

  // Calculate 15% IVA on all plans & add-ons
  const planTaxable = planNetTotal;
  const addonsTaxable = addonsNetTotal;
  const signaturesTaxable = 0; // Firmas electrónicas exentas de IVA 15%

  const preTaxTotal = planNetTotal + addonsNetTotal + signaturesSubtotal;
  const taxableBase = planTaxable + addonsTaxable;
  const taxAmount = taxableBase * 0.15; // 15% VAT
  const grandTotal = preTaxTotal + taxAmount;

  // Handle Addon Management
  const handleAddAddon = (addonName: string, price: number) => {
    const existing = selectedAddons.find(a => a.nombre === addonName);
    if (existing) {
      setSelectedAddons(selectedAddons.map(a => 
        a.nombre === addonName ? { ...a, cantidad: a.cantidad + 1 } : a
      ));
    } else {
      setSelectedAddons([...selectedAddons, { nombre: addonName, precio: price, cantidad: 1 }]);
    }
  };

  const handleRemoveAddon = (addonName: string) => {
    setSelectedAddons(selectedAddons.filter(a => a.nombre !== addonName));
  };

  const handleUpdateAddonQty = (addonName: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveAddon(addonName);
    } else {
      setSelectedAddons(selectedAddons.map(a => 
        a.nombre === addonName ? { ...a, cantidad: qty } : a
      ));
    }
  };

  const handleUpdateAddonPrice = (addonName: string, price: number) => {
    setSelectedAddons(selectedAddons.map(a => 
      a.nombre === addonName ? { ...a, precio: price } : a
    ));
  };

  // Handle Electronic Signatures Management
  const handleAddSignature = (tipo: string, vigencia: string, precio: number) => {
    const existing = selectedSignatures.find(s => s.tipo === tipo && s.vigencia === vigencia);
    if (existing) {
      setSelectedSignatures(selectedSignatures.map(s => 
        (s.tipo === tipo && s.vigencia === vigencia) ? { ...s, cantidad: s.cantidad + 1 } : s
      ));
    } else {
      setSelectedSignatures([...selectedSignatures, { tipo, vigencia, precio, cantidad: 1 }]);
    }
  };

  const handleRemoveSignature = (tipo: string, vigencia: string) => {
    setSelectedSignatures(selectedSignatures.filter(s => !(s.tipo === tipo && s.vigencia === vigencia)));
  };

  const handleUpdateSignatureQty = (tipo: string, vigencia: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveSignature(tipo, vigencia);
    } else {
      setSelectedSignatures(selectedSignatures.map(s => 
        (s.tipo === tipo && s.vigencia === vigencia) ? { ...s, cantidad: qty } : s
      ));
    }
  };

  const handleUpdateSignaturePrice = (tipo: string, vigencia: string, price: number) => {
    setSelectedSignatures(selectedSignatures.map(s => 
      (s.tipo === tipo && s.vigencia === vigencia) ? { ...s, precio: price } : s
    ));
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [11, 60, 93];
  };

  // Generate clean textual proposal for clipboard
  const generateProposalText = () => {
    let text = `PROPUESTA COMERCIAL\n\n`;
    text += `CLIENTE: ${clientName ? clientName.toUpperCase() : "ESTIMADO CLIENTE"}\n`;
    if (clientRuc) text += `RUC / C.I: ${clientRuc}\n`;
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    text += `FECHA DE EMISIÓN: ${dateStr}\n`;
    text += `MODALIDAD DE COBRO: ${billingCycle === "annual" ? "Anual" : "Mensual"}\n\n`;
    
    if (selectedProposalPlans.length > 0) {
      text += `DETALLE DE PLANES SELECCIONADOS:\n`;
      selectedProposalPlans.forEach(plan => {
        text += `* Plan: ${plan.nombre.toUpperCase()} (${plan.tipoPlan.toUpperCase()})\n`;
      });
    } else if (viewedPlanObj) {
      text += `DETALLE DE PLANES SELECCIONADOS:\n`;
      text += `* Plan: ${viewedPlanObj.nombre.toUpperCase()} (${tipoPlan.toUpperCase()})\n`;
    }

    if (selectedAddons.length > 0) {
      text += `MÓDULOS ADICIONALES :\n`;
      selectedAddons.forEach(addon => {
        const addonTotal = addon.precio * addon.cantidad;
        const cleanName = addon.nombre.replace(/^ADD-ON:\s*/i, '').toUpperCase();
        text += `* ${cleanName} x${addon.cantidad}: $${addonTotal.toFixed(2)}\n`;
      });
    }

    if (selectedSignatures.length > 0) {
      text += `FIRMAS ELECTRÓNICAS (SRI):\n`;
      selectedSignatures.forEach(sig => {
        const sigTotal = sig.precio * sig.cantidad;
        const sigName = `${sig.tipo} (${sig.vigencia})`.toUpperCase();
        text += `* Firma: ${sigName} x${sig.cantidad}: $${sigTotal.toFixed(2)}\n`;
      });
    }

    text += `\nRESUMEN FINANCIERO:\n`;
    text += `* Valor a cancelar con impuestos: $${grandTotal.toFixed(2)} USD\n`;
    text += `Quedamos a su entera disposición para cualquier inquietud.`;
    
    return text;
  };

  const copyToClipboard = () => {
    const text = generateProposalText();
    navigator.clipboard.writeText(text);
    setQuoteCopied(true);
    setTimeout(() => setQuoteCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    const text = generateProposalText();
    const cleanPhone = advisorPhone.replace(/[\s+]/g, "");
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(url, "_blank");
    setQuoteShared(true);
    setTimeout(() => setQuoteShared(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        setCustomLogo(base64Str);
        setCustomLogoName(file.name);
        
        const img = new window.Image();
        img.onload = () => {
          setLogoDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = base64Str;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Str = reader.result as string;
        setPdfBgImage(base64Str);
        setPdfBgImageName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // HIGH-FIDELITY PDF PROPOSAL GENERATION (jsPDF)
  const handleGenerarPDF = () => {
    if (!clientName.trim()) {
      alert("Por favor ingrese el Nombre o Empresa del cliente.");
      return;
    }

    const pdf = new jsPDF("p", "mm", "a4");
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MX = 14;

    // Retrieve customized colors or fallback to UpConta theme
    const C_PRIMARY: [number, number, number] = hexToRgb(pdfBgColor);
    const C_SECONDARY: [number, number, number] = hexToRgb(pdfTitleColor);
    const C_TEXT_DIM: [number, number, number] = hexToRgb(pdfSubtitleColor);
    const C_LIGHT_BG: [number, number, number] = [240, 246, 250];
    const C_WHITE: [number, number, number] = [255, 255, 255];
    const C_BORDER: [number, number, number] = [180, 198, 211];

    // Frame/Border & Background Drawing helper
    const drawPageStructure = () => {
      // Clean background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, PAGE_W, PAGE_H, "F");

      // Custom Background Watermark Image covering both pages if configured
      if (pdfBgImage) {
        try {
          (pdf as any).setGState(new (pdf as any).GState({ opacity: pdfBgOpacity }));
          pdf.addImage(pdfBgImage, "JPEG", 0, 0, PAGE_W, PAGE_H);
          (pdf as any).setGState(new (pdf as any).GState({ opacity: 1.0 }));
        } catch (err) {
          console.error("Error drawing background image watermark:", err);
          try {
            (pdf as any).setGState(new (pdf as any).GState({ opacity: 1.0 }));
          } catch (e) {}
        }
      }

      // Draw elegant subtle border frame
      pdf.setDrawColor(...C_BORDER);
      pdf.setLineWidth(0.4);
      pdf.roundedRect(6, 6, PAGE_W - 12, PAGE_H - 12, 4, 4, "S");

      // Corner accent highlight boxes (Premium UpConta editorial look)
      pdf.setDrawColor(...C_SECONDARY);
      pdf.setLineWidth(1.4);
      const s = 12;
      // Top-right corner highlight
      pdf.line(PAGE_W - 10 - s, 10, PAGE_W - 10, 10);
      pdf.line(PAGE_W - 10, 10, PAGE_W - 10, 10 + s);
      // Bottom-left corner highlight
      pdf.line(10, PAGE_H - 10, 10 + s, PAGE_H - 10);
      pdf.line(10, PAGE_H - 10 - s, 10, PAGE_H - 10);
    };

    // Helper: Draw list key-values in summary
    const drawMetaItem = (lbl: string, val: string, x: number, y: number) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...C_PRIMARY);
      pdf.text(lbl, x, y);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(...C_TEXT_DIM);
      pdf.text(val, x + pdf.getTextWidth(lbl) + 1.5, y);
    };

    // ----------------- PAGE 1 -----------------
    drawPageStructure();

    // 1. Brand Logo Header Area (Larger size on Page 1)
    let logoH = 0;
    if (customLogo) {
      try {
        let logoW = 65; // enlarged default (was 45)
        logoH = 32; // enlarged default (was 22)
        if (logoDimensions) {
          const aspect = logoDimensions.width / logoDimensions.height;
          // Bound within max-width 78mm and max-height 38mm (was 55 / 26)
          if (aspect > 78 / 38) {
            logoW = 78;
            logoH = 78 / aspect;
          } else {
            logoH = 38;
            logoW = 38 * aspect;
          }
        }
        // Embed the base64 custom client logo keeping its aspect ratio
        pdf.addImage(customLogo, "JPEG", MX, 8, logoW, logoH);
      } catch (e) {
        logoH = 16;
      }
    } else {
      logoH = 16;
    }

    // Right-aligned Proposal Title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.setTextColor(...C_PRIMARY);
    pdf.text("PROPUESTA COMERCIAL", PAGE_W - MX, 22, { align: "right" });

    // Dynamic Header divider line ALWAYS positioned strictly below the logo
    const logoBottomY = customLogo ? (8 + logoH) : 22;
    const lineY = Math.max(30, logoBottomY + 4);

    pdf.setDrawColor(...C_PRIMARY);
    pdf.setLineWidth(0.8);
    pdf.line(MX, lineY, PAGE_W - MX, lineY);

    // 2. Client Identity Header Block
    const clientText = clientRuc ? `${clientName.toUpperCase()} - RUC ${clientRuc}` : clientName.toUpperCase();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(...C_PRIMARY);
    pdf.text(clientText, PAGE_W / 2, lineY + 8, { align: "center" });

    // Secondary spacer line
    pdf.setDrawColor(...C_BORDER);
    pdf.setLineWidth(0.3);
    pdf.line(MX, lineY + 12, PAGE_W - MX, lineY + 12);

    // 3. Technical Metadata Column Left
    let dy = lineY + 19;
    const colLeftX = MX;

    const formattedDate = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

    const hasPromoEmprendeSig = selectedSignatures.some(s => s.tipo.toUpperCase().includes("PROMO EMPRENDE"));

    const planNameText = selectedProposalPlans.length > 0 
      ? selectedProposalPlans.map(p => `${p.nombre} (${p.tipoPlan.toUpperCase()})`).join(", ")
      : hasPromoEmprendeSig
      ? "PROMO EMPRENDE (PLAN UP LIGHT + FIRMA ELECTRÓNICA)"
      : viewedPlanObj ? `${viewedPlanObj.nombre} (${tipoPlan.toUpperCase()})` : "COTIZACIÓN BASE";
    drawMetaItem("Planes Seleccionados: ", planNameText, colLeftX, dy);
    dy += 7;

    let metrics = viewedPlanObj ? extractQuickMetrics(viewedPlanObj.modulos) : { comprobantes: "Ilimitados", usuarios: "Ilimitados", empresas: "" };
    if (hasPromoEmprendeSig && selectedProposalPlans.length === 0) {
      metrics = { comprobantes: "70 Comprobantes al año", usuarios: "1 Usuario", empresas: "" };
    }

    drawMetaItem("Comprobantes: ", metrics.comprobantes, colLeftX, dy);
    dy += 7;
    drawMetaItem("Usuarios: ", metrics.usuarios, colLeftX, dy);
    dy += 7;

    if (metrics.empresas) {
      drawMetaItem("Límite de Empresas: ", metrics.empresas, colLeftX, dy);
      dy += 7;
    }

    drawMetaItem("Fecha Emisión: ", formattedDate, colLeftX, dy);
    dy += 7;

    // 4. Detailed Line Items Table
    let tableY = dy + 5;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...C_PRIMARY);
    pdf.text("DETALLE DE LA PROPUESTA ECONÓMICA", MX, tableY);
    tableY += 4.5;

    // Columns: DESCRIPTION (60), QUANTITY (18), PRICE (20), TOTAL (20)
    const colWidths = [60, 18, 20, 20];
    const colTitles = ["DESCRIPCIÓN", "CANTIDAD", "PRECIO UNIT.", "VALOR TOTAL"];
    let colX = MX;

    // Draw header row
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    colWidths.forEach((w, idx) => {
      pdf.setFillColor(...C_PRIMARY);
      pdf.setDrawColor(...C_PRIMARY);
      pdf.rect(colX, tableY, w, 7, "FD");
      pdf.setTextColor(...C_WHITE);
      pdf.text(colTitles[idx], colX + w / 2, tableY + 4.5, { align: "center" });
      colX += w;
    });
    tableY += 7;

    // Print active proposal plans
    if (selectedProposalPlans.length > 0) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C_PRIMARY);

      selectedProposalPlans.forEach((p, idx) => {
        let cellX = MX;
        const unitPrice = p.precioPersonalizado !== null ? p.precioPersonalizado : p.precioBase;
        const itemSubtotal = unitPrice * p.cantidad;
        const cells = [
          { text: `PLAN ${p.nombre.toUpperCase()} (${p.tipoPlan.toUpperCase()})`, align: "left" },
          { text: String(p.cantidad), align: "center" },
          { text: `$${unitPrice.toFixed(2)}`, align: "center" },
          { text: `$${itemSubtotal.toFixed(2)}`, align: "right" }
        ];

        cells.forEach((cell, cellIdx) => {
          pdf.setFillColor(...C_LIGHT_BG);
          pdf.setDrawColor(...C_PRIMARY);
          pdf.setLineWidth(0.2);
          const cw = colWidths[cellIdx];
          pdf.rect(cellX, tableY, cw, 7.5, "FD");

          pdf.setTextColor(...C_PRIMARY);
          pdf.setFont("helvetica", cellIdx === 0 ? "bold" : "normal");
          const tX = cell.align === "right" ? cellX + cw - 2.5 : cell.align === "center" ? cellX + cw / 2 : cellX + 3;
          pdf.text(cell.text, tX, tableY + 4.8, { align: cell.align as "left" | "center" | "right" });
          cellX += cw;
        });
        tableY += 7.5;
      });

      // Plan discount row if applicable
      if (planDiscountPct > 0) {
        let cellX = MX;
        const discountCells = [
          `DESCUENTO ESPECIAL PLAN BASE (${planDiscountPct}%)`,
          "",
          "",
          `-$${planDiscountAmount.toFixed(2)}`
        ];
        discountCells.forEach((text, cellIdx) => {
          pdf.setFillColor(254, 242, 242); // soft red bg
          pdf.setDrawColor(...C_PRIMARY);
          pdf.setLineWidth(0.2);
          const cw = colWidths[cellIdx];
          pdf.rect(cellX, tableY, cw, 7, "FD");

          pdf.setTextColor(185, 28, 28); // deep red text
          pdf.setFont("helvetica", cellIdx === 0 ? "bolditalic" : "bold");
          const tX = cellIdx === 3 ? cellX + cw - 2.5 : cellIdx === 0 ? cellX + 3 : cellX + cw / 2;
          pdf.text(text, tX, tableY + 4.5, { align: cellIdx === 3 ? "right" : cellIdx === 0 ? "left" : "center" });
          cellX += cw;
        });
        tableY += 7;
      }
    }

    // Addons table rows (without "ADD-ON:" label)
    if (selectedAddons.length > 0) {
      selectedAddons.forEach((addon, idx) => {
        let cellX = MX;
        const addonTotal = addon.precio * addon.cantidad;
        const cleanAddonName = addon.nombre.replace(/^ADD-ON:\s*/i, '').toUpperCase();
        const cells = [
          { text: cleanAddonName, align: "left" },
          { text: String(addon.cantidad), align: "center" },
          { text: `$${addon.precio.toFixed(2)}`, align: "center" },
          { text: `$${addonTotal.toFixed(2)}`, align: "right" }
        ];

        cells.forEach((cell, cellIdx) => {
          const isOdd = idx % 2 === 1;
          pdf.setFillColor(...(isOdd ? C_LIGHT_BG : [255, 255, 255] as [number, number, number]));
          pdf.setDrawColor(...C_PRIMARY);
          pdf.setLineWidth(0.2);
          const cw = colWidths[cellIdx];
          pdf.rect(cellX, tableY, cw, 7.5, "FD");

          pdf.setTextColor(...C_PRIMARY);
          pdf.setFont("helvetica", cellIdx === 0 ? "bold" : "normal");
          const tX = cell.align === "right" ? cellX + cw - 2.5 : cell.align === "center" ? cellX + cw / 2 : cellX + 3;
          pdf.text(cell.text, tX, tableY + 4.8, { align: cell.align as "left" | "center" | "right" });
          cellX += cw;
        });
        tableY += 7.5;
      });

    }

    // Signatures table rows (without "FIRMA:" label)
    if (selectedSignatures.length > 0) {
      selectedSignatures.forEach((sig, idx) => {
        let cellX = MX;
        const sigTotal = sig.precio * sig.cantidad;
        const isPromo = sig.tipo.toUpperCase().includes("PROMO EMPRENDE");
        const cleanSigName = isPromo 
          ? `PROMO EMPRENDE (${sig.vigencia} - FIRMA ELECTRÓNICA + PLAN LIGHT)`
          : `${sig.tipo} (${sig.vigencia})`.replace(/^FIRMA:\s*/i, '').toUpperCase();
        const cells = [
          { text: cleanSigName, align: "left" },
          { text: String(sig.cantidad), align: "center" },
          { text: `$${sig.precio.toFixed(2)}`, align: "center" },
          { text: `$${sigTotal.toFixed(2)}`, align: "right" }
        ];

        cells.forEach((cell, cellIdx) => {
          const isOdd = idx % 2 === 1;
          pdf.setFillColor(...(isOdd ? C_LIGHT_BG : [255, 255, 255] as [number, number, number]));
          pdf.setDrawColor(...C_PRIMARY);
          pdf.setLineWidth(0.2);
          const cw = colWidths[cellIdx];
          pdf.rect(cellX, tableY, cw, 7.5, "FD");

          pdf.setTextColor(...C_PRIMARY);
          pdf.setFont("helvetica", cellIdx === 0 ? "bold" : "normal");
          const tX = cell.align === "right" ? cellX + cw - 2.5 : cell.align === "center" ? cellX + cw / 2 : cellX + 3;
          pdf.text(cell.text, tX, tableY + 4.8, { align: cell.align as "left" | "center" | "right" });
          cellX += cw;
        });
        tableY += 7.5;
      });
    }

    // 5. Side-by-Side Financial Summary Card (Right column on Page 1)
    const boxX = MX + 118 + 5;
    const boxW = PAGE_W - MX - boxX;
    const boxY = Math.max(54, lineY + 14);
    const boxH = Math.max(tableY - boxY, 40);

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...C_PRIMARY);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(boxX, boxY, boxW, boxH, 2, 2, "FD");

    // Title inside box
    pdf.setFillColor(...C_PRIMARY);
    pdf.rect(boxX + 0.2, boxY + 0.2, boxW - 0.4, 7.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...C_WHITE);
    pdf.text("RESUMEN DE INVERSIÓN", boxX + boxW / 2, boxY + 5.2, { align: "center" });

    // Financial line items inside box
    let boxLineY = boxY + 14;
    const drawBoxLine = (label: string, value: string, isTotal = false) => {
      pdf.setFont("helvetica", isTotal ? "bold" : "normal");
      pdf.setFontSize(isTotal ? 9.5 : 8);
      pdf.setTextColor(isTotal ? C_SECONDARY[0] : C_PRIMARY[0], isTotal ? C_SECONDARY[1] : C_PRIMARY[1], isTotal ? C_SECONDARY[2] : C_PRIMARY[2]);
      pdf.text(label, boxX + 3, boxLineY);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(isTotal ? 10.5 : 8);
      pdf.text(value, boxX + boxW - 3, boxLineY, { align: "right" });
      boxLineY += 5.5;
    };

    if (planSubtotal > 0) {
      drawBoxLine("Subtotal Plan:", `$${planSubtotal.toFixed(2)}`);
      if (planDiscountPct > 0) drawBoxLine(`Desc. Plan (${planDiscountPct}%):`, `-$${planDiscountAmount.toFixed(2)}`);
    }
    
    if (selectedAddons.length > 0) {
      drawBoxLine("Subtotal Adicionales:", `$${addonsSubtotal.toFixed(2)}`);
    }

    if (selectedSignatures.length > 0) {
      drawBoxLine("Subtotal Firmas SRI:", `$${signaturesSubtotal.toFixed(2)}`);
    }

    pdf.setDrawColor(...C_BORDER);
    pdf.setLineWidth(0.2);
    pdf.line(boxX + 2, boxLineY - 2, boxX + boxW - 2, boxLineY - 2);
    boxLineY += 1.5;

    drawBoxLine("Subtotal Neto:", `$${preTaxTotal.toFixed(2)}`);
    drawBoxLine("IVA (15%):", `$${taxAmount.toFixed(2)}`);
    
    pdf.setDrawColor(...C_PRIMARY);
    pdf.setLineWidth(0.4);
    pdf.line(boxX + 1.5, boxLineY - 2.5, boxX + boxW - 1.5, boxLineY - 2.5);
    boxLineY += 2;

    // Large banner total at the bottom of the card
    pdf.setFillColor(...C_PRIMARY);
    pdf.rect(boxX + 0.2, tableY - 10, boxW - 0.4, 9.8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...C_WHITE);
    pdf.text("TOTAL ESTIMADO USD", boxX + 4, tableY - 4);
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...C_SECONDARY);
    pdf.text(`$${grandTotal.toFixed(2)}`, boxX + boxW - 4, tableY - 4, { align: "right" });

    // 6. Client Notes block if present (rendered as full width framed box with cyan border & cream background matching layout)
    let nextY = tableY + 11;
    if (clientNotes.trim()) {
      const noteText = clientNotes.trim();
      const noteMaxWidth = PAGE_W - 2 * MX - 10;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      const noteLines = pdf.splitTextToSize(noteText, noteMaxWidth);
      const lineHeight = 4.2;
      const boxHeight = 11 + (noteLines.length * lineHeight);

      pdf.setFillColor(254, 252, 232); // light cream background
      pdf.setDrawColor(56, 189, 248); // sky cyan border matching image
      pdf.setLineWidth(0.4);

      pdf.roundedRect(MX, nextY, PAGE_W - 2 * MX, boxHeight, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42); // dark navy/black
      pdf.text("NOTA:", MX + 5, nextY + 5.5);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(30, 41, 59);
      pdf.text(noteText, MX + 5, nextY + 10.5, { maxWidth: noteMaxWidth, align: "justify" });

      nextY += boxHeight + 8;
    }

    // 7. Signature Footer Executive Section (Aligned at the very bottom of Page 1)
    const footerY = PAGE_H - 28;
    pdf.setDrawColor(...C_PRIMARY);
    pdf.setLineWidth(0.5);
    pdf.line(MX, footerY - 5, PAGE_W - MX, footerY - 5);

    // Left Column: Advisor name and title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...C_SECONDARY);
    pdf.text(advisorName.toUpperCase(), MX + 3, footerY + 2);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C_TEXT_DIM);
    pdf.text("Comercial Corporativo", MX + 3, footerY + 7);

    // Vertical Divider
    pdf.setDrawColor(...C_PRIMARY);
    pdf.setLineWidth(0.5);
    pdf.line(PAGE_W / 2, footerY - 2, PAGE_W / 2, footerY + 12);

    // Right Column: Phone and email
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(...C_PRIMARY);
    pdf.text(advisorPhone || "Contacto Corporativo", PAGE_W / 2 + 10, footerY + 2);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...C_TEXT_DIM);
    pdf.text(advisorEmail || "", PAGE_W / 2 + 10, footerY + 7);


    // ----------------- PAGE 2: TECHNICAL DETAILS -----------------
    pdf.addPage();
    drawPageStructure();

    // Logo on secondary page (checks for customLogo) - enlarged size
    let p2LogoH = 0;
    if (customLogo) {
      try {
        let logoW = 55; // enlarged default (was 38)
        p2LogoH = 25; // enlarged default (was 18)
        if (logoDimensions) {
          const aspect = logoDimensions.width / logoDimensions.height;
          // Bound within max-width 65mm and max-height 30mm (was 45 / 22)
          if (aspect > 65 / 30) {
            logoW = 65;
            p2LogoH = 65 / aspect;
          } else {
            p2LogoH = 30;
            logoW = 30 * aspect;
          }
        }
        pdf.addImage(customLogo, "JPEG", MX, 8, logoW, p2LogoH);
      } catch (e) {
        p2LogoH = 16;
      }
    } else {
      p2LogoH = 16;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...C_PRIMARY);
    pdf.text("FICHA TÉCNICA Y COBERTURA DE MÓDULOS", PAGE_W - MX, 17, { align: "right" });

    // Dynamic Header divider line ALWAYS positioned strictly below the logo on Page 2
    const p2LogoBottomY = customLogo ? (8 + p2LogoH) : 18;
    const p2LineY = Math.max(25, p2LogoBottomY + 4);

    pdf.setDrawColor(...C_PRIMARY);
    pdf.setLineWidth(0.5);
    pdf.line(MX, p2LineY, PAGE_W - MX, p2LineY);

    // Grid layout for 3 columns on Page 2
    const numCols = 3;
    const colW = (PAGE_W - 2 * MX - 8) / numCols;
    const colGap = 4;
    let cardY = p2LineY + 7;

    // Collect unique modules to display technical cards on Page 2
    const moduleSet = new Set<string>();

    // 1. From selected proposal plans (or viewed plan if none selected)
    if (selectedProposalPlans.length > 0) {
      selectedProposalPlans.forEach(p => {
        let planObj: Plan | undefined;
        Object.values(PLANES_DATA).forEach(planList => {
          const found = planList.find(item => item.nombre.toLowerCase() === p.nombre.toLowerCase());
          if (found) planObj = found;
        });
        const tier = planObj?.tier || (p.tipoPlan === "erp" ? "erp_start" : "basico");
        const mods = MODULOS_POR_TIER[tier] || [];
        mods.forEach(m => moduleSet.add(m));
      });
    } else if (hasPromoEmprendeSig) {
      // Include Plan Light modules (70 comprobantes, 1 usuario) + Impuestos
      const mods = MODULOS_POR_TIER["basico_sin_impuestos"] || [];
      mods.forEach(m => moduleSet.add(m));
      moduleSet.add("IMPUESTOS");
    } else if (viewedPlanObj) {
      const mods = MODULOS_POR_TIER[viewedPlanObj.tier] || [];
      mods.forEach(m => moduleSet.add(m));
    } else {
      (MODULOS_POR_TIER["basico"] || []).forEach(m => moduleSet.add(m));
    }

    if (hasPromoEmprendeSig) {
      const mods = MODULOS_POR_TIER["basico_sin_impuestos"] || [];
      mods.forEach(m => moduleSet.add(m));
      moduleSet.add("IMPUESTOS");
    }

    // 2. From selected add-ons (Módulos Adicionales)
    selectedAddons.forEach(addon => {
      const cleanName = addon.nombre.replace(/^ADD-ON:\s*/i, '').trim().toUpperCase();
      
      if (DETALLE_SUBMODULOS[cleanName]) {
        moduleSet.add(cleanName);
      } else {
        const matchedKey = Object.keys(DETALLE_SUBMODULOS).find(
          k => k.toUpperCase() === cleanName || cleanName.includes(k.toUpperCase())
        );
        if (matchedKey) {
          moduleSet.add(matchedKey);
        } else if (cleanName.includes("LIGHT") || cleanName.includes("BASE") || cleanName.includes("POWER")) {
          const mods = MODULOS_POR_TIER["basico_sin_impuestos"] || [];
          mods.forEach(m => moduleSet.add(m));
        }
      }
    });

    const tierModules = Array.from(moduleSet);

    tierModules.forEach((modName, mIdx) => {
      const colIdx = mIdx % numCols;
      if (mIdx > 0 && colIdx === 0) {
        cardY += 66; // advance to next row height
      }

      // Check if row exceeds page height and needs a new page
      if (cardY + 60 > PAGE_H - 10) {
        pdf.addPage();
        drawPageStructure();

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(...C_PRIMARY);
        pdf.text("FICHA TÉCNICA Y COBERTURA DE MÓDULOS", PAGE_W - MX, 17, { align: "right" });

        const newP2LineY = 25;
        pdf.setDrawColor(...C_PRIMARY);
        pdf.setLineWidth(0.5);
        pdf.line(MX, newP2LineY, PAGE_W - MX, newP2LineY);

        cardY = newP2LineY + 7;
      }

      const x = MX + colIdx * (colW + colGap);

      // Draw single module card
      pdf.setDrawColor(...C_PRIMARY);
      pdf.setLineWidth(0.25);
      pdf.setFillColor(...C_LIGHT_BG);
      pdf.roundedRect(x, cardY, colW, 60, 1.5, 1.5, "FD");

      // Module header
      pdf.setFillColor(...C_PRIMARY);
      pdf.rect(x + 0.2, cardY + 0.2, colW - 0.4, 6.5, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C_WHITE);
      pdf.text(`MÓDULO ${modName}`, x + colW / 2, cardY + 4.5, { align: "center" });

      // Submodules list inside card
      pdf.setTextColor(...C_PRIMARY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.8);

      const subList = DETALLE_SUBMODULOS[modName] || [];
      let itemY = cardY + 11;

      subList.slice(0, 11).forEach((itemText) => {
        if (itemText.startsWith("##")) {
          // Section header inside card
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...C_SECONDARY);
          pdf.text(itemText.replace("##", "").toUpperCase(), x + 3, itemY);
          pdf.setFont("helvetica", "normal");
        } else {
          // Bullet point
          pdf.setFillColor(...C_SECONDARY);
          pdf.circle(x + 3.5, itemY - 1, 0.45, "F");
          pdf.setTextColor(...C_PRIMARY);
          pdf.text(itemText, x + 5.5, itemY);
        }
        itemY += 4.1;
      });
    });

    // Page 2 bottom footer block removed (does not say anything about upconta)

    // Save PDF
    const safeClientName = clientName.trim().toUpperCase().replace(/\s+/g, "-") || "CLIENTE";
    pdf.save(`Propuesta-UpConta-${safeClientName}.pdf`);
    setPdfSuccess(true);
    setTimeout(() => setPdfSuccess(false), 5000);
  };

  // Helper to filter submodules or features based on user search
  const getFilteredSubmodules = (moduleName: string) => {
    const rawList = DETALLE_SUBMODULOS[moduleName] || [];
    if (!moduleSearchQuery.trim()) return rawList;
    return rawList.filter(item => 
      item.toLowerCase().includes(moduleSearchQuery.toLowerCase())
    );
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#f4f6f9] text-slate-800 font-sans selection:bg-[#0B2545]/20 antialiased pb-20">
      
      {/* Top Header Navigation */}
      <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-2.5">
          
          {/* Top Row: Logo & Platform Name */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3 shrink-0">
              <DynamicBrandLogo activeTab={activeTab} size="lg" className="shrink-0" />
              <div className="hidden sm:block h-8 w-[1px] bg-slate-200"></div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full animate-pulse ${
                    activeTab === "firmas" ? "bg-amber-500" : "bg-orange-500"
                  }`}></span>
                  <span className="uppercase tracking-widest text-[9.5px] font-black text-[#0B2545]">
                    {activeTab === "firmas"
                      ? "Firmas Electrónicas.ec by: anf"
                      : activeTab === "simulador"
                      ? "Cotizador Empresarial UpConta & ANF"
                      : activeTab === "contador"
                      ? "Calculadora Plan Contador UpConta"
                      : activeTab === "ventas"
                      ? "KPIer UpConta & ANF AC"
                      : activeTab === "dashboard"
                      ? "Dashboard Métrica de Ventas"
                      : "Plataforma Empresarial UpConta"}
                  </span>
                </div>
                <h1 className="text-xs font-bold tracking-tight text-slate-600 mt-0.5">
                  {activeTab === "firmas"
                    ? "Certificación Digital & Firmas SRI"
                    : activeTab === "simulador"
                    ? "Simulador Interactivo de Precios"
                    : activeTab === "contador"
                    ? "Calculadora Entorno UpConta"
                    : activeTab === "ventas"
                    ? "Registro Oficial de Ventas"
                    : activeTab === "dashboard"
                    ? "Métricas Estadísticas & Comisiones"
                    : "Fichas Técnicas & Cotizador"}
                </h1>
              </div>
            </div>

            {/* Quick billing cycle toggle - only shown when on Plan tab and ERP plan selected */}
            {activeTab === "plan" && tipoPlan === "erp" && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    billingCycle === "monthly" 
                      ? "bg-[#0B2545] text-white shadow" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pago Mensual
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    billingCycle === "annual" 
                      ? "bg-[#0B2545] text-white shadow" 
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Pago Anual</span>
                  <span className="bg-blue-100 text-[#0B2545] border border-blue-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    Anual
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Motivational Sales Ticker Banner - Full Width directly under Plataforma Empresarial UpConta */}
          <div className="w-full bg-gradient-to-r from-[#0B2545] via-[#003566] to-[#0B2545] text-white py-2 rounded-xl border border-orange-500/40 overflow-hidden relative shadow-md">
            <div className="animate-marquee flex items-center whitespace-nowrap">
              {[
                "“Las ventas no las cierran los mejores vendedores; las cierran quienes nunca dejan de dar seguimiento.”",
                "“La disciplina de hoy es la comisión de mañana.”",
                "“Las metas no se negocian; se trabajan todos los días.”",
                "“Las ventas no las cierran los mejores vendedores; las cierran quienes nunca dejan de dar seguimiento.”",
                "“La disciplina de hoy es la comisión de mañana.”",
                "“Las metas no se negocian; se trabajan todos los días.”"
              ].map((frase, idx) => (
                <div key={idx} className="flex items-center gap-4 sm:gap-6 mx-6 shrink-0">
                  <span className="bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1.5 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>MOTIVACIÓN</span>
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-black tracking-wide text-white drop-shadow-xs">
                    {frase}
                  </span>
                  <span className="text-amber-400 font-extrabold text-sm sm:text-base">★</span>
                </div>
              ))}
            </div>
          </div>

          {/* Underneath Logo & Motivation: INFO group on Left, Dashboard in Middle, COMERCIAL group on Right */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            
            {/* GROUP 1: INFO */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-1">
              <div className="px-2.5 py-1 bg-blue-500/10 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-200/50 flex items-center gap-1 shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>INFO</span>
              </div>

              <button
                onClick={() => setActiveTab("plan")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "plan"
                    ? "bg-[#0B2545] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Plan</span>
              </button>

              <button
                onClick={() => setActiveTab("firmas")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "firmas"
                    ? "bg-[#0B2545] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-orange-400" />
                <span>Firmas</span>
              </button>

              <button
                onClick={() => setActiveTab("explorador")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "explorador"
                    ? "bg-[#0B2545] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Explorador</span>
              </button>
            </div>

            {/* DASHBOARD BUTTON (STANDALONE 'Dashboard' IN THE MIDDLE BETWEEN INFO AND COMERCIAL) */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer shadow-md border-2 ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white border-amber-300 ring-2 ring-orange-400/50 scale-[1.03]"
                  : "bg-gradient-to-r from-[#0B2545] via-[#103460] to-[#0B2545] text-amber-300 hover:text-white border-orange-500/70 hover:border-orange-400 hover:scale-[1.02]"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span className="uppercase tracking-wider font-black">Dashboard</span>
            </button>

            {/* GROUP 2: COMERCIAL */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs gap-1">
              <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-200/50 flex items-center gap-1 shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>COMERCIAL</span>
              </div>

              <button
                onClick={() => setActiveTab("simulador")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "simulador"
                    ? "bg-[#0B2545] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulador</span>
              </button>

              <button
                onClick={() => setActiveTab("contador")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "contador"
                    ? "bg-[#0B2545] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Contador</span>
              </button>

              <button
                onClick={() => setActiveTab("ventas")}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "ventas"
                    ? "bg-[#0B2545] text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>KPIer Ventas</span>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* ==================================== TABS: PLAN (CATALOGUE & DETAILS) ==================================== */}
        {activeTab === "plan" && (
          <div className="space-y-8 animate-fade-in">
            {/* Step-by-Step Category Picker */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0B2545]" />
                1. Selecciona el Tipo de Plan Contable / Software
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Explora las capacidades analíticas de cada categoría de software para tus clientes o empresa.
              </p>
            </div>
            
            {/* Quick stats indicators */}
            <div className="flex gap-4 text-xs font-medium text-slate-500">
              <div>Facturación: <span className="text-[#0B2545] font-bold">8 planes</span></div>
              <div className="border-l border-slate-200 pl-4">ERP: <span className="text-[#0B2545] font-bold">3 planes</span></div>
              <div className="border-l border-slate-200 pl-4">Contador: <span className="text-[#0B2545] font-bold">6 planes</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            
            {/* Facturacion Tab */}
            <button
              onClick={() => setTipoPlan("facturacion")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                tipoPlan === "facturacion"
                  ? "bg-blue-50/60 border-[#0B2545] shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#0B2545]/10 border border-[#0B2545]/20 text-[#0B2545] rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">Lite-Mesa</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-3 flex items-center gap-1.5">
                Facturación Electrónica
                {tipoPlan === "facturacion" && <span className="w-1.5 h-1.5 rounded-full bg-[#0B2545] animate-ping"></span>}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Planes Up Light, Up Base, Power y Plus orientados a emisión fiscal ágil de comprobantes.
              </p>
            </button>

            {/* ERP Tab */}
            <button
              onClick={() => setTipoPlan("erp")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                tipoPlan === "erp"
                  ? "bg-blue-50/60 border-[#0B2545] shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#0B2545]/10 border border-[#0B2545]/20 text-[#0B2545] rounded-lg">
                  <Database className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">Full Control</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-3 flex items-center gap-1.5">
                ERP Administrativo Completo
                {tipoPlan === "erp" && <span className="w-1.5 h-1.5 rounded-full bg-[#0B2545] animate-ping"></span>}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                UpConta Start, Plus y Premium con inventarios multibodega, contabilidad integrada y nómina.
              </p>
            </button>

            {/* Contador Tab */}
            <button
              onClick={() => setTipoPlan("contador")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                tipoPlan === "contador"
                  ? "bg-blue-50/60 border-[#0B2545] shadow-sm"
                  : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#0B2545]/10 border border-[#0B2545]/20 text-[#0B2545] rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">Multi-RUC</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mt-3 flex items-center gap-1.5">
                Planes para Contadores
                {tipoPlan === "contador" && <span className="w-1.5 h-1.5 rounded-full bg-[#0B2545] animate-ping"></span>}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Suscripciones por volumen de empresas, Tax Ilimitado y Socio Estratégico Multiusuario.
              </p>
            </button>

          </div>
        </section>

        {/* Catalog & Explorer Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Plan Grid (5/12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Catálogo de Planes Disponibles
              </h3>
              <span className="text-[11px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                {activePlanList.length} Modelos
              </span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-2 scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {activePlanList.map((p) => {
                  const isSelected = selectedPlanName === p.nombre;
                  const metrics = extractQuickMetrics(p.modulos);
                  
                  let cyclePrice = p.precio;
                  let itemCycleLabel = "/mes";
                  if (tipoPlan === "erp") {
                    if (billingCycle === "annual") {
                      cyclePrice = p.precioAnual || (p.precio * 12);
                      itemCycleLabel = "/año";
                    } else {
                      cyclePrice = p.precio;
                      itemCycleLabel = "/mes";
                    }
                  } else {
                    cyclePrice = p.precio;
                    itemCycleLabel = "/mes";
                  }

                  return (
                    <motion.div
                      key={p.nombre}
                      layoutId={`plan-card-${p.nombre}`}
                      onClick={() => setSelectedPlanName(p.nombre)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "bg-white border-[#0B2545] shadow-md ring-1 ring-[#0B2545]"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {/* Left color bar for active status */}
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#0B2545]" />
                      )}

                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            {p.nombre}
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#0B2545]" />}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            Tier: {p.tier.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-slate-900">
                            ${cyclePrice.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold">
                            {itemCycleLabel}
                          </div>
                        </div>
                      </div>

                      {/* Quick specifications bullets */}
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{metrics.usuarios}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{metrics.comprobantes}</span>
                        </div>
                        {metrics.empresas && (
                          <div className="flex items-center gap-1.5 col-span-2 text-[#0B2545] font-bold">
                            <Building2 className="w-3.5 h-3.5 shrink-0 text-[#0B2545]" />
                            <span>{metrics.empresas}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Selected Plan Ficha Técnica & Interactive Tree (7/12 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {viewedPlanObj ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md">
                
                {/* Banner Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-200 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0B2545]/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 text-[#0B2545] text-[10px] font-extrabold rounded-md uppercase">
                        {tipoPlan}
                      </span>
                      <h3 className="text-xl font-black text-slate-850 mt-2 tracking-tight">
                        Ficha Técnica: {viewedPlanObj.nombre}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Estructura modular del plan y catálogo de submódulos normativos habilitados.
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-[#0B2545]">
                        ${(() => {
                          let displayPrice = viewedPlanObj.precio;
                          if (tipoPlan === "erp") {
                            if (billingCycle === "annual") {
                              displayPrice = viewedPlanObj.precioAnual || (viewedPlanObj.precio * 12);
                            }
                          }
                          return displayPrice.toFixed(2);
                        })()}
                      </div>
                      <span className="text-xs text-slate-500 font-bold block mt-0.5">
                        {(() => {
                          if (tipoPlan === "erp" && billingCycle === "annual") {
                            return "/año";
                          }
                          return "/mes";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical stats blocks */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 border-b border-slate-200">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Comprobantes</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">
                      {extractQuickMetrics(viewedPlanObj.modulos).comprobantes}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Usuarios</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1">
                      {extractQuickMetrics(viewedPlanObj.modulos).usuarios}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 col-span-2 md:col-span-1">
                    <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Límite Empresas</span>
                    <span className="text-xs font-bold text-[#0B2545] block mt-1">
                      {extractQuickMetrics(viewedPlanObj.modulos).empresas || "1 Empresa"}
                    </span>
                  </div>
                </div>

                {/* Submodule drilldown layout */}
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#0B2545]" />
                      Estructura Analítica de Módulos Activos
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Este plan habilita {MODULOS_POR_TIER[viewedPlanObj.tier]?.length || 0} módulos troncales. Haz clic en cualquiera para desglosar su catálogo de procesos específicos.
                    </p>
                  </div>

                  {/* Modules Pills Tab List */}
                  <div className="flex flex-wrap gap-2">
                    {(MODULOS_POR_TIER[viewedPlanObj.tier] || []).map((mName) => {
                      const isModuleActive = activeModule === mName;
                      return (
                        <button
                          key={mName}
                          onClick={() => setActiveModule(mName)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isModuleActive
                              ? "bg-[#0B2545] text-white shadow-md shadow-blue-950/10"
                              : "bg-slate-50 text-slate-600 hover:text-slate-950 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feature Checklist Breakdown */}
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-[#0B2545]" />
                        Catálogo de Procesos de {activeModule}
                      </span>

                      {/* Micro search input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar procesos..."
                          value={moduleSearchQuery}
                          onChange={(e) => setModuleSearchQuery(e.target.value)}
                          className="bg-white border border-slate-200 text-[10px] rounded px-2.5 py-1 text-slate-750 focus:outline-none focus:border-[#0B2545]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {getFilteredSubmodules(activeModule).map((item, idx) => {
                        const isHeader = item.startsWith("##");
                        const cleanItem = isHeader ? item.substring(2) : item;

                        if (isHeader) {
                          return (
                            <div key={idx} className="col-span-2 pt-3 pb-1 border-b border-slate-100 first:pt-0">
                              <span className="text-[9px] font-extrabold tracking-widest text-[#0B2545] uppercase">
                                {cleanItem}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                            <Check className="w-3.5 h-3.5 text-[#0B2545] shrink-0" />
                            <span className="font-light">{cleanItem}</span>
                          </div>
                        );
                      })}

                      {getFilteredSubmodules(activeModule).length === 0 && (
                        <div className="col-span-2 text-center py-4 text-xs text-slate-500">
                          Ningún proceso coincide con la búsqueda.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick checkout CTA */}
                  <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-xs text-slate-500">
                      ¿Deseas emitir una cotización para este plan?
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPlanName(viewedPlanObj.nombre);
                        handleAddProposalPlan(viewedPlanObj);
                        setCalcQuantity(1);
                        setActiveTab("simulador");
                        setTimeout(() => {
                          const calculatorSection = document.getElementById("cotizador-seccion");
                          if (calculatorSection) {
                            calculatorSection.scrollIntoView({ behavior: "smooth" });
                          }
                        }, 50);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0B2545] hover:bg-[#061830] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cargar en el Cotizador
                    </button>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
                Selecciona un plan del menú izquierdo para explorar su ficha técnica detallada.
              </div>
            )}
          </div>

        </div>

        {/* Pricing Comparison Matrix */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800">
              Tabla Comparativa de Planes ({tipoPlan.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Visualiza en paralelo los precios y capacidades para tomar una decisión comercial óptima.
            </p>
          </div>

          <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 text-slate-600 font-bold">Plan</th>
                  <th className="p-3 text-slate-600 font-bold">Precio Unitario</th>
                  <th className="p-3 text-slate-600 font-bold">Comprobantes</th>
                  <th className="p-3 text-slate-600 font-bold">Usuarios</th>
                  <th className="p-3 text-slate-600 font-bold">Módulos Troncales</th>
                  <th className="p-3 text-slate-600 font-bold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {activePlanList.map((p, index) => {
                  const metrics = extractQuickMetrics(p.modulos);
                  const isSelected = selectedPlanName === p.nombre;
                  
                  let cyclePrice = p.precio;
                  let itemCycleLabel = "/mes";
                  if (tipoPlan === "erp") {
                    if (billingCycle === "annual") {
                      cyclePrice = p.precioAnual || (p.precio * 12);
                      itemCycleLabel = "/año";
                    } else {
                      cyclePrice = p.precio;
                      itemCycleLabel = "/mes";
                    }
                  } else {
                    cyclePrice = p.precio;
                    itemCycleLabel = "/mes";
                  }

                  return (
                    <tr 
                      key={p.nombre} 
                      className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="p-3 font-bold text-slate-800">{p.nombre}</td>
                      <td className="p-3 font-extrabold text-slate-900">
                        ${cyclePrice.toFixed(2)}{itemCycleLabel}
                      </td>
                      <td className="p-3 text-slate-600">{metrics.comprobantes}</td>
                      <td className="p-3 text-slate-600">{metrics.usuarios}</td>
                      <td className="p-3 text-slate-500">
                        {MODULOS_POR_TIER[p.tier]?.join(", ") || "Estándar"}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => setSelectedPlanName(p.nombre)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? "bg-[#0B2545] text-white" 
                              : "bg-slate-100 text-slate-600 hover:text-slate-950"
                          }`}
                        >
                          {isSelected ? "Activo" : "Explorar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ==================================== TABS: PLAN END ==================================== */}
            {/* CTA Banner to the Simulator */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center shadow-sm max-w-3xl mx-auto mt-8">
              <h3 className="text-sm font-bold text-slate-800">¿Quieres cotizar el plan para tus clientes?</h3>
              <p className="text-xs text-slate-500 mt-1">Usa nuestro simulador interactivo para calcular precios, agregar firmas electrónicas y descargar propuestas en PDF.</p>
              <button 
                onClick={() => setActiveTab("simulador")}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B2545] hover:bg-[#061830] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Calculator className="w-4 h-4" />
                <span>Ir al Simulador de Cotizaciones</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================================== TABS: EXPLORAR MÓDULOS ==================================== */}
        {activeTab === "explorador" && (
          <div className="space-y-8 animate-fade-in">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
              {/* Directly render the Acceso al Sistema Real mockup full-width */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <AdminModuleMockups moduleName="Acceso al Sistema Real" />
              </div>
            </section>
          </div>
        )}

        {/* ==================================== TABS: SIMULADOR ==================================== */}
        {activeTab === "simulador" && (
          <div className="space-y-8 animate-fade-in">

        {/* Interactive Pricing Calculator / Cotizador (The main feature of Davecho's project) */}
        <section id="cotizador-seccion" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
          <div className="border-b border-slate-200 pb-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#0B2545]" />
              2. Simulador Contable de Cotizaciones Express
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Modela cotizaciones comerciales completas, aplica descuentos personalizados, agrega add-ons y comparte con tus clientes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            
            {/* Calculator Settings (7/12 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Form client info */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                  Datos del Prospecto / Empresa
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Razón Social / Nombre del Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Constructora El Cóndor S.A."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      RUC o Cédula de Identidad
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 1792434938001 (10 a 13 digitos)"
                      minLength={10}
                      maxLength={13}
                      value={clientRuc}
                      onChange={(e) => setClientRuc(e.target.value.replace(/\D/g, '').slice(0, 13))}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545]"
                    />
                    <span className="text-[9px] text-slate-400 font-medium">Mínimo 10, máximo 13 caracteres</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Notas o Condiciones Especiales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Escribe comentarios, vigencia de la oferta o acuerdos previos de pago..."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545] resize-none"
                  />
                </div>
              </div>

              {/* Base Plan Selection controls in quoter */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    Selección de Planes
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleAddProposalPlan()}
                    className="px-3.5 py-2 bg-[#0B2545] text-white hover:bg-[#061830] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Plan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Categoría de Plan
                    </label>
                    <select
                      value={tipoPlan}
                      onChange={(e) => {
                        const newCat = e.target.value as "facturacion" | "erp" | "contador";
                        setTipoPlan(newCat);
                        setSelectedPlanName("");
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#0B2545] cursor-pointer shadow-sm h-9"
                    >
                      <option value="facturacion">Facturación</option>
                      <option value="erp">ERP</option>
                      <option value="contador">Contadores</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Plan Seleccionado
                    </label>
                    <select
                      value={selectedPlanName}
                      onChange={(e) => {
                        setSelectedPlanName(e.target.value);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#0B2545] cursor-pointer shadow-sm h-9"
                    >
                      <option value="">-- Sin Plan Base (Ninguno) --</option>
                      {PLANES_DATA[tipoPlan].map((p) => (
                        <option key={p.nombre} value={p.nombre}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Cantidad de Licencias
                    </label>
                    <div className="flex items-center gap-2 h-9 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setCalcQuantity(Math.max(1, calcQuantity - 1))}
                        className="w-8 h-8 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-bold text-sm text-slate-800">{calcQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setCalcQuantity(calcQuantity + 1)}
                        className="w-8 h-8 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Valor Descuento (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ej: 10"
                        value={planDiscountPct === 0 ? "" : planDiscountPct}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setPlanDiscountPct(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-[#0B2545] h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons picker section */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">
                    Módulos Adicionales
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(tipoPlan === "contador" ? [...ADICIONALES_ESTANDAR, ...ADICIONALES_CONTADOR] : ADICIONALES_ESTANDAR).map((opt) => {
                    const isAdded = selectedAddons.some(a => a.nombre === opt.valor);
                    return (
                      <button
                        key={opt.valor}
                        onClick={() => handleAddAddon(opt.valor, opt.precio)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex justify-between items-center cursor-pointer ${
                          isAdded
                            ? "bg-blue-50 border-[#0B2545] text-slate-800 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <span className="font-bold block text-slate-800 text-[11px]">{opt.valor}</span>
                          <span className="text-[10px] text-slate-500">${opt.precio.toFixed(2)}</span>
                        </div>
                        <Plus className="w-4 h-4 text-[#0B2545]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Adicional Firmas Section */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0B2545]" />
                    Adicional Firmas Electrónicas
                  </h4>
                  
                  {/* Tab Selector for persona type */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm flex-wrap gap-1">
                    {(["PERSONA NATURAL", "PERSONA NATURAL RUC", "PERSONA JURIDICA", "PROMO EMPRENDE"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedSigType(t)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          selectedSigType === t
                            ? "bg-[#0B2545] text-white shadow"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {t === "PERSONA NATURAL" ? "Natural" : t === "PERSONA NATURAL RUC" ? "Natural RUC" : t === "PERSONA JURIDICA" ? "Jurídica" : "Promo Emprende"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid layout of available vigencias */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {FIRMAS_DATA.filter(f => f.tipo === selectedSigType).map((f) => {
                    const isAdded = selectedSignatures.some(s => s.tipo === f.tipo && s.vigencia === f.vigencia);
                    return (
                      <button
                        key={f.vigencia}
                        type="button"
                        onClick={() => handleAddSignature(f.tipo, f.vigencia, f.precio)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isAdded
                            ? "bg-blue-50 border-[#0B2545] text-slate-800 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-extrabold text-[10px] text-slate-800">{f.vigencia}</span>
                        <span className="text-[11px] text-[#0B2545] font-bold mt-1">${f.precio.toFixed(2)}</span>
                        <span className="text-[8px] text-slate-400 mt-1 block font-bold uppercase tracking-wider">Agregar</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commercial Advisor assignment (Manual fields) */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-750 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B2545]" />
                  Información del Asesor Comercial
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Nombre del Asesor
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={advisorName}
                      onChange={(e) => setAdvisorName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="Ingresa tu correo"
                      value={advisorEmail}
                      onChange={(e) => setAdvisorEmail(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0B2545]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center">
                      <span>Teléfono / WhatsApp</span>
                      <span className="text-[9px] font-normal lowercase text-slate-400">(10 dígitos)</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="0991234567"
                      value={advisorPhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setAdvisorPhone(digits);
                      }}
                      className={`bg-white border rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                        advisorPhone.length > 0 && advisorPhone.length < 10
                          ? "border-red-400 focus:border-red-500"
                          : advisorPhone.length === 10
                          ? "border-emerald-500 focus:border-emerald-600 ring-1 ring-emerald-500/20"
                          : "border-slate-200 focus:border-[#0B2545]"
                      }`}
                    />
                    {advisorPhone.length > 0 && advisorPhone.length < 10 && (
                      <span className="text-[9.5px] font-semibold text-red-500">
                        Ingresa exactamente 10 dígitos ({advisorPhone.length}/10)
                      </span>
                    )}
                    {advisorPhone.length === 10 && (
                      <span className="text-[9.5px] font-semibold text-emerald-600">
                        ✓ Número de 10 dígitos válido
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom PDF styling & branding panel */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-705 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0B2545]" />
                  Personalización Estética del PDF Oficial
                </h4>

                {/* Logo Upload Dropzone */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Logotipo Corporativo (Impreso en el PDF)
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8">
                      <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-white hover:border-[#0B2545]/50 transition-all flex flex-col items-center justify-center text-center relative cursor-pointer group shadow-sm">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Image className="w-6 h-6 text-slate-400 mb-1 group-hover:text-[#0B2545] transition-colors" />
                        <span className="text-xs font-semibold text-slate-700">
                          {customLogoName ? "Cambiar Imagen de Logotipo" : "Subir Logotipo de Empresa"}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5">
                          Formatos admitidos: PNG, JPG, JPEG (Se escala automáticamente)
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200 h-24 shadow-sm">
                      {customLogo ? (
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <img
                            src={customLogo}
                            alt="Logo personalizado"
                            className="max-h-12 max-w-full object-contain rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomLogo("");
                              setCustomLogoName("");
                            }}
                            className="text-[9px] font-bold text-red-600 hover:text-red-750 transition-colors bg-red-50 px-2 py-0.5 rounded cursor-pointer border border-red-200"
                          >
                            Quitar Logo
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-500 italic">
                          Sin logotipo cargado
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Background Watermark Image Upload Dropzone (Directly below logo upload) */}
                <div className="space-y-2 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Imagen de Fondo / Marca de Agua (Cubre las 2 Hojas)
                    </span>
                    {pdfBgImage && (
                      <span className="text-[10px] font-black text-[#0B2545] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        Opacidad: {Math.round(pdfBgOpacity * 100)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8">
                      <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-white hover:border-[#0B2545]/50 transition-all flex flex-col items-center justify-center text-center relative cursor-pointer group shadow-sm">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBgImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Image className="w-6 h-6 text-slate-400 mb-1 group-hover:text-[#0B2545] transition-colors" />
                        <span className="text-xs font-semibold text-slate-700">
                          {pdfBgImageName ? "Cambiar Imagen de Fondo / Marca de Agua" : "Subir Imagen de Fondo para el PDF"}
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5">
                          Formatos admitidos: PNG, JPG, JPEG (Cubre las 2 páginas del PDF)
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200 h-24 shadow-sm">
                      {pdfBgImage ? (
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <img
                            src={pdfBgImage}
                            alt="Fondo de agua"
                            className="max-h-10 max-w-full object-contain rounded border border-slate-200"
                            style={{ opacity: pdfBgOpacity }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPdfBgImage("");
                              setPdfBgImageName("");
                            }}
                            className="text-[9px] font-bold text-red-600 hover:text-red-750 transition-colors bg-red-50 px-2 py-0.5 rounded cursor-pointer border border-red-200"
                          >
                            Quitar Fondo
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-500 italic">
                          Sin marca de agua
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Watermark opacity control */}
                  {pdfBgImage && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                      <div className="flex justify-between items-center text-[10px]">
                        <label className="font-bold text-slate-700">Intensidad de Transparencia (Marca de Agua):</label>
                        <span className="font-mono text-[#0B2545] font-bold">{Math.round(pdfBgOpacity * 100)}% opacidad</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.50"
                        step="0.01"
                        value={pdfBgOpacity}
                        onChange={(e) => setPdfBgOpacity(parseFloat(e.target.value))}
                        className="w-full accent-[#0B2545] cursor-pointer h-1.5 bg-slate-100 rounded-lg"
                      />
                      <div className="flex justify-between text-[8.5px] text-slate-400 font-medium">
                        <span>Sutil (5%)</span>
                        <span>Recomendado (15%)</span>
                        <span>Intenso (50%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-made Palette Options */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Paletas de Colores de Antemano (10 Temas Oficiales)
                    </span>
                    <button
                      type="button"
                      onClick={() => setColorPickerTarget("bg")}
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0B2545] hover:text-[#061830] bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Palette className="w-3.5 h-3.5 text-[#0B2545]" />
                      <span>Abrir Abanico de Colores</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { nombre: "Azul UpConta Oficial", bg: "#0b2545", title: "#0b2545", sub: "#475569" },
                      { nombre: "Azul Profesional", bg: "#0b3c5d", title: "#0b3c5d", sub: "#46505a" },
                      { nombre: "Esmeralda", bg: "#065f46", title: "#065f46", sub: "#475569" },
                      { nombre: "Gris Oscuro Premium", bg: "#1e293b", title: "#1e293b", sub: "#64748b" },
                      { nombre: "Azul Noche", bg: "#0a1128", title: "#0a1128", sub: "#94a3b8" },
                      { nombre: "Púrpura Elegante", bg: "#5b21b6", title: "#5b21b6", sub: "#4b5563" },
                      { nombre: "Cobre Corporativo", bg: "#7c2d12", title: "#7c2d12", sub: "#64748b" },
                      { nombre: "Granate Ejecutivo", bg: "#881337", title: "#881337", sub: "#475569" },
                      { nombre: "Zafiro Clásico", bg: "#1e3a8a", title: "#1e3a8a", sub: "#64748b" },
                      { nombre: "Obsidiana Dorada", bg: "#0f172a", title: "#0f172a", sub: "#94a3b8" }
                    ].map((paleta) => {
                      const isSelected = pdfBgColor === paleta.bg && pdfTitleColor === paleta.title && pdfSubtitleColor === paleta.sub;
                      return (
                        <button
                          key={paleta.nombre}
                          type="button"
                          onClick={() => {
                            setPdfBgColor(paleta.bg);
                            setPdfTitleColor(paleta.title);
                            setPdfSubtitleColor(paleta.sub);
                          }}
                          className={`p-1.5 rounded-lg border text-left flex flex-col justify-between cursor-pointer transition-all ${
                            isSelected
                              ? "bg-slate-100 border-[#0B2545] shadow-sm ring-1 ring-[#0B2545]"
                              : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <span className="text-[9px] font-extrabold text-slate-700 truncate block w-full">{paleta.nombre}</span>
                          <div className="flex gap-1 mt-1">
                            <span className="w-3.5 h-3.5 rounded border border-slate-100 block" style={{ backgroundColor: paleta.bg }} title="Fondo" />
                            <span className="w-3.5 h-3.5 rounded border border-slate-100 block" style={{ backgroundColor: paleta.title }} title="Título" />
                            <span className="w-3.5 h-3.5 rounded border border-slate-100 block" style={{ backgroundColor: paleta.sub }} title="Subtítulo" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PDF Colors Selection (Grid layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
                  
                  {/* PDF Bg color setting */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Fondo de Encabezados
                      </label>
                      <button
                        type="button"
                        onClick={() => setColorPickerTarget("bg")}
                        className="text-[9px] font-bold text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Abrir abanico de colores"
                      >
                        <Palette className="w-3 h-3 text-[#0B2545]" />
                        <span>Abanico</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfBgColor}
                        onChange={(e) => setPdfBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-600 uppercase">{pdfBgColor}</span>
                    </div>
                  </div>

                  {/* PDF Title color setting */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Color de Título
                      </label>
                      <button
                        type="button"
                        onClick={() => setColorPickerTarget("title")}
                        className="text-[9px] font-bold text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Abrir abanico de colores"
                      >
                        <Palette className="w-3 h-3 text-[#0B2545]" />
                        <span>Abanico</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfTitleColor}
                        onChange={(e) => setPdfTitleColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-600 uppercase">{pdfTitleColor}</span>
                    </div>
                  </div>

                  {/* PDF Subtitle color setting */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Color de Subtítulos
                      </label>
                      <button
                        type="button"
                        onClick={() => setColorPickerTarget("sub")}
                        className="text-[9px] font-bold text-[#0B2545] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Abrir abanico de colores"
                      >
                        <Palette className="w-3 h-3 text-[#0B2545]" />
                        <span>Abanico</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfSubtitleColor}
                        onChange={(e) => setPdfSubtitleColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-300 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-600 uppercase">{pdfSubtitleColor}</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* LIVE INVOICE PREVIEW (5/12 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-6 space-y-6 relative sticky top-24 shadow-sm">
                
                {/* Stamp overlay */}
                <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md">
                  Simulación Activa
                </div>

                <div className="border-b border-slate-200 pb-4">
                  <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase block">Resumen de Propuesta</span>
                  <h4 className="text-sm font-extrabold text-[#0B2545]">COTIZADOR UPCONTA & ANF</h4>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Emisión: {new Date().toLocaleDateString("es-ES")} • ECUADOR
                  </div>
                </div>

                {/* Proposal Line items details */}
                <div className="space-y-4 text-xs">
                  {/* Customer Block */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Cliente</div>
                    <div className="font-bold text-slate-800 text-[11px] mt-0.5">{clientName || "Propuesta Estimada"}</div>
                    {clientRuc && <div className="text-slate-500 text-[10px]">RUC: {clientRuc}</div>}
                  </div>

                  {/* Selected Proposal Plans */}
                  {selectedProposalPlans.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Planes Incluidos</span>
                      {selectedProposalPlans.map((plan) => {
                        const unitPrice = plan.precioPersonalizado !== null ? plan.precioPersonalizado : plan.precioBase;
                        const itemSubtotal = unitPrice * plan.cantidad;
                        return (
                          <div key={plan.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-xs">PLAN {plan.nombre}</span>
                                  <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                    {plan.tipoPlan}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  {plan.billingCycle === "annual" ? "Facturación Anual" : "Facturación Mensual"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-xs">
                                  Subtotal: ${itemSubtotal.toFixed(2)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProposalPlan(plan.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Borrar plan de la propuesta"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cant:</span>
                                <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProposalPlanQty(plan.id, plan.cantidad - 1)}
                                    className="text-[10px] font-black text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                                    title="Disminuir licencias"
                                  >
                                    -
                                  </button>
                                  <span className="text-[10px] font-bold text-slate-800">{plan.cantidad}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateProposalPlanQty(plan.id, plan.cantidad + 1)}
                                    className="text-[10px] font-black text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                                    title="Aumentar licencias"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 transition-all">
                                <span className="text-[9.5px] text-slate-400 font-bold">Precio Unit: $</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={unitPrice}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    handleUpdateProposalPlanPrice(plan.id, isNaN(val) ? 0 : val);
                                  }}
                                  className="w-16 bg-transparent text-right font-black text-xs text-slate-850 focus:outline-none p-0 border-none"
                                  title="Establecer precio personalizado para el plan"
                                />
                                <span className="text-[9.5px] text-slate-400 font-bold">{plan.cycleLabel}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Base Plan Discount if applicable */}
                  {selectedProposalPlans.length > 0 && planDiscountPct > 0 && (
                    <div className="flex justify-between items-center text-xs text-red-600 font-medium bg-red-50 p-2 border border-red-100 rounded">
                      <span>Descuento de Plan ({planDiscountPct}%)</span>
                      <span>-${planDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Addons summary listing */}
                  {selectedAddons.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Módulos Extra (Add-ons)</span>
                      
                      <div className="space-y-2">
                        {selectedAddons.map((addon) => {
                          const addonTotal = addon.precio * addon.cantidad;
                          return (
                            <div key={addon.nombre} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-700">• {addon.nombre}</span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAddonQty(addon.nombre, addon.cantidad - 1)}
                                      className="text-[10px] font-black text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                                      title="Disminuir cantidad"
                                    >
                                      -
                                    </button>
                                    <span className="text-[10px] font-bold text-slate-800">{addon.cantidad}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateAddonQty(addon.nombre, addon.cantidad + 1)}
                                      className="text-[10px] font-black text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                                      title="Aumentar cantidad"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="font-extrabold text-slate-800">${addonTotal.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modificar Precio:</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                    <span className="text-slate-400 text-[10px] font-bold">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={addon.precio}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        handleUpdateAddonPrice(addon.nombre, isNaN(val) ? 0 : val);
                                      }}
                                      className="w-12 bg-transparent text-right font-bold text-[11px] text-slate-750 focus:outline-none p-0 border-none"
                                      title="Modificar precio unitario del Add-on"
                                    />
                                    <span className="text-[9px] text-slate-400 font-bold">{cycleLabel}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAddon(addon.nombre)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Eliminar de la propuesta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Selected Signatures listing */}
                  {selectedSignatures.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Firmas Electrónicas</span>
                      
                      <div className="space-y-2">
                        {selectedSignatures.map((sig) => {
                          const sigTotal = sig.precio * sig.cantidad;
                          return (
                            <div key={`${sig.tipo}-${sig.vigencia}`} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-slate-700">
                                  • {sig.tipo === "PERSONA NATURAL" ? "P. Natural" : sig.tipo === "PERSONA NATURAL RUC" ? "P. Natural RUC" : sig.tipo === "PERSONA JURIDICA" ? "P. Jurídica" : "Promo Emprende"} ({sig.vigencia})
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSignatureQty(sig.tipo, sig.vigencia, sig.cantidad - 1)}
                                      className="text-[10px] font-black text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                                      title="Disminuir cantidad"
                                    >
                                      -
                                    </button>
                                    <span className="text-[10px] font-bold text-slate-800">{sig.cantidad}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSignatureQty(sig.tipo, sig.vigencia, sig.cantidad + 1)}
                                      className="text-[10px] font-black text-slate-600 hover:text-slate-900 px-1 cursor-pointer"
                                      title="Aumentar cantidad"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="font-extrabold text-slate-800">${sigTotal.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modificar Precio:</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                    <span className="text-slate-400 text-[10px] font-bold">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={sig.precio}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        handleUpdateSignaturePrice(sig.tipo, sig.vigencia, isNaN(val) ? 0 : val);
                                      }}
                                      className="w-12 bg-transparent text-right font-bold text-[11px] text-slate-750 focus:outline-none p-0 border-none"
                                      title="Modificar precio unitario de la Firma"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSignature(sig.tipo, sig.vigencia)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Eliminar de la propuesta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Financial calculation block */}
                  <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Neto</span>
                      <span className="font-semibold text-slate-800">${preTaxTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>IVA (15%) Ecuador</span>
                      <span className="font-semibold text-slate-800">${taxAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-slate-800 text-sm font-black pt-2 border-t border-dashed border-slate-300">
                      <span>Total Estimado</span>
                      <span className="text-[#0B2545] font-extrabold text-base">${grandTotal.toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Copy / Share / Download Action Trigger Grid */}
                <div className="space-y-2">
                  <button
                    onClick={handleGenerarPDF}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0B2545] hover:bg-[#061830] text-white rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer shadow-md border border-[#0B2545]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar Propuesta Oficial PDF</span>
                  </button>

                  <button
                    onClick={copyToClipboard}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
                  >
                    <Share2 className="w-4 h-4 text-[#0B2545]" />
                    <span>Copiar Propuesta al Portapapeles</span>
                  </button>

                  <button
                    onClick={shareOnWhatsApp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>

                {/* Copied / Shared / PDF Success Toast Alerts */}
                <AnimatePresence>
                  {pdfSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-blue-50 border border-blue-200 text-[#0B2545] text-xs p-3 rounded-lg text-center font-semibold"
                    >
                      ¡Documento PDF de Propuesta generado y descargado con éxito!
                    </motion.div>
                  )}

                  {quoteCopied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-blue-50 border border-blue-200 text-[#0B2545] text-xs p-3 rounded-lg text-center font-semibold"
                    >
                      ¡Propuesta copiada correctamente al portapapeles para enviar por Email o Chat!
                    </motion.div>
                  )}

                  {quoteShared && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-lg text-center font-semibold"
                    >
                      Abriendo canal de WhatsApp para enviar la cotización...
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

          </div>
        </section>
          </div>
        )}

        {/* ==================================== TABS: FIRMAS ELECTRÓNICAS VIGENTES ==================================== */}
        {activeTab === "firmas" && (
          <div className="space-y-8 animate-fade-in">
            {/* Main Interactive Catalog & Details Grid */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-6">
              <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-orange-500" />
                    <span>Catálogo &amp; Solicitud de Firmas Electrónicas</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecciona un tipo de firma en el catálogo para ver tarifas, beneficios e instructivo de requisitos.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Emisión Rápida Acreditada ANF AC</span>
                </div>
              </div>

              {/* 2-Column Catalog Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT SIDE: Catálogo de Productos / Tipos de Firma (4 cols) */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 px-1 pb-1">
                    <Layers className="w-4 h-4 text-[#0B2545]" />
                    <span>Catálogo de productos</span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Item 1: Persona Natural */}
                    <button
                      type="button"
                      onClick={() => setFirmaTypeSelect("PERSONA NATURAL")}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        firmaTypeSelect === "PERSONA NATURAL"
                          ? "bg-blue-50/80 border-[#0B2545] shadow-sm ring-1 ring-[#0B2545]"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${firmaTypeSelect === "PERSONA NATURAL" ? "bg-[#0B2545] text-white" : "bg-blue-100 text-[#0B2545]"}`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Persona Natural</h3>
                            <span className="text-[11px] text-slate-500 font-medium">Sin RUC / Uso Personal</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-blue-100 text-[#0B2545] border border-blue-200 px-2 py-0.5 rounded-full">
                          Personal
                        </span>
                      </div>
                    </button>

                    {/* Item 2: Persona Natural con RUC */}
                    <button
                      type="button"
                      onClick={() => setFirmaTypeSelect("PERSONA NATURAL RUC")}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        firmaTypeSelect === "PERSONA NATURAL RUC"
                          ? "bg-orange-50/80 border-orange-500 shadow-sm ring-1 ring-orange-500"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${firmaTypeSelect === "PERSONA NATURAL RUC" ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"}`}>
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Persona Natural RUC</h3>
                            <span className="text-[11px] text-slate-500 font-medium">Profesionales &amp; Comerciantes</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full">
                          Facturación SRI
                        </span>
                      </div>
                    </button>

                    {/* Item 3: Persona Jurídica */}
                    <button
                      type="button"
                      onClick={() => setFirmaTypeSelect("PERSONA JURIDICA")}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        firmaTypeSelect === "PERSONA JURIDICA"
                          ? "bg-purple-50/80 border-purple-600 shadow-sm ring-1 ring-purple-600"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${firmaTypeSelect === "PERSONA JURIDICA" ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"}`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Persona Jurídica</h3>
                            <span className="text-[11px] text-slate-500 font-medium">Empresas &amp; Reps. Legales</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
                          Empresarial
                        </span>
                      </div>
                    </button>

                    {/* Item 4: Promo Emprende */}
                    <button
                      type="button"
                      onClick={() => setFirmaTypeSelect("PROMO EMPRENDE")}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                        firmaTypeSelect === "PROMO EMPRENDE"
                          ? "bg-amber-50/90 border-amber-500 shadow-sm ring-1 ring-amber-500"
                          : "bg-gradient-to-r from-amber-50/60 to-orange-50/60 border-amber-200 hover:border-amber-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${firmaTypeSelect === "PROMO EMPRENDE" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-800"}`}>
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Promo Emprende</h3>
                            <span className="text-[11px] text-amber-900 font-semibold">Firma + Facturación UpConta</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Promo
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* RIGHT SIDE: Product Details, Vigencia & Requirements (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Selected Product Card Header */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-[#0B2545] text-white shadow-sm">
                          {firmaTypeSelect === "PERSONA NATURAL" && <User className="w-6 h-6" />}
                          {firmaTypeSelect === "PERSONA NATURAL RUC" && <Briefcase className="w-6 h-6" />}
                          {firmaTypeSelect === "PERSONA JURIDICA" && <Building2 className="w-6 h-6" />}
                          {firmaTypeSelect === "PROMO EMPRENDE" && <Sparkles className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900">
                              {firmaTypeSelect === "PERSONA NATURAL" && "Firma Electrónica Persona Natural"}
                              {firmaTypeSelect === "PERSONA NATURAL RUC" && "Firma Electrónica Persona Natural con RUC"}
                              {firmaTypeSelect === "PERSONA JURIDICA" && "Firma Electrónica Persona Jurídica"}
                              {firmaTypeSelect === "PROMO EMPRENDE" && "Paquete Promo Emprende (Firma + Facturación)"}
                            </h3>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">Formato oficial .p12 / .pfx entregado de forma inmediata por ANF AC</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-[#0B2545] text-white px-3 py-1 rounded-full shadow-2xs">
                        Validez SRI &amp; Trámites
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {firmaTypeSelect === "PERSONA NATURAL" && "Diseñada para ciudadanos que requieren firmar trámites en instituciones públicas, contratos de arrendamiento, escrituras, declaraciones personales ante el SRI o gestiones legales."}
                      {firmaTypeSelect === "PERSONA NATURAL RUC" && "Para profesionales independientes, comerciantes, artesanos y contribuyentes con RUC. Es el requisito oficial para emitir facturas, retenciones y comprobantes en el SRI."}
                      {firmaTypeSelect === "PERSONA JURIDICA" && "Otorgada a Representantes Legales, Gerentes o Apoderados de sociedades (S.A.S., Cía. Ltda., S.A.). Certifica la representación empresarial para facturación masiva y trámites corporativos."}
                      {firmaTypeSelect === "PROMO EMPRENDE" && "Plan preferencial para emprendedores y nuevos negocios. Incluye la firma electrónica de ANF más el sistema de facturación UpConta de 70 comprobantes al año, catálogo de productos, servicios y módulo de impuestos."}
                    </p>

                    {/* Vigencias y Tarifas Grid */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-200">
                      <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider block">
                        Vigencias Disponibles &amp; Precios Finales (IVA 15% Incluido):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {FIRMAS_DATA.filter(f => f.tipo === firmaTypeSelect).map((item) => (
                          <div 
                            key={item.vigencia} 
                            className="bg-white border border-slate-200 hover:border-orange-400 p-3 rounded-xl text-center shadow-2xs transition-all space-y-0.5 group"
                          >
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">{item.vigencia}</span>
                            <span className="text-base font-black text-slate-900 group-hover:text-orange-600">${item.precio.toFixed(2)}</span>
                            <span className="text-[9.5px] text-emerald-600 font-bold block">IVA Incluido</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Beneficios Destacados */}
                    <div className="bg-gradient-to-r from-[#0B2545] to-[#003366] text-white p-4 rounded-xl border border-blue-900 shadow-sm space-y-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Beneficios &amp; Servicios Exclusivos Incluidos:</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-100">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>Validez SRI &amp; Comprobantes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>Plataforma de Preservación Nube</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>App Móvil para Firmar PDFs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                          <span>Módulo de Gestión &amp; Cambio de PIN</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REQUISITOS DE SOLICITUD BOX WITH COPY BUTTON */}
                  <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3.5">
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-400 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <span>Requisitos de Solicitud ({firmaTypeSelect === "PERSONA JURIDICA" ? "Persona Jurídica" : "Persona Natural / RUC / Promo"})</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Adjunta la siguiente documentación legible para la emisión inmediata de tu firma.
                        </p>
                      </div>

                      {/* Copy Requirements Button */}
                      <button
                        type="button"
                        onClick={() => handleCopyRequirements(
                          firmaTypeSelect === "PERSONA JURIDICA"
                            ? `Formatos de archivos: Imagen o Pdf. 📂\n\n✅ Cédula o pasaporte ambos lados a color, legible y vigente.\n\n✅ Fotografía sosteniendo la cédula o pasaporte por la parte frontal a la altura de su cuello.\n\n✅ Certificado de Ruc.\n✅ Nombramiento \n✅ Constitución\n✅ Comprobante de pago.\n \nDATOS DEL TITULAR DE LA FIRMA: 📧📲\n\n✅ Correo electrónico personal:\n✅ Correo electrónico de la empresa:\n✅ Celular:\n✅ Dirección de domicilio:\n✅ Provincia de residencia: \n✅ Ciudad de residencia:`
                            : `Formatos de archivos: Imagen o Pdf. 📂\n\n✅ Cédula o pasaporte, ambos lados, a color, legible y vigente.\n\n✅ Fotografía sosteniendo la cédula o pasaporte por la parte frontal a la altura de su cuello.\n\n✅ Comprobante de pago.\n\n✅ Certificado Ruc.\n \nDatos del titular de la firma electrónica: 📧📲\n\n✅ Correo electrónico personal:\n✅ Celular:\n✅ Dirección de domicilio:\n✅ Provincia de residencia: \n✅ Ciudad de residencia:`
                        )}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer shrink-0 border border-emerald-400/40"
                      >
                        {copiedRequirements ? (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>¡Requisitos Copiados!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-white" />
                            <span>Copiar Requisitos</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Formatted Text View of Requirements */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed space-y-3 selection:bg-amber-500 selection:text-slate-950">
                      {firmaTypeSelect === "PERSONA JURIDICA" ? (
                        <>
                          <p className="font-bold text-amber-300">Formatos de archivos: Imagen o Pdf. 📂</p>
                          <ul className="space-y-1.5 pl-1">
                            <li>✅ Cédula o pasaporte ambos lados a color, legible y vigente.</li>
                            <li>✅ Fotografía sosteniendo la cédula o pasaporte por la parte frontal a la altura de su cuello.</li>
                            <li>✅ Certificado de Ruc.</li>
                            <li>✅ Nombramiento</li>
                            <li>✅ Constitución</li>
                            <li>✅ Comprobante de pago.</li>
                          </ul>
                          <p className="font-bold text-amber-300 pt-2 border-t border-slate-800">DATOS DEL TITULAR DE LA FIRMA: 📧📲</p>
                          <ul className="space-y-1 pl-1 text-slate-300">
                            <li>✅ Correo electrónico personal:</li>
                            <li>✅ Correo electrónico de la empresa:</li>
                            <li>✅ Celular:</li>
                            <li>✅ Dirección de domicilio:</li>
                            <li>✅ Provincia de residencia:</li>
                            <li>✅ Ciudad de residencia:</li>
                          </ul>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-amber-300">Formatos de archivos: Imagen o Pdf. 📂</p>
                          <ul className="space-y-1.5 pl-1">
                            <li>✅ Cédula o pasaporte, ambos lados, a color, legible y vigente.</li>
                            <li>✅ Fotografía sosteniendo la cédula o pasaporte por la parte frontal a la altura de su cuello.</li>
                            <li>✅ Comprobante de pago.</li>
                            <li>✅ Certificado Ruc.</li>
                          </ul>
                          <p className="font-bold text-amber-300 pt-2 border-t border-slate-800">Datos del titular de la firma electrónica: 📧📲</p>
                          <ul className="space-y-1 pl-1 text-slate-300">
                            <li>✅ Correo electrónico personal:</li>
                            <li>✅ Celular:</li>
                            <li>✅ Dirección de domicilio:</li>
                            <li>✅ Provincia de residencia:</li>
                            <li>✅ Ciudad de residencia:</li>
                          </ul>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* TABLA COMPARATIVA DE TIPOS DE FIRMA AT THE BOTTOM */}
              <div className="pt-8 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#0B2545]" />
                    <span>Tabla Comparativa de Modalidades de Firma Electrónica</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">Precios finales incluyen el 15% de IVA</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0B2545] text-white font-bold uppercase text-[10.5px] tracking-wider">
                        <th className="p-3.5 border-b border-slate-800">Tipo de Firma</th>
                        <th className="p-3.5 border-b border-slate-800">Dirigido a</th>
                        <th className="p-3.5 border-b border-slate-800">Vigencias</th>
                        <th className="p-3.5 border-b border-slate-800">Precios (IVA Incl.)</th>
                        <th className="p-3.5 border-b border-slate-800">Validez SRI &amp; App</th>
                        <th className="p-3.5 border-b border-slate-800">Requisitos Clave</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {/* Row 1: Persona Natural */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Persona Natural</span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">Ciudadanos sin RUC para trámites públicos o contratos</td>
                        <td className="p-3.5 font-bold text-slate-700">15 Días a 5 Años</td>
                        <td className="p-3.5 font-black text-slate-900">$6.90 – $55.41</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Incluido
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">Cédula, Foto Rostro, Pago, Certificado RUC (si aplica)</td>
                      </tr>

                      {/* Row 2: Persona Natural RUC */}
                      <tr className="hover:bg-slate-50/80 transition-colors bg-slate-50/30">
                        <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-orange-500 shrink-0" />
                          <span>Persona Natural RUC</span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">Profesionales independientes, comerciantes y artesanos con RUC</td>
                        <td className="p-3.5 font-bold text-slate-700">1 Año a 5 Años</td>
                        <td className="p-3.5 font-black text-slate-900">$18.20 – $55.41</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Incluido
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">Cédula, Foto Rostro, Pago, RUC</td>
                      </tr>

                      {/* Row 3: Persona Jurídica */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <span>Persona Jurídica</span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">Representantes Legales de empresas (S.A.S., Cía Ltda, S.A.)</td>
                        <td className="p-3.5 font-bold text-slate-700">1 Año a 5 Años</td>
                        <td className="p-3.5 font-black text-slate-900">$21.84 – $63.12</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Incluido
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">Cédula, Foto Rostro, RUC, Nombramiento, Constitución</td>
                      </tr>

                      {/* Row 4: Promo Emprende */}
                      <tr className="hover:bg-amber-50/50 transition-colors bg-amber-50/20">
                        <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>Promo Emprende</span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">Pymes y emprendedores (Firma + Sistema de Facturación UpConta)</td>
                        <td className="p-3.5 font-bold text-slate-700">1 Año a 3 Años</td>
                        <td className="p-3.5 font-black text-slate-900">$24.00 – $38.00</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-black text-[10px]">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            Incluye Facturación
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 text-[11px]">Cédula, Foto Rostro, Pago, RUC</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </section>
          </div>
        )}

        {/* ==================================== TABS: PLAN CONTADOR ==================================== */}
        {activeTab === "contador" && <ContadorModule />}

        {/* ==================================== TABS: REGISTRO DE VENTAS ==================================== */}
        {activeTab === "ventas" && <VentasModule />}

        {/* ==================================== TABS: DASHBOARD METRICAS ==================================== */}
        {activeTab === "dashboard" && <DashboardModule />}

      </main>

      {/* Color Picker Dialog Modal ("Abanico de Colores") */}
      <ColorPickerDialog
        isOpen={colorPickerTarget !== null}
        onClose={() => setColorPickerTarget(null)}
        initialColor={
          colorPickerTarget === "bg"
            ? pdfBgColor
            : colorPickerTarget === "title"
            ? pdfTitleColor
            : colorPickerTarget === "sub"
            ? pdfSubtitleColor
            : "#0b2545"
        }
        onSelectColor={(newColor) => {
          if (colorPickerTarget === "bg") setPdfBgColor(newColor);
          if (colorPickerTarget === "title") setPdfTitleColor(newColor);
          if (colorPickerTarget === "sub") setPdfSubtitleColor(newColor);
        }}
        titleName={
          colorPickerTarget === "bg"
            ? "Fondo de Encabezados"
            : colorPickerTarget === "title"
            ? "Color de Título"
            : "Color de Subtítulos"
        }
      />

      {/* Footer Branding section */}
      <footer className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-slate-900 text-center text-slate-500 text-xs">
        <p className="font-light leading-relaxed">
          UpConta & Firmas Electrónicas.ec by: anf © 2026. Todos los derechos reservados.
        </p>
        <p className="text-[10px] text-slate-600 mt-1">
          Las tarifas mostradas incluyen el 15% de IVA aplicable para Ecuador. Los descuentos anuales corresponden al 10% del plan base.
        </p>
      </footer>

    </div>
  );
}
