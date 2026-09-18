import fs from 'fs';
import path from 'path';

// 1. UpConta Official Logo SVG
const upcontaLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 130" width="520" height="130">
  <text x="10" y="92" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif" font-weight="900" font-size="102" letter-spacing="-2" fill="#FF5500">Up</text>
  <text x="152" y="92" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Inter', sans-serif" font-weight="900" font-size="102" letter-spacing="-3" fill="#0B2545">Conta</text>
  <g transform="translate(426, 12)">
    <path d="M 12,50 L 52,50 C 62,50 68,44 68,34 L 68,10" fill="none" stroke="#FF5500" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 50,22 L 68,4 L 86,22" fill="none" stroke="#FF5500" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

// 2. Com Fun Ilimitado Flyer SVG (Orange theme matching Image 2 Card 1)
const comFunIlimitadoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150" style="background:#ffffff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="gradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF5500" />
      <stop offset="100%" stop-color="#E65100" />
    </linearGradient>
    <linearGradient id="gradNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2545" />
      <stop offset="100%" stop-color="#001D3D" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="1150" fill="#FFFDFB"/>

  <!-- Top Accent Header Bar -->
  <rect width="800" height="18" fill="url(#gradOrange)"/>

  <!-- Header Section with Logo -->
  <g transform="translate(40, 45)">
    <text x="0" y="55" font-weight="900" font-size="64" fill="#FF5500" letter-spacing="-1">Up</text>
    <text x="92" y="55" font-weight="900" font-size="64" fill="#0B2545" letter-spacing="-2">Conta</text>
    <g transform="translate(260, 6) scale(0.6)">
      <path d="M 12,50 L 52,50 C 62,50 68,44 68,34 L 68,10" fill="none" stroke="#FF5500" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 50,22 L 68,4 L 86,22" fill="none" stroke="#FF5500" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="520" y="15" width="200" height="42" rx="21" fill="#FFF3E0" stroke="#FFB74D" stroke-width="2"/>
    <text x="620" y="42" font-weight="800" font-size="16" fill="#E65100" text-anchor="middle">PLAN ILIMITADO</text>
  </g>

  <!-- Title Card -->
  <g transform="translate(40, 150)">
    <rect width="720" height="140" rx="24" fill="url(#gradOrange)"/>
    <text x="360" y="58" font-weight="900" font-size="34" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">COM FUN ILIMITADO</text>
    <text x="360" y="98" font-weight="700" font-size="20" fill="#FFE0B2" text-anchor="middle">Comprobantes Electrónicos &amp; Funciones Ilimitadas</text>
  </g>

  <!-- Feature Highlights Grid -->
  <g transform="translate(40, 320)">
    <!-- Box 1 -->
    <rect x="0" y="0" width="345" height="105" rx="16" fill="#FFFFFF" stroke="#FFE0B2" stroke-width="2"/>
    <circle cx="45" cy="52" r="24" fill="#FFF3E0"/>
    <text x="45" y="60" font-size="24" text-anchor="middle">⚡</text>
    <text x="85" y="44" font-weight="800" font-size="18" fill="#0B2545">Emisión Ilimitada</text>
    <text x="85" y="70" font-weight="500" font-size="13" fill="#64748B">Facturas, Retenciones y Guías SRI</text>

    <!-- Box 2 -->
    <rect x="375" y="0" width="345" height="105" rx="16" fill="#FFFFFF" stroke="#FFE0B2" stroke-width="2"/>
    <circle cx="420" cy="52" r="24" fill="#FFF3E0"/>
    <text x="420" y="60" font-size="24" text-anchor="middle">👥</text>
    <text x="460" y="44" font-weight="800" font-size="18" fill="#0B2545">Usuarios Ilimitados</text>
    <text x="460" y="70" font-weight="500" font-size="13" fill="#64748B">Roles comerciales y contables</text>

    <!-- Box 3 -->
    <rect x="0" y="125" width="345" height="105" rx="16" fill="#FFFFFF" stroke="#FFE0B2" stroke-width="2"/>
    <circle cx="45" cy="177" r="24" fill="#FFF3E0"/>
    <text x="45" y="185" font-size="24" text-anchor="middle">📦</text>
    <text x="85" y="169" font-weight="800" font-size="18" fill="#0B2545">Catálogo Sin Límites</text>
    <text x="85" y="195" font-weight="500" font-size="13" fill="#64748B">Productos, servicios y tarifas SRI</text>

    <!-- Box 4 -->
    <rect x="375" y="125" width="345" height="105" rx="16" fill="#FFFFFF" stroke="#FFE0B2" stroke-width="2"/>
    <circle cx="420" cy="177" r="24" fill="#FFF3E0"/>
    <text x="420" y="185" font-size="24" text-anchor="middle">🛡️</text>
    <text x="460" y="169" font-weight="800" font-size="18" fill="#0B2545">Firma Electrónica</text>
    <text x="460" y="195" font-weight="500" font-size="13" fill="#64748B">Archivo .p12 integrado y seguro</text>
  </g>

  <!-- Detailed Feature List -->
  <g transform="translate(40, 580)">
    <rect width="720" height="380" rx="20" fill="#FFFFFF" stroke="#F1F5F9" stroke-width="2"/>
    
    <text x="40" y="45" font-weight="900" font-size="20" fill="#0B2545">BENEFICIOS CLAVE DEL PLAN</text>
    <line x1="40" y1="65" x2="680" y2="65" stroke="#E2E8F0" stroke-width="1.5"/>

    <!-- Items -->
    <g transform="translate(40, 95)" font-weight="600" font-size="16" fill="#334155">
      <circle cx="12" cy="0" r="10" fill="#FF5500"/>
      <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
      <text x="35" y="5">Acceso 100% Web desde cualquier dispositivo (PC, Tablet o Móvil)</text>
      
      <g transform="translate(0, 50)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Envío automático de comprobantes por WhatsApp y Correo</text>
      </g>
      
      <g transform="translate(0, 100)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Reporte ATS y liquidación de impuestos automatizada</text>
      </g>

      <g transform="translate(0, 150)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Cuentas por Cobrar y Cuentas por Pagar sincronizadas</text>
      </g>

      <g transform="translate(0, 200)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Actualizaciones normativas automáticas según regulaciones del SRI</text>
      </g>

      <g transform="translate(0, 250)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Soporte técnico prioritario y capacitación virtual</text>
      </g>
    </g>
  </g>

  <!-- Bottom CTA / Contact Bar -->
  <g transform="translate(40, 990)">
    <rect width="720" height="110" rx="20" fill="url(#gradNavy)"/>
    <text x="40" y="50" font-weight="900" font-size="22" fill="#FFFFFF">Impulsa tu Gestión Contable Hoy</text>
    <text x="40" y="80" font-weight="500" font-size="14" fill="#94A3B8">www.upconta.com • Software Contable Cloud Ecuador</text>
    <rect x="520" y="32" width="160" height="46" rx="23" fill="#FF5500"/>
    <text x="600" y="61" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle">CONSULTAR</text>
  </g>
