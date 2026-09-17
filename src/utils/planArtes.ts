import arteLight from '../assets/artes/up_light.png';
import arteBase from '../assets/artes/up_base.png';
import artePower from '../assets/artes/up_power.png';
import arteInicial from '../assets/artes/up_inicial.png';
import arteIntermedio from '../assets/artes/up_intermedio.png';
import arteIdeal from '../assets/artes/up_ideal.png';
import arteProfesional from '../assets/artes/up_profesional.png';
import arteUltra from '../assets/artes/up_ultra.png';

export interface PlanArteItem {
  planKey: string;
  planName: string;
  officialTitle: string;
  downloadFileName: string;
  imageUrl: string;
  precio: string;
}

export const PLAN_ARTES_MAP: Record<string, PlanArteItem> = {
  "UP LIGHT": {
    planKey: "UP LIGHT",
    planName: "Up Light",
    officialTitle: "Plan Facturación Electrónica Up Light",
    downloadFileName: "1. LIGHT.png",
    imageUrl: arteLight,
    precio: "$10 + IVA",
  },
  "UP BASE": {
    planKey: "UP BASE",
    planName: "Up Base",
    officialTitle: "Plan Facturación Electrónica Up Base",
    downloadFileName: "2. BASE.png",
    imageUrl: arteBase,
    precio: "$25 + IVA",
  },
  "UP POWER": {
    planKey: "UP POWER",
    planName: "Up Power",
    officialTitle: "Plan Facturación Electrónica Up Power",
    downloadFileName: "3. POWER.png",
    imageUrl: artePower,
    precio: "$55 + IVA",
  },
  "UP INICIAL": {
    planKey: "UP INICIAL",
    planName: "Up Inicial",
    officialTitle: "Plan Facturación Electrónica Up Inicial",
    downloadFileName: "4. INICIAL. .png",
    imageUrl: arteInicial,
    precio: "$10 + IVA",
  },
  "UP INTERMEDIO": {
    planKey: "UP INTERMEDIO",
    planName: "Up Intermedio",
    officialTitle: "Plan Facturación Electrónica Up Intermedio",
    downloadFileName: "5. INTERMEDIO.png",
    imageUrl: arteIntermedio,
    precio: "$15 + IVA",
  },
  "UP IDEAL PLUS": {
    planKey: "UP IDEAL PLUS",
    planName: "Up Ideal +",
    officialTitle: "Plan Facturación Electrónica Up Ideal +",
    downloadFileName: "6. IDEAL.png",
    imageUrl: arteIdeal,
    precio: "$25 + IVA",
  },
  "UP PROFESIONAL PLUS": {
    planKey: "UP PROFESIONAL PLUS",
    planName: "Up Profesional +",
    officialTitle: "Plan Facturación Electrónica Up Profesional +",
    downloadFileName: "7. PROFESSIONAL.png",
    imageUrl: arteProfesional,
    precio: "$80 + IVA",
  },
  "UP ULTRA": {
    planKey: "UP ULTRA",
    planName: "Up Ultra",
    officialTitle: "Plan Facturación Electrónica Up Ultra",
    downloadFileName: "8. ULTRA.png",
    imageUrl: arteUltra,
    precio: "$150 + IVA",
  }
};

/**
 * Normalizes plan name to find its visual art
 */
export function getPlanArte(planName?: string | null): PlanArteItem | null {
  if (!planName) return null;
  const upper = planName.trim().toUpperCase();
  
  if (PLAN_ARTES_MAP[upper]) {
    return PLAN_ARTES_MAP[upper];
  }

  // Fuzzy matching for variations (e.g. "LIGHT", "PLAN UP LIGHT", "IDEAL+", "PROFESIONAL")
  if (upper.includes("LIGHT")) return PLAN_ARTES_MAP["UP LIGHT"];
  if (upper.includes("BASE")) return PLAN_ARTES_MAP["UP BASE"];
  if (upper.includes("POWER")) return PLAN_ARTES_MAP["UP POWER"];
  if (upper.includes("INICIAL")) return PLAN_ARTES_MAP["UP INICIAL"];
  if (upper.includes("INTERMEDIO")) return PLAN_ARTES_MAP["UP INTERMEDIO"];
  if (upper.includes("IDEAL")) return PLAN_ARTES_MAP["UP IDEAL PLUS"];
  if (upper.includes("PROFESIONAL") || upper.includes("PROFESSIONAL")) return PLAN_ARTES_MAP["UP PROFESIONAL PLUS"];
  if (upper.includes("ULTRA")) return PLAN_ARTES_MAP["UP ULTRA"];

  return null;
}

/**
 * Triggers the browser download of the plan's visual art image with its exact official filename
 */
export async function downloadPlanArte(planName: string): Promise<{ success: boolean; fileName: string; title: string }> {
  const item = getPlanArte(planName);
  if (!item) {
    return { success: false, fileName: "", title: "" };
  }

  try {
    const response = await fetch(item.imageUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = item.downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
    return { success: true, fileName: item.downloadFileName, title: item.officialTitle };
  } catch (err) {
    // Fallback direct link
    const link = document.createElement("a");
    link.href = item.imageUrl;
    link.download = item.downloadFileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, fileName: item.downloadFileName, title: item.officialTitle };
  }
}
