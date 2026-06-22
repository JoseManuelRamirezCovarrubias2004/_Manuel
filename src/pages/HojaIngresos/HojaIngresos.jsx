// src/pages/HojaIngresos/HojaIngresos.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowDownUp,
    Building2,
    CalendarDays,
    CarFront,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Clock3,
    LayoutGrid,
    Loader2,
    Mail,
    Phone,
    Plus,
    ReceiptText,
    RefreshCw,
    Save,
    Search,
    Table2,
    Trash2,
    UserRound,
    UserStar,
    Wrench,
    X,
    XCircle,
} from "lucide-react";

import { apiHojaIngresos } from "../../lib/apiHojaIngresos";
import { useAuth } from "../../auth/AuthContext";
import AgendaView from "./AgendaView";

const VW = {
    blue: "#001E50",
    blue2: "#0A2A66",
    electric: "#00B0F0",
    ink: "#111827",
    text: "#24324B",
    muted: "#64748B",
    faint: "#94A3B8",
    soft: "#F4F7FB",
    surface: "#FFFFFF",
    line: "#D9DEE8",
    line2: "#EEF1F6",
    ok: "#008A5B",
    okSoft: "#E8F6F0",
    warn: "#B7791F",
    warnSoft: "#FFF4DE",
    danger: "#C83A3A",
    dangerSoft: "#FDECEC",
};

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

const ASESORES_POR_DEALER = {
    "VW Cordoba": ["Yamil Tepole", "Iván Ramírez", "Verónica González"],
    "VW Orizaba": ["Carlos Oliveros", "Norma Angélica Reyes"],
};

const MEDIOS_CONCERTACION = [
    "Facebook",
    "WhatsApp",
    "Llamada entrante",
    "Llamada saliente",
    "Base de datos",
    "Cartera",
    "Piso",
    "Web",
    "Otro",
];

const MODELOS = [
    "AMAROK GP", "BEETLE", "BORA A5", "CADDY", "CLASICO", "CRAFTER", "GOL",
    "GOL SEDAN", "GOLF", "JETTA", "JETTA A6", "JETTA A7", "PASSAT", "POLO",
    "SAVEIRO GP", "T CROSS", "TAOS", "TERAMONT", "TIGUAN", "TIGUAN LWB",
    "TRANSPORTER", "VENTO", "VIRTUS", "NIVUS", "TERA",
];

const TIPOS_SERVICIO = [
    "Mtto. 15 km",
    "Mtto. 30 km",
    "Mtto. 45 km",
    "Mtto. 60 km",
    "Mtto. 75 km",
    "Mtto. 90 km",
    "Diagnóstico",
    "Reparacion",
    "Reparacion Mayor",
    "Reparacion Menor",
    "Diagnostico por Testigos Encendidos",
    "Diagnostico por Ruidos y Vibraciones",
    "Diagnostico por Fallo Electrico-Electronico",
    "Diagnostico por Fallo Mecanico",
    "Garantía",
    "Hojalatería y pintura",
    "Campaña",
    "Reclamación",
    "Otro",
];