</svg>`;

// 3. Plan Contador 1 Flyer SVG (Blue / Navy with $100 badge, matching Image 2 Card 2)
const planContador1Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150" style="background:#ffffff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="gradContNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2545" />
      <stop offset="100%" stop-color="#133E6E" />
    </linearGradient>
    <linearGradient id="gradContBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0369A1" />
    </linearGradient>
  </defs>

  <rect width="800" height="1150" fill="#F8FAFC"/>
  <rect width="800" height="18" fill="url(#gradContNavy)"/>

  <!-- Header with UpConta Logo -->
  <g transform="translate(40, 45)">
    <text x="0" y="55" font-weight="900" font-size="64" fill="#FF5500" letter-spacing="-1">Up</text>
    <text x="92" y="55" font-weight="900" font-size="64" fill="#0B2545" letter-spacing="-2">Conta</text>
    <g transform="translate(260, 6) scale(0.6)">
      <path d="M 12,50 L 52,50 C 62,50 68,44 68,34 L 68,10" fill="none" stroke="#FF5500" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 50,22 L 68,4 L 86,22" fill="none" stroke="#FF5500" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="520" y="15" width="200" height="42" rx="21" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2"/>
    <text x="620" y="42" font-weight="800" font-size="15" fill="#0369A1" text-anchor="middle">ESPECIAL CONTADORES</text>
  </g>

  <!-- Banner Plan Contador + $100 -->
  <g transform="translate(40, 150)">
    <rect width="720" height="160" rx="24" fill="url(#gradContNavy)"/>
    <text x="40" y="65" font-weight="900" font-size="34" fill="#FFFFFF" letter-spacing="1">PLAN CONTADOR</text>
    <text x="40" y="105" font-weight="600" font-size="18" fill="#93C5FD">Plataforma Multi-Empresa para Estudios Contables</text>

    <!-- Big Price Tag -->
    <rect x="500" y="25" width="180" height="110" rx="18" fill="#FF5500"/>
    <text x="590" y="75" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle">$100</text>
    <text x="590" y="108" font-weight="700" font-size="14" fill="#FFE0B2" text-anchor="middle">+ IVA / ANUAL</text>
  </g>

  <!-- Key Specs 3 Columns -->
  <g transform="translate(40, 340)">
    <rect x="0" y="0" width="226" height="110" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <text x="113" y="48" font-weight="900" font-size="30" fill="#0B2545" text-anchor="middle">MULTI-RUC</text>
    <text x="113" y="80" font-weight="600" font-size="13" fill="#64748B" text-anchor="middle">Gestión Centralizada</text>

    <rect x="246" y="0" width="226" height="110" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <text x="359" y="48" font-weight="900" font-size="30" fill="#FF5500" text-anchor="middle">ANUAL</text>
    <text x="359" y="80" font-weight="600" font-size="13" fill="#64748B" text-anchor="middle">Vigencia 12 Meses</text>

    <rect x="492" y="0" width="228" height="110" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <text x="606" y="48" font-weight="900" font-size="30" fill="#0284C7" text-anchor="middle">SRI ATS</text>
    <text x="606" y="80" font-weight="600" font-size="13" fill="#64748B" text-anchor="middle">Módulo Automático</text>
  </g>

  <!-- Detailed Specifications -->
  <g transform="translate(40, 480)">
    <rect width="720" height="470" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="40" y="50" font-weight="900" font-size="22" fill="#0B2545">CARACTERÍSTICAS INCLUIDAS</text>
    <line x1="40" y1="72" x2="680" y2="72" stroke="#E2E8F0" stroke-width="1.5"/>

    <g transform="translate(40, 110)" font-weight="600" font-size="16" fill="#334155">
      <circle cx="12" cy="0" r="10" fill="#0B2545"/>
      <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
      <text x="35" y="5">Panel unificado para administrar todos los clientes contables</text>

      <g transform="translate(0, 56)">
        <circle cx="12" cy="0" r="10" fill="#0B2545"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Generación automática de ATS (Anexo Transaccional Simplificado)</text>
      </g>

      <g transform="translate(0, 112)">
        <circle cx="12" cy="0" r="10" fill="#0B2545"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Descarga masiva de XML y RIDE directamente desde el portal SRI</text>
      </g>

      <g transform="translate(0, 168)">
        <circle cx="12" cy="0" r="10" fill="#0B2545"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Contabilización automática de comprobantes de ventas y compras</text>
      </g>

      <g transform="translate(0, 224)">
        <circle cx="12" cy="0" r="10" fill="#0B2545"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Plan de cuentas normativo ecuatoriano NIIF y formularios SRI</text>
      </g>

      <g transform="translate(0, 280)">
        <circle cx="12" cy="0" r="10" fill="#0B2545"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Reportes financieros exportables a Excel con un solo clic</text>
      </g>

      <g transform="translate(0, 336)">
        <circle cx="12" cy="0" r="10" fill="#0B2545"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Respaldo diario en la nube con seguridad bancaria</text>
      </g>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(40, 980)">
    <rect width="720" height="120" rx="20" fill="url(#gradContNavy)"/>
    <text x="40" y="52" font-weight="900" font-size="22" fill="#FFFFFF">Optimiza tu Despacho Contable</text>
    <text x="40" y="84" font-weight="500" font-size="14" fill="#93C5FD">Atención comercial directa: ventas@upconta.com • Ecuador</text>
    <rect x="520" y="36" width="160" height="48" rx="24" fill="#FF5500"/>
    <text x="600" y="66" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle">CONTACTAR</text>
  </g>
</svg>`;

