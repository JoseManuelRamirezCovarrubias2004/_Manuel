// src/pages/HojaIngresos/HojaIngresos.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowUpDown,
    Calendar,
    CarFront,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Loader2,
    Plus,
    Save,
    Search,
    Trash2,
    User,
    Star,
    X,
    XCircle,
    Table2,
    LayoutGrid,
} from "lucide-react";

import { apiHojaIngresos } from "../../lib/apiHojaIngresos";
import { useAuth } from "../../auth/AuthContext";
import AgendaView from "./AgendaView";

// ---------------------------------------------------------------------------
// Diseño VW integrado en este JSX.
// No depende de designTokens.js.
// Inspirado en el lenguaje visual actual de Volkswagen: superficies limpias,
// azul corporativo, mucho aire, tarjetas editoriales y acentos luminosos.
// ---------------------------------------------------------------------------
const COLOR = {
    ink: "#08111F",
    inkSoft: "#536070",
    inkFaint: "#8A95A6",
    inkInverse: "#FFFFFF",

    brand: "#001E50", // Volkswagen Blue
    brandDeep: "#000B24",
    brandMid: "#003B78",
    brandSoft: "#E8F0FA",
    brandLine: "#BFD0E7",

    accent: "#00B0F0",
    accentSoft: "#E5F7FE",
    accentLine: "#A7E5FA",

    paper: "#F4F7FB",
    surface: "#FFFFFF",
    surfaceAlt: "#F8FAFD",
    line: "#DDE5EF",
    lineStrong: "#B9C7DA",

    ok: "#0B7A53",
    okSoft: "#E4F5ED",
    okLine: "#B9E2CD",

    warn: "#9A6400",
    warnSoft: "#FBF1DC",
    warnLine: "#EDD59E",

    danger: "#B42318",
    dangerSoft: "#FDEAE7",
    dangerLine: "#F3C4BC",

    violet: "#4B3F99",
    violetSoft: "#ECEAF8",
    teal: "#087780",
    tealSoft: "#E0F4F5",
};

const FONT_DISPLAY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const ASESOR_PALETTE = [
    { bg: "#E8F0FA", line: "#BFD0E7", dot: "#001E50", text: "#001E50" },
    { bg: "#E0F4F5", line: "#B9E0E3", dot: "#087780", text: "#075D65" },
    { bg: "#FBF1DC", line: "#EDD59E", dot: "#9A6400", text: "#754D00" },
    { bg: "#ECEAF8", line: "#D2CDEF", dot: "#4B3F99", text: "#3D337D" },
    { bg: "#E4F5ED", line: "#B9E2CD", dot: "#0B7A53", text: "#075F40" },
    { bg: "#FDEAE7", line: "#F3C4BC", dot: "#B42318", text: "#912018" },
];

function colorForAsesor(nombre) {
    if (!nombre) return { bg: "#EEF2F7", line: "#DDE5EF", dot: "#8A95A6", text: "#536070" };
    let hash = 0;
    for (let i = 0; i < nombre.length; i += 1) hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
    return ASESOR_PALETTE[hash % ASESOR_PALETTE.length];
}

function tipoServicioMeta(tipo) {
    const t = String(tipo || "").toLowerCase();
    if (t.includes("mtto") || t.includes("mantenimiento")) {
        return { bg: COLOR.brandSoft, line: COLOR.brandLine, text: COLOR.brand, label: "Mantenimiento" };
    }
    if (t.includes("diagn")) {
        return { bg: "#EEF2F7", line: "#DDE5EF", text: "#3E4858", label: "Diagnóstico" };
    }
    if (t.includes("campa")) {
        return { bg: COLOR.violetSoft, line: "#D2CDEF", text: COLOR.violet, label: "Campaña" };
    }
    if (t.includes("repar")) {
        return { bg: COLOR.dangerSoft, line: COLOR.dangerLine, text: COLOR.danger, label: "Reparación" };
    }
    if (t.includes("garant")) {
        return { bg: COLOR.tealSoft, line: "#B9E0E3", text: COLOR.teal, label: "Garantía" };
    }
    return { bg: "#EEF2F7", line: COLOR.line, text: COLOR.inkSoft, label: tipo || "Otro" };
}


const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

const ASESORES_POR_DEALER = {
    "VW Cordoba": ["Yamil Tepole", "Iván Ramírez", "Verónica González"],
    "VW Orizaba": ["Carlos Oliveros", "Norma Angélica Reyes"],
};

const MEDIOS_CONCERTACION = [
    "Facebook", "WhatsApp", "Llamada entrante", "Llamada saliente",
    "Base de datos", "Cartera", "Piso", "Web", "Otro",
];

const MODELOS = [
    "AMAROK GP", "BEETLE", "BORA A5", "CADDY", "CLASICO", "CRAFTER", "GOL",
    "GOL SEDAN", "GOLF", "JETTA", "JETTA A6", "JETTA A7", "PASSAT", "POLO",
    "SAVEIRO GP", "T CROSS", "TAOS", "TERAMONT", "TIGUAN", "TIGUAN LWB",
    "TRANSPORTER", "VENTO", "VIRTUS", "NIVUS", "TERA",
];

const TIPOS_SERVICIO = [
    "Mtto. 15 km", "Mtto. 30 km", "Mtto. 45 km", "Mtto. 60 km", "Mtto. 75 km", "Mtto. 90 km",
    "Diagnóstico", "Reparacion", "Reparacion Mayor", "Reparacion Menor",
    "Diagnostico por Testigos Encendidos", "Diagnostico por Ruidos y Vibraciones",
    "Diagnostico por Fallo Electrico-Electronico", "Diagnostico por Fallo Mecanico",
    "Garantía", "Hojalatería y pintura", "Campaña", "Reclamación", "Otro",
];