const AGENDADO = ["Asistente", "Call Center", "Asesor de Servicio"];

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizeKey(value) {
    return normalizeStr(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function pad2(value) {
    return String(value).padStart(2, "0");
}

function localDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function localDateTimeInput(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${localDateKey(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function addDaysToYMD(value, days) {
    const [year, month, day] = String(value || localDateKey()).split("-").map(Number);
    const date = new Date(year, (month || 1) - 1, day || 1);
    date.setDate(date.getDate() + days);
    return localDateKey(date);
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
    return localDateTimeInput(date);
}

function fromDTLocalToISO(value) {
    return String(value || "").trim() || null;
}

function ymdToInt(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return Number(value.replaceAll("-", ""));
}

function formatDateTime(value) {
    const local = toDTLocal(value);
    if (!local) return "—";
    const [date, time] = local.split("T");
    return `${date} · ${time}`;
}

function getClienteNombre(row) {
    return row?.nombre_cliente || row?.cliente?.nombre || row?.cliente_nombre || "—";
}

function getTelefono(row) {
    return row?.telefono || row?.cliente?.telefono || row?.cliente_telefono || "—";
}

function getCorreo(row) {
    return row?.correo_electronico || row?.cliente?.correo_electronico || row?.cliente_correo_electronico || "—";
}

function money(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(number);
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

function servicioMeta(tipo) {
    const text = String(tipo || "").toLowerCase();
    if (text.includes("mtto") || text.includes("mantenimiento")) return { label: "Mantenimiento", bg: "#EAF1FF", text: VW.blue, line: "#BFD0F3" };
    if (text.includes("diagn")) return { label: "Diagnóstico", bg: "#EEF2F7", text: "#334155", line: "#D5DCE8" };
    if (text.includes("garant")) return { label: "Garantía", bg: VW.okSoft, text: VW.ok, line: "#B8E5D4" };
    if (text.includes("campa")) return { label: "Campaña", bg: "#F0ECFF", text: "#5B45C4", line: "#D7CDFB" };
    if (text.includes("repar")) return { label: "Reparación", bg: VW.dangerSoft, text: VW.danger, line: "#F3C1C1" };
    return { label: tipo || "Servicio", bg: VW.soft, text: VW.muted, line: VW.line };
}

function advisorColor(nombre) {
    const palette = [
        { dot: VW.blue, bg: "#EAF1FF", text: VW.blue },
        { dot: "#007C92", bg: "#E6F6F8", text: "#007C92" },
        { dot: "#6D5BD0", bg: "#F0ECFF", text: "#6D5BD0" },
        { dot: VW.ok, bg: VW.okSoft, text: VW.ok },
        { dot: VW.warn, bg: VW.warnSoft, text: VW.warn },
        { dot: VW.danger, bg: VW.dangerSoft, text: VW.danger },
    ];

    let hash = 0;
    const value = normalizeStr(nombre);
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    return palette[hash % palette.length] || palette[0];
}

function BrandMark() {
    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-black" style={{ borderColor: VW.blue, color: VW.blue }}>
            VW
        </div>
    );
}

function MetricCard({ label, value, icon: Icon, tone = "blue" }) {
    const tones = {
        blue: { bg: "#EAF1FF", text: VW.blue },
        green: { bg: VW.okSoft, text: VW.ok },
        amber: { bg: VW.warnSoft, text: VW.warn },
        red: { bg: VW.dangerSoft, text: VW.danger },
        gray: { bg: VW.soft, text: VW.text },
    };
    const color = tones[tone] || tones.blue;

    return (
        <div className="rounded-[24px] border bg-white p-4 shadow-[0_12px_32px_rgba(0,30,80,0.06)]" style={{ borderColor: VW.line2 }}>
            <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: VW.muted }}>{label}</span>
                {Icon ? (
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: color.bg, color: color.text }}>
                        <Icon className="h-4 w-4" />
                    </span>
                ) : null}
            </div>
            <div className="mt-3 text-2xl font-semibold tabular-nums" style={{ color: color.text }}>{value}</div>
        </div>
    );
}

function AsesorBadge({ asesor }) {
    const text = normalizeStr(asesor);
    if (!text) return <span style={{ color: VW.faint }}>—</span>;
    const color = advisorColor(text);

    return (
        <span className="inline-flex max-w-[190px] items-center gap-2 rounded-full px-3 py-1 text-xs font-black" style={{ background: color.bg, color: color.text }} title={text}>
            <span className="h-2 w-2 rounded-full" style={{ background: color.dot }} />
            <span className="truncate">{text}</span>
        </span>
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
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: value ? VW.okSoft : VW.dangerSoft, color: value ? VW.ok : VW.danger }}
        >
            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {value ? "Sí" : "No"}
        </button>
    );
}

function ServiceBadge({ value }) {
    if (!value) return <span style={{ color: VW.faint }}>—</span>;
    const first = String(value).split(",")[0]?.trim() || value;
    const meta = servicioMeta(first);

    return (
        <span className="inline-flex max-w-[210px] items-center rounded-full px-3 py-1 text-xs font-black" style={{ background: meta.bg, color: meta.text }} title={value}>
            <span className="truncate">{meta.label}</span>
        </span>
    );
}

function Field({ label, icon: Icon, required, children, className = "" }) {
    return (
        <label className={cn("block", className)}>
            <span className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]" style={{ color: VW.text }}>
                {Icon ? <Icon className="h-3.5 w-3.5" style={{ color: VW.blue }} /> : null}
                {label}
                {required ? <span style={{ color: VW.danger }}>*</span> : null}
            </span>
            {children}
        </label>
    );
}

function SectionTitle({ children, icon: Icon }) {
    return (
        <div className="col-span-full mt-3 flex items-center gap-3 border-b pb-3 first:mt-0" style={{ borderColor: VW.line2 }}>
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl" style={{ background: "#EAF1FF", color: VW.blue }}>
                {Icon ? <Icon className="h-4 w-4" /> : null}
            </span>
            <span className="text-sm font-black uppercase tracking-[0.22em]" style={{ color: VW.blue }}>{children}</span>
        </div>
    );
}

function Modal({ open, title, subtitle, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            <button type="button" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
                    <div className="border-b px-6 py-5" style={{ borderColor: VW.line2 }}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <BrandMark />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: VW.blue }}>Volkswagen Service</p>
                                        <h3 className="truncate text-2xl font-semibold tracking-tight" style={{ color: VW.ink }}>{title}</h3>
                                    </div>
                                </div>
                                {subtitle ? <p className="mt-3 text-sm" style={{ color: VW.muted }}>{subtitle}</p> : null}
                            </div>
                            <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white" style={{ borderColor: VW.line }}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5" style={{ background: VW.soft }}>{children}</div>

                    {footer ? (
                        <div className="flex flex-col-reverse gap-2 border-t bg-white px-6 py-4 sm:flex-row sm:justify-end" style={{ borderColor: VW.line2 }}>
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
            <div className="w-52 overflow-hidden rounded-2xl border bg-white shadow-2xl" style={{ borderColor: VW.line2 }}>
                <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold hover:bg-red-50"
                    style={{ color: VW.danger }}
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar registro
                </button>
                <button
                    type="button"
                    className="w-full border-t px-4 py-2.5 text-left text-xs font-semibold"
                    style={{ borderColor: VW.line2, color: VW.muted }}
                    onClick={onClose}
                >
                    Cerrar menú
                </button>
            </div>
        </div>,
        document.body
    );
}