// 4. Plan Contador 2 Flyer SVG (Matching Image 2 Card 3)
const planContador2Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150" style="background:#ffffff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="gradContPlus" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0B2545" />
    </linearGradient>
  </defs>

  <rect width="800" height="1150" fill="#F8FAFC"/>
  <rect width="800" height="18" fill="#0284C7"/>

  <!-- Header -->
  <g transform="translate(40, 45)">
    <text x="0" y="55" font-weight="900" font-size="64" fill="#FF5500" letter-spacing="-1">Up</text>
    <text x="92" y="55" font-weight="900" font-size="64" fill="#0B2545" letter-spacing="-2">Conta</text>
    <g transform="translate(260, 6) scale(0.6)">
      <path d="M 12,50 L 52,50 C 62,50 68,44 68,34 L 68,10" fill="none" stroke="#FF5500" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 50,22 L 68,4 L 86,22" fill="none" stroke="#FF5500" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="520" y="15" width="200" height="42" rx="21" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2"/>
    <text x="620" y="42" font-weight="800" font-size="15" fill="#B45309" text-anchor="middle">EDICIÓN AVANZADA</text>
  </g>

  <!-- Banner -->
  <g transform="translate(40, 150)">
    <rect width="720" height="150" rx="24" fill="url(#gradContPlus)"/>
    <text x="40" y="65" font-weight="900" font-size="34" fill="#FFFFFF">PLAN CONTADOR PLUS</text>
    <text x="40" y="105" font-weight="600" font-size="18" fill="#BAE6FD">Solución Profesional para Asesorías Contables y Tributarias</text>
  </g>

  <!-- 4 Feature Blocks -->
  <g transform="translate(40, 330)">
    <rect x="0" y="0" width="345" height="110" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="30" y="45" font-weight="900" font-size="20" fill="#0284C7">Multi-Empresa Ampliado</text>
    <text x="30" y="75" font-weight="500" font-size="13" fill="#64748B">Control integral de hasta 15 empresas o RUCs</text>

    <rect x="375" y="0" width="345" height="110" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="405" y="45" font-weight="900" font-size="20" fill="#0284C7">Conciliación Bancaria</text>
    <text x="405" y="75" font-weight="500" font-size="13" fill="#64748B">Cruce automático de estados de cuenta</text>

    <rect x="0" y="130" width="345" height="110" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="30" y="175" font-weight="900" font-size="20" fill="#0284C7">Auditoría SRI Continua</text>
    <text x="30" y="205" font-weight="500" font-size="13" fill="#64748B">Validación previa de inconsistencias tributarias</text>

    <rect x="375" y="130" width="345" height="110" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="405" y="175" font-weight="900" font-size="20" fill="#0284C7">Roles y Asistentes</text>
    <text x="405" y="205" font-weight="500" font-size="13" fill="#64748B">Permisos por cada cliente para tu equipo</text>
  </g>

  <!-- Bullet Points -->
  <g transform="translate(40, 600)">
    <rect width="720" height="350" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="40" y="50" font-weight="900" font-size="20" fill="#0B2545">TODO LO QUE TU ESTUDIO CONTABLE NECESITA</text>
    <line x1="40" y1="70" x2="680" y2="70" stroke="#E2E8F0" stroke-width="1.5"/>

    <g transform="translate(40, 105)" font-weight="600" font-size="16" fill="#334155">
      <circle cx="12" cy="0" r="10" fill="#0284C7"/>
      <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
      <text x="35" y="5">Generador de Balance General, Estado de Resultados y Flujo</text>

      <g transform="translate(0, 52)">
        <circle cx="12" cy="0" r="10" fill="#0284C7"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Importación masiva desde Excel para saldos iniciales</text>
      </g>

      <g transform="translate(0, 104)">
        <circle cx="12" cy="0" r="10" fill="#0284C7"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Notificaciones automáticas de vencimiento tributario SRI</text>
      </g>

      <g transform="translate(0, 156)">
        <circle cx="12" cy="0" r="10" fill="#0284C7"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Sincronización en la nube con backups automáticos</text>
      </g>

      <g transform="translate(0, 208)">
        <circle cx="12" cy="0" r="10" fill="#0284C7"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Soporte personalizado vía WhatsApp y llamada</text>
      </g>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(40, 980)">
    <rect width="720" height="120" rx="20" fill="url(#gradContPlus)"/>
    <text x="40" y="52" font-weight="900" font-size="22" fill="#FFFFFF">Cotiza tu Plan Contador Plus</text>
    <text x="40" y="84" font-weight="500" font-size="14" fill="#BAE6FD">Solicita una demostración guiada sin compromiso</text>
    <rect x="520" y="36" width="160" height="48" rx="24" fill="#FF5500"/>
    <text x="600" y="66" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle">SOLICITAR</text>
  </g>
