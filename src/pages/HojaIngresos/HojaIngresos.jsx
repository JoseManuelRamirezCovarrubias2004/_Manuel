// src/pages/HojaIngresos/HojaRegistros.jsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    ArrowUpDown,
    Building2,
    CalendarCheck,
    CalendarDays,
    CarFront,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    Loader2,
    Mail,
    Phone,
    Plus,
    Save,
    Search,
    Trash2,
    User,
    UserCheck,
    UserStar,
    X,
    XCircle,
    MessageSquareText,
} from "lucide-react";

import { apiHojaIngresos } from "../../lib/apiHojaIngresos";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

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
    "VW Cordoba": [
        {
            nombre: "Yamil Tepole",
            className: "border-blue-300 bg-blue-100 text-blue-800",
            dotClassName: "bg-blue-600",
        },
        {
            nombre: "Iván Ramírez",
            className: "border-slate-300 bg-slate-100 text-slate-700",
            dotClassName: "bg-slate-500",
        },
        {
            nombre: "Verónica González",
            className: "border-emerald-300 bg-emerald-100 text-emerald-800",
            dotClassName: "bg-emerald-600",
        },
    ],
    "VW Orizaba": [
        {
            nombre: "Carlos Oliveros",
            className: "border-emerald-300 bg-emerald-100 text-emerald-800",
            dotClassName: "bg-emerald-600",
        },
        {
            nombre: "Norma Angélica Reyes",
            className: "border-yellow-300 bg-yellow-100 text-yellow-800",
            dotClassName: "bg-yellow-500",
        },
    ],
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
    "AMAROK GP",
    "BEETLE",
    "BORA A5",
    "CADDY",
    "CLASICO",
    "CRAFTER",
    "GOL",
    "GOL SEDAN",
    "GOLF",
    "JETTA",
    "JETTA A6",
    "JETTA A7",
    "PASSAT",
    "POLO",
    "SAVEIRO GP",
    "T CROSS",
    "TAOS",
    "TERAMONT",
    "TIGUAN",
    "TIGUAN LWB",
    "TRANSPORTER",
    "VENTO",
    "VIRTUS",
    "NIVUS",
    "TERA",
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

