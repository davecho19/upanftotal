// Partner storage utility for Socios and Distribuidores with live Google Sheet gid sync

export const SPREADSHEET_ID = "1TGbabvY1HWd4kmNCQYRPWE75z-50rn7D5JQxZfyZEHA";
export const GID_SOCIOS = "1224372514";
export const GID_DISTRIBUIDORES = "1626271738";
export const DEFAULT_SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwN0DLNum5dfWe9CIUNaxwPjpjplh48HNdBjDR9GC-Tr32UFyo0jyq19tCJIGQpqMkv/exec";

export function getSheetWebAppUrl(): string {
  try {
    const custom = localStorage.getItem("custom_sheet_webapp_url");
    if (custom && custom.trim().startsWith("https://script.google.com/macros/s/")) {
      return custom.trim();
    }
  } catch (e) {}
  return DEFAULT_SHEET_WEBAPP_URL;
}

export function setSheetWebAppUrl(url: string): void {
  try {
    localStorage.setItem("custom_sheet_webapp_url", url.trim());
  } catch (e) {}
}

export const INITIAL_SOCIOS: string[] = [
  "ALEGRIA VELASQUEZ VILMA STEFANIE",
  "ALMACHI ZURITA CESAR DAVID",
  "ATUPAÑA CORO PATRICIO FERNANDO",
  "BYRON GERARDO DAQUILEMA MOROCHO",
  "CABEZAS SOTO JEFFERSON ALEXANDER",
  "CERON CHAFUELAN DINA AMPARO",
  "DELGADO CUSME DIEGO ARMANDO",
  "DIANA PAULİNA ZURİTA TORRES",
  "Diego Giovanni Anrango Anrango",
  "FABIAN DANIEL RAMOS VARGAS",
  "FIERRO ZAPATA JOSELYN LIZBETH",
  "GALARZA TOBAR ANTONIO JOSE",
  "GARCIA REYES SANDY ESTEFANIA",
  "GS CONTADORES S.A.S.",
  "KARLA DAYANNA HARO MORENO",
  "KINETIC TECH SERVICES",
  "MARIA DANIELA LOPEZ MOLINA",
  "MEGASYSTEMS S.A.S.",
  "MELISSA IVONNE VÉLEZ MUENTES",
  "MORA GUEVARA BRYAN ISRAEL",
  "MOROCHO PINTAG RUTH ABIGAIL",
  "Nancy Carmita Duchi Ushca",
  "NELSON SANTIAGO CAISA GUALPA",
  "NUCLEO CONSULTORA S.A.S.",
  "ORELLANA BENAVIDES REINA MARIBEL",
  "RIVERA LINO JOSE LUIS",
  "SANCHEZ GARCIA WILSON ANDRES",
  "SEGUNDA MERA",
  "SERRANO RIVERA MARTIN ANDRES",
  "Silvana del Rocio Quillupangui Álvarez",
  "SONIA RUTH SANJINEZ CAICEDO",
  "TORRES GUAYACONDO JESSICA MICHELLE",
  "TUZA SIGCHA GEOVANNA PILAR",
  "VARELA PERALTA BETTY LUCIOLA",
  "VEINTIMILLA PADILLA ADRIAN FERNANDO"
];

export const INITIAL_DISTRIBUIDORES: string[] = [
  "BAZURTO QUINAPALLO JESSICA LISSETTE",
  "CRUZ ARBOLEDA VICTOR MANUEL",
  "DIEGO MANUEL ESPINOSA RIVERA",
  "ELITEACCOUNTING S.A.S.",
  "ELIZABETH DANIELA TELLO PORTOCARRERO",
  "GARZON RUIZ DANNY NAYARITH",
  "GRIJALVA LASTRA SANTIAGO LEONARDO",
  "HEREDIA AYALA ALBERTO JOSUE",
  "HERRERA GONZALEZ DARIO JAVIER",
  "PARDO JIMENEZ GERMANIA ELIZABETH",
  "SANCHEZ YANEZ NEIVER ALEJANDRINO",
  "MEDINA GOMEZ RODOLFO ALEJANDRO",
  "MEJIA TOLEDO KATIA DE LAS MERCEDES",
  "MORILLO TONGUINO EDISON FERNANDO",
  "TOSCANO ALEJANDRO",
  "CUEVA VERONICA"
];

const STORAGE_KEY_SOCIOS = "upconta_socios_list_v2";
const STORAGE_KEY_DISTRIBUIDORES = "upconta_distribuidores_list_v3";

export function getStoredSocios(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOCIOS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set<string>([...INITIAL_SOCIOS, ...parsed]));
      }
    }
  } catch (e) {
    console.warn("Error reading stored socios:", e);
  }
  return [...INITIAL_SOCIOS];
}