</svg>`;

// 5. Plan Contador 3 Flyer SVG (Matching Image 2 Card 4, Dark Navy with $100)
const planContador3Svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1150" width="800" height="1150" style="background:#ffffff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;">
  <defs>
    <linearGradient id="gradContDark" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#001D3D" />
      <stop offset="100%" stop-color="#003566" />
    </linearGradient>
  </defs>

  <rect width="800" height="1150" fill="#F8FAFC"/>
  <rect width="800" height="18" fill="#FF5500"/>

  <!-- Header -->
  <g transform="translate(40, 45)">
    <text x="0" y="55" font-weight="900" font-size="64" fill="#FF5500" letter-spacing="-1">Up</text>
    <text x="92" y="55" font-weight="900" font-size="64" fill="#0B2545" letter-spacing="-2">Conta</text>
    <g transform="translate(260, 6) scale(0.6)">
      <path d="M 12,50 L 52,50 C 62,50 68,44 68,34 L 68,10" fill="none" stroke="#FF5500" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 50,22 L 68,4 L 86,22" fill="none" stroke="#FF5500" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="520" y="15" width="200" height="42" rx="21" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    <text x="620" y="42" font-weight="800" font-size="15" fill="#0F172A" text-anchor="middle">PLAN CORPORATIVO</text>
  </g>

  <!-- Banner Plan Contador Corp with $100 -->
  <g transform="translate(40, 150)">
    <rect width="720" height="160" rx="24" fill="url(#gradContDark)"/>
    <text x="40" y="65" font-weight="900" font-size="34" fill="#FFFFFF">CONTADOR CORPORATIVO</text>
    <text x="40" y="105" font-weight="600" font-size="18" fill="#93C5FD">Capacidad Máxima Multi-Empresa para Grandes Firmas</text>

    <rect x="500" y="25" width="180" height="110" rx="18" fill="#FF5500"/>
    <text x="590" y="75" font-weight="900" font-size="44" fill="#FFFFFF" text-anchor="middle">$100</text>
    <text x="590" y="108" font-weight="700" font-size="14" fill="#FFE0B2" text-anchor="middle">+ IVA / ANUAL</text>
  </g>

  <!-- 3 Boxes -->
  <g transform="translate(40, 340)">
    <rect x="0" y="0" width="226" height="115" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="113" y="48" font-weight="900" font-size="26" fill="#0B2545" text-anchor="middle">RUCs ILIMITADOS</text>
    <text x="113" y="80" font-weight="600" font-size="13" fill="#64748B" text-anchor="middle">Sin Límite de Empresas</text>

    <rect x="246" y="0" width="226" height="115" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="359" y="48" font-weight="900" font-size="26" fill="#FF5500" text-anchor="middle">SRI NIIF FULL</text>
    <text x="359" y="80" font-weight="600" font-size="13" fill="#64748B" text-anchor="middle">Normativas Vigentes</text>

    <rect x="492" y="0" width="228" height="115" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="606" y="48" font-weight="900" font-size="26" fill="#0284C7" text-anchor="middle">NUBE PRIVADA</text>
    <text x="606" y="80" font-weight="600" font-size="13" fill="#64748B" text-anchor="middle">Alta Disponibilidad</text>
  </g>

  <!-- Feature List -->
  <g transform="translate(40, 485)">
    <rect width="720" height="465" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>
    <text x="40" y="50" font-weight="900" font-size="22" fill="#0B2545">VENTAJAS CORPORATIVAS EXCLUSIVAS</text>
    <line x1="40" y1="72" x2="680" y2="72" stroke="#E2E8F0" stroke-width="1.5"/>

    <g transform="translate(40, 110)" font-weight="600" font-size="16" fill="#334155">
      <circle cx="12" cy="0" r="10" fill="#FF5500"/>
      <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
      <text x="35" y="5">Infraestructura de alta velocidad para estudios contables masivos</text>

      <g transform="translate(0, 56)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Generación y validación de ATS por lotes automatizada</text>
      </g>

      <g transform="translate(0, 112)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Módulo de tesorería, retenciones automáticas y conciliación</text>
      </g>

      <g transform="translate(0, 168)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Gestión de inventarios multidepósito por cada empresa</text>
      </g>

      <g transform="translate(0, 224)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Exportación directa a sistemas tributarios y auditoría contable</text>
      </g>

      <g transform="translate(0, 280)">
        <circle cx="12" cy="0" r="10" fill="#FF5500"/>
        <text x="12" y="4" font-size="12" fill="#FFFFFF" text-anchor="middle" font-weight="900">✓</text>
        <text x="35" y="5">Capacitación completa y migración de datos asistida</text>
      </g>
    </g>
  </g>

  <!-- Footer -->
  <g transform="translate(40, 980)">
    <rect width="720" height="120" rx="20" fill="url(#gradContDark)"/>
    <text x="40" y="52" font-weight="900" font-size="22" fill="#FFFFFF">La Solución Definitiva para Contadores</text>
    <text x="40" y="84" font-weight="500" font-size="14" fill="#93C5FD">Contáctanos para habilitación inmediata</text>
    <rect x="520" y="36" width="160" height="48" rx="24" fill="#FF5500"/>
    <text x="600" y="66" font-weight="800" font-size="15" fill="#FFFFFF" text-anchor="middle">CONTRATAR</text>
  </g>
</svg>`;

// Write all SVGs to /public/artes/ and /src/assets/artes/
const targets = [
  { file: 'upconta_logo.svg', content: upcontaLogoSvg },
  { file: 'com_fun_ilimitado.svg', content: comFunIlimitadoSvg },
  { file: 'plan_contador_1.svg', content: planContador1Svg },
  { file: 'plan_contador_2.svg', content: planContador2Svg },
  { file: 'plan_contador_3.svg', content: planContador3Svg },
];

for (const t of targets) {
  fs.writeFileSync(path.join(process.cwd(), 'public/artes', t.file), t.content, 'utf8');
  fs.writeFileSync(path.join(process.cwd(), 'src/assets/artes', t.file), t.content, 'utf8');
}

console.log('Successfully created SVGs in public/artes and src/assets/artes');