function SkeletonRow({ columns = 10 }) {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, index) => (
                <td key={index} className="px-4 py-4">
                    <div className="h-4 w-28 animate-pulse rounded-full" style={{ background: VW.line2 }} />
                </td>
            ))}
        </tr>
    );
}

function EmptyState({ loading }) {
    return (
        <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            {loading ? (
                <>
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: VW.blue }} />
                    <p className="mt-3 text-sm font-bold" style={{ color: VW.text }}>Cargando registros...</p>
                </>
            ) : (
                <>
                    <ClipboardList className="h-10 w-10" style={{ color: VW.faint }} />
                    <p className="mt-3 text-sm font-bold" style={{ color: VW.text }}>No hay registros con los filtros seleccionados.</p>
                    <p className="mt-1 text-sm" style={{ color: VW.muted }}>Ajusta la búsqueda o cambia el rango de fechas.</p>
                </>
            )}
        </div>
    );
}

export default function HojaRegistros() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN") || permisos.includes("CRM_DIGITALES");
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
    const [selectedDate, setSelectedDate] = useState(localDateKey());
    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState(userAgencia || "VW Cordoba");

    const inputClass = "h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60";
    const textareaClass = "min-h-[96px] w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium outline-none transition focus:ring-4";
    const inputStyle = (invalid = false) => ({
        borderColor: invalid ? VW.danger : VW.line,
        color: VW.ink,
        "--tw-ring-color": invalid ? "rgba(200,58,58,0.14)" : "rgba(0,176,240,0.16)",
    });

    const columns = [
        { key: "fecha_ingreso", label: "Fecha ingreso", sortable: true },
        { key: "cliente", label: "Cliente", sortable: true },
        { key: "asistencia", label: "Asistencia" },
        { key: "asesor", label: "Asesor", sortable: true },
        { key: "pauta", label: "Campaña" },
        { key: "citado", label: "Citado" },
        { key: "torre", label: "Torre" },
        { key: "tipo_cita", label: "Servicio" },
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
    }, [rows, isAdmin, userAgencias]);

    const availableAsesores = useMemo(() => {
        if (!draft) return [];
        const agenciaActual = isAdmin ? normalizeStr(draft.agencia) : normalizeStr(userAgencia);
        return getAsesoresPorAgencia(agenciaActual, isAdmin);
    }, [draft, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = normalizeKey(filters.q);
        const desdeInt = ymdToInt(filters.desde);
        const hastaInt = ymdToInt(filters.hasta);

        return (rows || []).filter((row) => {
            if (!isAdmin && userAgencias.length > 0) {
                if (!userAgencias.some((ua) => normalizeStr(ua) === normalizeStr(row.agencia))) return false;
            }

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(row.agencia) === normalizeStr(filters.agencia);
            let matchFecha = true;

            if (desdeInt !== null || hastaInt !== null) {
                const actualInt = ymdToInt(row.fecha_ingreso ? localDateKey(row.fecha_ingreso) : "");
                if (!actualInt) return false;
                if (desdeInt !== null && actualInt < desdeInt) matchFecha = false;
                if (hastaInt !== null && actualInt > hastaInt) matchFecha = false;
            }

            const values = [
                row.agencia,
                row.no_orden,
                getClienteNombre(row),
                getTelefono(row),
                getCorreo(row),
                row.diss,
                row.pauta,
                row.torre,
                row.asesor,
                row.tipo_cita,
                row.vin,
                row.medio_concertacion,
            ];

            const matchQ = !q || values.some((value) => normalizeKey(value).includes(q));
            return matchAgencia && matchFecha && matchQ;
        });
    }, [rows, filters, isAdmin, userAgencias]);

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
                const va = normalizeKey(getClienteNombre(a));
                const vb = normalizeKey(getClienteNombre(b));
                if (va < vb) return -1 * mult;
                if (va > vb) return 1 * mult;
                return 0;
            }
            const va = normalizeKey(a?.[key]);
            const vb = normalizeKey(b?.[key]);
            if (va < vb) return -1 * mult;
            if (va > vb) return 1 * mult;
            return 0;
        });
    }, [filtered, sort]);

    const metrics = useMemo(() => {
        const hoy = localDateKey();
        const rowsHoy = rows.filter((row) => localDateKey(row.fecha_ingreso) === hoy);
        const citados = filtered.filter((row) => boolFromAny(row.citado)).length;
        const asistencia = filtered.filter((row) => boolFromAny(row.asistencia)).length;
        const venta = filtered.reduce((acc, row) => acc + Number(row.venta_mano_obra || 0), 0);
        return { total: filtered.length, hoy: rowsHoy.length, citados, asistencia, venta };
    }, [rows, filtered]);

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
        const hoy = localDateKey();
        setFilters((prev) => ({ ...prev, desde: hoy, hasta: hoy }));
    }

    function setSemana() {
        const hoy = localDateKey();
        setFilters((prev) => ({ ...prev, desde: addDaysToYMD(hoy, -7), hasta: hoy }));
    }

    function onRowContextMenu(event, row) {
        event.preventDefault();
        event.stopPropagation();
        setCtxMenu({ open: true, x: event.clientX, y: event.clientY, row });
    }

    function abrirNuevo() {
        setTouchedSave(false);
        setMode("create");
        const nextDraft = crearDraftBase(userAgencia, isAdmin);

        if (viewMode === "agenda") {
            nextDraft.agencia = isAdmin ? agenciaSeleccionada : userAgencia;
            nextDraft.fecha_ingreso = `${selectedDate}T08:00`;
        } else {
            nextDraft.fecha_ingreso = localDateTimeInput();
        }

        setDraft(nextDraft);
        setOpenModal(true);
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
                cliente_nombre: data.nombre_cliente || data?.cliente?.nombre || "",
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

    async function handleSaveCita(cita) {
        try {
            setSaving(true);

            const payload = {
                ...cita,
                cliente_nombre: cita.cliente_nombre || "",
                cliente_telefono: normalizeStr(cita.cliente_telefono),
                cliente_correo_electronico: cita.cliente_correo_electronico || "",
                agencia: cita.agencia || agenciaSeleccionada,
                fecha_ingreso: fromDTLocalToISO(cita.fecha_ingreso),
                asistencia: !!cita.asistencia,
                citado: !!cita.citado,
                no_orden: cita.no_orden || "",
                diss: cita.diss || "",
                pauta: cita.pauta || "",
                torre: cita.torre || "",
                asesor: cita.asesor || "",
                agendado_por: cita.agendado_por || "",
                tipo_cita: Array.isArray(cita.tipo_cita) ? cita.tipo_cita.join(", ") : cita.tipo_cita || "",
                comentarios: cita.comentarios || "",
                vin: cita.vin || "",
                anio_vehiculo: cita.anio_vehiculo || "",
                modelo: cita.modelo || "",
                medio_concertacion: cita.medio_concertacion || "",
                pauta_origen: cita.pauta_origen || "",
                venta_mano_obra: cita.venta_mano_obra === "" ? "0" : cita.venta_mano_obra,
            };

            if (cita.id) await apiHojaIngresos.update(cita.id, payload);
            else await apiHojaIngresos.create(payload);

            await refreshList();
        } catch (error) {
            console.error(error);
            alert("No se pudo guardar la cita: " + error.message);
        } finally {
            setSaving(false);
        }
    }

    const tipoCitaList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

    return (
        <div className="min-h-screen w-full" style={{ background: VW.soft, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
            <div className="mx-auto w-full max-w-[1800px] px-3 py-4 sm:px-5 lg:px-6">
                <section className="mb-5 overflow-hidden rounded-[32px] border bg-white shadow-[0_18px_60px_rgba(0,30,80,0.08)]" style={{ borderColor: VW.line2 }}>
                    <div className="grid gap-5 p-5 xl:grid-cols-[1fr_auto] xl:items-center">
                        <div className="flex min-w-0 items-start gap-4">
                            <BrandMark />
                            <div className="min-w-0">
                                <p className="text-[11px] font-black uppercase tracking-[0.30em]" style={{ color: VW.blue }}>
                                    Volkswagen Aftersales CRM
                                </p>
                                <h1 className="mt-1 text-3xl font-semibold tracking-tight" style={{ color: VW.ink }}>
                                    Recepción de servicio
                                </h1>
                                <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: VW.muted }}>
                                    Control operativo de citas, asistencia, asesores y hoja de ingresos con una estética sobria alineada a una operación institucional Volkswagen.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <div className="flex overflow-hidden rounded-full border bg-white p-1" style={{ borderColor: VW.line }}>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("agenda")}
                                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition"
                                    style={viewMode === "agenda" ? { background: VW.blue, color: "#fff" } : { color: VW.text }}
                                >
                                    <LayoutGrid className="h-4 w-4" /> Agenda
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("tabla")}
                                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-black transition"
                                    style={viewMode === "tabla" ? { background: VW.blue, color: "#fff" } : { color: VW.text }}
                                >
                                    <Table2 className="h-4 w-4" /> Hoja
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={refreshList}
                                disabled={loadingList}
                                className="inline-flex h-11 items-center gap-2 rounded-full border bg-white px-4 text-sm font-black disabled:opacity-60"
                                style={{ borderColor: VW.line, color: VW.text }}
                            >
                                <RefreshCw className={cn("h-4 w-4", loadingList ? "animate-spin" : "")} />
                                Actualizar
                            </button>

                            <button
                                type="button"
                                onClick={abrirNuevo}
                                className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(0,30,80,0.24)]"
                                style={{ background: VW.blue }}
                            >
                                <Plus className="h-4 w-4" /> Nueva cita
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-3 border-t p-5 sm:grid-cols-2 xl:grid-cols-5" style={{ background: "#FBFCFE", borderColor: VW.line2 }}>
                        <MetricCard label="Registros filtrados" value={metrics.total} icon={ReceiptText} tone="blue" />
                        <MetricCard label="Ingresos de hoy" value={metrics.hoy} icon={CalendarDays} tone="gray" />
                        <MetricCard label="Citados" value={metrics.citados} icon={CheckCircle2} tone="green" />
                        <MetricCard label="Asistencias" value={metrics.asistencia} icon={UserRound} tone="amber" />
                        <MetricCard label="Mano de obra" value={money(metrics.venta)} icon={Wrench} tone="red" />
                    </div>
                </section>

                {viewMode === "agenda" ? (
                    <AgendaView
                        citas={rows}
                        agenciaSeleccionada={agenciaSeleccionada}
                        setAgenciaSeleccionada={setAgenciaSeleccionada}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        onSaveCita={handleSaveCita}
                        abrirEditar={abrirEditar}
                    />
                ) : (
                    <>
                        <section className="mb-4 overflow-hidden rounded-[28px] border bg-white shadow-[0_14px_40px_rgba(0,30,80,0.06)]" style={{ borderColor: VW.line2 }}>
                            <div className="grid gap-3 p-4 xl:grid-cols-[1fr_220px_360px]">
                                <div>
                                    <div className="mb-1.5 text-xs font-black uppercase tracking-[0.2em]" style={{ color: VW.muted }}>Búsqueda global</div>
                                    <div className="flex h-12 items-center gap-3 rounded-2xl border bg-white px-4" style={{ borderColor: VW.line }}>
                                        <Search className="h-4 w-4" style={{ color: VW.blue }} />
                                        <input
                                            value={filters.q}
                                            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                                            placeholder="Cliente, teléfono, VIN, asesor, orden, campaña..."
                                            className="w-full bg-transparent text-sm font-semibold outline-none"
                                            style={{ color: VW.ink }}
                                        />
                                        {filters.q ? (
                                            <button type="button" onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}>
                                                <X className="h-4 w-4" style={{ color: VW.faint }} />
                                            </button>
                                        ) : null}
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-1.5 text-xs font-black uppercase tracking-[0.2em]" style={{ color: VW.muted }}>Dealer</div>
                                    <select
                                        value={filters.agencia}
                                        onChange={(event) => setFilters((prev) => ({ ...prev, agencia: event.target.value }))}
                                        className="h-12 w-full rounded-2xl border bg-white px-4 text-sm font-black outline-none"
                                        style={{ borderColor: VW.line, color: VW.text }}
                                    >
                                        {dealers.map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1.5 text-xs font-black uppercase tracking-[0.2em]" style={{ color: VW.muted }}>Rango de fechas</div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="date"
                                            value={filters.desde}
                                            onChange={(event) => setFilters((prev) => ({ ...prev, desde: event.target.value }))}
                                            className="h-12 rounded-2xl border bg-white px-3 text-sm font-black outline-none"
                                            style={{ borderColor: VW.line, color: VW.text }}
                                        />
                                        <input
                                            type="date"
                                            value={filters.hasta}
                                            onChange={(event) => setFilters((prev) => ({ ...prev, hasta: event.target.value }))}
                                            className="h-12 rounded-2xl border bg-white px-3 text-sm font-black outline-none"
                                            style={{ borderColor: VW.line, color: VW.text }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3" style={{ borderColor: VW.line2, background: VW.soft }}>
                                <button type="button" onClick={setHoy} className="h-9 rounded-full px-4 text-xs font-black text-white" style={{ background: VW.blue }}>Hoy</button>
                                <button type="button" onClick={setSemana} className="h-9 rounded-full border bg-white px-4 text-xs font-black" style={{ borderColor: VW.line, color: VW.text }}>Últimos 7 días</button>
                                <button type="button" onClick={resetFilters} className="inline-flex h-9 items-center gap-2 rounded-full border bg-white px-4 text-xs font-black" style={{ borderColor: VW.line, color: VW.text }}>
                                    <X className="h-3.5 w-3.5" /> Limpiar
                                </button>
                            </div>
                        </section>

                        <section className="hidden overflow-hidden rounded-[28px] border bg-white shadow-[0_18px_50px_rgba(0,30,80,0.06)] lg:block" style={{ borderColor: VW.line2 }}>
                            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: VW.line2 }}>
                                <div>
                                    <h2 className="text-lg font-semibold" style={{ color: VW.ink }}>Hoja de ingresos</h2>
                                    <p className="mt-1 text-sm" style={{ color: VW.muted }}>{sorted.length} registro(s) encontrados</p>
                                </div>
                                <span className="rounded-full px-3 py-1 text-xs font-black" style={{ background: "#EAF1FF", color: VW.blue }}>
                                    Doble clic para editar · clic derecho para acciones
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-[1480px] w-full border-separate border-spacing-0 text-left text-sm">
                                    <thead>
                                        <tr style={{ background: VW.blue }}>
                                            {columns.map((column) => (
                                                <th key={column.key} className="whitespace-nowrap px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white/90">
                                                    {column.sortable ? (
                                                        <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-2">
                                                            {column.label}
                                                            {sort.key === column.key ? (sort.dir === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />) : <ArrowDownUp className="h-4 w-4 opacity-60" />}
                                                        </button>
                                                    ) : column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {loadingList ? (
                                            Array.from({ length: 8 }).map((_, index) => <SkeletonRow key={index} columns={columns.length} />)
                                        ) : sorted.length === 0 ? (
                                            <tr>
                                                <td colSpan={columns.length}><EmptyState /></td>
                                            </tr>
                                        ) : (
                                            sorted.map((row, index) => (
                                                <tr
                                                    key={row.id}
                                                    onDoubleClick={() => abrirEditar(row)}
                                                    onContextMenu={(event) => onRowContextMenu(event, row)}
                                                    className="cursor-pointer transition hover:bg-[#F4F7FB]"
                                                    style={{ background: index % 2 === 0 ? "#fff" : "#FBFCFE" }}
                                                >
                                                    <td className="whitespace-nowrap border-b px-4 py-4 font-semibold tabular-nums" style={{ borderColor: VW.line2, color: VW.text }}>{formatDateTime(row.fecha_ingreso)}</td>
                                                    <td className="border-b px-4 py-4" style={{ borderColor: VW.line2 }}>
                                                        <div className="font-black" style={{ color: VW.ink }}>{getClienteNombre(row)}</div>
                                                        <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: VW.muted }}>
                                                            <Phone className="h-3 w-3" /> {getTelefono(row)}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4" style={{ borderColor: VW.line2 }}><BooleanButton row={row} field="asistencia" updatingInline={updatingInline} onToggle={patchBoolean} /></td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4" style={{ borderColor: VW.line2 }}><AsesorBadge asesor={row.asesor} /></td>
                                                    <td className="max-w-[240px] border-b px-4 py-4" style={{ borderColor: VW.line2, color: VW.text }}><span className="line-clamp-2">{row.pauta || "—"}</span></td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4" style={{ borderColor: VW.line2 }}><BooleanButton row={row} field="citado" updatingInline={updatingInline} onToggle={patchBoolean} /></td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4 font-semibold" style={{ borderColor: VW.line2, color: VW.text }}>{row.torre || "—"}</td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4" style={{ borderColor: VW.line2 }}><ServiceBadge value={row.tipo_cita} /></td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4 font-semibold" style={{ borderColor: VW.line2, color: VW.text }}>{row.vin || "—"}</td>
                                                    <td className="whitespace-nowrap border-b px-4 py-4 font-semibold" style={{ borderColor: VW.line2, color: VW.text }}>{row.medio_concertacion || "—"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminar} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </section>

                        <section className="grid gap-3 lg:hidden">
                            {loadingList ? (
                                <div className="rounded-[26px] border bg-white p-6" style={{ borderColor: VW.line2 }}>
                                    <div className="flex items-center gap-2 font-bold" style={{ color: VW.blue }}>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
                                    </div>
                                </div>
                            ) : sorted.length === 0 ? (
                                <div className="rounded-[26px] border bg-white p-10 text-center" style={{ borderColor: VW.line2, color: VW.muted }}>
                                    No hay resultados con esos filtros.
                                </div>
                            ) : (
                                sorted.map((row) => (
                                    <button
                                        key={row.id}
                                        type="button"
                                        onClick={() => abrirEditar(row)}
                                        className="rounded-[26px] border bg-white p-4 text-left shadow-[0_12px_30px_rgba(0,30,80,0.06)]"
                                        style={{ borderColor: VW.line2 }}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="truncate text-base font-black" style={{ color: VW.ink }}>{getClienteNombre(row)}</div>
                                                <div className="mt-1 text-xs font-semibold" style={{ color: VW.muted }}>{row.agencia || "—"} · {getTelefono(row)}</div>
                                                <div className="mt-1 text-xs font-semibold tabular-nums" style={{ color: VW.muted }}>{formatDateTime(row.fecha_ingreso)}</div>
                                            </div>
                                            <BooleanButton row={row} field="citado" updatingInline={updatingInline} onToggle={patchBoolean} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <AsesorBadge asesor={row.asesor} />
                                            <ServiceBadge value={row.tipo_cita} />
                                        </div>
                                        <p className="mt-3 line-clamp-3 text-sm" style={{ color: VW.text }}>{row.comentarios || row.pauta || "Sin comentarios"}</p>
                                    </button>
                                ))
                            )}
                        </section>
                    </>
                )}
            </div>

            <Modal
                open={openModal}
                title={mode === "create" ? "Nueva cita / ingreso" : `Editar ingreso #${draft?.id}`}
                subtitle="Captura limpia para recepción de servicio. Los campos principales mantienen compatibilidad con tu backend actual."
                onClose={cerrarModal}
                footer={
                    <>
                        <button type="button" onClick={cerrarModal} disabled={saving} className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-black" style={{ borderColor: VW.line, color: VW.text }}>
                            Cancelar
                        </button>
                        <button type="button" onClick={guardar} disabled={saving || loadingDetail || !!telError} className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:opacity-60" style={{ background: VW.blue }}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="h-24 animate-pulse rounded-3xl bg-white" />
                        ))}
                    </div>
                ) : !draft ? null : (
                    <div className="grid gap-4 rounded-[28px] border bg-white p-5 md:grid-cols-3" style={{ borderColor: VW.line2 }}>
                        <SectionTitle icon={Building2}>Operación</SectionTitle>

                        <Field label="Dealer" icon={Building2} required>
                            <select
                                value={draft.agencia || ""}
                                onChange={(event) => setDraft((prev) => ({ ...prev, agencia: event.target.value, asesor: "" }))}
                                disabled={!isAdmin}
                                className={inputClass}
                                style={inputStyle(false)}
                            >
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias.length > 0 ? userAgencias : DEALERS).map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                            </select>
                        </Field>

                        <Field label="Fecha ingreso" icon={CalendarDays} required>
                            <input
                                type="datetime-local"
                                value={draft.fecha_ingreso}
                                onChange={(event) => setDraft((prev) => ({ ...prev, fecha_ingreso: event.target.value }))}
                                className={inputClass}
                                style={inputStyle(isInvalid("fecha_ingreso"))}
                            />
                            {isInvalid("fecha_ingreso") ? <p className="mt-1.5 text-xs font-bold" style={{ color: VW.danger }}>Fecha ingreso es requerida.</p> : null}
                        </Field>

                        <Field label="No. Preorden" icon={ClipboardList}>
                            <input value={draft.no_orden} onChange={(event) => setDraft((prev) => ({ ...prev, no_orden: event.target.value }))} className={inputClass} style={inputStyle(false)} placeholder="No. Preorden" />
                        </Field>

                        <Field label="DISS" icon={ReceiptText}>
                            <input value={draft.diss} onChange={(event) => setDraft((prev) => ({ ...prev, diss: event.target.value }))} className={inputClass} style={inputStyle(false)} />
                        </Field>

                        <Field label="Torre" icon={Building2}>
                            <input value={draft.torre} onChange={(event) => setDraft((prev) => ({ ...prev, torre: event.target.value }))} className={inputClass} style={inputStyle(false)} />
                        </Field>

                        <Field label="Asesor" icon={UserStar}>
                            <select value={draft.asesor || ""} onChange={(event) => setDraft((prev) => ({ ...prev, asesor: event.target.value }))} className={inputClass} style={inputStyle(false)}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {availableAsesores.length === 0 ? <option value="" disabled>Selecciona primero VW Cordoba o VW Orizaba...</option> : null}
                                {availableAsesores.map((asesor) => <option key={asesor} value={asesor}>{asesor}</option>)}
                            </select>
                            {draft.asesor ? <div className="mt-2"><AsesorBadge asesor={draft.asesor} /></div> : null}
                        </Field>

                        <Field label="Agendado por" icon={Clock3}>
                            <select value={draft.agendado_por || ""} onChange={(event) => setDraft((prev) => ({ ...prev, agendado_por: event.target.value }))} className={inputClass} style={inputStyle(false)}>
                                <option value="" disabled>Selecciona una opción...</option>
                                {AGENDADO.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </Field>

                        <Field label="Medio" icon={Search}>
                            <select value={draft.medio_concertacion || ""} onChange={(event) => setDraft((prev) => ({ ...prev, medio_concertacion: event.target.value }))} className={inputClass} style={inputStyle(false)}>
                                <option value="">Selecciona...</option>
                                {MEDIOS_CONCERTACION.map((medio) => <option key={medio} value={medio}>{medio}</option>)}
                            </select>
                        </Field>

                        <SectionTitle icon={UserRound}>Cliente</SectionTitle>

                        <Field label="Cliente" icon={UserRound}>
                            <input value={draft.cliente_nombre} onChange={(event) => setDraft((prev) => ({ ...prev, cliente_nombre: event.target.value }))} className={inputClass} style={inputStyle(false)} placeholder="Nombre completo" />
                        </Field>

                        <Field label="Teléfono" icon={Phone} required>
                            <input
                                maxLength={12}
                                value={draft.cliente_telefono}
                                onChange={(event) => setDraft((prev) => ({ ...prev, cliente_telefono: event.target.value.replace(/\D/g, "").slice(0, 12) }))}
                                disabled={telefonoBloqueado}
                                className={inputClass}
                                style={inputStyle(isInvalid("cliente_telefono") || !!telError)}
                                placeholder="10 dígitos"
                            />
                            {telefonoBloqueado ? <p className="mt-1.5 text-xs font-bold" style={{ color: VW.faint }}>Teléfono bloqueado después de capturarse.</p> : null}
                            {isInvalid("cliente_telefono") ? <p className="mt-1.5 text-xs font-bold" style={{ color: VW.danger }}>Teléfono es requerido.</p> : null}
                            {!isInvalid("cliente_telefono") && telError ? <p className="mt-1.5 text-xs font-bold" style={{ color: VW.danger }}>{telError}</p> : null}
                        </Field>

                        <Field label="Correo" icon={Mail}>
                            <input type="email" value={draft.cliente_correo_electronico} onChange={(event) => setDraft((prev) => ({ ...prev, cliente_correo_electronico: event.target.value }))} className={inputClass} style={inputStyle(false)} placeholder="correo@empresa.com" />
                        </Field>

                        <SectionTitle icon={CarFront}>Vehículo y servicio</SectionTitle>

                        <Field label="VIN" icon={CarFront}>
                            <input value={draft.vin} onChange={(event) => setDraft((prev) => ({ ...prev, vin: event.target.value }))} className={inputClass} style={inputStyle(false)} />
                        </Field>

                        <Field label="Año vehículo" icon={CarFront}>
                            <input value={draft.anio_vehiculo} onChange={(event) => setDraft((prev) => ({ ...prev, anio_vehiculo: event.target.value }))} className={inputClass} style={inputStyle(false)} />
                        </Field>

                        <Field label="Modelo" icon={CarFront}>
                            <select value={draft.modelo || ""} onChange={(event) => setDraft((prev) => ({ ...prev, modelo: event.target.value }))} className={inputClass} style={inputStyle(false)}>
                                <option value="">Selecciona...</option>
                                {MODELOS.map((modelo) => <option key={modelo} value={modelo}>{modelo}</option>)}
                            </select>
                        </Field>

                        <Field label="Tipo de servicio" icon={Wrench} className="md:col-span-2">
                            <div className="grid max-h-[188px] grid-cols-1 gap-2 overflow-y-auto rounded-3xl border bg-white p-3 sm:grid-cols-2" style={{ borderColor: VW.line }}>
                                {TIPOS_SERVICIO.map((tipo) => (
                                    <label key={tipo} className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition hover:bg-[#F4F7FB]" style={{ color: VW.text }}>
                                        <input
                                            type="checkbox"
                                            checked={(draft.tipo_cita || []).includes(tipo)}
                                            onChange={(event) => {
                                                let nuevosTipos = [...(draft.tipo_cita || [])];
                                                if (event.target.checked) nuevosTipos.push(tipo);
                                                else nuevosTipos = nuevosTipos.filter((item) => item !== tipo);
                                                setDraft((prev) => ({ ...prev, tipo_cita: nuevosTipos }));
                                            }}
                                            className="h-4 w-4"
                                            style={{ accentColor: VW.blue }}
                                        />
                                        {tipo}
                                    </label>
                                ))}
                            </div>
                            {tipoCitaList(draft.tipo_cita).length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {tipoCitaList(draft.tipo_cita).map((tipo) => {
                                        const meta = servicioMeta(tipo);
                                        return <span key={tipo} className="rounded-full px-3 py-1 text-xs font-black" style={{ background: meta.bg, color: meta.text }}>{tipo}</span>;
                                    })}
                                </div>
                            ) : null}
                        </Field>

                        <Field label="Venta mano de obra" icon={ReceiptText}>
                            <input type="number" min="0" step="0.01" value={draft.venta_mano_obra} onChange={(event) => setDraft((prev) => ({ ...prev, venta_mano_obra: event.target.value }))} className={inputClass} style={inputStyle(false)} />
                        </Field>

                        <SectionTitle icon={CheckCircle2}>Estado y seguimiento</SectionTitle>

                        <Field label="Citado" icon={CheckCircle2}>
                            <label className="flex h-11 items-center justify-between rounded-2xl border bg-white px-4 text-sm font-black" style={{ borderColor: VW.line, color: VW.text }}>
                                ¿Cliente citado?
                                <input type="checkbox" checked={!!draft.citado} onChange={(event) => setDraft((prev) => ({ ...prev, citado: event.target.checked }))} className="h-4 w-4" style={{ accentColor: VW.blue }} />
                            </label>
                        </Field>

                        <Field label="Asistencia" icon={CheckCircle2}>
                            <label className="flex h-11 items-center justify-between rounded-2xl border bg-white px-4 text-sm font-black" style={{ borderColor: VW.line, color: VW.text }}>
                                ¿Asistió?
                                <input type="checkbox" checked={!!draft.asistencia} onChange={(event) => setDraft((prev) => ({ ...prev, asistencia: event.target.checked }))} className="h-4 w-4" style={{ accentColor: VW.blue }} />
                            </label>
                        </Field>

                        <Field label="Campaña" icon={ReceiptText}>
                            <input value={draft.pauta} onChange={(event) => setDraft((prev) => ({ ...prev, pauta: event.target.value }))} className={inputClass} style={inputStyle(false)} />
                        </Field>

                        <Field label="Declaración textual" icon={ReceiptText} className="md:col-span-2">
                            <textarea value={draft.declaracion_textual_cliente} onChange={(event) => setDraft((prev) => ({ ...prev, declaracion_textual_cliente: event.target.value }))} className={textareaClass} style={inputStyle(false)} />
                        </Field>

                        <Field label="Comentarios" icon={ReceiptText} className="md:col-span-3">
                            <textarea value={draft.comentarios} onChange={(event) => setDraft((prev) => ({ ...prev, comentarios: event.target.value }))} className={textareaClass} style={inputStyle(false)} />
                        </Field>
                    </div>
                )}
            </Modal>
        </div>
    );
}