export function getStoredDistribuidores(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISTRIBUIDORES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set<string>([...INITIAL_DISTRIBUIDORES, ...parsed]));
      }
    }
  } catch (e) {
    console.warn("Error reading stored distribuidores:", e);
  }
  return [...INITIAL_DISTRIBUIDORES];
}

// Fetch live socios directly from Google Sheet tab using exact GID 1224372514
export async function fetchRemoteSocios(): Promise<string[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID_SOCIOS}&t=${Date.now()}`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const lines = csvText.split(/\r?\n/);
      const names: string[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(",").map(p => p.trim().replace(/^"/, "").replace(/"$/, ""));
        const candidate = parts[1] || parts[0];
        if (candidate && !/^\d+$/.test(candidate) && candidate.toLowerCase() !== "nombre" && candidate.toLowerCase() !== "socio" && candidate.toLowerCase() !== "secuencia") {
          names.push(candidate);
        }
      }
      if (names.length > 0) {
        const stored = getStoredSocios();
        const merged = Array.from(new Set<string>([...names, ...stored]));
        try {
          localStorage.setItem(STORAGE_KEY_SOCIOS, JSON.stringify(merged));
        } catch (e) {}
        return merged;
      }
    }
  } catch (e) {
    console.warn("Remote socios fetch warning:", e);
  }
  return getStoredSocios();
}

// Fetch live distribuidores directly from Google Sheet tab using exact GID 1626271738
export async function fetchRemoteDistribuidores(): Promise<string[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID_DISTRIBUIDORES}&t=${Date.now()}`;
    const res = await fetch(url);
    if (res.ok) {
      const csvText = await res.text();
      const lines = csvText.split(/\r?\n/);
      const names: string[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split(",").map(p => p.trim().replace(/^"/, "").replace(/"$/, ""));
        const candidate = parts[1] || parts[0];
        if (candidate && !/^\d+$/.test(candidate) && candidate.toLowerCase() !== "nombre" && candidate.toLowerCase() !== "distribuidor" && candidate.toLowerCase() !== "secuencia") {
          names.push(candidate);
        }
      }
      if (names.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_DISTRIBUIDORES, JSON.stringify(names));
          localStorage.removeItem("upconta_distribuidores_list_v2");
        } catch (e) {}
        return names;
      }
    }
  } catch (e) {
    console.warn("Remote distribuidores fetch warning:", e);
  }
  return getStoredDistribuidores();
}

// Save a newly created socio both locally and via Google Apps Script WebApp
export async function saveNewSocio(nombre: string): Promise<string[]> {
  const cleanName = nombre.trim().toUpperCase();
  if (!cleanName) return getStoredSocios();

  const current = getStoredSocios();
  const exists = current.some(s => s.toLowerCase() === cleanName.toLowerCase());
  const updated = exists ? current : [...current, cleanName];

  try {
    localStorage.setItem(STORAGE_KEY_SOCIOS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("socios_updated", { detail: updated }));
  } catch (e) {
    console.warn("Error saving socio to localStorage:", e);
  }

  // Push to Google Sheets via WebApp
  try {
    const webappUrl = getSheetWebAppUrl();
    const params = new URLSearchParams({
      action: "crear_socio",
      tipo: "socio",
      hoja: "SOCIOS",
      sheet: "SOCIOS",
      nombre: cleanName,
      socio: cleanName
    });
    fetch(`${webappUrl}?${params.toString()}`, {
      method: "GET",
      mode: "no-cors"
    }).catch(err => console.warn("Google Sheet sync notice:", err));
  } catch (err) {
    console.warn("Error submitting socio to sheet:", err);
  }

  return updated;
}

// Save a newly created distribuidor both locally and via Google Apps Script WebApp
export async function saveNewDistribuidor(nombre: string): Promise<string[]> {
  const cleanName = nombre.trim().toUpperCase();
  if (!cleanName) return getStoredDistribuidores();

  const current = getStoredDistribuidores();
  const exists = current.some(d => d.toLowerCase() === cleanName.toLowerCase());
  const updated = exists ? current : [...current, cleanName];

  try {
    localStorage.setItem(STORAGE_KEY_DISTRIBUIDORES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("distribuidores_updated", { detail: updated }));
  } catch (e) {
    console.warn("Error saving distribuidor to localStorage:", e);
  }

  // Push to Google Sheets via WebApp
  try {
    const webappUrl = getSheetWebAppUrl();
    const params = new URLSearchParams({
      action: "crear_distribuidor",
      tipo: "distribuidor",
      hoja: "DISTRIBUIDORES",
      sheet: "DISTRIBUIDORES",
      nombre: cleanName,
      distribuidor: cleanName
    });
    fetch(`${webappUrl}?${params.toString()}`, {
      method: "GET",
      mode: "no-cors"
    }).catch(err => console.warn("Google Sheet sync notice:", err));
  } catch (err) {
    console.warn("Error submitting distribuidor to sheet:", err);
  }

  return updated;
}

