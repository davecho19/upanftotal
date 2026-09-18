import React, { useState, useMemo } from "react";
import { Search, ExternalLink, Copy, Check, Youtube, BookOpen, Filter } from "lucide-react";

export interface TutorialLink {
  numero: string;
  modulo: string;
  titulo: string;
  link: string;
}

export const TUTORIAL_LINKS: TutorialLink[] = [
  { numero: "125", modulo: "ADMINISTRATIVO", titulo: "¿Cómo recuperar la contraseña en el sistema?", link: "https://youtu.be/yxGLv_e9yRE" },
  { numero: "12", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO ANULAR UN COMPROBANTE EN EL SISTEMA?", link: "https://www.youtube.com/watch?v=6uADzXgKCtg&t=1s" },
  { numero: "15", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO FACTURAR DESDE LA NUEVA INTERFAZ DEL SISTEMA?", link: "https://www.youtube.com/watch?v=kY9a5iMxPhs&ab_channel=UpConta" },
  { numero: "16", modulo: "ADMINISTRATIVO", titulo: "¿Cómo Registrar Las Compras?", link: "https://www.youtube.com/watch?v=e521lk_VQsQ&ab_channel=UpConta" },
  { numero: "17", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO CARGAR MASIVAMENTE COMPROBANTES ELECTRÓNICOS A LA BIBLIOTECA DE ARCHIVOS?", link: "https://www.youtube.com/watch?v=cU9GsPOG1h4&ab_channel=UpConta" },
  { numero: "18", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO REGISTRAR A UNA PERSONA EN EL SISTEMA ?", link: "https://www.youtube.com/watch?v=EUyZm4t56pw&ab_channel=UpConta" },
  { numero: "20", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO EMITIR COMPROBANTES DE RETENCIÓN?", link: "https://www.youtube.com/watch?v=NvLj1Wvk514&feature=emb_imp_woyt&ab_channel=UpConta" },
  { numero: "23", modulo: "ADMINISTRATIVO", titulo: "¿Cómo Registrar Una Nota De Crédito?", link: "https://www.youtube.com/watch?v=41GqAl3lTrY&ab_channel=UpConta" },
  { numero: "26", modulo: "ADMINISTRATIVO", titulo: "¿Cómo Emitir Una Factura De Reembolso?", link: "https://www.youtube.com/watch?v=UERepEy8sRM&ab_channel=UpConta" },
  { numero: "29", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO LLENAR Y EMITIR UNA GUÍA DE REMISIÓN?", link: "https://www.youtube.com/watch?v=JZ9C17OMJIk&ab_channel=UpConta" },
  { numero: "30", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO CREAR UNA PROFORMA EN EL SISTEMA?", link: "https://www.youtube.com/watch?v=AJzetCpmeh4&ab_channel=UpConta" },
  { numero: "35", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO EMITIR UNA LIQUIDACIÓN DE COMPRAS?", link: "https://www.youtube.com/watch?v=g5ESPui-pug" },
  { numero: "36", modulo: "ADMINISTRATIVO", titulo: "¿Cómo podemos crear una persona cuando vamos a emitir un comprobante electrónico?", link: "https://www.youtube.com/watch?v=plCxkbseRT4" },
  { numero: "37", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO EMITIR UNA NOTA DE CRÉDITO EN EL SISTEMA?", link: "https://www.youtube.com/watch?v=5p1260Tav2E&t=1s" },
  { numero: "38", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO ANULAR COMPROBANTE EN EL Y SISTEMA Y EN EL SRI ?", link: "https://www.youtube.com/watch?v=MNYuckeRJls" },
  { numero: "45", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO EMITIR UNA NOTA DE VENTA O RECIBO?", link: "https://www.youtube.com/watch?v=3mBDu1MpWkY" },
  { numero: "49", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO EMITIR UNA FACTURA DE REEMBOLSO?", link: "https://www.youtube.com/watch?v=UERepEy8sRM" },
  { numero: "65", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO FACTURAR DESDE EL PUNTO DE VENTA?", link: "https://youtu.be/-2Lsa4Dh_jg" },
  { numero: "77", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO REGISTRAR UNA COMPRA CON CUOTAS DE PAGO?", link: "https://youtu.be/Z-2nUUHO1TI" },
  { numero: "78", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO MODIFICAR LA INFORMACIÓN DE NUESTRO CLIENTE?", link: "https://www.youtube.com/watch?v=kYS3Z9LFzS4" },
  { numero: "79", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO ASIGNAR CUOTAS A UNA FACTURA DE VENTA?", link: "https://www.youtube.com/watch?v=0SGO_6OS6GA" },
  { numero: "88", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO CARGAR MASIVAMENTE NUESTRA NÓMINA EN EL SISTEMA?", link: "https://youtu.be/w1jSnhRSXTA" },
  { numero: "89", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO GENERAR UN REPORTE DE VENTAS NETAS EN EL SISTEMA?", link: "https://youtu.be/GIRF5-Lh0iA" },
  { numero: "90", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO GENERAR UN REPORTE DE NUESTROS CONTRATOS EN EL SISTEMA?", link: "https://youtu.be/U2hxhBUVut4" },
  { numero: "95", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO MANEJAR LA FACTURACIÓN RÁPIDA EN UpConta?", link: "https://youtu.be/5I_rItsiyb8" },
  { numero: "96", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO FACTURAR ELECTRÓNICAMENTE EN UpConta?", link: "https://youtu.be/jdBkr8Rre-w" },
  { numero: "99", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO CARGAR MASIVAMENTE CLIENTES EN EL SISTEMA?", link: "https://youtu.be/FfGuYqufSno" },
  { numero: "101", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO EMITIR UN COMPROBANTE DE RETENCIÓN VERSIÓN 2.0 EN UpConta ?", link: "https://youtu.be/JS3sKDF4Ok4" },
  { numero: "105", modulo: "ADMINISTRATIVO", titulo: "¿CÓMO FACTURAR ELECTRÓNICAMENTE DESDE LA APP DE UpConta?", link: "https://youtu.be/k8ft8uTs2GE" },
  { numero: "121", modulo: "ADMINISTRATIVO", titulo: "¿Cómo eliminar el historial de UpConta en un dispositivo Android?", link: "https://youtu.be/3FauExyNBjs" },
  { numero: "123", modulo: "ADMINISTRATIVO", titulo: "¿Cómo crear establecimientos y puntos de emisión en el sistema?", link: "https://youtu.be/_6q9ajl0tng" },
  { numero: "129", modulo: "Biblioteca de Archivos", titulo: "¿Cómo utilizar la extensión UpConta descargador de XML en tu navegador?", link: "https://youtu.be/orb2YXCcumU" },
  { numero: "82", modulo: "COMERCIAL", titulo: "DEMO MÓDULOS QUE CONTIENEN LOS PLANES DE FACTURACIÓN ELECTRÓNICA", link: "https://youtu.be/b4o01o-IfTo" },
  { numero: "106", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CONFIGURAR O MODIFICAR LA SECUENCIA DE TUS COMPROBANTES ELECTRÓNICOS EN EL SISTEMA ?", link: "https://youtu.be/0I0A_1WPjSs" },
  { numero: "107", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CONOCER TU ESTABLECIMIENTO CORRECTO DE ACUERDO AL SRI?", link: "https://youtu.be/_WwnNPrEuPM" },
  { numero: "108", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CAMBIAR EL AMBIENTE DE LOS COMPROBANTES ELECTRÓNICOS EN EL SISTEMA?", link: "https://youtu.be/Bc-XgePJDCA" },
  { numero: "122", modulo: "CONFIGURACIONES", titulo: "¿Cómo seleccionar nuestro régimen en el sistema de acuerdo al SRI?", link: "https://youtu.be/Flp-3yqObkE" },
  { numero: "40", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CARGAR NUESTRA FIRMA ELECTRÓNICA EN EL SISTEMA?", link: "https://www.youtube.com/watch?v=HuOx24AnvzA" },
  { numero: "41", modulo: "CONFIGURACIONES", titulo: "Configuraciones iniciales en el sistema", link: "https://www.youtube.com/watch?v=NhFi27MXrMA&t=357s" },
  { numero: "64", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CONFIGURAR NUESTRO PUNTO DE VENTA?", link: "https://youtu.be/NniyN0NqVJY" },
  { numero: "70", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CARGAR NUESTRA FIRMA ELECTRÓNICA?", link: "https://youtu.be/uTFCC-btXgE" },
  { numero: "76", modulo: "CONFIGURACIONES", titulo: "¿CÓMO SELECCIONAR SI SOMOS AGENTES DE RETENCIÓN, R. MICROEMPRESAS U OBLIGADOS A LLEVAR CONTABILIDAD?", link: "https://youtu.be/37U7LaO7ICk" },
  { numero: "80", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CONFIGURAR EL FORMATO DE NUESTRO PDF?", link: "https://youtu.be/MVGuUDWoZsQ" },
  { numero: "81", modulo: "CONFIGURACIONES", titulo: "¿CÓMO SELECCIONAR LOS DECIMALES DE NUESTROS COMPROBANTES?", link: "https://youtu.be/TNQjTf26Uh8" },
  { numero: "83", modulo: "CONFIGURACIONES", titulo: "CÓMO SELECCIONAR QUE NUESTRA EMPRESA PERTENECE AL RÉGIMEN RIMPE", link: "https://youtu.be/dcAJJUaqXdk" },
  { numero: "84", modulo: "CONFIGURACIONES", titulo: "¿CÓMO INSERTAR, CONFIGURAR Y DAR ACCESO A USUARIOS EN NUESTRA EMPRESA?", link: "https://youtu.be/kGYrWUQBH_0" },
  { numero: "86", modulo: "CONFIGURACIONES", titulo: "¿CÓMO INSERTAR UN CONTRATO EN EL SISTEMA?", link: "https://www.youtube.com/watch?v=IY_ffXN7KUA" },
  { numero: "87", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CONFIGURAR LOS PDF EN EL SISTEMA?", link: "https://youtu.be/kJxYHnajaog" },
  { numero: "93", modulo: "CONFIGURACIONES", titulo: "¿CÓMO COLOCAR LA FIRMA DE REPRESENTANTES EN ESTADOS FINANCIEROS?", link: "https://youtu.be/uSoguacF55o" },
  { numero: "97", modulo: "CONFIGURACIONES", titulo: "¿CÓMO CREAR ESTABLECIMIENTOS Y PUNTOS DE EMISIÓN EN EL SISTEMA?", link: "https://youtu.be/siQEQHKDXCk" },
  { numero: "98", modulo: "CONFIGURACIONES", titulo: "¿CÓMO FACTURAR DESDE UN PUNTO DE EMISIÓN ASIGNADO?", link: "https://youtu.be/qF7kRZ1kI_4" },
  { numero: "32", modulo: "CONTABILIDAD", titulo: "¿CÓMO MODIFICAR NUESTROS COMPROBANTES CONTABLES?", link: "https://www.youtube.com/watch?v=UdDUdSEy1Jw&ab_channel=UpConta" },
  { numero: "44", modulo: "CONTABILIDAD", titulo: "¿CÓMO SUBIR UN PLAN DE CUENTAS AL SISTEMA?", link: "https://www.youtube.com/watch?v=EmEcqkXFhjU&t=1s" },
  { numero: "46", modulo: "CONTABILIDAD", titulo: "REGLAS CONTABLES", link: "https://www.youtube.com/watch?v=ruEvY2Jms-4&ab_channel=UpConta" },
  { numero: "47", modulo: "CONTABILIDAD", titulo: "RETENCIONES FISCALES", link: "https://www.youtube.com/watch?v=cFLG-PM3T7g&ab_channel=UpConta" },
  { numero: "52", modulo: "CONTABILIDAD", titulo: "¿CÓMO PODEMOS GENERAR NUESTRO BALANCE GENERAL?", link: "https://www.youtube.com/watch?v=8wLAjmLAMlk" },
  { numero: "66", modulo: "CONTABILIDAD", titulo: "¿CÓMO GENERAR UN REPORTE DEL ESTADO DE PERDIDAS Y GANANCIAS DE NUESTRA EMPRESA?", link: "https://youtu.be/6z6CXgh9CSo" },
  { numero: "68", modulo: "CONTABILIDAD", titulo: "¿CÓMO GENERAR UN REPORTE DE NUESTROS DIARIOS CONTABLES?", link: "https://youtu.be/JIuMlCkg-Jg" },
  { numero: "69", modulo: "CONTABILIDAD", titulo: "¿CÓMO GENERAR UN REPORTE DE NUESTROS MAYORES CONTABLES?", link: "https://youtu.be/xlqU7PKRqL4" },
  { numero: "71", modulo: "CONTABILIDAD", titulo: "¿CÓMO GENERAR UN REPORTE DETALLADO DE INGRESOS Y EGRESOS?", link: "https://youtu.be/ejEJ6iNynUo" },
  { numero: "72", modulo: "CONTABILIDAD", titulo: "¿CÓMO GENERAR UN REPORTE DE NUESTRO BALANCE DE COMPROBACIÓN?", link: "https://youtu.be/_1NZZfMQYuM" },
  { numero: "120", modulo: "CONTABILIDAD", titulo: "¿Cómo generar un asiento de cierre en el sistema?", link: "https://youtu.be/ajToqIUvS9I" },
  { numero: "0", modulo: "FACTURACIÓN RÁPIDA", titulo: "FACTURACIÓN RÁPIDA DESDE LA APP DE UpConta", link: "https://youtu.be/9NjKuBQLrCI" },
  { numero: "53", modulo: "IMPUESTOS", titulo: "¿CÓMO DESCARGAR UN ATS MENSUAL O SEMESTRAL?", link: "https://www.youtube.com/watch?v=Ib9YeenJy4s" },
  { numero: "119", modulo: "INFORMATIVO", titulo: "¿Cómo eliminar el historial de UpConta en un dispositivo Android?", link: "https://youtu.be/JzFbXQGz4Zg" },
  { numero: "91", modulo: "APP & REGISTRO", titulo: "Descarga la app de UPCONTA", link: "https://youtu.be/4rPnsFwVWuw" },
  { numero: "94", modulo: "APP & REGISTRO", titulo: "¿CÓMO AUTORREGISTRARSE EN UpConta?", link: "https://youtu.be/6gaJcd0FptQ" },
  { numero: "104", modulo: "APP & REGISTRO", titulo: "¿CÓMO CREAR UN ACCESO DIRECTO A UpConta EN TU IPHONE?", link: "https://youtu.be/gqqWAmf4dWU" },
  { numero: "109", modulo: "APP & REGISTRO", titulo: "¿CÓMO SOLICITAR LA AUTORIZACIÓN EN EL SRI PARA PODER EMITIR COMPROBANTES ELECTRÓNICOS?", link: "https://youtu.be/loyWCBN987M" },
  { numero: "14", modulo: "NÓMINA", titulo: "¿CÓMO MANEJAR EL MÓDULO DE NÓMINA?", link: "https://www.youtube.com/watch?v=OjnKoVtS64M&ab_channel=UpConta" },
  { numero: "50", modulo: "NÓMINA", titulo: "CÓMO REGISTRAR ANTICIPOS Y PRÉSTAMOS A UN EMPLEADO", link: "https://www.youtube.com/watch?v=R9lYq3sWrUo" },
  { numero: "51", modulo: "NÓMINA", titulo: "CÓMO REGISTRAR LOS PERMISOS, VACACIONES Y FALTAS DE NUESTROS EMPLEADOS?", link: "https://www.youtube.com/watch?v=oPSTHBgHJFQ" },
  { numero: "54", modulo: "NÓMINA", titulo: "¿CÓMO REGISTRAR UN CAMBIO DE SUELDO'", link: "https://www.youtube.com/watch?v=tpUOq3BZfMM" },
  { numero: "55", modulo: "NÓMINA", titulo: "¿CÓMO REGISTRAR HORAS EXTRAS Y COMISIONES?", link: "https://www.youtube.com/watch?v=rUzTw5bNrNE" },
  { numero: "58", modulo: "NÓMINA", titulo: "¿CÓMO GENERAR UN ROL DE PAGOS", link: "https://youtu.be/KBqPa82jFNo" },
  { numero: "92", modulo: "NÓMINA", titulo: "¿CÓMO GENERAR UN REPORTE DE NUESTROS EMPLEADOS EN EL SISTEMA?", link: "https://youtu.be/YOgxEAEkvn8" },
  { numero: "100", modulo: "NÓMINA", titulo: "¿CÓMO GENERAR TU ANEXO RDEP EN UpConta ?", link: "https://youtu.be/uzzIbTZmR8o" },
  { numero: "85", modulo: "PRODUCCIÓN", titulo: "¿CÓMO INSERTAR UN COMPROBANTE DE STOCK EN EL SISTEMA?", link: "https://youtu.be/25MxXZ1ZgxY" },
  { numero: "42", modulo: "PRODUCCIÓN", titulo: "¿CÓMO CREAR UNA ORDEN DE COMPRA?", link: "https://www.youtube.com/watch?v=dDICbmpXadQ&t=9s" },
  { numero: "73", modulo: "PRODUCCIÓN", titulo: "¿CÓMO GENERAR UN REPORTE DE STOCKS?", link: "https://youtu.be/QS2ftQe0wlc" },
  { numero: "75", modulo: "PRODUCCIÓN", titulo: "¿CÓMO CREAR BODEGAS EN EL SISTEMA ?", link: "https://youtu.be/5pafjyM793M" },
  { numero: "19", modulo: "PRODUCCIÓN", titulo: "¿CÓMO CREAR UN PRODUCTO EN EL SISTEMA ?", link: "https://www.youtube.com/watch?v=OFV8GNqivf8&feature=emb_imp_woyt&ab_channel=UpConta" },
  { numero: "22", modulo: "PRODUCCIÓN", titulo: "¿Cómo Crear Un Servicio En El Sistema ?", link: "https://www.youtube.com/watch?v=P1tTKEYsK0w&ab_channel=UpConta" },
  { numero: "24", modulo: "PRODUCCIÓN", titulo: "¿Cómo Alimentar Nuestro Stock De Productos En El Sistema?", link: "https://www.youtube.com/watch?v=7NqccXGg6cA&ab_channel=UpConta" },
  { numero: "56", modulo: "PRODUCCIÓN", titulo: "¿CÓMO HACER UN ASIENTO CIERRE DE COSTOS DE VENTA ?", link: "https://www.youtube.com/watch?v=-ypYl1ESBc0&t=22s" },
  { numero: "43", modulo: "DEMO GENERAL", titulo: "VIDEO DEMOSTRATIVO SISTEMA CONTABLE UPCONTA", link: "https://www.youtube.com/watch?v=U4OZQY_jy_A&t=6s" },
  { numero: "21", modulo: "TESORERÍA", titulo: "¿CÓMO PAGAR FACTURAS DE COMPRA?", link: "https://www.youtube.com/watch?v=SrDem4l2juU&ab_channel=UpConta" },
  { numero: "25", modulo: "TESORERÍA", titulo: "¿Cómo Registrar Un Movimiento?", link: "https://www.youtube.com/watch?v=TQBlVBUZkSk&ab_channel=UpConta" },
  { numero: "27", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UN COBRO?", link: "https://www.youtube.com/watch?v=nieFbMnWhzg&feature=emb_imp_woyt" },
  { numero: "28", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UN ANTICIPO A NUESTRO PROVEEDOR?", link: "https://www.youtube.com/watch?v=SiK2pk6jnBE&ab_channel=UpConta" },
  { numero: "31", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UN ANTICIPO DE UN CLIENTE?", link: "https://www.youtube.com/watch?v=xGkgcHXbv_M&feature=emb_imp_woyt&ab_channel=UpConta" },
  { numero: "33", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UNA CAJA CHICA?", link: "https://www.youtube.com/watch?v=4rpIbBW1DcY&ab_channel=UpConta" },
  { numero: "34", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UNA DEVOLUCIÓN DE UN ANTICIPO A NUESTRO CLIENTE?", link: "https://www.youtube.com/watch?v=40T-garXYW8&ab_channel=UpConta" },
  { numero: "57", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UNA DEVOLUCIÓN DE UN ANTICIPO A NUESTRO PROVEEDOR?", link: "https://www.youtube.com/watch?v=aeXPIwGOr8A&t=28s" },
  { numero: "59", modulo: "TESORERÍA", titulo: "CÓMO REALIZAR UNA LIQUIDACIÓN DE CAJA CHICA", link: "https://youtu.be/cDAIWuR4Ob8" },
  { numero: "60", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UNA TARJETA DE CRÉDITO EN EL SISTEMA?", link: "https://youtu.be/62od8Wfw_Qs" },
  { numero: "61", modulo: "TESORERÍA", titulo: "¿CÓMO REGISTRAR UNA CUENTA BANCARIA EN EL SISTEMA?", link: "https://youtu.be/rmo0vJGxbk0" },
  { numero: "62", modulo: "TESORERÍA", titulo: "¿CÓMO GENERAR UN ESTADO DE CUENTA DE NUESTROS PROVEEDORES?", link: "https://www.youtube.com/watch?v=ETib5_GSxqc" },
  { numero: "63", modulo: "TESORERÍA", titulo: "¿CÓMO GENERAR UN ESTADO DE CUENTA DE NUESTROS CLIENTES?", link: "https://www.youtube.com/watch?v=BNyZ5lxAPu4&ab_channel=UpConta" },
  { numero: "67", modulo: "TESORERÍA", titulo: "¿CÓMO CREAR UNA CAJA EN EL SISTEMA?", link: "https://youtu.be/Vz44YqSLYe4" },
  { numero: "74", modulo: "TESORERÍA", titulo: "¿CÓMO GENERAR UN REPORTE HISTÓRICO DE NUESTROS CLIENTES ?", link: "https://youtu.be/1qEOSICHZ68" },
  { numero: "102", modulo: "TESORERÍA", titulo: "¿CÓMO GENERAR UN ESTADO DE CUENTA DE CLIENTE DESDE UpConta ?", link: "https://www.youtube.com/watch?v=WOsk1KPmiOE&t=3s" },
  { numero: "117", modulo: "TESORERÍA", titulo: "¿Cómo pagar masivamente a tus proveedoresI?", link: "https://youtu.be/kIqdNMfpOsM" },
  { numero: "118", modulo: "TESORERÍA", titulo: "¿Cómo realizar las configuraciones iniciales en el sistema?", link: "https://youtu.be/teGpQY0y_DY" },
  { numero: "110", modulo: "GENERAL", titulo: "¿CÓMO RENOVAR TU SUSCRIPCIÓN EN upConta?", link: "https://youtu.be/CKC6gJ1BuqU" },
  { numero: "111", modulo: "GENERAL", titulo: "¿Cómo manejar el módulo conciliaciones en UpConta?", link: "https://youtu.be/aeZaAp5-oWQ" },
  { numero: "113", modulo: "PRODUCCIÓN", titulo: "¿Cómo manejar el módulo órdenes de producción en UpConta?", link: "https://youtu.be/MjWbuXoNwsY" },
  { numero: "114", modulo: "NÓMINA", titulo: "Conoce la nueva interfaz para generar roles de pago en el sistema", link: "https://youtu.be/zkvJyQkIJw0" },
  { numero: "115", modulo: "RESTAURANTES", titulo: "¿Cómo configurar el módulo restaurantes en el sistema?", link: "https://youtu.be/Q6VW7Fjy4DM" },
  { numero: "116", modulo: "CONFIGURACIONES", titulo: "¿Cómo configurar tu categoría en el sistema de acuerdo al SRI?", link: "https://youtu.be/9ADG0IwgkF8" },
  { numero: "126", modulo: "ADMINISTRATIVO", titulo: "¿Cómo manejar la nueva interfaz de facturación en el sistema?", link: "https://youtu.be/geuj0vQA994" },
  { numero: "127", modulo: "ADMINISTRATIVO", titulo: "¿Cómo manejar la liquidación de importación en UpConta?", link: "https://youtu.be/gH2dL8MyPRU" },
  { numero: "128", modulo: "Biblioteca de Archivos", titulo: "¿Cómo descargar la extensión de UpConta descargador de XML en tu navegador?", link: "https://youtu.be/Xi74noI6tno" },
];

export function LinksModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const modulesList = useMemo(() => {
    const set = new Set<string>();
    TUTORIAL_LINKS.forEach(l => {
      const clean = l.modulo.trim().toUpperCase();
      if (clean) set.add(clean);
    });
    return Array.from(set).sort();
  }, []);

  const filteredLinks = useMemo(() => {
    return TUTORIAL_LINKS.filter(item => {
      const matchSearch =
        searchTerm === "" ||
        item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero.toLowerCase().includes(searchTerm.toLowerCase());

      const matchModule =
        selectedModule === "ALL" ||
        item.modulo.trim().toUpperCase() === selectedModule.toUpperCase();

      return matchSearch && matchModule;
    });
  }, [searchTerm, selectedModule]);

  const handleCopy = (link: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const getModuleBadgeColor = (mod: string) => {
    const m = mod.toUpperCase();
    if (m.includes("ADMIN")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (m.includes("CONTAB")) return "bg-purple-50 text-purple-700 border-purple-200";
    if (m.includes("CONFIG")) return "bg-slate-100 text-slate-700 border-slate-300";
    if (m.includes("NOMINA") || m.includes("NÓMINA")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (m.includes("TESORER")) return "bg-amber-50 text-amber-800 border-amber-200";
    if (m.includes("PRODUC")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (m.includes("BIBLIO") || m.includes("ARCHIV")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (m.includes("IMPUEST")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (m.includes("COMERC")) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, módulo o N° de video..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ×
            </button>
          )}
        </div>

        {/* Module Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
          >
            <option value="ALL">Todos los Módulos ({TUTORIAL_LINKS.length})</option>
            {modulesList.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Links List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B2545] text-white font-extrabold uppercase text-[10.5px] tracking-wider">
                <th className="py-3 px-3 w-14 text-center">N°</th>
                <th className="py-3 px-3 w-36 sm:w-44">Módulo</th>
                <th className="py-3 px-4">Título del Video / Guía</th>
                <th className="py-3 px-3 w-56 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredLinks.map((item, idx) => {
                const isCopied = copiedLink === item.link;
                return (
                  <tr
                    key={`${item.numero}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-bold text-slate-700 border border-slate-200">
                        {item.numero}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getModuleBadgeColor(item.modulo)}`}>
                        {item.modulo || "GENERAL"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 leading-snug">
                      <div className="flex items-start gap-2">
                        <Youtube className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item.titulo}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-md">
                        {item.link}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleCopy(item.link, `${item.titulo}\n${item.link}`)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer border shadow-2xs ${
                            isCopied
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border-slate-200"
                          }`}
                          title="Copiar título y enlace para WhatsApp"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-600" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>

                        <a
                          href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-[#0B2545] hover:bg-[#003566] text-white rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Abrir video en YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                          <span>Ver</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLinks.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-bold">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No se encontraron videos con el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