const AGENDADO = [
    "Asistente",
    "Call Center",
    "Asesor de Servicio",
];

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizeKey(value) {
    return normalizeStr(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function getDealerCanonical(agencia) {
    const key = normalizeKey(agencia);

    if (key.includes("cordoba")) return "VW Cordoba";
    if (key.includes("orizaba")) return "VW Orizaba";

    return normalizeStr(agencia);
}

function getAsesoresPorAgencia(agencia, incluirTodos = false) {
    const dealer = getDealerCanonical(agencia);

    if (incluirTodos && !dealer) {
        return Object.values(ASESORES_POR_DEALER).flat();
    }

    return ASESORES_POR_DEALER[dealer] || [];
}

function getAsesorConfig(asesor, agencia) {
    const asesorKey = normalizeKey(asesor);
    if (!asesorKey) return null;

    const dealer = getDealerCanonical(agencia);
    const asesoresDealer = ASESORES_POR_DEALER[dealer] || [];
    const matchDealer = asesoresDealer.find(
        (item) => normalizeKey(item.nombre) === asesorKey
    );

    if (matchDealer) return matchDealer;

    return Object.values(ASESORES_POR_DEALER)
        .flat()
        .find((item) => normalizeKey(item.nombre) === asesorKey) || null;
}

function AsesorBadge({ asesor, agencia }) {
    const text = normalizeStr(asesor);

    if (!text) {
        return <span className="text-[#131E5C]">—</span>;
    }

    const config = getAsesorConfig(text, agencia);

    if (!config) {
        return <span className="font-semibold text-[#131E5C]">{text}</span>;
    }

    return (
        <span
            className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold",
                config.className,
            ].join(" ")}
            title={config.nombre}
        >
            <span className={["h-2.5 w-2.5 rounded-full", config.dotClassName].join(" ")} />
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

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
        return text.slice(0, 16);
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDTLocalToISO(value) {
    const text = String(value || "").trim();
    return text || null;
}

function toYMD(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}`;
}

function ymdToInt(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return Number(value.replaceAll("-", ""));
}

function formatDate(value) {
    const local = toDTLocal(value);
    return local ? local.replace("T", " ") : "—";
}

function getClienteNombre(row) {
    return row?.nombre_cliente || row?.cliente?.nombre || "—";
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

        tipo_cita: "",
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

function SkeletonRow({ columns = 13 }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: columns }).map((_, index) => (
                <td key={index} className="px-4 py-3">
                    <div className="h-4 w-28 rounded bg-slate-200/70" />
                </td>
            ))}
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 12 }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-white/10 bg-neutral-200/50 p-4"
                >
                    <div className="h-4 w-32 rounded bg-black/10" />
                    <div className="mt-3 h-10 w-full rounded-lg bg-black/10" />
                </div>
            ))}
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
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
            <div
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-6xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="truncate text-base font-extrabold text-white">
                            {title}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
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
        <div
            className="fixed z-[9999]"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(ctxMenu.row)}
                >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>

                <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
                    onClick={onClose}
                >
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

function EmptyState({ loading }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-[#131E5C]">
            {loading ? (
                <>
                    <Loader2 className="mb-3 h-7 w-7 animate-spin" />
                    <p className="text-sm font-bold">Cargando hoja de ingresos...</p>
                </>
            ) : (
                <>
                    <ClipboardList className="mb-3 h-8 w-8" />
                    <p className="text-sm font-bold">
                        No hay registros con los filtros seleccionados.
                    </p>
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

        return (
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN") ||
            permisos.includes("CRM_DIGITALES")
        );
    }, [user]);

    const userAgencias = useMemo(() => {
        return String(user?.agencia || "")
            .split("|")
            .map((a) => a.trim())
            .filter(Boolean);
    }, [user?.agencia]);

    const userAgencia = userAgencias[0] || "";

    const [rows, setRows] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);

    const [ctxMenu, setCtxMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        row: null,
    });

    const [updatingInline, setUpdatingInline] = useState({});

    const [sort, setSort] = useState({
        key: "fecha_ingreso",
        dir: "desc",
    });

    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        desde: "",
        hasta: "",
    });

    const [touchedSave, setTouchedSave] = useState(false);

    const inputBase =
        "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none transition";
    const inputOk =
        "border-black/10 bg-neutral-100 focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10";
    const inputBad =
        "border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-100";

    const columns = [
        { key: "fecha_ingreso", label: "Fecha ingreso", sortable: true },
        { key: "cliente", label: "Cliente", sortable: true },
        { key: "asistencia", label: "Asistencia" },
        { key: "asesor", label: "Asesor", sortable: true },
        { key: "pauta", label: "Campaña" },
        { key: "citado", label: "Citado" },
        { key: "torre", label: "Torre" },
        { key: "tipo_cita", label: "Tipo de servicio" },
        { key: "vin", label: "VIN" },
        { key: "medio_concertacion", label: "Medio concertación" },
    ];

    const required = useMemo(
        () => ({
            cliente_telefono: "Teléfono",
            fecha_ingreso: "Fecha ingreso",
        }),
        []
    );

    const missing = useMemo(() => {
        if (!draft) return [];

        return Object.keys(required).filter((key) => {
            const value = draft[key];
            return value === null || value === undefined || String(value).trim() === "";
        });
    }, [draft, required]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => {
        return String(draft?.cliente_telefono || "").replace(/\D/g, "");
    }, [draft?.cliente_telefono]);

    const telIsOk = useMemo(() => {
        return /^(?:\d{10}|52\d{10})$/.test(telDigits);
    }, [telDigits]);

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
        if (telDigits.length === 12 && !telDigits.startsWith("52")) {
            return "Número inválido. Si tiene 12 dígitos debe iniciar con 52.";
        }
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

        const set = new Set(
            (rows || []).map((row) => normalizeStr(row.agencia)).filter(Boolean)
        );

        return ["Todos", ...DEALERS, ...Array.from(set)].filter(
            (value, index, array) => array.indexOf(value) === index
        );
    }, [rows, isAdmin, userAgencia]);

    const availableAsesores = useMemo(() => {
        if (!draft) return [];

        const agenciaActual = isAdmin
            ? normalizeStr(draft.agencia)
            : normalizeStr(userAgencia);

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

            const matchAgencia =
                filters.agencia === "Todos" ||
                normalizeStr(row.agencia) === normalizeStr(filters.agencia);

            let matchFecha = true;

            if (desdeInt !== null || hastaInt !== null) {
                const actualInt = ymdToInt(row.fecha_ingreso ? toYMD(row.fecha_ingreso) : "");

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

            const matchQ =
                !q || values.some((value) => normalizeStr(value).toLowerCase().includes(q));

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
        setFilters({
            q: "",
            agencia: "Todos",
            desde: "",
            hasta: "",
        });
    }

    function setHoy() {
        const hoy = toYMD(new Date());

        setFilters((prev) => ({
            ...prev,
            desde: hoy,
            hasta: hoy,
        }));
    }

    function onRowContextMenu(event, row) {
        event.preventDefault();
        event.stopPropagation();

        setCtxMenu({
            open: true,
            x: event.clientX,
            y: event.clientY,
            row,
        });
    }

    function abrirNuevo() {
        setTouchedSave(false);
        setMode("create");
        setDraft(crearDraftBase(userAgencia, isAdmin));
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
                cliente_correo_electronico:
                    data.correo_electronico || data?.cliente?.correo_electronico || "",

                tipo_cita: data.tipo_cita || "",
                declaracion_textual_cliente: data.declaracion_textual_cliente || "",
                comentarios: data.comentarios || "",

                vin: data.vin || "",
                anio_vehiculo: data.anio_vehiculo || "",
                modelo: data.modelo || "",
                medio_concertacion: data.medio_concertacion || "",
                pauta_origen: data.pauta_origen || "",
                venta_mano_obra:
                    data.venta_mano_obra === null || data.venta_mano_obra === undefined
                        ? ""
                        : String(data.venta_mano_obra),
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

            tipo_cita: draft.tipo_cita || "",
            declaracion_textual_cliente: draft.declaracion_textual_cliente || "",
            comentarios: draft.comentarios || "",

            vin: draft.vin || "",
            anio_vehiculo: draft.anio_vehiculo || "",
            modelo: draft.modelo || "",
            medio_concertacion: draft.medio_concertacion || "",
            pauta_origen: draft.pauta_origen || "",
            venta_mano_obra:
                draft.venta_mano_obra === "" || draft.venta_mano_obra === null
                    ? "0"
                    : draft.venta_mano_obra,
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

        setRows((prev) =>
            prev.map((item) => (item.id === row.id ? { ...item, [field]: next } : item))
        );

        setUpdatingInline((prev) => ({
            ...prev,
            [`${row.id}-${field}`]: true,
        }));

        try {
            await apiHojaIngresos.patch(row.id, { [field]: next });
        } catch (error) {
            console.error(error);

            setRows((prev) =>
                prev.map((item) =>
                    item.id === row.id ? { ...item, [field]: previous } : item
                )
            );

            alert(`No se pudo actualizar ${field}.`);
        } finally {
            setUpdatingInline((prev) => {
                const copy = { ...prev };
                delete copy[`${row.id}-${field}`];
                return copy;
            });
        }
    }

    function BooleanButton({ row, field }) {
        const isUpdating = !!updatingInline[`${row.id}-${field}`];
        const value = boolFromAny(row[field]);

        return (
            <button
                type="button"
                disabled={isUpdating}
                onClick={(event) => {
                    event.stopPropagation();
                    patchBoolean(row, field);
                }}
                className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold",
                    value
                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                        : "border-red-300 bg-red-100 text-red-700",
                    isUpdating ? "cursor-not-allowed opacity-60" : "hover:opacity-80",
                ].join(" ")}
            >
                {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : value ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                    <XCircle className="h-3.5 w-3.5" />
                )}

                {value ? "Sí" : "No"}
            </button>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-[#131E5C]">
                        Hoja de ingresos
                    </h2>
                    <p className="text-sm text-slate-400">
                        Doble clic para editar. Clic derecho para eliminar.
                    </p>

                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}
                            <span className="text-[#131E5C]">{userAgencias.join(", ")}</span>
                        </p>
                    ) : null}
                </div>

                <button
                    type="button"
                    onClick={abrirNuevo}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/90"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo ingreso
                </button>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-6">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />

                                <input
                                    value={filters.q}
                                    onChange={(event) =>
                                        setFilters((prev) => ({ ...prev, q: event.target.value }))
                                    }
                                    placeholder="Buscar cliente, teléfono, VIN, asesor, orden..."
                                    className="w-full text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                />

                                {filters.q ? (
                                    <button
                                        type="button"
                                        onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
                                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Dealer">
                            <select
                                value={filters.agencia}
                                onChange={(event) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        agencia: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            >
                                {dealers.map((dealer) => (
                                    <option key={dealer} value={dealer}>
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-3">
                        <FilterBlock label="Acciones">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={setHoy}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                    Hoy
                                </button>

                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar
                                </button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Desde">
                            <input
                                type="date"
                                value={filters.desde}
                                onChange={(event) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        desde: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input
                                type="date"
                                value={filters.hasta}
                                onChange={(event) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        hasta: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            <div className="hidden rounded-lg bg-white shadow-lg lg:block">
                <div className="w-full overflow-x-auto">
                    <table className="min-w-[1700px] text-left text-sm rounded-lg ">
                        <thead className="sticky top-0 z-10 bg-[#131E5C] rounded-lg text-xs text-white">
                            <tr>
                                {columns.map((column) => (
                                    <th key={column.key} className="whitespace-nowrap px-4 py-3">
                                        {column.sortable ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleSort(column.key)}
                                                className="inline-flex items-center gap-1 font-bold"
                                            >
                                                {column.label}
                                                {sort.key === column.key ? (
                                                    sort.dir === "asc" ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-4 w-4 opacity-60" />
                                                )}
                                            </button>
                                        ) : (
                                            <span className="font-bold">{column.label}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-black/10">
                            {loadingList ? (
                                Array.from({ length: 8 }).map((_, index) => (
                                    <SkeletonRow key={index} columns={columns.length} />
                                ))
                            ) : sorted.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length}>
                                        <EmptyState />
                                    </td>
                                </tr>
                            ) : (
                                sorted.map((row, index) => (
                                    <tr
                                        key={row.id}
                                        onDoubleClick={() => abrirEditar(row)}
                                        onContextMenu={(event) => onRowContextMenu(event, row)}
                                        title="Doble clic para editar"
                                        className={[
                                            "cursor-pointer",
                                            index % 2 === 0
                                                ? "bg-white hover:bg-blue-50/40"
                                                : "bg-slate-50/60 hover:bg-blue-50/40",
                                        ].join(" ")}
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                            {formatDate(row.fecha_ingreso)}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <div className="font-bold text-[#131E5C]">
                                                {getClienteNombre(row)}
                                            </div>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <BooleanButton row={row} field="asistencia" />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <AsesorBadge asesor={row.asesor} agencia={row.agencia} />
                                        </td>


                                        <td className="max-w-[260px] px-4 py-3 text-[#131E5C]">
                                            <span className="line-clamp-2">{row.pauta || "—"}</span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            <BooleanButton row={row} field="citado" />
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                            {row.torre || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                            {row.tipo_cita || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                            {row.vin || "—"}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                            {row.medio_concertacion || "—"}
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <ContextMenu
                        ctxMenu={ctxMenu}
                        onDelete={eliminar}
                        onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })}
                    />
                </div>
            </div>

            <div className="grid gap-3 lg:hidden">
                {loadingList ? (
                    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-[#131E5C]">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Cargando...
                        </div>
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">
                        No hay resultados con esos filtros.
                    </div>
                ) : (
                    sorted.map((row) => (
                        <button
                            key={row.id}
                            type="button"
                            onClick={() => abrirEditar(row)}
                            className="rounded-3xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-slate-50"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                        {getClienteNombre(row)}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-600">
                                        {row.agencia || "—"} • {getTelefono(row)}
                                    </div>

                                    <div className="mt-1 text-xs text-slate-600">
                                        {formatDate(row.fecha_ingreso)}
                                    </div>

                                    <div className="mt-2">
                                        <AsesorBadge asesor={row.asesor} agencia={row.agencia} />
                                    </div>
                                </div>

                                <span
                                    className={[
                                        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
                                        boolFromAny(row.citado)
                                            ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                                            : "border-red-300 bg-red-100 text-red-700",
                                    ].join(" ")}
                                >
                                    Citado: {boolFromAny(row.citado) ? "Sí" : "No"}
                                </span>
                            </div>

                            <div className="mt-3 text-sm text-slate-700 line-clamp-3">
                                {row.comentarios || row.pauta || "—"}
                            </div>

                            <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                        </button>
                    ))
                )}
            </div>

            <Modal
                open={openModal}
                title={mode === "create" ? "Nuevo ingreso" : `Editar ingreso #${draft?.id}`}
                onClose={cerrarModal}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={cerrarModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={guardar}
                            disabled={saving || loadingDetail || !!telError}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C]/90 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </>
                }
            >
                {loadingDetail ? (
                    <ModalSkeleton />
                ) : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        agencia: event.target.value,
                                        asesor: "",
                                    }))
                                }
                                disabled={!isAdmin}
                                className={[
                                    inputBase,
                                    inputOk,
                                    !isAdmin ? "cursor-not-allowed opacity-75" : "",
                                ].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un dealer...
                                </option>

                                {(isAdmin ? DEALERS : userAgencias.length > 0 ? userAgencias : DEALERS).map(
                                    (dealer) => (
                                        <option key={dealer} value={dealer}>
                                            {dealer}
                                        </option>
                                    )
                                )}
                            </select>
                        </Field>

                        <Field label="Fecha ingreso" icon={CalendarDays}>
                            <input
                                type="datetime-local"
                                value={draft.fecha_ingreso}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        fecha_ingreso: event.target.value,
                                    }))
                                }
                                className={[
                                    inputBase,
                                    isInvalid("fecha_ingreso") ? inputBad : inputOk,
                                ].join(" ")}
                            />

                            {isInvalid("fecha_ingreso") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">
                                    Fecha ingreso es requerida.
                                </div>
                            ) : null}
                        </Field>

                        <Field label="No. Preorden" icon={ClipboardList}>
                            <input
                                value={draft.no_orden}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, no_orden: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="No. Preorden"
                            />
                        </Field>

                        <Field label="Cliente" icon={User}>
                            <input
                                value={draft.cliente_nombre}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        cliente_nombre: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="Nombre completo"
                            />
                        </Field>

                        <Field label="Teléfono" icon={Phone}>
                            <input
                                maxLength={12}
                                value={draft.cliente_telefono}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        cliente_telefono: event.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 12),
                                    }))
                                }
                                disabled={telefonoBloqueado}
                                className={[
                                    inputBase,
                                    isInvalid("cliente_telefono") || telError ? inputBad : inputOk,
                                    telefonoBloqueado ? "cursor-not-allowed opacity-75" : "",
                                ].join(" ")}
                                placeholder="10 dígitos"
                            />

                            {telefonoBloqueado ? (
                                <div className="mt-2 text-xs font-bold text-slate-500">
                                    Teléfono bloqueado después de capturarse.
                                </div>
                            ) : null}

                            {isInvalid("cliente_telefono") ? (
                                <div className="mt-2 text-xs font-bold text-red-600">
                                    Teléfono es requerido.
                                </div>
                            ) : null}

                            {!isInvalid("cliente_telefono") && telError ? (
                                <div className="mt-2 text-xs font-bold text-red-600">
                                    {telError}
                                </div>
                            ) : null}
                        </Field>

                        <Field label="Correo electrónico" icon={Mail}>
                            <input
                                type="email"
                                value={draft.cliente_correo_electronico}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        cliente_correo_electronico: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                                placeholder="correo@empresa.com"
                            />
                        </Field>

                        <Field label="DISS" icon={ClipboardList}>
                            <input
                                value={draft.diss}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, diss: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Torre" icon={Building2}>
                            <input
                                value={draft.torre}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, torre: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Asesor" icon={UserStar}>
                            <select
                                value={draft.asesor || ""}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, asesor: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un asesor...
                                </option>

                                {availableAsesores.length === 0 ? (
                                    <option value="" disabled>
                                        Selecciona primero VW Cordoba o VW Orizaba...
                                    </option>
                                ) : null}

                                {availableAsesores.map((asesor) => (
                                    <option key={asesor.nombre} value={asesor.nombre}>
                                        {asesor.nombre}
                                    </option>
                                ))}
                            </select>

                            {draft.asesor ? (
                                <div className="mt-3">
                                    <AsesorBadge asesor={draft.asesor} agencia={draft.agencia} />
                                </div>
                            ) : null}
                        </Field>

                        <Field label="Agendado Por" icon={CalendarCheck}>
                            <select
                                value={draft.agendado_por || ""}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, agendado_por: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>Selecciona una opción...</option>
                                {AGENDADO.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Tipo de servicio" icon={ClipboardList}>
                            <select
                                value={draft.tipo_cita || ""}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, tipo_cita: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Selecciona...</option>

                                {TIPOS_SERVICIO.map((tipo) => (
                                    <option key={tipo} value={tipo}>
                                        {tipo}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="VIN" icon={CarFront}>
                            <input
                                value={draft.vin}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, vin: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Año vehículo" icon={CarFront}>
                            <input
                                value={draft.anio_vehiculo}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        anio_vehiculo: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Modelo" icon={CarFront}>
                            <select
                                value={draft.modelo || ""}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, modelo: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Selecciona...</option>

                                {MODELOS.map((tipo) => (
                                    <option key={tipo} value={tipo}>
                                        {tipo}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Medio concertación" icon={UserCheck}>
                            <select
                                value={draft.medio_concertacion || ""}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        medio_concertacion: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Selecciona...</option>

                                {MEDIOS_CONCERTACION.map((medio) => (
                                    <option key={medio} value={medio}>
                                        {medio}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Venta mano de obra" icon={ClipboardList}>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.venta_mano_obra}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        venta_mano_obra: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Citado" icon={UserCheck}>
                            <label className="flex items-center gap-3 text-sm font-semibold text-[#131E5C]">
                                <input
                                    type="checkbox"
                                    checked={!!draft.citado}
                                    onChange={(event) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            citado: event.target.checked,
                                        }))
                                    }
                                    className="h-4 w-4"
                                />
                                ¿Cliente citado?
                            </label>
                        </Field>

                        <Field label="Asistencia" icon={UserCheck}>
                            <label className="flex items-center gap-3 text-sm font-semibold text-[#131E5C]">
                                <input
                                    type="checkbox"
                                    checked={!!draft.asistencia}
                                    onChange={(event) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            asistencia: event.target.checked,
                                        }))
                                    }
                                    className="h-4 w-4"
                                />
                                ¿Asistió?
                            </label>
                        </Field>

                        <Field label="Campaña" icon={MessageSquareText}>
                            <input
                                value={draft.pauta}
                                onChange={(event) =>
                                    setDraft((prev) => ({ ...prev, pauta: event.target.value }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Declaración textual del cliente" icon={MessageSquareText}>
                                <textarea
                                    value={draft.declaracion_textual_cliente}
                                    onChange={(event) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            declaracion_textual_cliente: event.target.value,
                                        }))
                                    }
                                    className={[inputBase, inputOk, "min-h-[100px]"].join(" ")}
                                />
                            </Field>
                        </div>

                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea
                                    value={draft.comentarios}
                                    onChange={(event) =>
                                        setDraft((prev) => ({
                                            ...prev,
                                            comentarios: event.target.value,
                                        }))
                                    }
                                    className={[inputBase, inputOk, "min-h-[100px]"].join(" ")}
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}