// Global synchronization function to reload all data from Google Sheets across the entire app
export async function syncAllGoogleSheetsData(): Promise<{ sociosCount: number; distCount: number }> {
  const socios = await fetchRemoteSocios();
  const dist = await fetchRemoteDistribuidores();

  // Dispatch events to notify all components in the app
  window.dispatchEvent(new CustomEvent("socios_updated", { detail: socios }));
  window.dispatchEvent(new CustomEvent("distribuidores_updated", { detail: dist }));
  window.dispatchEvent(new CustomEvent("sales_data_updated"));

  return { sociosCount: socios.length, distCount: dist.length };
}

// The official Apps Script code that powers Google Sheets
export const APPS_SCRIPT_SOURCE_CODE = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var p = e.parameter || {};
    var action = (p.action || "").toString().toLowerCase().trim();

    // 1. CREAR NUEVO SOCIO EN PESTAÑA "SOCIOS"
    if (action === "crear_socio" || action === "nuevo_socio") {
      var sheetSocios = ss.getSheetByName("SOCIOS") || ss.getSheetByName("socios");
      if (!sheetSocios) {
        sheetSocios = ss.insertSheet("SOCIOS");
        sheetSocios.appendRow(["SECUENCIA", "SOCIO"]);
      }
      var nuevoSocio = (p.nombre || p.socio || "").toString().trim().toUpperCase();
      if (nuevoSocio) {
        var lastRow = sheetSocios.getLastRow();
        var nextNum = lastRow > 0 ? lastRow : 1;
        sheetSocios.appendRow([nextNum, nuevoSocio]);
        return ContentService.createTextOutput(JSON.stringify({
          status: "ok",
          accion: "crear_socio",
          nombre: nuevoSocio,
          fila: lastRow + 1
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. CREAR NUEVO DISTRIBUIDOR EN PESTAÑA "DISTRIBUIDORES"
    if (action === "crear_distribuidor" || action === "nuevo_distribuidor") {
      var sheetDist = ss.getSheetByName("DISTRIBUIDORES") || ss.getSheetByName("distribuidores") || ss.getSheetByName("distribuidor");
      if (!sheetDist) {
        sheetDist = ss.insertSheet("DISTRIBUIDORES");
        sheetDist.appendRow(["SECUENCIA", "DISTRIBUIDOR"]);
      }
      var nuevoDist = (p.nombre || p.distribuidor || "").toString().trim().toUpperCase();
      if (nuevoDist) {
        var lastRow = sheetDist.getLastRow();
        var nextNum = lastRow > 0 ? lastRow : 1;
        sheetDist.appendRow([nextNum, nuevoDist]);
        return ContentService.createTextOutput(JSON.stringify({
          status: "ok",
          accion: "crear_distribuidor",
          nombre: nuevoDist,
          fila: lastRow + 1
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. REGISTRAR VENTA EN PESTAÑA "GENERAL" (15 COLUMNAS HASTA LA 'O')
    var sheetGeneral = ss.getSheetByName("GENERAL") || ss.getSheets()[0];
    var totalNum = parseFloat(p.total || 0) || 0;
    var totalSinIva = (totalNum / 1.15).toFixed(2);
    var socioODist = (p.socioDistribuidor || p["SOCIO / DISTRIBUIDOR"] || p.socio || p.distribuidor || p.socio_distribuidor || "").toString().trim();

    var fila = [
      p.asesor || "",                           // Col A (1): ASESOR
      p.fecha || "",                            // Col B (2): FECHA
      p.ruc || "",                              // Col C (3): RUC
      p.nombre || "",                           // Col D (4): NOMBRE
      p.tipoVenta || p.tipo || "Nuevo",         // Col E (5): TIPO
      p.producto || "",                         // Col F (6): PRODUCTO
      p.plan || "",                             // Col G (7): PLAN
      p.adicionales || "",                      // Col H (8): ADICIONALES
      p.valorPlan || "",                        // Col I (9): VALOR PLAN
      p.valorAdicional || "",                   // Col J (10): VALOR ADICIONAL
      p.descuento || "0.00",                    // Col K (11): DESCUENTO
      p.total || "0.00",                        // Col L (12): TOTAL
      totalSinIva,                              // Col M (13): TOTAL SIN IVA
      p.mes || "",                              // Col N (14): MES
      socioODist                                // Col O (15): SOCIO / DISTRIBUIDOR
    ];

    sheetGeneral.appendRow(fila);

    return ContentService.createTextOutput(JSON.stringify({
      status: "ok",
      hoja: sheetGeneral.getName(),
      filaDestino: sheetGeneral.getLastRow(),
      filaEscrita: fila,
      socioDistribuidorRegistrado: socioODist
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      mensaje: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
