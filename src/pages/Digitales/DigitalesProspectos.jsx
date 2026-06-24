//volkswagen
//src/pages/Digitales/DigitalesProspectos.jsx
import { useMemo, useState, useRef, useEffect, useDeferredValue, useCallback } from "react";
import {
    Plus, Search, X, Save, User, Van, CarFront, CalendarDays, ArrowUpDown,
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MessageSquareShare,
    Building2, FileText, FileDown, Car, Trash2, Loader2, CalendarPlus,
    CalendarCheck, Phone, LayoutList, UserStar, ClipboardCheck, BrainCircuit,
    CalendarRange, Table2, BarChart3, Clock3, Flame, AlertCircle, TrendingUp,
    TrendingDown, Eye, MessageCircle, Zap, Activity, Target, Radio, Paperclip,
    UploadCloud,
} from "lucide-react";
import CONCESIONARIO from "/concesionario.png";
import WAP from "/whatsapp.svg";
import FB from "/facebook.svg";
import PHONE from "/phone.svg";
import { api } from "../../lib/apiPruebas";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { apiCitas } from "../../lib/apiCitas";
import { useAuth } from "../../auth/AuthContext";
import * as XLSX from "xlsx";

const BRAND_BLUE = "#131E5C";
const PAGE_SIZE = 200;

const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;

const lineaMeta = {
    Nuevos: { Icon: Car, label: "Nuevos" },
    Usados: { Icon: CarFront, label: "Usados" },
    Comerciales: { Icon: Van, label: "Comerciales" },
};

const origenMeta = {
    "VW-Concesionarios": { Icon: ImgIcon(CONCESIONARIO, "VW-Concesionarios"), label: "VW-Concesionarios" },
    WhatsApp: { Icon: ImgIcon(WAP, "WhatsApp"), label: "WhatsApp" },
    Facebook: { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" },
    "Llamada Entrante": { Icon: ImgIcon(PHONE, "Llamada Entrante"), label: "Llamada Entrante" },
};

const ASESORES_DIGITALES = [
    "Lizbeth Cano Clara", "Erendira Santos Coyotzi", "Marelly Tenorio Salinas",
    "IA Vagen", "Edgar Omar Noguera Solis", "Dulce Abigail Garcia Olivares",
    "Bianca Isabel Chávez Alarcón", "Edgar Omar Nogera Solis",
];

const ESTADOS_PROSPECTO = [
    "Contactado", "Calificado", "Pendiente de Cotización",
    "Requiere Asesor", "Financiamiento", "Sin Respuesta", "Descalificado",
];

const MOTIVO_DESCALIFICACION = [
    "Falta de presupuesto",
    "Sin intención de compra",
    "No califica para financiamiento",
    "Ya compró otro vehículo",
    "No se pudo contactar",
    "Datos de contacto incorrectos",
    "No es el tomador de decisión",
    "Interés fuera del mercado objetivo",
    "Compra pospuesta",
    "Cambio de necesidades",
    "Pérdida de interés",
    "Mala experiencia con la atención",
    "Encontró una mejor oferta",
    "Registro duplicado",
    "Solicitó no ser contactado",
    "Prospecto falso o información inválida"
];

const VEHICULOS = [
    "Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun",
    "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera",
    "Avaluo", "Transporter", "Caddy", "Crafter",
];

const BURO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "bueno", label: "Bueno" },
    { value: "regular", label: "Regular" },
    { value: "iniciando", label: "Iniciando" },
    { value: "desconocido", label: "Desconocido" },
];

const SOLICITUD_CREDITO = [
    { value: "", label: "— Selecciona —" },
    { value: "autorizado", label: "Autorizado" },
    { value: "rechazado", label: "Rechazado" },
    { value: "condicionado", label: "Condicionado" },
];

const FORMA_PAGO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "contado", label: "Contado" },
    { value: "credito", label: "Crédito" },
    { value: "arrendamiento", label: "Arrendamiento" },
    { value: "desconocido", label: "Desconocido" },
];

const TIPO_CLIENTE_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "persona_fisica", label: "Persona física" },
    { value: "persona_moral", label: "Persona moral" },
    { value: "desconocido", label: "Desconocido" },
];

const PLAZO_COMPRA_OPTIONS = [
    "",
    "Inmediato",
    "Esta semana",
    "Este mes",
    "1 a 3 meses",
    "3 a 6 meses",
    "Más de 6 meses",
    "Sin definir",
];

const INITIAL_FILTERS = {
    q: "", estado: "Todos", agencia: "Todos", linea: "Todos",
    buro: "Todos", formaPago: "Todos", tipoCliente: "Todos",
    fechaRegistroDesde: "", fechaRegistroHasta: "",
    fechaContactoDesde: "", fechaContactoHasta: "",
};

const ASESOR_DIGITAL_POR_NUMERO = {
    "522712638803": { asesor_digital: "IA Vagen", agencia: "VW Cordoba" },
    "522721111244": { asesor_digital: "Lizbeth Cano Clara", agencia: "VW Orizaba" },
    "522713133332": { asesor_digital: "Erendira Santos Coyotzi", agencia: "VW Cordoba" },
    "522871232641": { asesor_digital: "Marelly Tenorio Salinas", agencia: "VW Tuxtepec" },
    "527835412658": { asesor_digital: "Edgar Omar Noguera Solis", agencia: "VW Tuxpan" },
    "527828732416": { asesor_digital: "Dulce Abigail Garcia Olivares", agencia: "VW Poza Rica" },
    "522712837999": { asesor_digital: "Bianca Chávez Alarcón", agencia: "VW Córdoba Usados" },
    "522721986539": { asesor_digital: "Candy Denisse Marquez", agencia: "VW Orizaba Usados" },
    "527831263814": { asesor_digital: "Edgar Omar Nogera Solis", agencia: "VW Tuxpan" },
};

const ASESORES = [
    "AURA MARLIZETH FERNANDEZ LOPEZ", "Bianca Isabel Chavez Alarcon", "ERENDIRA SANTOS COYOTZI",
    "IRENE DEL CARMEN GUIZA LOPEZ", "MARCOS RAUL DIAZ RAMOS", "MARIO ALBERTO LOPEZ RAMOS",
    "MARISOL LAGUNES GONZALEZ", "NALLELY HERNANDEZ GARCIA", "OCTAVIO BRUNO GONZALEZ",
    "ROGELIO VAZQUEZ SANCHEZ", "RUBEN ALBERTO TOSQUY ADRIANO", "Saja Azzam Mohammad Jamous",
    "SANDRA LUZ PRIETO PEREZ", "YAMIL MISAEL RODRIGUEZ AGUILAR", "LUIS ALFONSO CORIA MARROQUIN",
    "CANDY DENISSE MARQUEZ CORTES", "DELMAR JAVIER ILLESCAS DOMINGUEZ", "EDGAR JESUS GOMEZ PEREZ",
    "Valeria Zilli Durante", "IDALMY JIMENEZ SANCHEZ", "IVAN JUAREZ ORTEGA", "JESSICA OLIVARES CAMPOS",
    "JESUS XITLAMA GOMEZ", "LIZBETH CANO CLARA", "LUIS MANUEL PALOMARES OLAYO",
    "MARIA DEL CARMEN ZAVALA VELAZQUEZ", "OMAR VILLIERS MONDRAGON", "RUBEN ROMERO VALDES",
    "VERONICA CASTILLO FUENTES", "Hector Rodriguez", "GEOVANI NAVA DIAZ", "ZEILA NAVARRO CONTRERAS",
    "JOSE ALFREDO BARRANCA REYES", "ADRIAN GALVEZ ROLDAN", "MARIA DE GUADALUPE VANVOLLENHOVEN DIAZ",
    "Marelly Tenorio Salinas", "ELIA INES ARANO REYES", "JORGE LUIS ALAMILLO RODRIGUEZ",
    "Cesar Ivan Salazar Reyes", "Cristian Fernando Rivera Godinez", "DULCE ABIGAIL GARCIA OLIVARES",
    "Felix Emmanuel Solis Angeles", "GERMAN JARITH SALAZAR MIRANDA", "Iris Yazmín Gómez Velázquez",
    "Israel Garcia Juarez", "JORGE ANTONIO RODRIGUEZ MARTINEZ", "JOSE DE JESUS GARCIA ROMAN",
    "JUAN MANUEL SOBREVILLA VICENCIO", "Miguel Capitanachi Paredes", "OLIMPIA VAZQUEZ MENDEZ",
    "Roberto Ramses Luna Fajardo", "Carlos Arturo Garces Vengas", "Edgar Omar Noguera Solis",
    "Javier Perez Meraz", "Luis Armando Almora Perez", "Mara Erubey Soto Villegas",
    "Sergio Ivan Quintana Martinez", "Sergio Rene Delgado Sarmiento", "Yoseth Ruiz Castellanos",
    "Dulce Abigail Garcia Olivares", "JOSE ALBERTO SEDAS FLORES", "Luis Alberto Ramirez Santamaria",
    "Paul Serrano Vera", "Luis Manuel Alvarez Martinez",
];

const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    return digits;
}

function formatTelefonoMx(tel) {
    const digits = normalizaTelefonoMx(tel);
    if (!/^52\d{10}$/.test(digits)) return tel || "Sin número";
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function tryParseJson(text) { try { return JSON.parse(text); } catch { return null; } }

function getNumeroUsuarioSesion(user) {
    const nd = normalizaTelefonoMx(user?.telefono || user?.numero_asesor || user?.whatsapp_number || user?.phone || "");
    if (nd) return nd;
    for (const key of ["auth", "crm.user", "user"]) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = tryParseJson(raw);
            if (!parsed || typeof parsed !== "object") continue;
            const userObj = parsed?.user && typeof parsed.user === "object" ? parsed.user : parsed;
            const numero = normalizaTelefonoMx(userObj?.telefono || userObj?.numero_asesor || userObj?.whatsapp_number || userObj?.phone || "");
            if (numero) return numero;
        } catch { /* sin acción */ }
    }
    return "";
}

function getAsesorDigitalPorNumero(numero) {
    return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numero)]?.asesor_digital || "";
}

function getDealerPorNumero(numero) {
    return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numero)]?.agencia || "";
}

function getContextoDigitalPorNumero(numero) {
    return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numero)] || null;
}