const AGENDADO = ["Asistente", "Call Center", "Asesor de Servicio"];

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizeKey(value) {
    return normalizeStr(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getDealerCanonical(agencia) {
    const key = normalizeKey(agencia);
    if (key.includes("cordoba")) return "VW Cordoba";
    if (key.includes("orizaba")) return "VW Orizaba";
    return normalizeStr(agencia);
}

function getAsesoresPorAgencia(agencia, incluirTodos = false) {
    const dealer = getDealerCanonical(agencia);
    if (incluirTodos && !dealer) return Object.values(ASESORES_POR_DEALER).flat();
    return ASESORES_POR_DEALER[dealer] || [];
}

function AsesorBadge({ asesor, agencia }) {
    const text = normalizeStr(asesor);
    if (!text) return <span style={{ color: COLOR.inkFaint }}>—</span>;

    const color = colorForAsesor(text);
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={{ background: color.bg, color: color.text }}
            title={text}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color.dot }} />
            {text}
        </span>
    );
}

function boolFromAny(value) {
    if (typeof value === "boolean") return value;
    const text = String(value ?? "").trim().toLowerCase();
    return ["true", "1", "si", "sí", "yes"].includes(text);
}

function toDTLocal(value) {
    if (!value) return "";
    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) return text.slice(0, 16);
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDTLocalToISO(value) {
    return String(value || "").trim() || null;
}

function toYMD(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function ymdToInt(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return Number(value.replaceAll("-", ""));
}

function formatDate(value) {
    const local = toDTLocal(value);
    return local ? local.replace("T", "  ·  ") : "—";
}

// La fuente de verdad para el nombre del cliente es `nombre_cliente`
// (así lo entrega la API). Se conservan los demás como respaldo para no
// romper datos antiguos, pero el orden de prioridad es el mismo en toda
// la app — ésta era la causa de que, al editar desde ciertas vistas, el
// nombre apareciera vacío y se sobrescribiera al guardar.
function getClienteNombre(row) {
    return row?.nombre_cliente || row?.cliente_nombre || row?.cliente?.nombre || "—";
}
function getTelefono(row) {
    return row?.telefono || row?.cliente?.telefono || "—";
}
function getCorreo(row) {
    return row?.correo_electronico || row?.cliente?.correo_electronico || "—";
}

function crearDraftBase(userAgencia = "", isAdmin = true) {
    return {
        id: null,
        cliente_id: null,
        agencia: isAdmin ? "" : userAgencia,
        fecha_ingreso: "",
        asistencia: false,
        citado: false,
        no_orden: "",
        diss: "",
        pauta: "",
        indicador_resultados: "",
        alcance: "",
        torre: "",
        asesor: "",
        agendado_por: "",
        cliente_nombre: "",
        cliente_telefono: "",
        cliente_correo_electronico: "",
        tipo_cita: [],
        declaracion_textual_cliente: "",
        comentarios: "",
        vin: "",
        anio_vehiculo: "",
        modelo: "",
        medio_concertacion: "",
        pauta_origen: "",
        venta_mano_obra: "",
    };
}

// ---------------------------------------------------------------------------
// Bloques visuales reutilizables
// ---------------------------------------------------------------------------

function SkeletonRow({ columns = 10 }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-3.5 w-24 animate-pulse rounded" style={{ background: COLOR.line }} />
                </td>
            ))}
        </tr>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <ClipboardList className="mb-3 h-7 w-7" style={{ color: COLOR.inkFaint }} />
            <p className="text-[13px] font-semibold" style={{ color: COLOR.inkSoft }}>
                No hay registros con los filtros seleccionados
            </p>
            <p className="mt-1 text-[12px]" style={{ color: COLOR.inkFaint }}>
                Ajusta la búsqueda o el rango de fechas para ver más resultados.
            </p>
        </div>
    );
}

function SectionHeading({ icon: Icon, children }) {
    return (
        <div className="col-span-full mt-2 flex items-center gap-2 border-b pb-2 first:mt-0" style={{ borderColor: COLOR.line }}>
            <Icon className="h-4 w-4" style={{ color: COLOR.brand }} />
            <span
                className="text-[11.5px] font-semibold uppercase tracking-wide"
                style={{ color: COLOR.brand, fontFamily: FONT_DISPLAY }}
            >
                {children}
            </span>
        </div>
    );
}

function Field({ label, required, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-[12px] font-semibold" style={{ color: COLOR.ink }}>
                {label}
                {required ? <span style={{ color: COLOR.danger }}> *</span> : null}
            </label>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: COLOR.inkFaint }}>
                {label}
            </div>
            {children}
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-[#000B24]/55 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div
                    className="w-full max-w-6xl overflow-hidden rounded-[32px] border shadow-2xl"
                    style={{ background: COLOR.surface, borderColor: "rgba(255,255,255,0.24)" }}
                >
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{
                            background: `radial-gradient(circle at 92% 0%, rgba(0,176,240,0.32), transparent 30%), linear-gradient(135deg, ${COLOR.brandDeep}, ${COLOR.brand})`,
                        }}
                    >
                        <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">Registro de servicio</div>
                            <span className="mt-1 block truncate text-[17px] font-semibold text-white" style={{ fontFamily: FONT_DISPLAY }}>
                                {title}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 hover:bg-white/15 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5" style={{ background: `linear-gradient(180deg, ${COLOR.paper}, #FFFFFF)` }}>
                        {children}
                    </div>

                    {footer ? (
                        <div
                            className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end"
                            style={{ borderColor: COLOR.line, background: COLOR.surface }}
                        >
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-44 overflow-hidden rounded-2xl border shadow-xl" style={{ background: COLOR.surface, borderColor: COLOR.line }}>
                <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold hover:bg-red-50"
                    style={{ color: COLOR.danger }}
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar registro
                </button>
                <button
                    type="button"
                    className="w-full border-t px-3.5 py-2 text-left text-[11px]"
                    style={{ borderColor: COLOR.line, color: COLOR.inkFaint }}
                    onClick={onClose}
                >
                    Cerrar menú
                </button>
            </div>
        </div>,
        document.body
    );
}

function BooleanButton({ row, field, updatingInline, onToggle }) {
    const isUpdating = !!updatingInline[`${row.id}-${field}`];
    const value = boolFromAny(row[field]);

    return (
        <button
            type="button"
            disabled={isUpdating}
            onClick={(event) => {
                event.stopPropagation();
                onToggle(row, field);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition-opacity"
            style={{
                background: value ? COLOR.okSoft : COLOR.dangerSoft,
                color: value ? COLOR.ok : COLOR.danger,
                opacity: isUpdating ? 0.6 : 1,
                cursor: isUpdating ? "not-allowed" : "pointer",
            }}
        >
            {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : value ? (
                <CheckCircle2 className="h-3 w-3" />
            ) : (
                <XCircle className="h-3 w-3" />
            )}
            {value ? "Sí" : "No"}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Vista principal
// ---------------------------------------------------------------------------

export default function HojaRegistros() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return (
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN") ||
            permisos.includes("CRM_DIGITALES")
        );
    }, [user]);

    const userAgencias = useMemo(() => {
        return String(user?.agencia || "").split("|").map((a) => a.trim()).filter(Boolean);
    }, [user?.agencia]);

    const userAgencia = userAgencias[0] || "";

    const [rows, setRows] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [updatingInline, setUpdatingInline] = useState({});

    const [sort, setSort] = useState({ key: "fecha_ingreso", dir: "desc" });

    const [filters, setFilters] = useState({ q: "", agencia: "Todos", desde: "", hasta: "" });
    const [touchedSave, setTouchedSave] = useState(false);

    const [viewMode, setViewMode] = useState("agenda");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("VW Cordoba");

    const changeDate = (days) => {
        const fecha = new Date(selectedDate);
        fecha.setDate(fecha.getDate() + days);
        setSelectedDate(fecha.toISOString().split("T")[0]);
    };

    const inputBase = "w-full rounded-2xl border px-3 py-2 text-[13px] font-medium outline-none transition focus:ring-2";
    const inputStyle = (invalid) => ({
        borderColor: invalid ? COLOR.danger : COLOR.line,
        background: invalid ? COLOR.dangerSoft : COLOR.surface,
        color: COLOR.ink,
    });

    const columns = [
        { key: "fecha_ingreso", label: "Fecha de ingreso", sortable: true },
        { key: "cliente", label: "Cliente", sortable: true },
        { key: "asistencia", label: "Asistencia" },
        { key: "asesor", label: "Asesor", sortable: true },
        { key: "pauta", label: "Campaña" },
        { key: "citado", label: "Citado" },
        { key: "torre", label: "Torre" },
        { key: "tipo_cita", label: "Tipo de servicio" },
        { key: "vin", label: "VIN" },
        { key: "medio_concertacion", label: "Medio" },
    ];

    const required = useMemo(() => ({ cliente_telefono: "Teléfono", fecha_ingreso: "Fecha ingreso" }), []);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(required).filter((key) => {
            const value = draft[key];
            return value === null || value === undefined || String(value).trim() === "";
        });
    }, [draft, required]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g, ""), [draft?.cliente_telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);

    const telefonoBloqueado = useMemo(() => {
        if (!draft?.cliente_telefono) return false;
        if (mode === "edit") return true;
        return telIsOk;
    }, [draft?.cliente_telefono, mode, telIsOk]);

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (/^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto. Debe tener 10 dígitos.";
        if (telDigits.length === 11) return "Número inválido. 11 dígitos no es válido.";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido. Si tiene 12 dígitos debe iniciar con 52.";
        if (telDigits.length > 12) return "Número demasiado largo.";
        return "Número inválido.";
    }, [openModal, draft, telDigits]);

    useEffect(() => {
        const close = () => setCtxMenu((prev) => ({ ...prev, open: false, row: null }));
        window.addEventListener("click", close);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("click", close);
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, []);

    async function refreshList() {
        setLoadingList(true);
        try {
            const data = await apiHojaIngresos.list();
            setRows(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRows([]);
            alert("No se pudo cargar la hoja de ingresos.");
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        refreshList();
    }, []);

    const dealers = useMemo(() => {
        if (!isAdmin && userAgencias.length > 0) return ["Todos", ...userAgencias];
        const set = new Set((rows || []).map((row) => normalizeStr(row.agencia)).filter(Boolean));
        return ["Todos", ...DEALERS, ...Array.from(set)].filter((value, index, array) => array.indexOf(value) === index);
    }, [rows, isAdmin, userAgencia]);

    const availableAsesores = useMemo(() => {
        if (!draft) return [];
        const agenciaActual = isAdmin ? normalizeStr(draft.agencia) : normalizeStr(userAgencia);
        return getAsesoresPorAgencia(agenciaActual, isAdmin);
    }, [draft, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.desde);
        const hastaInt = ymdToInt(filters.hasta);

        return (rows || []).filter((row) => {
            if (!isAdmin && userAgencias.length > 0) {
                if (!userAgencias.some((ua) => normalizeStr(ua) === normalizeStr(row.agencia))) return false;
            }

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(row.agencia) === normalizeStr(filters.agencia);

            let matchFecha = true;
            if (desdeInt !== null || hastaInt !== null) {
                const actualInt = ymdToInt(row.fecha_ingreso ? toYMD(row.fecha_ingreso) : "");
                if (!actualInt) return false;
                if (desdeInt !== null && actualInt < desdeInt) matchFecha = false;
                if (hastaInt !== null && actualInt > hastaInt) matchFecha = false;
            }

            const values = [
                row.agencia, row.no_orden, getClienteNombre(row), getTelefono(row), getCorreo(row),
                row.diss, row.pauta, row.torre, row.asesor, row.tipo_cita, row.vin, row.medio_concertacion,
            ];

            const matchQ = !q || values.some((value) => normalizeStr(value).toLowerCase().includes(q));
            return matchAgencia && matchFecha && matchQ;
        });
    }, [rows, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "fecha_ingreso") {
                const ta = a.fecha_ingreso ? new Date(a.fecha_ingreso).getTime() : 0;
                const tb = b.fecha_ingreso ? new Date(b.fecha_ingreso).getTime() : 0;
                return (ta - tb) * mult;
            }
            if (key === "cliente") {
                const va = getClienteNombre(a).toLowerCase();
                const vb = getClienteNombre(b).toLowerCase();
                if (va < vb) return -1 * mult;
                if (va > vb) return 1 * mult;
                return 0;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    function resetFilters() {
        setFilters({ q: "", agencia: "Todos", desde: "", hasta: "" });
    }

    function setHoy() {
        const hoy = toYMD(new Date());
        setFilters((prev) => ({ ...prev, desde: hoy, hasta: hoy }));
    }

    function onRowContextMenu(event, row) {
        event.preventDefault();
        event.stopPropagation();
        setCtxMenu({ open: true, x: event.clientX, y: event.clientY, row });
    }

    // `preset` permite prellenar la cita cuando se origina desde un clic en
    // una celda vacía de la agenda (asesor + horario + fecha ya conocidos).
    function abrirNuevo(preset = null) {
        setTouchedSave(false);
        setMode("create");
        const d = crearDraftBase(userAgencia, isAdmin);

        if (preset) {
            d.agencia = preset.agencia || d.agencia;
            d.asesor = preset.asesor || "";
            d.fecha_ingreso = preset.fecha_ingreso || "";
        } else if (viewMode === "agenda") {
            d.fecha_ingreso = new Date().toISOString().slice(0, 16);
        }

        setDraft(d);
        setOpenModal(true);
    }

    // Clic en un espacio libre de la agenda → abre el formulario completo
    // (con todas sus validaciones) ya pre-llenado con asesor/fecha/hora.
    function onAgendaSlotClick(asesorNombre, horaSlot) {
        const [hh, mm] = horaSlot.split(":").map(Number);
        const fechaIso = `${selectedDate}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        abrirNuevo({ asesor: asesorNombre, agencia: agenciaSeleccionada, fecha_ingreso: fechaIso });
    }

    async function abrirEditar(row) {
        if (!row?.id) return;
        setTouchedSave(false);
        setMode("edit");
        setOpenModal(true);
        setLoadingDetail(true);

        try {
            const data = await apiHojaIngresos.get(row.id);

            if (!isAdmin && userAgencias.length > 0) {
                if (!userAgencias.some((ua) => normalizeStr(ua) === normalizeStr(data.agencia))) {
                    alert("No tienes permisos para editar registros de otra agencia.");
                    setOpenModal(false);
                    return;
                }
            }

            setDraft({
                id: data.id,
                cliente_id: data?.cliente?.id ?? null,
                agencia: data.agencia || (isAdmin ? "" : userAgencia),
                fecha_ingreso: toDTLocal(data.fecha_ingreso),
                asistencia: !!data.asistencia,
                citado: boolFromAny(data.citado),
                no_orden: data.no_orden || "",
                diss: data.diss || "",
                pauta: data.pauta || "",
                indicador_resultados: data.indicador_resultados || "",
                alcance: data.alcance || "",
                torre: data.torre || "",
                asesor: data.asesor || "",
                agendado_por: data.agendado_por || "",
                cliente_nombre: getClienteNombre(data) === "—" ? "" : getClienteNombre(data),
                cliente_telefono: data.telefono || data?.cliente?.telefono || "",
                cliente_correo_electronico: data.correo_electronico || data?.cliente?.correo_electronico || "",
                tipo_cita: data.tipo_cita ? String(data.tipo_cita).split(",").map((t) => t.trim()).filter(Boolean) : [],
                declaracion_textual_cliente: data.declaracion_textual_cliente || "",
                comentarios: data.comentarios || "",
                vin: data.vin || "",
                anio_vehiculo: data.anio_vehiculo || "",
                modelo: data.modelo || "",
                medio_concertacion: data.medio_concertacion || "",
                pauta_origen: data.pauta_origen || "",
                venta_mano_obra: data.venta_mano_obra === null || data.venta_mano_obra === undefined ? "" : String(data.venta_mano_obra),
            });
        } catch (error) {
            console.error(error);
            alert("No se pudo abrir el registro.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    }

    function cerrarModal() {
        if (saving) return;
        setOpenModal(false);
        setDraft(null);
    }

    function buildPayload() {
        return {
            cliente_id: draft.cliente_id || null,
            cliente_nombre: draft.cliente_nombre || "",
            cliente_telefono: normalizeStr(draft.cliente_telefono),
            cliente_correo_electronico: draft.cliente_correo_electronico || "",
            agencia: isAdmin ? normalizeStr(draft.agencia) : userAgencia,
            fecha_ingreso: fromDTLocalToISO(draft.fecha_ingreso),
            asistencia: !!draft.asistencia,
            citado: !!draft.citado,
            no_orden: draft.no_orden || "",
            diss: draft.diss || "",
            pauta: draft.pauta || "",
            indicador_resultados: draft.indicador_resultados || "",
            alcance: draft.alcance || "",
            torre: draft.torre || "",
            asesor: draft.asesor || "",
            agendado_por: draft.agendado_por || "",
            nombre_cliente: draft.cliente_nombre || "",
            tipo_cita: Array.isArray(draft.tipo_cita) ? draft.tipo_cita.join(", ") : draft.tipo_cita || "",
            declaracion_textual_cliente: draft.declaracion_textual_cliente || "",
            comentarios: draft.comentarios || "",
            vin: draft.vin || "",
            anio_vehiculo: draft.anio_vehiculo || "",
            modelo: draft.modelo || "",
            medio_concertacion: draft.medio_concertacion || "",
            pauta_origen: draft.pauta_origen || "",
            venta_mano_obra: draft.venta_mano_obra === "" || draft.venta_mano_obra === null ? "0" : draft.venta_mano_obra,
        };
    }

    async function guardar() {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length) return;

        if (!telIsOk) {
            alert("Revisa el teléfono del cliente.");
            return;
        }

        setSaving(true);
        try {
            const payload = buildPayload();
            if (mode === "create") await apiHojaIngresos.create(payload);
            else await apiHojaIngresos.update(draft.id, payload);
            await refreshList();
            cerrarModal();
        } catch (error) {
            console.error(error);
            alert(`No se pudo guardar el registro: ${error.message}`);
        } finally {
            setSaving(false);
        }
    }

    async function eliminar(row) {
        if (!row?.id) return;
        if (!isAdmin && userAgencias.length > 0) {
            if (!userAgencias.some((ua) => normalizeStr(ua) === normalizeStr(row.agencia))) {
                alert("No tienes permisos para eliminar registros de otra agencia.");
                return;
            }
        }

        const ok = confirm(`¿Eliminar el registro de ${getClienteNombre(row)}?`);
        if (!ok) return;

        try {
            await apiHojaIngresos.remove(row.id);
            setRows((prev) => prev.filter((item) => item.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (error) {
            console.error(error);
            alert("No se pudo eliminar el registro.");
        }
    }

    async function patchBoolean(row, field) {
        if (!row?.id) return;
        const previous = boolFromAny(row[field]);
        const next = !previous;

        setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, [field]: next } : item)));
        setUpdatingInline((prev) => ({ ...prev, [`${row.id}-${field}`]: true }));

        try {
            await apiHojaIngresos.patch(row.id, { [field]: next });
        } catch (error) {
            console.error(error);
            setRows((prev) => prev.map((item) => (item.id === row.id ? { ...item, [field]: previous } : item)));
            alert(`No se pudo actualizar ${field}.`);
        } finally {
            setUpdatingInline((prev) => {
                const copy = { ...prev };
                delete copy[`${row.id}-${field}`];
                return copy;
            });
        }
    }

    const tipoCitaList = (value) => (Array.isArray(value) ? value : value ? [value] : []);
    const fechaLegible = useMemo(() => {
        const [y, m, d] = selectedDate.split("-").map(Number);
        if (!y) return "";
        const date = new Date(y, m - 1, d);
        const texto = date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }, [selectedDate]);

    const metricasDia = useMemo(() => {
        const base = (rows || []).filter((row) => {
            const fecha = row.fecha_ingreso ? toYMD(row.fecha_ingreso) : "";
            const mismaFecha = fecha === selectedDate;
            const mismaAgencia = !agenciaSeleccionada || getDealerCanonical(row.agencia) === getDealerCanonical(agenciaSeleccionada);
            return mismaFecha && mismaAgencia;
        });

        const citados = base.filter((row) => boolFromAny(row.citado)).length;
        const asistencias = base.filter((row) => boolFromAny(row.asistencia)).length;
        const clientes = new Set(base.map((row) => getTelefono(row)).filter(Boolean)).size;

        return { total: base.length, citados, asistencias, clientes };
    }, [rows, selectedDate, agenciaSeleccionada]);

    return (
        <div
            className="w-full min-h-screen rounded-[14px]"
        >
            {/* Agenda ejecutiva: cabecera única del módulo */}
            <section
                className="mb-4 overflow-hidden rounded-lg border"
                style={{
                    background: `radial-gradient(circle at 92% 0%, rgba(0,176,240,0.32), transparent 28%), linear-gradient(135deg, ${COLOR.brandDeep} 0%, ${COLOR.brand} 58%, ${COLOR.brandMid} 100%)`,
                    borderColor: "rgba(255,255,255,0.16)",
                    boxShadow: "0 24px 70px rgba(0, 30, 80, 0.18)",
                }}
            >
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-6">
                    <div className="min-w-0 text-white">
                        <h1 className="mt-4 text-[32px] font-semibold leading-none tracking-[-0.055em] md:text-[46px]">
                            Hoja Ingresos
                        </h1>
                        <p className="mt-3 max-w-2xl text-[13px] font-medium leading-6 text-white/68">
                            Control diario de ingresos de servicio Volkswagen R&amp;R. {fechaLegible || "Fecha"} · {agenciaSeleccionada}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => abrirNuevo()}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold shadow-lg transition hover:-translate-y-0.5"
                                style={{ color: COLOR.brand }}
                            >
                                <Plus className="h-4 w-4" />
                                Nueva cita
                            </button>

                            <div className="flex items-center overflow-hidden rounded-lg border border-white/15 bg-white/10 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("agenda")}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-colors"
                                    style={viewMode === "agenda" ? { background: "#fff", color: COLOR.brand } : { color: "rgba(255,255,255,0.74)" }}
                                >
                                    <LayoutGrid className="h-3.5 w-3.5" /> Agenda
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("tabla")}
                                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition-colors"
                                    style={viewMode === "tabla" ? { background: "#fff", color: COLOR.brand } : { color: "rgba(255,255,255,0.74)" }}
                                >
                                    <Table2 className="h-3.5 w-3.5" /> Tabla
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <div className="flex items-center overflow-hidden rounded-lg border border-white/15 bg-white/10">
                                <button
                                    type="button"
                                    onClick={() => changeDate(-1)}
                                    className="px-2.5 py-2 text-white/75 hover:text-white"
                                    title="Día anterior"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                                    className="border-x border-white/15 px-3 py-2 text-[12px] font-bold text-white"
                                >
                                    Hoy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeDate(1)}
                                    className="px-2.5 py-2 text-white/75 hover:text-white"
                                    title="Día siguiente"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2">
                                <Calendar className="h-3.5 w-3.5 text-white/65" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="text-[12px] font-bold outline-none"
                                    style={{ color: "#fff", background: "transparent", colorScheme: "dark" }}
                                />
                            </div>

                            <div className="flex items-center gap-1.5">
                                {["VW Cordoba", "VW Orizaba"].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setAgenciaSeleccionada(d)}
                                        className="rounded-lg px-3.5 py-2 text-[12px] font-bold transition-colors"
                                        style={
                                            agenciaSeleccionada === d
                                                ? { background: "#fff", color: COLOR.brand }
                                                : { background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.74)", border: "1px solid rgba(255,255,255,0.14)" }
                                        }
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-2 border-t border-white/10 bg-white/[0.06] p-3 md:grid-cols-4">
                    {[
                        { label: "Citas día", value: metricasDia.total, hint: "agenda seleccionada" },
                        { label: "Citados", value: metricasDia.citados, hint: "confirmados" },
                        { label: "Asistencias", value: metricasDia.asistencias, hint: "registradas" },
                        { label: "Clientes únicos", value: metricasDia.clientes, hint: "por teléfono" },
                    ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur">
                            <div className="text-[10px] font-bold uppercase tracking-[0.19em] text-white/52">{item.label}</div>
                            <div className="mt-2 text-[30px] font-semibold leading-none tabular-nums">{item.value}</div>
                            <div className="mt-1 text-[11px] font-semibold text-white/58">{item.hint}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Filtros — solo vista tabla */}
            {viewMode === "tabla" && (
                <div className="mb-3 rounded-lg border p-3" style={{ background: COLOR.surface, borderColor: COLOR.line }}>
                    <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-5">
                            <FilterBlock label="Búsqueda">
                                <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: COLOR.line }}>
                                    <Search className="h-3.5 w-3.5" style={{ color: COLOR.inkFaint }} />
                                    <input
                                        value={filters.q}
                                        onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                                        placeholder="Cliente, teléfono, VIN, asesor, orden..."
                                        className="w-full text-[13px] font-medium outline-none"
                                        style={{ color: COLOR.ink }}
                                    />
                                    {filters.q && (
                                        <button type="button" onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}>
                                            <X className="h-3.5 w-3.5" style={{ color: COLOR.inkFaint }} />
                                        </button>
                                    )}
                                </div>
                            </FilterBlock>
                        </div>

                        <div className="md:col-span-2">
                            <FilterBlock label="Dealer">
                                <select
                                    value={filters.agencia}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, agencia: event.target.value }))}
                                    className="w-full rounded-lg border px-3 py-2 text-[13px] font-medium outline-none"
                                    style={{ borderColor: COLOR.line, color: COLOR.ink }}
                                >
                                    {dealers.map((dealer) => (
                                        <option key={dealer} value={dealer}>{dealer}</option>
                                    ))}
                                </select>
                            </FilterBlock>
                        </div>

                        <div className="md:col-span-2">
                            <FilterBlock label="Desde">
                                <input
                                    type="date"
                                    value={filters.desde}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, desde: event.target.value }))}
                                    className="w-full rounded-lg border px-3 py-2 text-[13px] font-medium outline-none"
                                    style={{ borderColor: COLOR.line, color: COLOR.ink }}
                                />
                            </FilterBlock>
                        </div>

                        <div className="md:col-span-2">
                            <FilterBlock label="Hasta">
                                <input
                                    type="date"
                                    value={filters.hasta}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, hasta: event.target.value }))}
                                    className="w-full rounded-lg border px-3 py-2 text-[13px] font-medium outline-none"
                                    style={{ borderColor: COLOR.line, color: COLOR.ink }}
                                />
                            </FilterBlock>
                        </div>

                        <div className="md:col-span-1">
                            <FilterBlock label=" ">
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={setHoy}
                                        title="Filtrar por hoy"
                                        className="flex-1 rounded-lg py-2 text-[11px] font-semibold"
                                        style={{ background: COLOR.brandSoft, color: COLOR.brand }}
                                    >
                                        Hoy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        title="Limpiar filtros"
                                        className="flex-1 rounded-lg border py-2 text-[11px] font-semibold"
                                        style={{ borderColor: COLOR.line, color: COLOR.inkSoft }}
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            </FilterBlock>
                        </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px]" style={{ color: COLOR.inkFaint }}>
                        <span className="font-semibold" style={{ color: COLOR.ink }}>{sorted.length}</span>
                        registro{sorted.length === 1 ? "" : "s"} encontrado{sorted.length === 1 ? "" : "s"}
                    </div>
                </div>
            )}

            {/* Contenido: tabla o agenda */}
            {viewMode === "tabla" ? (
                <>
                    {/* TABLA DESKTOP */}
                    <div className="hidden overflow-hidden rounded-lg border lg:block" style={{ background: COLOR.surface, borderColor: COLOR.line }}>
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-[1500px] w-full text-left text-[13px]">
                                <thead className="sticky top-0 z-10" style={{ background: COLOR.brand }}>
                                    <tr>
                                        {columns.map((column) => (
                                            <th key={column.key} className="whitespace-nowrap px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-white/90">
                                                {column.sortable ? (
                                                    <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1">
                                                        {column.label}
                                                        {sort.key === column.key ? (
                                                            sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                                        ) : (
                                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    column.label
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingList ? (
                                        Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} columns={columns.length} />)
                                    ) : sorted.length === 0 ? (
                                        <tr>
                                            <td colSpan={columns.length}>
                                                <EmptyState />
                                            </td>
                                        </tr>
                                    ) : (
                                        sorted.map((row, index) => {
                                            const servicio = tipoServicioMeta(row.tipo_cita);
                                            return (
                                                <tr
                                                    key={row.id}
                                                    onDoubleClick={() => abrirEditar(row)}
                                                    onContextMenu={(event) => onRowContextMenu(event, row)}
                                                    title="Doble clic para editar"
                                                    className="cursor-pointer transition-colors"
                                                    style={{
                                                        background: index % 2 === 0 ? COLOR.surface : COLOR.paper,
                                                        borderTop: `1px solid ${COLOR.line}`,
                                                    }}
                                                >
                                                    <td className="whitespace-nowrap px-4 py-2.5 tabular-nums" style={{ color: COLOR.inkSoft }}>
                                                        {formatDate(row.fecha_ingreso)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5">
                                                        <div className="font-semibold" style={{ color: COLOR.ink }}>{getClienteNombre(row)}</div>
                                                        <div className="text-[11px]" style={{ color: COLOR.inkFaint }}>{getTelefono(row)}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5">
                                                        <BooleanButton row={row} field="asistencia" updatingInline={updatingInline} onToggle={patchBoolean} />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5">
                                                        <AsesorBadge asesor={row.asesor} agencia={row.agencia} />
                                                    </td>
                                                    <td className="max-w-[200px] px-4 py-2.5" style={{ color: COLOR.inkSoft }}>
                                                        <span className="line-clamp-1">{row.pauta || "—"}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5">
                                                        <BooleanButton row={row} field="citado" updatingInline={updatingInline} onToggle={patchBoolean} />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: COLOR.inkSoft }}>
                                                        {row.torre || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5">
                                                        {row.tipo_cita ? (
                                                            <span
                                                                className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
                                                                style={{ background: servicio.bg, color: servicio.text }}
                                                            >
                                                                {row.tipo_cita}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: COLOR.inkFaint }}>—</span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[12px]" style={{ color: COLOR.inkSoft }}>
                                                        {row.vin || "—"}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: COLOR.inkSoft }}>
                                                        {row.medio_concertacion || "—"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminar} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </div>
                    </div>

                    {/* VISTA MÓVIL */}
                    <div className="grid gap-2.5 lg:hidden">
                        {loadingList ? (
                            <div className="rounded-[24px] border p-5" style={{ background: COLOR.surface, borderColor: COLOR.line }}>
                                <div className="flex items-center gap-2 font-semibold" style={{ color: COLOR.ink }}>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando...
                                </div>
                            </div>
                        ) : sorted.length === 0 ? (
                            <div className="rounded-[24px] border p-8" style={{ background: COLOR.surface, borderColor: COLOR.line }}>
                                <EmptyState />
                            </div>
                        ) : (
                            sorted.map((row) => (
                                <button
                                    key={row.id}
                                    type="button"
                                    onClick={() => abrirEditar(row)}
                                    className="rounded-[24px] border p-3.5 text-left"
                                    style={{ background: COLOR.surface, borderColor: COLOR.line }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="truncate text-[14px] font-semibold" style={{ color: COLOR.ink }}>
                                                {getClienteNombre(row)}
                                            </div>
                                            <div className="mt-0.5 text-[12px]" style={{ color: COLOR.inkSoft }}>
                                                {row.agencia || "—"} · {getTelefono(row)}
                                            </div>
                                            <div className="mt-0.5 text-[11.5px] tabular-nums" style={{ color: COLOR.inkFaint }}>
                                                {formatDate(row.fecha_ingreso)}
                                            </div>
                                            <div className="mt-2">
                                                <AsesorBadge asesor={row.asesor} agencia={row.agencia} />
                                            </div>
                                        </div>

                                        <span
                                            className="inline-flex shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold"
                                            style={
                                                boolFromAny(row.citado)
                                                    ? { background: COLOR.okSoft, color: COLOR.ok }
                                                    : { background: COLOR.dangerSoft, color: COLOR.danger }
                                            }
                                        >
                                            {boolFromAny(row.citado) ? "Citado" : "No citado"}
                                        </span>
                                    </div>

                                    {(row.comentarios || row.pauta) && (
                                        <div className="mt-2.5 line-clamp-2 text-[12.5px]" style={{ color: COLOR.inkSoft }}>
                                            {row.comentarios || row.pauta}
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <AgendaView
                    citas={rows}
                    agenciaSeleccionada={agenciaSeleccionada}
                    selectedDate={selectedDate}
                    abrirEditar={abrirEditar}
                    onSlotClick={onAgendaSlotClick}
                />
            )}

            {/* Modal crear/editar */}
            <Modal
                open={openModal}
                title={
                    mode === "create" ? "Nueva cita" : `Editar cita #${draft?.id}`
                }
                onClose={cerrarModal}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={cerrarModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-2 text-[13px] font-semibold disabled:opacity-60"
                            style={{ borderColor: COLOR.line, color: COLOR.inkSoft }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={guardar}
                            disabled={saving || loadingDetail || !!telError}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
                            style={{ background: COLOR.brand }}
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? (
                    <div className="grid gap-3 md:grid-cols-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border p-3" style={{ borderColor: COLOR.line, background: COLOR.surface }}>
                                <div className="h-3 w-20 rounded" style={{ background: COLOR.line }} />
                                <div className="mt-3 h-8 w-full rounded" style={{ background: COLOR.line }} />
                            </div>
                        ))}
                    </div>
                ) : !draft ? null : (
                    <div className="grid gap-x-4 gap-y-3.5 md:grid-cols-3">
                        <SectionHeading icon={User}>Cliente y cita</SectionHeading>

                        <Field label="Dealer" required>
                            <select
                                value={draft.agencia || ""}
                                onChange={(event) => setDraft((prev) => ({ ...prev, agencia: event.target.value, asesor: "" }))}
                                disabled={!isAdmin}
                                className={inputBase}
                                style={{ ...inputStyle(false), opacity: !isAdmin ? 0.7 : 1, cursor: !isAdmin ? "not-allowed" : "pointer" }}
                            >
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias.length > 0 ? userAgencias : DEALERS).map((dealer) => (
                                    <option key={dealer} value={dealer}>{dealer}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Fecha de ingreso" required>
                            <input
                                type="datetime-local"
                                value={draft.fecha_ingreso}
                                onChange={(event) => setDraft((prev) => ({ ...prev, fecha_ingreso: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(isInvalid("fecha_ingreso"))}
                            />
                            {isInvalid("fecha_ingreso") && (
                                <div className="mt-1 text-[11px] font-semibold" style={{ color: COLOR.danger }}>
                                    Fecha de ingreso es requerida.
                                </div>
                            )}
                        </Field>

                        <Field label="No. preorden">
                            <input
                                value={draft.no_orden}
                                onChange={(event) => setDraft((prev) => ({ ...prev, no_orden: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                                placeholder="No. preorden"
                            />
                        </Field>

                        <Field label="Cliente">
                            <input
                                value={draft.cliente_nombre}
                                onChange={(event) => setDraft((prev) => ({ ...prev, cliente_nombre: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                                placeholder="Nombre completo"
                            />
                        </Field>

                        <Field label="Teléfono" required>
                            <input
                                maxLength={12}
                                value={draft.cliente_telefono}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, cliente_telefono: event.target.value.replace(/\D/g, "").slice(0, 12) }))
                                }
                                disabled={telefonoBloqueado}
                                className={inputBase}
                                style={{
                                    ...inputStyle(isInvalid("cliente_telefono") || !!telError),
                                    opacity: telefonoBloqueado ? 0.7 : 1,
                                    cursor: telefonoBloqueado ? "not-allowed" : "text",
                                }}
                                placeholder="10 dígitos"
                            />
                            {telefonoBloqueado && (
                                <div className="mt-1 text-[11px] font-medium" style={{ color: COLOR.inkFaint }}>
                                    Teléfono bloqueado después de capturarse.
                                </div>
                            )}
                            {isInvalid("cliente_telefono") && (
                                <div className="mt-1 text-[11px] font-semibold" style={{ color: COLOR.danger }}>
                                    Teléfono es requerido.
                                </div>
                            )}
                            {!isInvalid("cliente_telefono") && telError && (
                                <div className="mt-1 text-[11px] font-semibold" style={{ color: COLOR.danger }}>
                                    {telError}
                                </div>
                            )}
                        </Field>

                        <Field label="Correo electrónico">
                            <input
                                type="email"
                                value={draft.cliente_correo_electronico}
                                onChange={(event) => setDraft((prev) => ({ ...prev, cliente_correo_electronico: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                                placeholder="correo@empresa.com"
                            />
                        </Field>

                        <Field label="DISS">
                            <input
                                value={draft.diss}
                                onChange={(event) => setDraft((prev) => ({ ...prev, diss: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            />
                        </Field>

                        <Field label="Torre">
                            <input
                                value={draft.torre}
                                onChange={(event) => setDraft((prev) => ({ ...prev, torre: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            />
                        </Field>

                        <SectionHeading icon={Star}>Asignación</SectionHeading>

                        <Field label="Asesor">
                            <select
                                value={draft.asesor || ""}
                                onChange={(event) => setDraft((prev) => ({ ...prev, asesor: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            >
                                <option value="" disabled>Selecciona un asesor...</option>
                                {availableAsesores.length === 0 ? (
                                    <option value="" disabled>Selecciona primero VW Cordoba o VW Orizaba...</option>
                                ) : null}
                                {availableAsesores.map((asesor) => (
                                    <option key={asesor} value={asesor}>{asesor}</option>
                                ))}
                            </select>
                            {draft.asesor && (
                                <div className="mt-2">
                                    <AsesorBadge asesor={draft.asesor} agencia={draft.agencia} />
                                </div>
                            )}
                        </Field>

                        <Field label="Agendado por">
                            <select
                                value={draft.agendado_por || ""}
                                onChange={(event) => setDraft((prev) => ({ ...prev, agendado_por: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            >
                                <option value="" disabled>Selecciona una opción...</option>
                                {AGENDADO.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Medio de concertación">
                            <select
                                value={draft.medio_concertacion || ""}
                                onChange={(event) => setDraft((prev) => ({ ...prev, medio_concertacion: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            >
                                <option value="">Selecciona...</option>
                                {MEDIOS_CONCERTACION.map((medio) => (
                                    <option key={medio} value={medio}>{medio}</option>
                                ))}
                            </select>
                        </Field>

                        <SectionHeading icon={CarFront}>Vehículo y servicio</SectionHeading>

                        <Field label="VIN">
                            <input
                                value={draft.vin}
                                onChange={(event) => setDraft((prev) => ({ ...prev, vin: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            />
                        </Field>

                        <Field label="Año del vehículo">
                            <input
                                value={draft.anio_vehiculo}
                                onChange={(event) => setDraft((prev) => ({ ...prev, anio_vehiculo: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            />
                        </Field>

                        <Field label="Modelo">
                            <select
                                value={draft.modelo || ""}
                                onChange={(event) => setDraft((prev) => ({ ...prev, modelo: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            >
                                <option value="">Selecciona...</option>
                                {MODELOS.map((tipo) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Tipo de servicio">
                                <div
                                    className="grid max-h-[160px] grid-cols-2 gap-1 overflow-y-auto rounded-2xl border p-2"
                                    style={{ borderColor: COLOR.line, background: COLOR.surface }}
                                >
                                    {TIPOS_SERVICIO.map((tipo) => (
                                        <label
                                            key={tipo}
                                            className="flex items-center gap-2 rounded px-2 py-1.5 text-[12px] font-medium hover:bg-black/[0.03]"
                                            style={{ color: COLOR.ink }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={(draft.tipo_cita || []).includes(tipo)}
                                                onChange={(event) => {
                                                    let nuevosTipos = [...(draft.tipo_cita || [])];
                                                    if (event.target.checked) nuevosTipos.push(tipo);
                                                    else nuevosTipos = nuevosTipos.filter((t) => t !== tipo);
                                                    setDraft((prev) => ({ ...prev, tipo_cita: nuevosTipos }));
                                                }}
                                                className="h-3.5 w-3.5"
                                                style={{ accentColor: COLOR.brand }}
                                            />
                                            {tipo}
                                        </label>
                                    ))}
                                </div>

                                {tipoCitaList(draft.tipo_cita).length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {tipoCitaList(draft.tipo_cita).map((tipo) => {
                                            const meta = tipoServicioMeta(tipo);
                                            return (
                                                <span
                                                    key={tipo}
                                                    className="rounded px-2 py-0.5 text-[11px] font-semibold"
                                                    style={{ background: meta.bg, color: meta.text }}
                                                >
                                                    {tipo}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </Field>
                        </div>

                        <Field label="Venta mano de obra">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.venta_mano_obra}
                                onChange={(event) => setDraft((prev) => ({ ...prev, venta_mano_obra: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            />
                        </Field>

                        <SectionHeading icon={CheckCircle2}>Estado</SectionHeading>

                        <Field label="Citado">
                            <label className="flex h-9 items-center gap-2.5 rounded-2xl border px-3 text-[13px] font-medium" style={{ borderColor: COLOR.line, color: COLOR.ink }}>
                                <input
                                    type="checkbox"
                                    checked={!!draft.citado}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, citado: event.target.checked }))}
                                    className="h-3.5 w-3.5"
                                    style={{ accentColor: COLOR.brand }}
                                />
                                ¿Cliente citado?
                            </label>
                        </Field>

                        <Field label="Asistencia">
                            <label className="flex h-9 items-center gap-2.5 rounded-2xl border px-3 text-[13px] font-medium" style={{ borderColor: COLOR.line, color: COLOR.ink }}>
                                <input
                                    type="checkbox"
                                    checked={!!draft.asistencia}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, asistencia: event.target.checked }))}
                                    className="h-3.5 w-3.5"
                                    style={{ accentColor: COLOR.brand }}
                                />
                                ¿Asistió?
                            </label>
                        </Field>

                        <Field label="Campaña">
                            <input
                                value={draft.pauta}
                                onChange={(event) => setDraft((prev) => ({ ...prev, pauta: event.target.value }))}
                                className={inputBase}
                                style={inputStyle(false)}
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Declaración textual del cliente">
                                <textarea
                                    value={draft.declaracion_textual_cliente}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, declaracion_textual_cliente: event.target.value }))}
                                    className={inputBase}
                                    style={{ ...inputStyle(false), minHeight: 88 }}
                                />
                            </Field>
                        </div>

                        <div className="md:col-span-3">
                            <Field label="Comentarios">
                                <textarea
                                    value={draft.comentarios}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, comentarios: event.target.value }))}
                                    className={inputBase}
                                    style={{ ...inputStyle(false), minHeight: 88 }}
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