function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T00:00`;
    if (s.includes("T")) return s.slice(0, 16);
    return "";
}

function onlyDate(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
}

function splitNombre(full) {
    const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { nombre: "", apellidos: "" };
    if (parts.length === 1) return { nombre: parts[0], apellidos: "" };
    return { nombre: parts.slice(0, 1).join(" "), apellidos: parts.slice(1).join(" ") };
}

function joinNombre(nombre, apellidos) {
    return `${String(nombre || "").trim()} ${String(apellidos || "").trim()}`.trim();
}

function tieneNombreReal(full) {
    const texto = normalizeText(full);
    return !!texto && texto !== "sin nombre";
}

function getNombreCompletoDraft(draft) {
    if (!draft) return "";
    const nombreCompleto = String(draft.nombre_cliente || "").trim();
    if (nombreCompleto) return nombreCompleto;
    return joinNombre(draft.cliente_nombre, draft.cliente_apellidos);
}

function normalizeDateForFilter(value) { return onlyDate(value); }

function isDateInRange(value, desde, hasta) {
    if (!desde && !hasta) return true;
    const dateValue = normalizeDateForFilter(value);
    if (!dateValue) return false;
    if (desde && dateValue < desde) return false;
    if (hasta && dateValue > hasta) return false;
    return true;
}

function getSortValue(row, key) {
    if (["fecha_reclamacion", "fecha_contacto"].includes(key)) return onlyDate(row?.[key] || "");
    if (["ultimo_contacto_at", "primer_contacto_at", "creado", "resumen_actualizado_at"].includes(key)) return toDTLocal(row?.[key] || "");
    return String(row?.[key] ?? "").toLowerCase();
}

function normalizeProspecto(p) {
    const { nombre, apellidos } = splitNombre(p.nombre);
    return {
        id_exp: p.id, cliente_id: p.cliente_id, agencia: p.agencia || "",
        cliente_nombre: nombre, cliente_apellidos: apellidos,
        telefono: String(p.telefono || ""), correo: p.correo || "",
        linea: p.business || "", origen: p.canal_contacto || "",
        pauta: p.pauta || "", estado: p.estado || "",
        comentarios: p.comentarios || "", resumen: p.resumen || "",
        resumen_actualizado_at: toDTLocal(p.resumen_actualizado_at),
        resumen_fuente: p.resumen_fuente || "",
        cliente_interes: p.auto_interes || "",
        asesor_digital: p.asesor_digital || "", asesor_solicita: p.asesor_ventas || "",
        primer_contacto_at: toDTLocal(p.primer_contacto_at),
        ultimo_contacto_at: toDTLocal(p.ultimo_contacto_at),
        creado: toDTLocal(p.creado),
        fecha_atencion: onlyDate(p.primer_contacto_at) || onlyDate(p.creado),
        fecha_contacto: onlyDate(p.ultimo_contacto_at),
        fecha_reclamacion: onlyDate(p.creado),
        requiere_asesor: Boolean(p.requiere_asesor),
        motivo_requiere_asesor: p.motivo_requiere_asesor || "",
        cotizacion_pendiente: Boolean(p.cotizacion_pendiente),
        cotizacion_solicitada_at: toDTLocal(p.cotizacion_solicitada_at),
        enganche_monto: p.enganche_monto || "", presupuesto_mensual: p.presupuesto_mensual || "",
        buro_estado: p.buro_estado || "", forma_pago: p.forma_pago || "",
        tipo_cliente: p.tipo_cliente || "", uso_vehiculo: p.uso_vehiculo || "",
        plazo_compra: p.plazo_compra || "", comprobacion_ingresos: p.comprobacion_ingresos || "",
        ia_pausada: Boolean(p.ia_pausada),
        ia_pausada_motivo: p.ia_pausada_motivo || "",
        ultima_cita_agendada: toDTLocal(p.ultima_cita_agendada),
        asistencia: Boolean(p.asistencia),
    };
}


function toNumber(value) {
    if (value === null || value === undefined || value === "") return 0;
    const num = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(num) && num > 0 ? num : 0;
}

function toNullableNumber(value) {
    const num = toNumber(value);
    return num > 0 ? Math.round(num) : null;
}

function formatMoneyMXN(value) {
    const num = toNumber(value);
    if (!num) return "—";
    return num.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    });
}

function labelFromKey(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function valueOrDash(value) {
    const label = labelFromKey(value);
    return label || "—";
}

function hasPerfilComercial(row) {
    return Boolean(
        toNumber(row.enganche_monto) ||
        toNumber(row.presupuesto_mensual) ||
        row.buro_estado ||
        row.forma_pago ||
        row.tipo_cliente ||
        row.uso_vehiculo ||
        row.plazo_compra ||
        row.comprobacion_ingresos
    );
}

function getMontoBucket(value, type = "enganche") {
    const amount = toNumber(value);
    if (!amount) return "Sin dato";

    if (type === "mensual") {
        if (amount <= 5000) return "$1 - $5k";
        if (amount <= 8000) return "$5k - $8k";
        if (amount <= 12000) return "$8k - $12k";
        if (amount <= 18000) return "$12k - $18k";
        return ">$18k";
    }

    if (amount <= 50000) return "$1 - $50k";
    if (amount <= 100000) return "$50k - $100k";
    if (amount <= 200000) return "$100k - $200k";
    return ">$200k";
}

function countBy(rows, getter, { limit = null, includeEmpty = false, emptyLabel = "Sin dato" } = {}) {
    const map = new Map();

    for (const row of rows) {
        const raw = typeof getter === "function" ? getter(row) : row?.[getter];
        const key = String(raw || "").trim();
        if (!key && !includeEmpty) continue;
        const label = key ? valueOrDash(key) : emptyLabel;
        map.set(label, (map.get(label) || 0) + 1);
    }

    const result = Array.from(map.entries()).sort(([, a], [, b]) => b - a);
    return limit ? result.slice(0, limit) : result;
}

function avgPositive(rows, field) {
    const values = rows.map((row) => toNumber(row[field])).filter(Boolean);
    if (!values.length) return 0;
    return Math.round(values.reduce((acc, item) => acc + item, 0) / values.length);
}

function percent(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
}

function formatDateYMDLocal(date) {
    const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function addDays(date, days) { const c = new Date(date); c.setDate(c.getDate() + days); return c; }

function getStartOfWeek(date) {
    const c = new Date(date), day = c.getDay(), diff = day === 0 ? -6 : 1 - day;
    c.setDate(c.getDate() + diff); return c;
}
function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function getEndOfWeek(date) { const s = getStartOfWeek(date); s.setDate(s.getDate() + 6); return s; }

// ─── Lead Score (computed heuristic) ─────────────────────────────────────────
// ─── Lead Score financiero realista ─────────────────────────────────────────

const PRECIO_REFERENCIA_VW = {
    virtus: 360000,
    polo: 350000,
    jetta: 480000,
    "jetta gli": 650000,
    "golf gti": 800000,
    taos: 560000,
    nivus: 460000,
    taigun: 430000,
    tiguan: 720000,
    teramont: 1150000,
    crossport: 980000,
    saveiro: 330000,
    amarok: 780000,
    transporter: 720000,
    caddy: 590000,
    crafter: 980000,
    tera: 390000,
    seminuevos: 350000,
};

const ENGANCHE_MINIMO_PCT = 0.20;

// Aproximación conservadora para estimar mensualidad mínima.
// No es cotización oficial, solo sirve para scoring interno.
const FACTOR_MENSUALIDAD_APROX = 0.024;

function getPrecioReferenciaVehiculo(row) {
    const interes = normalizeText(row?.cliente_interes || "");

    if (!interes) return 0;

    const match = Object.entries(PRECIO_REFERENCIA_VW).find(([modelo]) =>
        interes.includes(normalizeText(modelo))
    );

    return match ? match[1] : 450000;
}

function getEngancheMinimoEstimado(row) {
    const precio = getPrecioReferenciaVehiculo(row);

    if (!precio) return 0;

    return Math.round(precio * ENGANCHE_MINIMO_PCT);
}

function getMensualidadMinimaEstimada(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    const enganche = toNumber(row.enganche_monto);

    if (!precio) return 0;

    const montoFinanciar = Math.max(precio - enganche, 0);

    return Math.round(montoFinanciar * FACTOR_MENSUALIDAD_APROX);
}

function getPerfilFinancieroDiagnostico(row) {
    const precio = getPrecioReferenciaVehiculo(row);
    const enganche = toNumber(row.enganche_monto);
    const engancheMinimo = getEngancheMinimoEstimado(row);
    const mensualidad = toNumber(row.presupuesto_mensual);
    const mensualidadMinima = getMensualidadMinimaEstimada(row);

    const ratioEnganche = engancheMinimo > 0 ? enganche / engancheMinimo : 0;
    const faltanteEnganche = Math.max(engancheMinimo - enganche, 0);

    return {
        precio,
        enganche,
        engancheMinimo,
        mensualidad,
        mensualidadMinima,
        ratioEnganche,
        faltanteEnganche,
        engancheSuficiente: engancheMinimo > 0 && enganche >= engancheMinimo,
    };
}

function calcLeadScore(row) {
    let score = 8;

    const estado = normalizeText(row.estado);
    const buro = normalizeText(row.buro_estado);
    const formaPago = normalizeText(row.forma_pago);
    const plazo = normalizeText(row.plazo_compra);

    const perfil = getPerfilFinancieroDiagnostico(row);
    const esCredito = formaPago === "credito" || formaPago === "arrendamiento" || !formaPago || formaPago === "desconocido";

    // Interés real
    if (row.cliente_interes) score += 8;
    else score -= 5;

    // Estado comercial
    if (estado === "calificado") score += 12;
    else if (estado === "pendiente de cotizacion" || estado === "pendiente de cotización") score += 9;
    else if (estado === "financiamiento") score += 8;
    else if (estado === "contactado") score += 4;
    else if (estado === "sin respuesta") score -= 14;
    else if (estado === "descalificado") score -= 40;

    // Enganche contra mínimo estimado del 20%
    if (esCredito) {
        if (!perfil.enganche) {
            score -= 10;
        } else if (perfil.ratioEnganche >= 1) {
            score += 24;
        } else if (perfil.ratioEnganche >= 0.75) {
            score += 15;
        } else if (perfil.ratioEnganche >= 0.5) {
            score += 7;
        } else if (perfil.ratioEnganche >= 0.25) {
            score -= 4;
        } else {
            score -= 18;
        }
    }

    // Mensualidad contra estimado aproximado
    if (esCredito) {
        if (!perfil.mensualidad) {
            score -= 6;
        } else if (perfil.mensualidadMinima && perfil.mensualidad >= perfil.mensualidadMinima) {
            score += 14;
        } else if (perfil.mensualidadMinima && perfil.mensualidad >= perfil.mensualidadMinima * 0.75) {
            score += 6;
        } else {
            score -= 8;
        }
    }

    // Buró
    if (buro === "bueno") score += 14;
    else if (buro === "regular") score += 5;
    else if (buro === "iniciando") score -= 10;
    else if (buro === "desconocido" || !buro) score -= 6;

    // Forma de pago
    if (formaPago === "contado") score += 18;
    else if (formaPago === "credito") score += 5;
    else if (formaPago === "arrendamiento") score += 6;
    else score -= 3;

    // Perfil de compra
    if (plazo === "inmediato") score += 10;
    else if (plazo === "esta semana") score += 8;
    else if (plazo === "este mes") score += 5;
    else if (plazo === "1 a 3 meses") score += 2;
    else if (plazo === "mas de 6 meses" || plazo === "más de 6 meses") score -= 6;

    if (row.comprobacion_ingresos) score += 6;
    if (row.tipo_cliente) score += 2;
    if (row.asesor_solicita) score += 6;
    else score -= 4;

    // Actividad reciente, pero ya no debe inflar demasiado
    if (row.ultimo_contacto_at) {
        const h = (Date.now() - new Date(row.ultimo_contacto_at).getTime()) / 36e5;

        if (h < 2) score += 6;
        else if (h < 24) score += 4;
        else if (h < 72) score += 2;
        else if (h > 168) score -= 6;
    }

    if (row.cotizacion_pendiente) score += 5;
    if (row.requiere_asesor) score += 4;
    if (row.ia_pausada) score -= 5;

    // Topes de realidad financiera
    if (esCredito && perfil.engancheMinimo && perfil.enganche && perfil.enganche < perfil.engancheMinimo * 0.5) {
        score = Math.min(score, 45);
    }

    if (esCredito && (!buro || buro === "desconocido")) {
        score = Math.min(score, 60);
    }

    if (buro === "iniciando") {
        score = Math.min(score, 50);
    }

    if (!row.asesor_solicita) {
        score = Math.min(score, 70);
    }

    return Math.min(100, Math.max(0, Math.round(score)));
}

function getScoreLabel(score) {
    if (score >= 80) return { label: "Muy alto", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 60) return { label: "Alto", cls: "text-amber-700 bg-amber-50 border-amber-200" };
    if (score >= 35) return { label: "Medio", cls: "text-sky-700 bg-sky-50 border-sky-200" };
    return { label: "Bajo", cls: "text-slate-500 bg-slate-50 border-slate-200" };
}

function getPrioridad(row) {
    const e = String(row.estado || "").toLowerCase();
    const h = row.ultimo_contacto_at
        ? (Date.now() - new Date(row.ultimo_contacto_at).getTime()) / 36e5
        : 999;
    if (e === "sin respuesta" && h > 24) return { label: "Urgente", cls: "bg-red-100 text-red-800 border-red-300" };
    if (row.cotizacion_pendiente || row.requiere_asesor) return { label: "Alta", cls: "bg-orange-100 text-orange-800 border-orange-300" };
    if (e === "calificado") return { label: "Alta", cls: "bg-orange-100 text-orange-800 border-orange-300" };
    if (h < 6) return { label: "Media", cls: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Normal", cls: "bg-slate-100 text-slate-600 border-slate-300" };
}

function getAccionRequerida(row) {
    if (row.cotizacion_pendiente) return { label: "Cotización pendiente", cls: "bg-amber-100 text-amber-900 border-amber-300" };
    if (row.requiere_asesor) return { label: "Requiere asesor", cls: "bg-orange-100 text-orange-900 border-orange-300" };
    if (String(row.forma_pago || "").toLowerCase().includes("credito")) return { label: "Financiamiento", cls: "bg-sky-100 text-sky-900 border-sky-300" };
    if (row.ia_pausada) return { label: "IA pausada", cls: "bg-slate-100 text-slate-700 border-slate-300" };
    return null;
}

// ─── UI Utilities ─────────────────────────────────────────────────────────────

function cls(...a) { return a.filter(Boolean).join(" "); }

function badgeCls(value) {
    const map = {
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        calificado: "bg-violet-500/15 text-violet-800 border-violet-300/25",
        "pendiente de cotización": "bg-amber-500/20 text-amber-900 border-amber-300/40",
        "requiere asesor": "bg-orange-500/20 text-orange-900 border-orange-300/40",
        financiamiento: "bg-sky-500/15 text-sky-800 border-sky-300/30",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
        descalificado: "bg-slate-500/15 text-slate-700 border-slate-300/25",
    };
    return map[String(value || "").trim().toLowerCase()] || "bg-black/10 text-[#131E5C] border-black/10";
}

function Skeleton({ className = "" }) {
    return <div className={cls("animate-pulse rounded-md bg-black/10", className)} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            {[32, 40, 28, 28, 20].map((w, i) => (
                <td key={i} className="px-4 py-3">
                    <div className={`h-4 w-${w} rounded bg-slate-200/60`} />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function BadgeEstado({ value }) {
    const map = {
        descalificado: "bg-blue-600/15 text-blue-800 font-bold border-blue-300/25",
        contactado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        "sin respuesta": "bg-red-500/15 text-red-800 border-red-300/25",
    };
    const key = String(value || "").trim().toLowerCase();
    const c = map[key] || "bg-black/10 text-[#131E5C] border-black/10";
    return (
        <span className={cls("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", c)}>
            {value || "Sin estado"}
        </span>
    );
}

function LeadScoreRing({ score }) {
    const { label, cls: labelCls } = getScoreLabel(score);
    const radius = 18, circ = 2 * Math.PI * radius;
    const pct = score / 100;
    const color = score >= 75 ? "#059669" : score >= 50 ? "#d97706" : score >= 30 ? "#0284c7" : "#94a3b8";
    return (
        <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 flex-shrink-0">
                <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                    <circle cx="22" cy="22" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="4"
                        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#131E5C]">{score}</span>
            </div>
            <span className={cls("text-xs font-semibold px-2 py-0.5 rounded-full border", labelCls)}>{label}</span>
        </div>
    );
}

// ─── Panel de estadísticas lateral ───────────────────────────────────────────
function SidePanel({ rows, highlighted, onSelectHighlight }) {
    const statsPorEstado = useMemo(() => {
        const map = {};
        for (const r of rows) { const k = r.estado || "Sin estado"; map[k] = (map[k] || 0) + 1; }
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5);
    }, [rows]);

    const statsPorCanal = useMemo(() => {
        const map = {};
        for (const r of rows) { const k = r.origen || "Sin canal"; map[k] = (map[k] || 0) + 1; }
        return Object.entries(map).sort(([, a], [, b]) => b - a);
    }, [rows]);

    const sinRespuesta24h = useMemo(() =>
        rows.filter(r => {
            const e = String(r.estado || "").toLowerCase();
            if (e !== "sin respuesta") return false;
            const h = r.ultimo_contacto_at ? (Date.now() - new Date(r.ultimo_contacto_at).getTime()) / 36e5 : 999;
            return h > 24;
        }).length,
        [rows]
    );

    const leadsCalientes = useMemo(() => rows.filter(r => calcLeadScore(r) >= 80).length, [rows]);
    const pendientesIA = useMemo(() => rows.filter(r => r.cotizacion_pendiente || r.requiere_asesor).length, [rows]);

    const topHighlight = useMemo(() => {
        if (highlighted) return highlighted;
        return [...rows].sort((a, b) => calcLeadScore(b) - calcLeadScore(a))[0] || null;
    }, [rows, highlighted]);

    const topScore = topHighlight ? calcLeadScore(topHighlight) : 0;
    const { label: topLabel } = getScoreLabel(topScore);

    const canalColors = ["#131E5C", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"];
    const total = rows.length || 1;

    return (
        <aside className="flex flex-col gap-4 w-64 flex-shrink-0">

            {/* Prospecto destacado */}
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: BRAND_BLUE }}>
                    <Target className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-bold text-white">Prospecto destacado</span>
                    {topHighlight && (
                        <span className="ml-auto text-[10px] bg-emerald-400/30 text-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                            {topLabel === "Muy alto" ? "Requiere seguimiento hoy" : "Pendiente"}
                        </span>
                    )}
                </div>
                {topHighlight ? (
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="min-w-0">
                                <div className="text-sm font-bold text-[#131E5C] truncate">
                                    {`${topHighlight.cliente_nombre} ${topHighlight.cliente_apellidos}`.trim() || "Sin nombre"}
                                </div>
                                <div className="text-xs text-slate-500">{formatTelefonoMx(topHighlight.telefono)}</div>
                            </div>
                        </div>
                        <LeadScoreRing score={topScore} />
                        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Interés principal</span>
                                <span className="font-semibold text-[#131E5C] truncate max-w-[120px]">{topHighlight.cliente_interes || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Fuente</span>
                                <span className="font-semibold text-[#131E5C]">{topHighlight.origen || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Último contacto</span>
                                <span className="font-semibold text-[#131E5C]">
                                    {topHighlight.ultimo_contacto_at
                                        ? new Date(topHighlight.ultimo_contacto_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                                        : "—"}
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Enganche</div>
                                    <div className="font-black text-[#131E5C]">{formatMoneyMXN(topHighlight.enganche_monto)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Mensualidad</div>
                                    <div className="font-black text-[#131E5C]">{formatMoneyMXN(topHighlight.presupuesto_mensual)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Buró</div>
                                    <div className="font-black text-[#131E5C]">{valueOrDash(topHighlight.buro_estado)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Forma pago</div>
                                    <div className="font-black text-[#131E5C]">{valueOrDash(topHighlight.forma_pago)}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                <span>Prob. conversión</span>
                                <span className="font-bold text-[#131E5C]">{topScore}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-[#131E5C] to-emerald-500 transition-all" style={{ width: `${topScore}%` }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-sm text-slate-400 text-center">Sin prospectos</div>
                )}
            </div>

            {/* Alertas y oportunidades */}
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: BRAND_BLUE }}>
                    <AlertCircle className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-bold text-white">Alertas y oportunidades</span>
                </div>
                <div className="p-3 space-y-2">
                    {leadsCalientes > 0 && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                            <Flame className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <div className="font-bold text-emerald-800">{leadsCalientes} leads calientes</div>
                                <div className="text-emerald-600">Requieren seguimiento inmediato</div>
                            </div>
                        </div>
                    )}
                    {sinRespuesta24h > 0 && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <div className="font-bold text-red-800">{sinRespuesta24h} sin respuesta +24h</div>
                                <div className="text-red-600">Riesgo de perder el prospecto</div>
                            </div>
                        </div>
                    )}
                    {pendientesIA > 0 && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                            <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <div className="font-bold text-amber-800">{pendientesIA} pendientes de atención</div>
                                <div className="text-amber-600">Cotizaciones o asesor requerido</div>
                            </div>
                        </div>
                    )}
                    {leadsCalientes === 0 && sinRespuesta24h === 0 && pendientesIA === 0 && (
                        <div className="text-xs text-center text-slate-400 py-2">Sin alertas activas</div>
                    )}
                </div>
            </div>

            {/* Distribución por estado */}
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: BRAND_BLUE }}>
                    <Activity className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-bold text-white">Distribución por estado</span>
                </div>
                <div className="p-4 space-y-2.5">
                    {statsPorEstado.map(([label, count], i) => (
                        <div key={label}>
                            <div className="flex justify-between text-xs font-semibold text-[#131E5C] mb-1">
                                <span className="truncate">{label}</span>
                                <span className="ml-2 text-slate-500">{count} · {Math.round(count / total * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${count / total * 100}%`, background: canalColors[i % canalColors.length] }} />
                            </div>
                        </div>
                    ))}
                    {statsPorEstado.length === 0 && <div className="text-xs text-slate-400 text-center">Sin datos</div>}
                </div>
            </div>

            {/* Canales principales */}
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: BRAND_BLUE }}>
                    <Radio className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-bold text-white">Canales principales</span>
                </div>
                <div className="p-4 space-y-2.5">
                    {statsPorCanal.map(([label, count], i) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: canalColors[i % canalColors.length] }} />
                            <span className="text-xs flex-1 truncate text-[#131E5C] font-semibold">{label}</span>
                            <span className="text-xs text-slate-400">{Math.round(count / total * 100)}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${count / total * 100}%`, background: canalColors[i % canalColors.length] }} />
                            </div>
                        </div>
                    ))}
                    {statsPorCanal.length === 0 && <div className="text-xs text-slate-400 text-center">Sin datos</div>}
                </div>
            </div>

        </aside>
    );
}

// ─── Vista Gráficos ────────────────────────────────────────────────────────────
function VistaGraficos({ rows }) {
    const totalProspectos = rows.length;
    const totalSeguro = totalProspectos || 1;
    const palette = ["#131E5C", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6366f1", "#14b8a6"];

    const statsPorEstado = useMemo(() => countBy(rows, "estado", { includeEmpty: true, emptyLabel: "Sin estado" }), [rows]);
    const statsPorAgencia = useMemo(() => countBy(rows, "agencia", { includeEmpty: true, emptyLabel: "Sin dealer" }), [rows]);
    const statsPorLinea = useMemo(() => countBy(rows, "linea", { includeEmpty: true, emptyLabel: "Sin business" }), [rows]);
    const statsPorAsesor = useMemo(() => countBy(rows, "asesor_digital", { includeEmpty: true, emptyLabel: "Sin asesor", limit: 10 }), [rows]);
    const statsPorBuro = useMemo(() => countBy(rows, "buro_estado", { includeEmpty: true }), [rows]);
    const statsPorFormaPago = useMemo(() => countBy(rows, "forma_pago", { includeEmpty: true }), [rows]);
    const statsPorTipoCliente = useMemo(() => countBy(rows, "tipo_cliente", { includeEmpty: true }), [rows]);
    const statsPorPlazoCompra = useMemo(() => countBy(rows, "plazo_compra", { includeEmpty: true }), [rows]);
    const statsPorComprobacion = useMemo(() => countBy(rows, "comprobacion_ingresos", { includeEmpty: true }), [rows]);
    const statsPorUsoVehiculo = useMemo(() => countBy(rows, "uso_vehiculo", { includeEmpty: true, limit: 8 }), [rows]);
    const statsRangoEnganche = useMemo(() => countBy(rows, (r) => getMontoBucket(r.enganche_monto, "enganche"), { includeEmpty: true }), [rows]);
    const statsRangoMensual = useMemo(() => countBy(rows, (r) => getMontoBucket(r.presupuesto_mensual, "mensual"), { includeEmpty: true }), [rows]);

    const statsPorDia = useMemo(() => {
        const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const map = { Lunes: 0, Martes: 0, "Miércoles": 0, Jueves: 0, Viernes: 0, "Sábado": 0, Domingo: 0 };
        for (const r of rows) {
            const fechaStr = r.fecha_reclamacion || r.fecha_contacto;
            if (fechaStr) {
                const f = new Date(fechaStr);
                if (!isNaN(f.getTime())) map[diasSemana[f.getDay()]]++;
            }
        }
        const order = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
        return Object.entries(map).filter(([, c]) => c > 0).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
    }, [rows]);

    const statsPorHora = useMemo(() => {
        const map = {};
        for (let i = 0; i < 24; i++) map[`${String(i).padStart(2, "0")}:00`] = 0;
        for (const r of rows) {
            const fechaStr = r.ultimo_contacto_at || r.creado || r.fecha_reclamacion || r.fecha_contacto;
            if (fechaStr) {
                const f = new Date(fechaStr);
                if (!isNaN(f.getTime())) {
                    const hora = `${String(f.getHours()).padStart(2, "0")}:00`;
                    map[hora]++;
                }
            }
        }
        return Object.entries(map).filter(([, c]) => c > 0);
    }, [rows]);

    const perfilCaptura = useMemo(() => [
        ["Enganche", rows.filter((r) => toNumber(r.enganche_monto)).length],
        ["Presupuesto mensual", rows.filter((r) => toNumber(r.presupuesto_mensual)).length],
        ["Buró", rows.filter((r) => r.buro_estado).length],
        ["Forma de pago", rows.filter((r) => r.forma_pago).length],
        ["Tipo de cliente", rows.filter((r) => r.tipo_cliente).length],
        ["Uso del vehículo", rows.filter((r) => r.uso_vehiculo).length],
        ["Plazo de compra", rows.filter((r) => r.plazo_compra).length],
        ["Comprobación ingresos", rows.filter((r) => r.comprobacion_ingresos).length],
    ], [rows]);

    const matrizBuroPago = useMemo(() => {
        const formas = ["credito", "contado", "arrendamiento", "desconocido", "Sin dato"];
        const buros = ["bueno", "regular", "iniciando", "desconocido", "Sin dato"];
        const rowsMatriz = formas.map((forma) => {
            const cells = buros.map((buro) => rows.filter((row) => {
                const formaRow = row.forma_pago || "Sin dato";
                const buroRow = row.buro_estado || "Sin dato";
                return normalizeText(formaRow) === normalizeText(forma) && normalizeText(buroRow) === normalizeText(buro);
            }).length);
            return { forma, cells, total: cells.reduce((a, b) => a + b, 0) };
        }).filter((item) => item.total > 0);
        return { formas, buros, rowsMatriz };
    }, [rows]);

    const promedioEnganche = avgPositive(rows, "enganche_monto");
    const promedioMensual = avgPositive(rows, "presupuesto_mensual");
    const perfilesConDatos = rows.filter(hasPerfilComercial).length;
    const perfilesFinanciables = rows.filter((r) => {
        const forma = normalizeText(r.forma_pago);
        const buro = normalizeText(r.buro_estado);
        return ["credito", "arrendamiento"].includes(forma) && ["bueno", "regular"].includes(buro);
    }).length;
    const cotizacionesPendientes = rows.filter((r) => r.cotizacion_pendiente).length;
    const requiereAsesor = rows.filter((r) => r.requiere_asesor).length;

    function MetricCard({ title, value, subtitle, icon: Icon, tone = "blue" }) {
        const tones = {
            blue: "bg-[#131E5C]/10 text-[#131E5C]",
            green: "bg-emerald-100 text-emerald-700",
            amber: "bg-amber-100 text-amber-700",
            red: "bg-red-100 text-red-700",
            sky: "bg-sky-100 text-sky-700",
        };
        return (
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className={cls("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone] || tones.blue)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-2xl font-black leading-tight text-[#131E5C]">{value}</div>
                        <div className="mt-0.5 text-xs font-bold text-slate-500">{title}</div>
                        {subtitle ? <div className="mt-1 text-[11px] font-semibold text-slate-400">{subtitle}</div> : null}
                    </div>
                </div>
            </div>
        );
    }

    function BarGroup({ title, data, icon: Icon, colorIndex = 0, total = totalSeguro, maxItems = null }) {
        const visibleData = maxItems ? data.slice(0, maxItems) : data;
        const max = Math.max(...visibleData.map(([, count]) => count), 1);
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                        {data.reduce((acc, [, n]) => acc + n, 0)}
                    </span>
                </div>
                <div className="space-y-3 p-5 max-h-[320px] overflow-y-auto">
                    {visibleData.map(([label, count], i) => (
                        <div key={`${title}-${label}`}>
                            <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-[#131E5C]">
                                <span className="truncate" title={label}>{label}</span>
                                <span className="shrink-0 text-slate-500">{count} · {percent(count, total)}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.round((count / max) * 100)}%`, background: palette[(colorIndex + i) % palette.length] }}
                                />
                            </div>
                        </div>
                    ))}
                    {visibleData.length === 0 && <p className="text-center text-sm text-slate-400">Sin datos</p>}
                </div>
            </div>
        );
    }

    function CaptureCard({ title, data, icon: Icon }) {
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">{title}</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">calidad datos</span>
                </div>
                <div className="grid gap-3 p-5 md:grid-cols-2">
                    {data.map(([label, count], i) => (
                        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="mb-1 flex items-center justify-between text-xs font-bold text-[#131E5C]">
                                <span>{label}</span>
                                <span>{percent(count, totalSeguro)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white">
                                <div
                                    className="h-full rounded-full"
                                    style={{ width: `${percent(count, totalSeguro)}%`, background: palette[i % palette.length] }}
                                />
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-400">{count} de {totalProspectos} prospectos</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function MatrixCard() {
        return (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <Target className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-extrabold text-white">Cruce buró vs forma de pago</span>
                    <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">riesgo financiero</span>
                </div>
                <div className="overflow-x-auto p-5">
                    <table className="min-w-full text-left text-xs">
                        <thead>
                            <tr className="text-slate-400">
                                <th className="px-3 py-2 font-black">Forma pago</th>
                                {matrizBuroPago.buros.map((buro) => (
                                    <th key={buro} className="px-3 py-2 text-center font-black">{valueOrDash(buro)}</th>
                                ))}
                                <th className="px-3 py-2 text-center font-black">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {matrizBuroPago.rowsMatriz.map((row, rowIndex) => (
                                <tr key={row.forma}>
                                    <td className="px-3 py-2 font-black text-[#131E5C]">{valueOrDash(row.forma)}</td>
                                    {row.cells.map((count, i) => (
                                        <td key={`${row.forma}-${i}`} className="px-3 py-2 text-center">
                                            <span
                                                className="inline-flex min-w-8 justify-center rounded-lg px-2 py-1 font-black text-[#131E5C]"
                                                style={{ background: count ? `${palette[(rowIndex + i) % palette.length]}18` : "#f8fafc" }}
                                            >
                                                {count || "—"}
                                            </span>
                                        </td>
                                    ))}
                                    <td className="px-3 py-2 text-center font-black text-[#131E5C]">{row.total}</td>
                                </tr>
                            ))}
                            {matrizBuroPago.rowsMatriz.length === 0 && (
                                <tr>
                                    <td colSpan={matrizBuroPago.buros.length + 2} className="px-3 py-8 text-center text-slate-400">
                                        Sin datos suficientes para el cruce.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <MetricCard icon={User} title="Prospectos analizados" value={totalProspectos.toLocaleString("es-MX")} subtitle="Resultado de filtros actuales" />
                <MetricCard icon={TrendingUp} title="Perfil comercial capturado" value={`${percent(perfilesConDatos, totalSeguro)}%`} subtitle={`${perfilesConDatos} con datos financieros`} tone="green" />
                <MetricCard icon={FileText} title="Enganche promedio" value={formatMoneyMXN(promedioEnganche)} subtitle="Solo prospectos con enganche" tone="sky" />
                <MetricCard icon={Clock3} title="Mensualidad promedio" value={formatMoneyMXN(promedioMensual)} subtitle="Solo prospectos con presupuesto" tone="sky" />
                <MetricCard icon={Target} title="Financiables" value={perfilesFinanciables} subtitle="Crédito/arrendamiento + buró bueno/regular" tone="green" />
                <MetricCard icon={AlertCircle} title="Atención comercial" value={cotizacionesPendientes + requiereAsesor} subtitle={`${cotizacionesPendientes} cotizaciones · ${requiereAsesor} asesor`} tone="amber" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <BarGroup title="Pipeline por estado" data={statsPorEstado} icon={BarChart3} colorIndex={0} />
                <BarGroup title="Distribución por dealer" data={statsPorAgencia} icon={Building2} colorIndex={2} />
                <BarGroup title="Distribución por business" data={statsPorLinea} icon={Car} colorIndex={4} />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <BarGroup title="Buró de crédito" data={statsPorBuro} icon={ClipboardCheck} colorIndex={1} />
                <BarGroup title="Forma de pago" data={statsPorFormaPago} icon={FileText} colorIndex={3} />
                <BarGroup title="Tipo de cliente" data={statsPorTipoCliente} icon={UserStar} colorIndex={5} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <BarGroup title="Rangos de enganche" data={statsRangoEnganche} icon={TrendingUp} colorIndex={2} />
                <BarGroup title="Rangos de presupuesto mensual" data={statsRangoMensual} icon={Clock3} colorIndex={4} />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <BarGroup title="Plazo de compra" data={statsPorPlazoCompra} icon={CalendarRange} colorIndex={0} />
                <BarGroup title="Comprobación de ingresos" data={statsPorComprobacion} icon={FileText} colorIndex={2} />
                <BarGroup title="Uso del vehículo" data={statsPorUsoVehiculo} icon={CarFront} colorIndex={4} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <CaptureCard title="Cobertura de captura por campo" data={perfilCaptura} icon={Activity} />
                <MatrixCard />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <BarGroup title="Top 10 asesores digitales" data={statsPorAsesor} icon={UserStar} colorIndex={1} />
                <BarGroup title="Actividad por hora" data={statsPorHora} icon={Clock3} colorIndex={5} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <BarGroup title="Registros por día de la semana" data={statsPorDia} icon={CalendarDays} colorIndex={3} />
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                        <ClipboardCheck className="h-4 w-4 text-white/70" />
                        <span className="text-sm font-extrabold text-white">Lectura ejecutiva</span>
                    </div>
                    <div className="space-y-3 p-5 text-sm text-slate-600">
                        <p>
                            <span className="font-black text-[#131E5C]">{percent(perfilesConDatos, totalSeguro)}%</span> de los prospectos tiene al menos un dato comercial capturado.
                        </p>
                        <p>
                            <span className="font-black text-[#131E5C]">{perfilesFinanciables}</span> prospectos tienen perfil potencialmente financiable según forma de pago y buró.
                        </p>
                        <p>
                            Prioriza los casos con cotización pendiente, asesor requerido, buen buró y presupuesto mensual capturado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/45" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-2 sm:items-center sm:p-4">
                <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-[#131E5C]/20 bg-neutral-100 shadow-xl">
                    <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                        </div>
                        <button type="button" onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 [scrollbar-gutter:stable]">
                        {children}
                    </div>
                    {footer && (
                        <div className="flex shrink-0 flex-col gap-2 border-t border-[#131E5C]/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="h-full rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{label}</span>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function LineaPicker({ value, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(lineaMeta).map(([key, meta]) => {
                const active = value === key;
                const Icon = meta.Icon;
                return (
                    <button key={key} type="button" onClick={() => onChange(key)}
                        className={cls("flex h-14 w-full items-center justify-center gap-2 rounded-xl border px-4 transition",
                            active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/20" : "border-black/10 bg-neutral-50 hover:bg-white")}>
                        <span className={cls("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                            active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white")}>
                            <Icon className="h-4 w-4 text-[#131E5C]" />
                        </span>
                        <span className="truncate text-sm font-semibold text-[#131E5C]">{meta.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function OrigenPicker({ value, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {Object.entries(origenMeta).map(([key, meta]) => {
                const active = value === key;
                const Icon = meta.Icon;
                return (
                    <button type="button" key={key} onClick={() => onChange(key)}
                        className={cls("flex h-14 w-full items-center gap-3 rounded-xl border px-4 text-left transition",
                            active ? "border-[#131E5C]/50 bg-white ring-2 ring-[#131E5C]/20" : "border-black/10 bg-neutral-50 hover:bg-white")}>
                        <div className={cls("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                            active ? "border-[#131E5C]/40 bg-[#131E5C]/10" : "border-black/10 bg-white")}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-[#131E5C]">{meta.label}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={e => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DigitalesProspectos() {
    const navigate = useNavigate();
    const { user, ready } = useAuth();
    const [cases, setCases] = useState([]);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [viewMode, setViewMode] = useState("tabla");
    const [highlightedRow, setHighlightedRow] = useState(null);
    const fileInputRef = useRef(null);

    const VIEW_MODES = [
        { key: "tabla", label: "Tabla", Icon: Table2 },
        { key: "graficos", label: "Gráficos", Icon: BarChart3 },
    ];

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencias = useMemo(() =>
        String(user?.agencia || "").split("|").map(a => a.trim()).filter(Boolean),
        [user?.agencia]
    );

    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            const agencia = String(agenciaRegistro || "").trim();
            if (!agencia) return false;
            return userAgencias.some(a => a.toLowerCase() === agencia.toLowerCase());
        },
        [userAgencias]
    );

    const numeroUsuarioSesion = useMemo(() => getNumeroUsuarioSesion(user), [user]);
    const contextoDigitalSesion = useMemo(() => getContextoDigitalPorNumero(numeroUsuarioSesion), [numeroUsuarioSesion]);

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [pautasMeta, setPautasMeta] = useState([]);
    const [loadingPautas, setLoadingPautas] = useState(false);
    const [updatingEstado, setUpdatingEstado] = useState({});
    const [generatingSummary, setGeneratingSummary] = useState({});
    const [openSummaryModal, setOpenSummaryModal] = useState(false);
    const [summaryInfo, setSummaryInfo] = useState(null);
    const [sort, setSort] = useState({ key: null, dir: "asc" });
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [selectedNumeroAsesor, setSelectedNumeroAsesor] = useState("Todos");
    const deferredQ = useDeferredValue(filters.q);
    const [page, setPage] = useState(1);
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingCases, setLoadingCases] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [touchedSave, setTouchedSave] = useState(false);
    const [openAgendaModal, setOpenAgendaModal] = useState(false);
    const [agendaInfo, setAgendaInfo] = useState(null);
    const [drafter, setDrafter] = useState({ agencia: "", fecha_cita: "", asesor_digital: "", asesor_solicita: "", tipo_cita: "" });
    const [savingo, setSavingo] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const totalEvidenciasDraft =
        (draft?.evidencias_existentes?.length || 0) +
        (draft?.evidencias_nuevas?.length || 0);
    useEffect(() => {
        const cerrar = () => setCtxMenu(prev => prev.open ? { open: false, x: 0, y: 0, row: null } : prev);
        window.addEventListener("click", cerrar);
        window.addEventListener("scroll", cerrar, true);
        window.addEventListener("resize", cerrar);
        return () => { window.removeEventListener("click", cerrar); window.removeEventListener("scroll", cerrar, true); window.removeEventListener("resize", cerrar); };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };

    const eliminarCaso = async (row) => {
        if (!row?.id_exp) return;
        if (!confirm(`¿Eliminar el prospecto ${row.id_exp}? Esta acción no se puede deshacer.`)) return;
        try {
            await api.digitalesDeleteProspecto(row.id_exp);
            setCases(prev => prev.filter(c => c.id_exp !== row.id_exp));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) { console.error(e); alert("No se pudo eliminar (revisa consola / backend)."); }
    };

    const REQUIRED = useMemo(() => ({ telefono: "Teléfono" }), []);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter(key => {
            const v = draft[key];
            return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
        });
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits]);

    const telInvalid = !!telError;

    const inputBase = "w-full rounded-lg border px-3 py-2.5 text-sm text-[#131E5C] font-semibold outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";
    const filterControlCls = "h-9 w-full rounded-lg border border-[#131E5C] bg-white px-3 text-sm text-[#131E5C] shadow-sm outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15";
    const filterLabelCls = "mb-1.5 block text-xs font-bold text-[#131E5C]";

    useEffect(() => {
        (async () => {
            setLoadingCases(true);
            try {
                const data = await api.digitalesListProspectos();
                setCases((Array.isArray(data) ? data : []).map(normalizeProspecto));
            } catch (e) { console.error(e); setCases([]); }
            finally { setLoadingCases(false); }
        })();
    }, []);

    useEffect(() => {
        if (!openModal || pautasMeta.length) return;
        (async () => {
            setLoadingPautas(true);
            try {
                const res = await api.digitalesCampanasMeta(30);
                setPautasMeta(Array.isArray(res?.items) ? res.items : []);
            } catch (e) { console.error(e); setPautasMeta([]); }
            finally { setLoadingPautas(false); }
        })();
    }, [openModal, pautasMeta.length]);

    useEffect(() => {
        if (!ready) return;
        if (!isAdmin) { setSelectedNumeroAsesor(numeroUsuarioSesion || ""); return; }
        setSelectedNumeroAsesor(prev => prev || "Todos");
    }, [isAdmin, numeroUsuarioSesion, ready]);

    const filtroNumeroActivo = useMemo(() => {
        if (isAdmin) {
            if (selectedNumeroAsesor === "Todos") return null;
            return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(selectedNumeroAsesor)] || null;
        }
        return ASESOR_DIGITAL_POR_NUMERO[normalizaTelefonoMx(numeroUsuarioSesion)] || null;
    }, [isAdmin, selectedNumeroAsesor, numeroUsuarioSesion]);

    const dealers = useMemo(() => {
        const d = new Set(cases.map(c => c.agencia).filter(Boolean));
        if (!isAdmin && userAgencias.length > 0) return ["Todos", ...userAgencias];
        return ["Todos", ...Array.from(d)];
    }, [cases, isAdmin, userAgencias]);

    const estados = useMemo(() => {
        const s = new Set(cases.map(c => c.estado).filter(Boolean));
        return ["Todos", ...Array.from(s)];
    }, [cases]);

    const businessOptions = useMemo(() => {
        const set = new Set(cases.map(c => String(c.linea || "").trim()).filter(Boolean));
        const orderedKnown = Object.keys(lineaMeta).filter(item => set.has(item));
        const extras = Array.from(set).filter(item => !orderedKnown.includes(item)).sort((a, b) => a.localeCompare(b, "es"));
        return ["Todos", ...orderedKnown, ...extras];
    }, [cases]);

    const buroOptions = useMemo(() => {
        const items = Array.from(new Set(cases.map(c => String(c.buro_estado || "").trim()).filter(Boolean)));
        return ["Todos", ...items.sort((a, b) => valueOrDash(a).localeCompare(valueOrDash(b), "es"))];
    }, [cases]);

    const formaPagoOptions = useMemo(() => {
        const items = Array.from(new Set(cases.map(c => String(c.forma_pago || "").trim()).filter(Boolean)));
        return ["Todos", ...items.sort((a, b) => valueOrDash(a).localeCompare(valueOrDash(b), "es"))];
    }, [cases]);

    const tipoClienteOptions = useMemo(() => {
        const items = Array.from(new Set(cases.map(c => String(c.tipo_cliente || "").trim()).filter(Boolean)));
        return ["Todos", ...items.sort((a, b) => valueOrDash(a).localeCompare(valueOrDash(b), "es"))];
    }, [cases]);

    const phoneOptions = useMemo(() => {
        const numeros = Object.keys(ASESOR_DIGITAL_POR_NUMERO).sort((a, b) => a.localeCompare(b, "es"));
        return ["Todos", ...numeros];
    }, []);

    function toggleSort(key) {
        setSort(prev => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" });
    }

    const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

    const filtered = useMemo(() => {
        const q = deferredQ.trim().toLowerCase();
        return cases.filter(c => {
            const nombre = `${c.cliente_nombre || ""} ${c.cliente_apellidos || ""}`.trim();
            if (!isAdmin && userAgencias.length > 0 && !userTieneAgencia(c.agencia)) return false;
            if (filtroNumeroActivo) {
                if (normalizeText(c.asesor_digital) !== normalizeText(filtroNumeroActivo.asesor_digital)) return false;
                if (normalizeText(c.agencia) !== normalizeText(filtroNumeroActivo.agencia)) return false;
            } else if (!isAdmin) return false;
            const matchQ = !q || [
                c.id_exp, c.cliente_id, c.agencia, nombre, c.comentarios, c.estado,
                c.telefono, c.correo, c.asesor_digital, c.asesor_solicita, c.linea,
                c.origen, c.cliente_interes, c.pauta, c.enganche_monto,
                c.presupuesto_mensual, c.buro_estado, c.forma_pago, c.tipo_cliente,
                c.uso_vehiculo, c.plazo_compra, c.comprobacion_ingresos,
            ].some(v => String(v || "").toLowerCase().includes(q));

            return matchQ &&
                (filters.estado === "Todos" || c.estado === filters.estado) &&
                (filters.agencia === "Todos" || c.agencia === filters.agencia) &&
                (filters.linea === "Todos" || c.linea === filters.linea) &&
                (filters.buro === "Todos" || c.buro_estado === filters.buro) &&
                (filters.formaPago === "Todos" || c.forma_pago === filters.formaPago) &&
                (filters.tipoCliente === "Todos" || c.tipo_cliente === filters.tipoCliente) &&
                isDateInRange(c.fecha_reclamacion, filters.fechaRegistroDesde, filters.fechaRegistroHasta) &&
                isDateInRange(c.fecha_contacto || c.ultimo_contacto_at, filters.fechaContactoDesde, filters.fechaContactoHasta);
        });
    }, [cases, deferredQ, filters, isAdmin, filtroNumeroActivo, userAgencias, userTieneAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        if (!sort.key) return data;
        const dir = sort.dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const va = getSortValue(a, sort.key), vb = getSortValue(b, sort.key);
            if (va < vb) return -1 * dir;
            if (va > vb) return 1 * dir;
            return 0;
        });
    }, [filtered, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    useEffect(() => { setPage(1); }, [filters, sort]);
    useEffect(() => { setPage(prev => Math.min(prev, totalPages)); }, [totalPages]);

    const paginatedRows = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
    const pageStart = sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const pageEnd = sorted.length === 0 ? 0 : Math.min(page * PAGE_SIZE, sorted.length);

    // KPIs
    const kpis = useMemo(() => {
        const total = sorted.length;
        const calientes = sorted.filter(r => calcLeadScore(r) >= 80).length;
        const sinResp = sorted.filter(r => String(r.estado || "").toLowerCase() === "sin respuesta").length;
        const pendIA = sorted.filter(r => r.cotizacion_pendiente || r.requiere_asesor).length;
        const conPerfil = sorted.filter(hasPerfilComercial).length;
        const financiamiento = sorted.filter(r => ["credito", "arrendamiento"].includes(normalizeText(r.forma_pago))).length;
        const tiemposResp = sorted
            .filter(r => r.primer_contacto_at && r.creado)
            .map(r => (new Date(r.primer_contacto_at).getTime() - new Date(r.creado).getTime()) / 60000)
            .filter(v => v > 0 && v < 1440);
        const avgResp = tiemposResp.length ? Math.round(tiemposResp.reduce((a, b) => a + b, 0) / tiemposResp.length) : null;
        return { total, calientes, sinResp, pendIA, conPerfil, financiamiento, avgResp };
    }, [sorted]);

    const pautasOptions = useMemo(() => {
        const items = Array.isArray(pautasMeta) ? pautasMeta : [];
        const vistos = new Set();
        const opciones = [];
        for (const item of items) {
            const value = String(item?.value || "").trim();
            const label = String(item?.label || value).trim();
            if (!value) continue;
            const key = normalizeText(value);
            if (vistos.has(key)) continue;
            vistos.add(key);
            opciones.push({ value, label });
        }
        return opciones.sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
    }, [pautasMeta]);

    const dtFmt = new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    function fmtDTIntl(value) {
        if (!value) return "—";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "—" : dtFmt.format(d);
    }

    function limpiarValorExcel(value) {
        if (value === null || value === undefined || value === "") return "—";
        const texto = String(value).trim();
        return /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
    }

    function exportarExcelProspectos() {
        if (!sorted.length) { alert("No hay registros para exportar con los filtros actuales."); return; }
        const ahora = new Date();
        const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
        const hora = `${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;
        const registros = sorted.map(row => ({
            ID: limpiarValorExcel(row.id_exp), Dealer: limpiarValorExcel(row.agencia),
            Cliente: limpiarValorExcel(`${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim()),
            Teléfono: limpiarValorExcel(formatTelefonoMx(row.telefono)),
            Correo: limpiarValorExcel(row.correo), Business: limpiarValorExcel(row.linea),
            "Canal de Contacto": limpiarValorExcel(row.origen), "Pauta de Origen": limpiarValorExcel(row.pauta),
            Estado: limpiarValorExcel(row.estado), "Asesor Digital": limpiarValorExcel(row.asesor_digital),
            "Asignado a": limpiarValorExcel(row.asesor_solicita),
            "VW de sus sueños": limpiarValorExcel(row.cliente_interes),
            "Fecha de Registro": limpiarValorExcel(row.fecha_reclamacion),
            "Primer Contacto": limpiarValorExcel(fmtDTIntl(row.primer_contacto_at)),
            "Último Contacto": limpiarValorExcel(fmtDTIntl(row.ultimo_contacto_at)),
            "Enganche": limpiarValorExcel(formatMoneyMXN(row.enganche_monto)),
            "Presupuesto mensual": limpiarValorExcel(formatMoneyMXN(row.presupuesto_mensual)),
            "Buró": limpiarValorExcel(valueOrDash(row.buro_estado)),
            "Forma de pago": limpiarValorExcel(valueOrDash(row.forma_pago)),
            "Tipo cliente": limpiarValorExcel(valueOrDash(row.tipo_cliente)),
            "Uso vehículo": limpiarValorExcel(row.uso_vehiculo),
            "Plazo compra": limpiarValorExcel(row.plazo_compra),
            "Comprobación ingresos": limpiarValorExcel(row.comprobacion_ingresos),
            "Cotización pendiente": row.cotizacion_pendiente ? "Sí" : "No",
            "Requiere asesor": row.requiere_asesor ? "Sí" : "No",
            "IA pausada": row.ia_pausada ? "Sí" : "No",
            "Última cita agendada": limpiarValorExcel(fmtDTIntl(row.ultima_cita_agendada)),
            "Asistencia": row.asistencia ? "Sí" : "No",
            Comentarios: limpiarValorExcel(row.comentarios), "Resumen IA": limpiarValorExcel(row.resumen),
        }));
        const ws = XLSX.utils.json_to_sheet(registros);
        ws["!cols"] = Array(32).fill({ wch: 22 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Prospectos");
        XLSX.writeFile(wb, `reporte_prospectos_${fecha}_${hora}.xlsx`, { compression: true });
    }

    const openCreate = () => {
        setTouchedSave(false);
        setMode("create");
        const now = new Date();
        const nowLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        setDraft({
            id_exp: null, agencia: !isAdmin ? (contextoDigitalSesion?.agencia || "") : "",
            tiene_nombre: false, cliente_nombre: "", cliente_apellidos: "",
            telefono: "", correo: "", linea: "", origen: "", pauta: "", estado: "Contactado",
            cliente_interes: "", comentarios: "",
            asesor_digital: !isAdmin ? (contextoDigitalSesion?.asesor_digital || "") : "",
            asesor_solicita: "", creado: nowLocal, primer_contacto_at: "", ultimo_contacto_at: "",
            enganche_monto: "", presupuesto_mensual: "", buro_estado: "", forma_pago: "",
            tipo_cliente: "", uso_vehiculo: "", plazo_compra: "", comprobacion_ingresos: "",
        });
        setOpenModal(true);
    };

    const closeAgendaModal = () => { setOpenAgendaModal(false); setAgendaInfo(null); };
    const closeSummaryModal = () => { setOpenSummaryModal(false); setSummaryInfo(null); };

    const openSummaryViewer = (row) => {
        if (!row) return;
        setSummaryInfo({ id_exp: row.id_exp, nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(), resumen: row.resumen || "", resumen_actualizado_at: row.resumen_actualizado_at || "", resumen_fuente: row.resumen_fuente || "" });
        setOpenSummaryModal(true);
    };

    const abrirAgendaCita = (row) => {
        if (!row) return;
        const nombre = `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim();
        setAgendaInfo({ id_exp: row.id_exp, cliente_id: row.cliente_id, nombre, telefono: row.telefono || "", correo: row.correo || "", auto_interes: row.cliente_interes || "", agencia: row.agencia || "", fuente_prospeccion: row.origen || "", fecha_cita: "", asesor_digital: row.asesor_digital, asesor_solicita: row.asesor_solicita, tipo_cita: "" });
        setOpenAgendaModal(true);
    };

    const openEdit = async (row) => {
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const p = await api.digitalesGetProspecto(row.id_exp);
            const nombreCompleto = String(p.nombre || "").trim();
            const tieneNombre = tieneNombreReal(nombreCompleto);
            setDraft({
                id_exp: p.id, agencia: p.agencia || "", tiene_nombre: tieneNombre,
                nombre_cliente: tieneNombre ? nombreCompleto : "",
                telefono: String(p.telefono || ""), correo: p.correo || "",
                linea: p.business || "", origen: p.canal_contacto || "", pauta: p.pauta || "",
                estado: p.estado || "", cliente_interes: p.auto_interes || "",
                comentarios: p.comentarios || "", resumen: p.resumen || "",
                resumen_actualizado_at: toDTLocal(p.resumen_actualizado_at),
                resumen_fuente: p.resumen_fuente || "", asesor_digital: p.asesor_digital || "",
                asesor_solicita: p.asesor_ventas || "", creado: toDTLocal(p.creado),
                primer_contacto_at: toDTLocal(p.primer_contacto_at),
                ultimo_contacto_at: toDTLocal(p.ultimo_contacto_at),
                enganche_monto: p.enganche_monto || "",
                presupuesto_mensual: p.presupuesto_mensual || "",
                buro_estado: p.buro_estado || "",
                forma_pago: p.forma_pago || "",
                tipo_cliente: p.tipo_cliente || "",
                uso_vehiculo: p.uso_vehiculo || "",
                plazo_compra: p.plazo_compra || "",
                comprobacion_ingresos: p.comprobacion_ingresos || "",
            });
        } catch (e) { console.error(e); alert("No se pudo abrir el prospecto para editar."); setOpenModal(false); }
        finally { setLoadingDetail(false); }
    };

    const closeModal = () => { if (saving) return; setOpenModal(false); setDraft(null); };

    const refreshList = async () => {
        const data = await api.digitalesListProspectos();
        setCases((Array.isArray(data) ? data : []).map(normalizeProspecto));
    };

    const save = async () => {
        if (!draft || saving || !telIsOk) return;
        setTouchedSave(true);
        if (missing.length || telInvalid) return;
        setSaving(true);
        try {
            const agenciaFinal = !isAdmin && contextoDigitalSesion?.agencia ? contextoDigitalSesion.agencia : (draft.agencia || "");
            const asesorDigitalFinal = !isAdmin && contextoDigitalSesion?.asesor_digital ? contextoDigitalSesion.asesor_digital : (draft.asesor_digital || "");
            const nombreCapturado = getNombreCompletoDraft(draft);
            const nombreFinal = draft.tiene_nombre && nombreCapturado ? nombreCapturado : "SIN NOMBRE";
            const payload = {
                nombre: nombreFinal,
                telefono: draft.telefono,
                correo: draft.correo,
                agencia: agenciaFinal,
                business: draft.linea,
                canal_contacto: draft.origen,
                pauta: draft.pauta,
                estado: draft.estado,
                asesor_digital: asesorDigitalFinal,
                asesor_ventas: draft.asesor_solicita || "",
                auto_interes: draft.cliente_interes || "",
                comentarios: draft.comentarios || "",
                enganche_monto: toNullableNumber(draft.enganche_monto),
                presupuesto_mensual: toNullableNumber(draft.presupuesto_mensual),
                buro_estado: draft.buro_estado || "",
                forma_pago: draft.forma_pago || "",
                tipo_cliente: draft.tipo_cliente || "",
                uso_vehiculo: draft.uso_vehiculo || "",
                plazo_compra: draft.plazo_compra || "",
                comprobacion_ingresos: draft.comprobacion_ingresos || "",
                id_cotizacion: draft.id_cotizacion || "",
                folio_solicitud_credito: draft.folio_solicitud_credito || "",
                solicitud_credito_estado: draft.solicitud_credito_estado || "",
                vin_facturado: draft.vin_facturado || "",
                vin_estatus_entrega: draft.vin_estatus_entrega || "",
            };
            if (mode === "create") { payload.primer_contacto_at = draft.primer_contacto_at || null; payload.ultimo_contacto_at = draft.ultimo_contacto_at || null; await api.digitalesCreateProspecto(payload); }
            else { await api.digitalesUpdateProspecto(draft.id_exp, payload); }
            await refreshList(); closeModal();
        } catch (e) { console.error(e); alert("Error guardando el prospecto."); }
        finally { setSaving(false); }
    };

    useEffect(() => {
        if (openAgendaModal && agendaInfo) {
            setDrafter({ agencia: agendaInfo.agencia || "", fecha_cita: agendaInfo.fecha_cita || "", asesor_digital: agendaInfo.asesor_digital || "", asesor_solicita: agendaInfo.asesor_solicita || "", tipo_cita: agendaInfo.tipo_cita || "" });
            setErrorMsg("");
        }
    }, [openAgendaModal, agendaInfo]);

    async function handleAgendar() {
        if (!agendaInfo) return;
        try {
            setSavingo(true); setErrorMsg("");
            await apiCitas.create({ cliente_id: agendaInfo.cliente_id, nombre: agendaInfo.nombre, telefono: agendaInfo.telefono, correo: agendaInfo.correo || "", auto_interes: agendaInfo.auto_interes || "", agencia: agendaInfo.agencia || "", fecha_hora_cita: drafter.fecha_cita || null, fuente_prospeccion: agendaInfo.fuente_prospeccion || "", asesor_digital: drafter.asesor_digital || "", asesor_solicita: drafter.asesor_solicita || "", asesor_asignado: drafter.asesor_solicita || "", tipo_cita: drafter.tipo_cita || "" });
            await refreshList(); closeAgendaModal();
        } catch (err) { setErrorMsg(err?.message || "No se pudo crear la cita"); }
        finally { setSavingo(false); }
    }

    const updateEstadoInline = async (row, newEstado) => {
        const id = row?.id_exp; if (!id) return;
        const prevEstado = row.estado;
        setCases(prev => prev.map(c => c.id_exp === id ? { ...c, estado: newEstado } : c));
        setUpdatingEstado(p => ({ ...p, [id]: true }));
        try { await api.digitalesPatchProspecto(id, { estado: newEstado }); }
        catch (e) { console.error(e); setCases(prev => prev.map(c => c.id_exp === id ? { ...c, estado: prevEstado } : c)); alert("No se pudo actualizar el estado."); }
        finally { setUpdatingEstado(p => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const generarResumenInline = async (row) => {
        const id = row?.id_exp; if (!id) return;
        setGeneratingSummary(prev => ({ ...prev, [id]: true }));
        try {
            const res = await api.digitalesGenerarResumen(id);
            const resumenNuevo = res?.resumen || "";
            const resumenActualizadoAt = toDTLocal(res?.resumen_actualizado_at);
            const resumenFuente = res?.resumen_fuente || "manual";
            setCases(prev => prev.map(c => c.id_exp === id ? { ...c, resumen: resumenNuevo, resumen_actualizado_at: resumenActualizadoAt, resumen_fuente: resumenFuente } : c));
            if (draft?.id_exp === id) setDraft(prev => ({ ...prev, resumen: resumenNuevo, resumen_actualizado_at: resumenActualizadoAt, resumen_fuente: resumenFuente }));
            setSummaryInfo({ id_exp: row.id_exp, nombre: `${row.cliente_nombre || ""} ${row.cliente_apellidos || ""}`.trim(), resumen: resumenNuevo, resumen_actualizado_at: resumenActualizadoAt, resumen_fuente: resumenFuente });
            setOpenSummaryModal(true);
        } catch (e) { console.error(e); alert("No se pudo generar el resumen."); }
        finally { setGeneratingSummary(prev => { const n = { ...prev }; delete n[id]; return n; }); }
    };

    const resetFilters = () => { setFilters(INITIAL_FILTERS); setSelectedNumeroAsesor(isAdmin ? "Todos" : numeroUsuarioSesion || ""); };

    const now = new Date();
    const todayStr = formatDateYMDLocal(now);
    const yesterdayStr = formatDateYMDLocal(addDays(now, -1));
    const weekStartStr = formatDateYMDLocal(getStartOfWeek(now));
    const weekEndStr = formatDateYMDLocal(getEndOfWeek(now));
    const last7DaysStartStr = formatDateYMDLocal(addDays(now, -6));
    const last30DaysStartStr = formatDateYMDLocal(addDays(now, -30));
    const monthStartStr = formatDateYMDLocal(getStartOfMonth(now));
    const monthEndStr = formatDateYMDLocal(getEndOfMonth(now));
    const isQuickActive = (desde, hasta) => filters.fechaRegistroDesde === desde && filters.fechaRegistroHasta === hasta;

    // ── KPI Cards ────────────────────────────────────────────────────────────────
    const KPICard = ({ icon: Icon, label, value, sub, subColor = "text-slate-400", bg = "bg-white", iconBg = "bg-[#131E5C]/10", iconColor = "text-[#131E5C]" }) => (
        <div className={cls("rounded-2xl border border-black/10 shadow-sm p-4 flex items-start gap-3", bg)}>
            <div className={cls("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
                <Icon className={cls("h-5 w-5", iconColor)} />
            </div>
            <div className="min-w-0">
                <div className="text-2xl font-black text-[#131E5C] leading-tight">{value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
                {sub && <div className={cls("text-[11px] font-semibold mt-1", subColor)}>{sub}</div>}
            </div>
        </div>
    );

    const filtrosActivos = useMemo(() => {
        const items = [];

        if (filters.q) {
            items.push({
                key: "q",
                label: `Búsqueda: ${filters.q}`,
                clear: () => updateFilter("q", ""),
            });
        }

        if (filters.agencia !== "Todos") {
            items.push({
                key: "agencia",
                label: `Dealer: ${filters.agencia}`,
                clear: () => updateFilter("agencia", "Todos"),
            });
        }

        if (filters.linea !== "Todos") {
            items.push({
                key: "linea",
                label: `Business: ${filters.linea}`,
                clear: () => updateFilter("linea", "Todos"),
            });
        }

        if (filters.estado !== "Todos") {
            items.push({
                key: "estado",
                label: `Estado: ${filters.estado}`,
                clear: () => updateFilter("estado", "Todos"),
            });
        }

        if (filters.buro !== "Todos") {
            items.push({
                key: "buro",
                label: `Buró: ${valueOrDash(filters.buro)}`,
                clear: () => updateFilter("buro", "Todos"),
            });
        }

        if (filters.formaPago !== "Todos") {
            items.push({
                key: "formaPago",
                label: `Pago: ${valueOrDash(filters.formaPago)}`,
                clear: () => updateFilter("formaPago", "Todos"),
            });
        }

        if (filters.tipoCliente !== "Todos") {
            items.push({
                key: "tipoCliente",
                label: `Cliente: ${valueOrDash(filters.tipoCliente)}`,
                clear: () => updateFilter("tipoCliente", "Todos"),
            });
        }

        if (filters.fechaRegistroDesde || filters.fechaRegistroHasta) {
            items.push({
                key: "fechaRegistro",
                label: `Registro: ${filters.fechaRegistroDesde || "Inicio"} → ${filters.fechaRegistroHasta || "Hoy"}`,
                clear: () =>
                    setFilters((prev) => ({
                        ...prev,
                        fechaRegistroDesde: "",
                        fechaRegistroHasta: "",
                    })),
            });
        }

        if (isAdmin && selectedNumeroAsesor !== "Todos") {
            items.push({
                key: "numeroAsesor",
                label: `Línea: ${formatTelefonoMx(selectedNumeroAsesor)}`,
                clear: () => setSelectedNumeroAsesor("Todos"),
            });
        }

        return items;
    }, [filters, isAdmin, selectedNumeroAsesor]);



    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <div className="w-full">

            {/* Header */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-extrabold text-[#131E5C] flex items-center gap-2">
                        Gestión Comercial
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#131E5C]/10 text-[#131E5C] px-2 py-0.5 rounded-full">
                            <Activity className="h-3 w-3" /> IA activa
                        </span>
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">Monitorea tus prospectos y su información clave para el seguimiento asistido por IA.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center rounded-xl border border-[#131E5C]/20 bg-white p-1 shadow-sm">
                        {VIEW_MODES.map(({ key, label, Icon }) => (
                            <button key={key} type="button" onClick={() => setViewMode(key)}
                                className={cls("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                                    viewMode === key ? "bg-[#131E5C] text-white shadow" : "text-[#131E5C] hover:bg-slate-100")}>
                                <Icon className="h-4 w-4" /> {label}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={exportarExcelProspectos} disabled={loadingCases || sorted.length === 0}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 py-2 text-sm font-semibold text-[#131E5C] shadow-sm hover:bg-slate-100 disabled:opacity-50">
                        <FileDown className="h-4 w-4" /> Exportar Excel
                    </button>
                    <button onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80">
                        <Plus className="h-4 w-4" /> Nuevo Prospecto
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 mb-5 xl:grid-cols-7">
                <KPICard icon={User} label="Total prospectos hoy" value={kpis.total.toLocaleString()} sub={`${sorted.length} con filtros`} subColor="text-slate-400" />
                <KPICard icon={Zap} label="Pendientes de respuesta IA" value={kpis.pendIA} sub={kpis.pendIA > 0 ? "Requieren atención" : "Sin pendientes"}
                    subColor={kpis.pendIA > 0 ? "text-amber-600" : "text-emerald-600"}
                    iconBg="bg-amber-100" iconColor="text-amber-700" />
                <KPICard icon={Flame} label="Leads calientes" value={kpis.calientes} sub={kpis.calientes > 0 ? "Alta probabilidad" : "Sin leads calientes"}
                    subColor={kpis.calientes > 0 ? "text-emerald-600" : "text-slate-400"}
                    iconBg="bg-red-100" iconColor="text-red-600" />
                <KPICard icon={AlertCircle} label="Sin respuesta" value={kpis.sinResp} sub={kpis.sinResp > 0 ? "> 24h sin contacto" : "Todo al día"}
                    subColor={kpis.sinResp > 0 ? "text-red-600" : "text-emerald-600"}
                    iconBg="bg-red-50" iconColor="text-red-500" />
                <KPICard icon={ClipboardCheck} label="Perfil comercial" value={`${percent(kpis.conPerfil, kpis.total || 1)}%`} sub={`${kpis.conPerfil} con datos de compra`}
                    subColor="text-sky-600" iconBg="bg-sky-100" iconColor="text-sky-700" />
                <KPICard icon={Target} label="Crédito / arrendamiento" value={kpis.financiamiento} sub="Oportunidad financiera"
                    subColor="text-violet-600" iconBg="bg-violet-100" iconColor="text-violet-700" />
                <KPICard icon={Clock3} label="Ventana prom. respuesta" value={kpis.avgResp !== null ? `${kpis.avgResp < 60 ? kpis.avgResp + "m" : Math.floor(kpis.avgResp / 60) + "h " + (kpis.avgResp % 60) + "m"}` : "—"}
                    sub="Objetivo < 4h" subColor="text-sky-600" iconBg="bg-sky-100" iconColor="text-sky-700" />
            </div>

            {/* Filtros */}
            {/* Filtros compactos */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="p-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        {/* Buscador principal */}
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#131E5C]/60" />

                            <input
                                value={filters.q}
                                onChange={(e) => updateFilter("q", e.target.value)}
                                placeholder="Buscar cliente, teléfono, email, asesor, vehículo..."
                                className="h-11 w-full rounded-xl border border-[#131E5C]/15 bg-slate-50 pl-10 pr-10 text-sm font-semibold text-[#131E5C] outline-none transition placeholder:text-slate-400 focus:border-[#131E5C]/40 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10"
                            />

                            {filters.q ? (
                                <button
                                    type="button"
                                    onClick={() => updateFilter("q", "")}
                                    aria-label="Limpiar búsqueda"
                                    className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>

                        {/* Filtros principales */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:items-center">
                            <select
                                value={filters.agencia}
                                onChange={(e) => updateFilter("agencia", e.target.value)}
                                className="h-11 rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10"
                            >
                                {dealers.map((d) => (
                                    <option key={d} value={d}>
                                        {d === "Todos" ? "Dealer" : d}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filters.linea}
                                onChange={(e) => updateFilter("linea", e.target.value)}
                                className="h-11 rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10"
                            >
                                {businessOptions.map((l) => (
                                    <option key={l} value={l}>
                                        {l === "Todos" ? "Business" : l}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filters.estado}
                                onChange={(e) => updateFilter("estado", e.target.value)}
                                className="h-11 rounded-xl border border-[#131E5C]/15 bg-white px-3 text-sm font-bold text-[#131E5C] outline-none transition hover:bg-slate-50 focus:ring-4 focus:ring-[#131E5C]/10"
                            >
                                {estados.map((s) => (
                                    <option key={s} value={s}>
                                        {s === "Todos" ? "Estado" : s}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                {
                                    label: "Hoy",
                                    desde: todayStr,
                                    hasta: todayStr,
                                    inactive: "border-emerald-200 bg-emerald-300 text-emerald-700 hover:bg-emerald-100",
                                    active: "bg-emerald-600 text-white ring-4 ring-emerald-100",
                                },
                                {
                                    label: "Ayer",
                                    desde: yesterdayStr,
                                    hasta: yesterdayStr,
                                    inactive: "border-amber-200 bg-amber-300 text-amber-700 hover:bg-amber-100",
                                    active: "bg-amber-500 text-white ring-4 ring-amber-100",
                                },
                                {
                                    label: "Semana",
                                    desde: weekStartStr,
                                    hasta: weekEndStr,
                                    inactive: "border-sky-200 bg-sky-300 text-sky-700 hover:bg-sky-100",
                                    active: "bg-sky-600 text-white ring-4 ring-sky-100",
                                },
                                {
                                    label: "7 días",
                                    desde: last7DaysStartStr,
                                    hasta: todayStr,
                                    inactive: "border-violet-200 bg-violet-300 text-violet-700 hover:bg-violet-100",
                                    active: "bg-violet-600 text-white ring-4 ring-violet-100",
                                },
                                {
                                    label: "30 días",
                                    desde: last30DaysStartStr,
                                    hasta: todayStr,
                                    inactive: "border-indigo-200 bg-indigo-300 text-indigo-700 hover:bg-indigo-100",
                                    active: "bg-indigo-600 text-white ring-4 ring-indigo-100",
                                },
                                {
                                    label: "Este mes",
                                    desde: monthStartStr,
                                    hasta: monthEndStr,
                                    inactive: "border-[#131E5C]/20 bg-blue-300 text-[#131E5C] hover:bg-blue-100",
                                    active: "bg-[#131E5C] text-white ring-4 ring-[#131E5C]/10",
                                },
                            ].map(({ label, desde, hasta, inactive, active }) => {
                                const isActive = isQuickActive(desde, hasta);

                                return (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                fechaRegistroDesde: desde,
                                                fechaRegistroHasta: hasta,
                                            }))
                                        }
                                        className={cls(
                                            "h-11 rounded-xl border px-3 text-sm font-black shadow-sm transition active:scale-[0.98]",
                                            isActive ? active : inactive
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                                className={cls(
                                    "inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-black shadow-sm transition",
                                    showAdvancedFilters || filtrosActivos.length > 0
                                        ? "bg-[#131E5C] text-white"
                                        : "border border-[#131E5C]/15 bg-white text-[#131E5C] hover:bg-[#131E5C]/5"
                                )}
                            >
                                Más filtros

                                {filtrosActivos.length > 0 ? (
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-black text-[#131E5C]">
                                        {filtrosActivos.length}
                                    </span>
                                ) : null}

                                {showAdvancedFilters ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={resetFilters}
                                title="Limpiar filtros"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 shadow-sm transition hover:bg-red-100"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel avanzado colapsable */}
                {showAdvancedFilters ? (
                    <div className="border-t border-[#131E5C]/10 bg-slate-50/80 p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div className="text-xs font-bold text-slate-400">
                                {pageStart}–{pageEnd} de {sorted.length} prospectos
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
                            <div className="xl:col-span-2">
                                <label className={filterLabelCls}>Buró</label>
                                <select
                                    value={filters.buro}
                                    onChange={(e) => updateFilter("buro", e.target.value)}
                                    className={filterControlCls}
                                >
                                    {buroOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : valueOrDash(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="xl:col-span-2">
                                <label className={filterLabelCls}>Forma de pago</label>
                                <select
                                    value={filters.formaPago}
                                    onChange={(e) => updateFilter("formaPago", e.target.value)}
                                    className={filterControlCls}
                                >
                                    {formaPagoOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : valueOrDash(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="xl:col-span-2">
                                <label className={filterLabelCls}>Tipo cliente</label>
                                <select
                                    value={filters.tipoCliente}
                                    onChange={(e) => updateFilter("tipoCliente", e.target.value)}
                                    className={filterControlCls}
                                >
                                    {tipoClienteOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s === "Todos" ? "Todos" : valueOrDash(s)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {isAdmin ? (
                                <div className="xl:col-span-3">
                                    <label className={filterLabelCls}>Línea / número asesor</label>
                                    <select
                                        value={selectedNumeroAsesor}
                                        onChange={(e) => setSelectedNumeroAsesor(e.target.value)}
                                        className={filterControlCls}
                                    >
                                        {phoneOptions.map((numero) => (
                                            <option key={numero} value={numero}>
                                                {numero === "Todos"
                                                    ? "Todos los números"
                                                    : `${formatTelefonoMx(numero)} • ${getAsesorDigitalPorNumero(numero)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            <div className={cls(isAdmin ? "xl:col-span-3" : "xl:col-span-6")}>
                                <label className={filterLabelCls}>Fecha de registro</label>
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <input
                                        type="date"
                                        value={filters.fechaRegistroDesde}
                                        onChange={(e) => updateFilter("fechaRegistroDesde", e.target.value)}
                                        className={filterControlCls}
                                    />
                                    <span className="text-xs font-black text-slate-400">→</span>
                                    <input
                                        type="date"
                                        value={filters.fechaRegistroHasta}
                                        onChange={(e) => updateFilter("fechaRegistroHasta", e.target.value)}
                                        className={filterControlCls}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Vista Gráficos */}
            {viewMode === "graficos" && <VistaGraficos rows={sorted} />}

            {/* Vista Tabla */}
            {viewMode === "tabla" && (
                <div className="flex gap-4 items-start">

                    {/* Tabla principal */}
                    <div className="flex-1 min-w-0">
                        <div className="hidden overflow-hidden rounded-xl bg-white border border-black/10 shadow-sm lg:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead style={{ background: BRAND_BLUE }}>
                                        <tr className="text-xs text-white">
                                            {[
                                                { key: "agencia", label: "Dealer" },
                                                { key: null, label: "Cliente" },
                                                { key: "fecha_reclamacion", label: "Fecha reg." },
                                                { key: "ultimo_contacto_at", label: "Último contacto" },
                                                { key: null, label: "Business" },
                                                { key: null, label: "Interés" },
                                                { key: null, label: "Prioridad" },
                                                { key: "estado", label: "Estado" },
                                                { key: null, label: "Canal" },
                                                { key: null, label: "Asesor Digital" },
                                                { key: null, label: "Asesor Piso" },
                                                { key: null, label: "Lead Score" },
                                                { key: null, label: "Perfil financiero" },
                                                { key: null, label: "Perfil compra" },
                                                { key: null, label: "Resumen" },
                                                { key: null, label: "Acciones" },
                                            ].map(({ key, label }) => (
                                                <th key={label} className="px-3 py-3 whitespace-nowrap">
                                                    {key ? (
                                                        <button type="button" onClick={() => toggleSort(key)}
                                                            className="inline-flex items-center gap-1 text-xs font-bold">
                                                            {label}
                                                            <span className="opacity-60">
                                                                {sort.key === key ? (sort.dir === "asc" ? <ChevronUp className="h-3" /> : <ChevronDown className="h-3" />) : <ArrowUpDown className="h-3" />}
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs font-bold">{label}</span>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/[0.06]">
                                        {loadingCases
                                            ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                            : paginatedRows.map(row => {
                                                const score = calcLeadScore(row);
                                                const { label: scoreLabel, cls: scoreCls } = getScoreLabel(score);
                                                const prioridad = getPrioridad(row);
                                                const perfilFin = getPerfilFinancieroDiagnostico(row);
                                                const isUpdating = !!updatingEstado[row.id_exp];
                                                return (
                                                    <tr key={row.id_exp}
                                                        onDoubleClick={() => openEdit(row)}
                                                        onContextMenu={e => onRowContextMenu(e, row)}
                                                        onClick={() => setHighlightedRow(row)}
                                                        className={cls("cursor-pointer hover:bg-[#131E5C]/[0.03] transition-colors",
                                                            highlightedRow?.id_exp === row.id_exp ? "bg-[#131E5C]/[0.05]" : "")}>
                                                        <td className="px-3 py-2.5 text-xs text-[#131E5C] font-semibold whitespace-nowrap">{row.agencia || "—"}</td>
                                                        <td className="px-3 py-2.5 min-w-[140px]">
                                                            <div className="text-xs font-bold text-[#131E5C] truncate max-w-[130px]">
                                                                {`${row.cliente_nombre} ${row.cliente_apellidos}`.trim() || "Sin nombre"}
                                                            </div>
                                                            <div className="text-[11px] text-slate-400">{formatTelefonoMx(row.telefono)}</div>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.fecha_reclamacion || "—"}</td>
                                                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtDTIntl(row.ultimo_contacto_at)}</td>
                                                        <td className="px-3 py-2.5 text-xs text-[#131E5C] font-semibold">{row.linea || "—"}</td>
                                                        <td className="px-3 py-2.5 text-xs text-[#131E5C]">{row.cliente_interes || "—"}</td>
                                                        <td className="px-3 py-2.5">
                                                            <span className={cls("inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", prioridad.cls)}>
                                                                {prioridad.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="relative inline-flex items-center">
                                                                <select value={row.estado || "Contactado"} disabled={isUpdating}
                                                                    onClick={e => e.stopPropagation()}
                                                                    onChange={e => { e.stopPropagation(); updateEstadoInline(row, e.target.value); }}
                                                                    className={cls("appearance-none rounded-full border bg-transparent px-2.5 py-0.5 pr-7 text-[11px] font-semibold outline-none",
                                                                        badgeCls(row.estado), isUpdating ? "cursor-not-allowed opacity-70" : "cursor-pointer")}>
                                                                    {ESTADOS_PROSPECTO.map(s => <option key={s} value={s} className="bg-white text-[#131E5C]">{s}</option>)}
                                                                </select>
                                                                <span className="pointer-events-none absolute right-1.5">
                                                                    {isUpdating ? <Loader2 className="h-3 w-3 animate-spin text-[#131E5C]" /> : <ChevronDown className="h-3 w-3 text-[#131E5C]/60" />}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.origen || "—"}</td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1">
                                                                <div
                                                                    className={cls(
                                                                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                                                                        row.asesor_digital?.toLowerCase().includes("ia")
                                                                            ? "bg-emerald-500"
                                                                            : "bg-slate-300"
                                                                    )}
                                                                />
                                                                <span
                                                                    className="text-xs text-[#131E5C] truncate max-w-[110px]"
                                                                    title={row.asesor_digital || ""}
                                                                >
                                                                    {row.asesor_digital || "—"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        <td className="px-3 py-2.5 min-w-[170px]">
                                                            {row.asesor_solicita ? (
                                                                <div>
                                                                    <div
                                                                        className="text-xs font-bold text-[#131E5C] truncate max-w-[160px]"
                                                                        title={row.asesor_solicita}
                                                                    >
                                                                        {row.asesor_solicita}
                                                                    </div>
                                                                    <div className="mt-0.5 text-[11px] text-slate-400">
                                                                        Asesor de piso/ventas
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                                                                    Sin asignar
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-2.5">
                                                            <LeadScoreRing score={score} />
                                                        </td>
                                                        <td className="px-3 py-2.5 min-w-[220px]">
                                                            <div className="text-xs font-bold text-[#131E5C]">
                                                                Eng. {formatMoneyMXN(row.enganche_monto)}
                                                            </div>

                                                            <div
                                                                className={cls(
                                                                    "mt-0.5 text-[11px] font-semibold",
                                                                    perfilFin.engancheSuficiente ? "text-emerald-600" : "text-amber-700"
                                                                )}
                                                            >
                                                                Mín. 20%: {formatMoneyMXN(perfilFin.engancheMinimo)}
                                                            </div>

                                                            {perfilFin.faltanteEnganche > 0 ? (
                                                                <div className="mt-0.5 text-[11px] font-bold text-red-500">
                                                                    Faltan {formatMoneyMXN(perfilFin.faltanteEnganche)}
                                                                </div>
                                                            ) : (
                                                                <div className="mt-0.5 text-[11px] font-bold text-emerald-600">
                                                                    Enganche suficiente
                                                                </div>
                                                            )}

                                                            <div className="mt-0.5 text-[11px] text-slate-500">
                                                                Mens. {formatMoneyMXN(row.presupuesto_mensual)} · Est. {formatMoneyMXN(perfilFin.mensualidadMinima)}
                                                            </div>

                                                            <div className="mt-0.5 text-[11px] text-slate-400">
                                                                Buró {valueOrDash(row.buro_estado)} · {valueOrDash(row.forma_pago)}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 min-w-[190px]">
                                                            <div className="text-xs font-bold text-[#131E5C]">
                                                                {valueOrDash(row.tipo_cliente)}
                                                            </div>
                                                            <div className="mt-0.5 text-[11px] text-slate-500">
                                                                Plazo: {valueOrDash(row.plazo_compra)}
                                                            </div>
                                                            <div className="mt-0.5 text-[11px] text-slate-400 truncate max-w-[180px]" title={row.uso_vehiculo || ""}>
                                                                Uso: {valueOrDash(row.uso_vehiculo)} · Ing: {valueOrDash(row.comprobacion_ingresos)}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5 max-w-[200px]">
                                                            <div className="flex items-start gap-1.5">
                                                                <button type="button" onClick={e => { e.stopPropagation(); openSummaryViewer(row); }}
                                                                    className="text-left min-w-0 flex-1">
                                                                    <span className="line-clamp-2 text-xs text-slate-600">{row.resumen || "Sin resumen"}</span>
                                                                </button>
                                                                <button type="button" onClick={e => { e.stopPropagation(); generarResumenInline(row); }}
                                                                    disabled={!!generatingSummary[row.id_exp]}
                                                                    className="h-7 w-7 flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm disabled:opacity-60"
                                                                    title="Generar resumen">
                                                                    {generatingSummary[row.id_exp] ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#131E5C]" /> : <ClipboardCheck className="h-3.5 w-3.5 text-[#131E5C]" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <button type="button" onClick={e => { e.stopPropagation(); abrirAgendaCita(row); }}
                                                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-black/10 bg-white shadow-sm hover:bg-slate-50"
                                                                    title="Agendar cita">
                                                                    <CalendarPlus className="h-4 w-4 text-[#131E5C]" />
                                                                </button>
                                                                <button type="button" onClick={e => { e.stopPropagation(); navigate(`/comercial/prospectos/contacto?tel=${encodeURIComponent(row.telefono || "")}&direct=1`); }}
                                                                    className="h-8 px-2 inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white shadow-sm hover:bg-slate-50 disabled:opacity-50"
                                                                    disabled={!row.telefono} title="Abrir chat">
                                                                    <MessageSquareShare className="h-4 w-4 text-[#131E5C]" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        }
                                        {!loadingCases && paginatedRows.length === 0 && (
                                            <tr>
                                                <td colSpan={15} className="px-4 py-12 text-center text-slate-400">
                                                    No hay resultados con esos filtros.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {sorted.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-black/[0.06] bg-white">
                                    <div className="text-xs text-slate-500">
                                        Página {page} de {totalPages} · {PAGE_SIZE} registros por página
                                    </div>
                                    <div className="flex gap-1">
                                        {[
                                            { label: "«", action: () => setPage(1), disabled: page === 1 },
                                            { label: "‹", action: () => setPage(p => Math.max(p - 1, 1)), disabled: page === 1 },
                                            { label: "›", action: () => setPage(p => Math.min(p + 1, totalPages)), disabled: page === totalPages },
                                            { label: "»", action: () => setPage(totalPages), disabled: page === totalPages },
                                        ].map(({ label, action, disabled }) => (
                                            <button key={label} type="button" onClick={action} disabled={disabled}
                                                className="h-8 w-8 text-sm font-semibold rounded-lg border border-[#131E5C]/20 text-[#131E5C] disabled:opacity-40 hover:bg-slate-50">
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Vista móvil */}
                        <div className="grid gap-3 lg:hidden">
                            {loadingCases
                                ? Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                                        <Skeleton className="h-4 w-48" /><Skeleton className="mt-2 h-3 w-36" />
                                        <Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/4" />
                                    </div>
                                ))
                                : paginatedRows.map(row => {
                                    const score = calcLeadScore(row);
                                    const prioridad = getPrioridad(row);
                                    return (
                                        <button key={row.id_exp} onClick={() => openEdit(row)}
                                            className="rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                                        {`${row.cliente_nombre} ${row.cliente_apellidos}`.trim() || "Sin nombre"}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-slate-500">{row.agencia} · {row.fecha_reclamacion || "—"}</div>
                                                    <div className="mt-0.5 text-xs text-slate-500">{row.cliente_interes || "—"} · {row.origen || "—"}</div>
                                                    <div className="mt-0.5 text-xs text-slate-500">Eng. {formatMoneyMXN(row.enganche_monto)} · Mens. {formatMoneyMXN(row.presupuesto_mensual)}</div>
                                                    <div className="mt-0.5 text-xs text-slate-500">Buró {valueOrDash(row.buro_estado)} · {valueOrDash(row.forma_pago)}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                    <BadgeEstado value={row.estado} />
                                                    <span className={cls("text-[10px] font-bold px-2 py-0.5 rounded-full border", prioridad.cls)}>{prioridad.label}</span>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <LeadScoreRing score={score} />
                                            </div>
                                        </button>
                                    );
                                })
                            }
                            {!loadingCases && paginatedRows.length === 0 && (
                                <div className="rounded-2xl border border-black/10 bg-white p-10 text-center text-slate-400">
                                    No hay resultados con esos filtros.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel lateral — solo tabla */}
                    <SidePanel rows={sorted} highlighted={highlightedRow} onSelectHighlight={setHighlightedRow} />

                </div>
            )}

            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminarCaso} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />

            {/* Modal Editar/Crear */}
            <Modal open={openModal} title={mode === "create" ? "Nuevo prospecto" : `Editar prospecto · ${draft?.id_exp}`}
                onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button onClick={save} disabled={saving || loadingDetail || telInvalid || (draft?.telefono ? !telIsOk : false)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C] disabled:opacity-60">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-4">
                        {touchedSave && missing.length > 0 && (
                            <div className="md:col-span-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <div className="font-extrabold">Faltan campos obligatorios</div>
                                <div className="mt-1 text-xs font-semibold">{missing.map(k => REQUIRED[k]).join(" · ")}</div>
                            </div>
                        )}
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={e => setDraft(p => ({ ...p, agencia: e.target.value }))}
                                disabled={!isAdmin && userAgencias.length <= 1}
                                className={cls(inputBase, isInvalid("agencia") ? inputBad : inputOk, !isAdmin && contextoDigitalSesion ? "cursor-not-allowed opacity-70" : "")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias.length > 0 ? userAgencias : DEALERS).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </Field>
                        <Field label="Asesor Digital" icon={User}>
                            <select value={draft.asesor_digital || ""} onChange={e => setDraft(p => ({ ...p, asesor_digital: e.target.value }))}
                                className={cls(inputBase, inputOk)}>
                                <option value="">— Selecciona —</option>
                                {ASESORES_DIGITALES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </Field>
                        <Field label="Asignado a" icon={User}>
                            <select value={draft.asesor_solicita || ""} onChange={e => setDraft(p => ({ ...p, asesor_solicita: e.target.value }))}
                                className={cls(inputBase, inputOk)}>
                                <option value="">— Selecciona —</option>
                                {ASESORES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </Field>
                        <Field label="VW de sus sueños">
                            <div>
                                <select value={draft.cliente_interes || ""} onChange={e => setDraft(p => ({ ...p, cliente_interes: e.target.value }))}
                                    className={cls(inputBase, inputOk)}>
                                    <option value="" disabled>Selecciona un modelo...</option>
                                    {VEHICULOS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </Field>

                        <div className="md:col-span-4">
                            <Field label="Cliente" icon={User}>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <label className="inline-flex items-center gap-3 text-sm font-bold text-[#131E5C]">
                                            <input type="checkbox" checked={!!draft.tiene_nombre}
                                                onChange={e => setDraft(p => ({ ...p, tiene_nombre: e.target.checked, nombre_cliente: e.target.checked ? p.nombre_cliente : "" }))}
                                                className="h-4 w-4" />
                                            Nombre del Prospecto
                                        </label>
                                        <input value={draft.nombre_cliente || ""} onChange={e => setDraft(p => ({ ...p, nombre_cliente: e.target.value }))}
                                            disabled={!draft.tiene_nombre}
                                            className={cls(inputBase, inputOk, !draft.tiene_nombre ? "cursor-not-allowed opacity-70" : "")}
                                            placeholder={draft.tiene_nombre ? "Nombre" : "SIN NOMBRE"} />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Teléfono</div>
                                        <input maxLength={12} disabled={telIsNormalized} value={draft.telefono || ""}
                                            onChange={e => setDraft(p => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                                            className={cls(inputBase, telIsNormalized ? "cursor-not-allowed opacity-70" : "", isInvalid("telefono") || telInvalid ? inputBad : inputOk)} />
                                        {isInvalid("telefono") && <div className="mt-1 text-xs font-bold text-red-600">Teléfono es requerido.</div>}
                                        {!isInvalid("telefono") && telError && <div className="mt-1 text-xs font-bold text-red-600">{telError}</div>}
                                    </div>
                                    <div className="">
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Estado</div>

                                        <select value={draft.estado || ""} onChange={e => setDraft(p => ({ ...p, estado: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {ESTADOS_PROSPECTO.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="">
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Motivo Descalificacion</div>

                                        <select value={draft.estado || ""} onChange={e => setDraft(p => ({ ...p, estado: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {ESTADOS_PROSPECTO.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Pauta de Origen</div>
                                        {loadingPautas ? (
                                            <div className="mt-2">
                                                <Skeleton className="h-10 w-full rounded-lg" />
                                                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#131E5C]">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando campañas recientes...
                                                </div>
                                            </div>
                                        ) : (
                                            <select value={draft.pauta || ""} onChange={e => setDraft(p => ({ ...p, pauta: e.target.value }))} className={cls(inputBase, inputOk)}>
                                                <option value="">— Selecciona una pauta —</option>
                                                {draft.pauta && !pautasOptions.some(item => normalizeText(item.value) === normalizeText(draft.pauta)) && (
                                                    <option value={draft.pauta}>{draft.pauta} (actual)</option>
                                                )}
                                                {pautasOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                                            </select>
                                        )}
                                    </div>

                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Business</div>
                                        <LineaPicker value={draft.linea} onChange={v => setDraft(p => ({ ...p, linea: v }))} />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-1">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Canal de Contacto</div>
                                        <OrigenPicker value={draft.origen} onChange={v => setDraft(p => ({ ...p, origen: v }))} />
                                    </div>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-4">
                            <Field label="Perfil comercial y financiero" icon={Activity}>
                                <div className="grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Enganche</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            value={draft.enganche_monto || ""}
                                            onChange={e => setDraft(p => ({ ...p, enganche_monto: e.target.value.replace(/\D/g, "") }))}
                                            className={cls(inputBase, inputOk)}
                                            placeholder="Ej. 80000"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Presupuesto mensual</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            value={draft.presupuesto_mensual || ""}
                                            onChange={e => setDraft(p => ({ ...p, presupuesto_mensual: e.target.value.replace(/\D/g, "") }))}
                                            className={cls(inputBase, inputOk)}
                                            placeholder="Ej. 9000"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Buró</div>
                                        <select value={draft.buro_estado || ""} onChange={e => setDraft(p => ({ ...p, buro_estado: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {BURO_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Forma de pago</div>
                                        <select value={draft.forma_pago || ""} onChange={e => setDraft(p => ({ ...p, forma_pago: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {FORMA_PAGO_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Tipo cliente</div>
                                        <select value={draft.tipo_cliente || ""} onChange={e => setDraft(p => ({ ...p, tipo_cliente: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {TIPO_CLIENTE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Plazo de compra</div>
                                        <select value={draft.plazo_compra || ""} onChange={e => setDraft(p => ({ ...p, plazo_compra: e.target.value }))} className={cls(inputBase, inputOk)}>
                                            {PLAZO_COMPRA_OPTIONS.map(item => <option key={item || "empty"} value={item}>{item || "— Selecciona —"}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Uso del vehículo</div>
                                        <input value={draft.uso_vehiculo || ""} onChange={e => setDraft(p => ({ ...p, uso_vehiculo: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Personal, familiar, trabajo..." />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Comprobación ingresos</div>
                                        <input value={draft.comprobacion_ingresos || ""} onChange={e => setDraft(p => ({ ...p, comprobacion_ingresos: e.target.value }))} className={cls(inputBase, inputOk)} placeholder="Nómina, estados, negocio..." />
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-4">
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">ID Cotizacion</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            value={draft.id_cotizacion || ""}
                                            onChange={e => setDraft(p => ({ ...p, id_cotizacion: e.target.value }))}
                                            className={cls(inputBase, inputOk)}
                                            placeholder="Ej. 80000"
                                        />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">Folio Solicitud Credito</div>
                                        <input
                                            type="number"
                                            min="0"
                                            inputMode="numeric"
                                            // Folio Solicitud Crédito
                                            value={draft.folio_solicitud_credito || ""}
                                            onChange={e => setDraft(p => ({ ...p, folio_solicitud_credito: e.target.value }))}
                                            className={cls(inputBase, inputOk)}
                                            placeholder="Ej. 80000"
                                        />
                                        <select
                                            value={draft.solicitud_credito_estado || ""}
                                            onChange={e => setDraft(p => ({ ...p, solicitud_credito_estado: e.target.value }))}
                                            className={cls(inputBase, inputOk)}
                                        >
                                            {SOLICITUD_CREDITO.map(item => (
                                                <option key={item.value} value={item.value}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">VIN Facturado</div>
                                        <input
                                            value={draft.vin_facturado || ""}
                                            onChange={e => setDraft(p => ({ ...p, vin_facturado: e.target.value.toUpperCase() }))}
                                            className={cls(inputBase, inputOk)} placeholder="A8XAS8FSF8FG2EU" />
                                    </div>
                                    <div>
                                        <div className="mb-1 text-sm font-bold text-[#131E5C]">
                                            ¿VIN Entregado?
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDraft((p) => ({
                                                    ...p,
                                                    vin_estatus_entrega:
                                                        p.vin_estatus_entrega === "entregado"
                                                            ? "cancelado"
                                                            : "entregado",
                                                }))
                                            }
                                            className={`relative flex h-9 w-28 items-center rounded-full px-1 transition-all duration-300 ${draft.comprobacion_ingresos === "entregado"
                                                ? "bg-emerald-500"
                                                : "bg-red-500"
                                                }`}
                                        >
                                            <span
                                                className={`flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md transition-all duration-300 ${draft.comprobacion_ingresos === "entregado"
                                                    ? "translate-x-[76px] text-emerald-600"
                                                    : "translate-x-0 text-red-600"
                                                    }`}
                                            >
                                                {draft.comprobacion_ingresos === "entregado" ? "✓" : "×"}
                                            </span>
                                        </button>

                                        <div className="mt-1 text-xs font-semibold text-[#515778]">
                                            Estado actual:{" "}
                                            <span
                                                className={
                                                    draft.comprobacion_ingresos === "entregado"
                                                        ? "text-emerald-600"
                                                        : "text-red-600"
                                                }
                                            >
                                                {draft.comprobacion_ingresos === "entregado"
                                                    ? "Entregado"
                                                    : "Cancelado"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2 lg:col-span-4 sm:col-span-4">
                            <Field label="Evidencias" icon={Paperclip}>
                                <div className="space-y-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
                                        className="hidden"
                                        onChange={(e) => {
                                            handleAddFiles(e.target.files);
                                            e.target.value = "";
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-4 py-6 text-center text-[#131E5C] transition hover:bg-[#131E5C]/10 sm:flex-row sm:text-left"
                                    >
                                        <UploadCloud className="h-6 w-6" />
                                        <div className="min-w-0">
                                            <div className="text-sm font-extrabold">
                                                Agregar fotos, videos o archivos
                                            </div>
                                            <div className="text-xs font-semibold text-slate-500">
                                                Puedes seleccionar varios archivos al mismo tiempo. Límite sugerido: 50 MB por archivo.
                                            </div>
                                        </div>
                                    </button>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                            Total: {totalEvidenciasDraft}
                                        </span>

                                        {(draft.delete_evidencia_ids || []).length > 0 ? (
                                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                                Por eliminar: {draft.delete_evidencia_ids.length}
                                            </span>
                                        ) : null}

                                        {(draft.evidencias_nuevas || []).length > 0 ? (
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                                Nuevas: {draft.evidencias_nuevas.length}
                                            </span>
                                        ) : null}
                                    </div>

                                    {(draft.evidencias_existentes?.length || 0) > 0 ? (
                                        <div>
                                            <div className="mb-2 text-sm font-extrabold text-[#131E5C]">
                                                Evidencias guardadas
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                                {draft.evidencias_existentes.map((item) => (
                                                    <EvidenceCard
                                                        key={`existente-${item.id}`}
                                                        item={item}
                                                        onRemove={() => removeEvidenciaExistente(item.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {(draft.evidencias_nuevas?.length || 0) > 0 ? (
                                        <div>
                                            <div className="mb-2 text-sm font-extrabold text-[#131E5C]">
                                                Evidencias nuevas
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                                                {draft.evidencias_nuevas.map((item) => (
                                                    <EvidenceCard
                                                        key={item._tmpId}
                                                        item={item}
                                                        onRemove={() => removeNuevaEvidencia(item._tmpId)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {totalEvidenciasDraft === 0 ? (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                                            Aún no has agregado evidencias a este avalúo.
                                        </div>
                                    ) : null}
                                </div>
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Comentarios Adicionales" icon={FileText}>
                                <textarea value={draft.comentarios || ""} onChange={e => setDraft(p => ({ ...p, comentarios: e.target.value }))}
                                    rows={4} className={cls(inputBase, inputOk)} />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Resumen de conversación" icon={ClipboardCheck}>
                                <textarea value={draft.resumen || ""} disabled rows={5}
                                    className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />
                                {draft.resumen_actualizado_at && (
                                    <div className="mt-2 text-xs font-semibold text-slate-500">
                                        Última actualización: {fmtDTIntl(draft.resumen_actualizado_at)}
                                        {draft.resumen_fuente ? ` · ${draft.resumen_fuente}` : ""}
                                    </div>
                                )}
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Resumen */}
            <Modal open={openSummaryModal}
                title={summaryInfo ? `Resumen IA · ${summaryInfo.nombre || `Prospecto ${summaryInfo.id_exp}`}` : "Resumen IA"}
                onClose={closeSummaryModal}
                footer={
                    <button onClick={closeSummaryModal}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                        <X className="h-4 w-4" /> Cerrar
                    </button>
                }>
                {summaryInfo && (
                    <div className="grid gap-3">
                        <Field label="Prospecto" icon={User}>
                            <input value={summaryInfo.nombre || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                        </Field>
                        <Field label="Resumen generado" icon={ClipboardCheck}>
                            <textarea value={summaryInfo.resumen || "Sin resumen disponible"} disabled rows={10}
                                className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />
                        </Field>
                        <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Última actualización" icon={CalendarDays}>
                                <input value={summaryInfo.resumen_actualizado_at ? fmtDTIntl(summaryInfo.resumen_actualizado_at) : "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                            </Field>
                            <Field label="Fuente" icon={BrainCircuit}>
                                <input value={summaryInfo.resumen_fuente || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Agenda */}
            <Modal open={openAgendaModal} title="Agendar cita" onClose={closeAgendaModal}
                footer={
                    <>
                        <button onClick={closeAgendaModal}
                            className="inline-flex items-center gap-2 rounded-2xl bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                            <X className="h-4 w-4" /> Cerrar
                        </button>
                        <button onClick={handleAgendar} disabled={!agendaInfo || savingo}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C]/85 px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C] disabled:opacity-60">
                            <CalendarCheck className="h-4 w-4" /> {savingo ? "Guardando..." : "Agendar"}
                        </button>
                    </>
                }>
                {agendaInfo && (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Prospecto" icon={User}>
                            <input value={agendaInfo.nombre} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                        </Field>
                        <Field label="VW de sus sueños" icon={CarFront}>
                            <input value={agendaInfo.auto_interes || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input value={agendaInfo.telefono || "—"} disabled className="w-full rounded-lg border border-black/10 bg-neutral-100 px-3 py-2 text-sm font-semibold text-[#131E5C]" />
                        </Field>
                        <Field label="Fecha y Hora de cita" icon={CalendarDays}>
                            <input type="datetime-local" value={drafter.fecha_cita || ""}
                                onChange={e => setDrafter(p => ({ ...p, fecha_cita: e.target.value }))}
                                className={cls(inputBase, inputOk)} />
                        </Field>
                        <Field label="Asesor Asignado" icon={UserStar}>
                            <select value={drafter.asesor_solicita || ""} onChange={e => setDrafter(p => ({ ...p, asesor_solicita: e.target.value }))}
                                className={cls(inputBase, inputOk)}>
                                <option value="">— Selecciona —</option>
                                {ASESORES.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </Field>
                        <Field label="Tipo de cita" icon={LayoutList}>
                            <select value={drafter.tipo_cita || ""} onChange={e => setDrafter(p => ({ ...p, tipo_cita: e.target.value }))}
                                className={cls(inputBase, inputOk)}>
                                <option value="">— Selecciona —</option>
                                {["Prueba de Manejo", "Tradicional", "Digital"].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </Field>
                        {errorMsg && (
                            <div className="md:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                )}
            </Modal>

        </div>
    );
}