// src/pages/Taller/Taller.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Plus,
    Search,
    X,
    Save,
    User,
    CarFront,
    CalendarDays,
    ClipboardList,
    Loader2,
    Phone,
    LayoutList,
    Building2,
    UserCog,
    Clock3,
    Columns3,
    Table2,
    Wrench,
    CheckCircle2,
    PauseCircle,
    ListChecks,
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

const TECNICOS = [
    "Técnico 1",
    "Técnico 2",
    "Técnico 3",
    "Técnico 4",
    "Técnico 5",
    "Técnico 6",
];

const TIPOS_SERVICIO = [
    "Mtto. 15 km",
    "Mtto. 30 km",
    "Mtto. 45 km",
    "Mtto. 60 km",
    "Mtto. 75 km",
    "Mtto. 90 km",
    "Diagnóstico",
    "Garantía",
    "Hojalatería y pintura",
    "Campaña",
    "Reclamación",
    "Otro",
];

const ETAPAS_PROCESO = [
    "Ingreso con Cita",
    "Ingreso Sin Cita",
    "En espera de trabajo",
    "Trabajo en Proceso",
    "En Control de Calidad",
    "En Lavado",
    "En Espera de Entrega",
];

const ETAPAS_WIP = [
    "En espera de Diagnóstico",
    "En espera de DISS",
    "En espera de autorización de presupuesto",
    "En espera de refacciones",
];

const ETAPAS_TERMINADO = ["Terminado"];
const TODAS_ETAPAS = [...ETAPAS_PROCESO, ...ETAPAS_WIP, ...ETAPAS_TERMINADO];
const STORAGE_KEY = "taller.ordenes.estado.v1";

function normalizeStr(value) {
    return String(value ?? "").trim();
}

function normalizeKey(value) {
    return normalizeStr(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
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
    return local ? local.replace("T", " ") : "—";
}

function getClienteNombre(row) {
    return (
        row?.cliente_nombre ||
        row?.cliente?.nombre ||
        row?.nombre_cliente ||
        "Sin nombre"
    );
}

function getTelefono(row) {
    return row?.telefono || row?.cliente?.telefono || "—";
}

function getCorreo(row) {
    return (
        row?.correo ||
        row?.correo_electronico ||
        row?.cliente?.correo ||
        row?.cliente?.correo_electronico ||
        ""
    );
}

function getDefaultEtapa(row) {
    if (row?.citado === true || String(row?.citado).toLowerCase() === "true") return "Ingreso con Cita";
    return "Ingreso Sin Cita";
}

function splitTrabajos(text) {
    const raw = normalizeStr(text);
    if (!raw) return ["Sin trabajo asignado"];

    return raw
        .split(/\s*(?:\+|,|;|\/|\by\b)\s*/i)
        .map((item) => normalizeStr(item))
        .filter(Boolean);
}

function getOrdenKey(row) {
    const noOrden = normalizeStr(row?.no_orden);
    if (noOrden) return `orden:${normalizeKey(noOrden)}`;

    const telefono = normalizeStr(getTelefono(row));
    const vin = normalizeStr(row?.vin);
    const cliente = normalizeStr(getClienteNombre(row));
    return `cliente:${normalizeKey(cliente)}|tel:${normalizeKey(telefono)}|vin:${normalizeKey(vin)}`;
}

function loadLocalState() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function saveLocalState(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value || {}));
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="truncate text-base font-extrabold text-white">{title}</div>
                        <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer ? <div className="flex flex-col gap-2 border-t border-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div> : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4">
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
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function Badge({ children, type = "normal" }) {
    const styles = {
        normal: "border-slate-200 bg-slate-50 text-slate-700",
        proceso: "border-blue-200 bg-blue-50 text-blue-700",
        wip: "border-amber-200 bg-amber-50 text-amber-700",
        done: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
    return <span className={["inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold", styles[type]].join(" ")}>{children}</span>;
}

function getEtapaType(etapa) {
    if (ETAPAS_WIP.includes(etapa)) return "wip";
    if (ETAPAS_TERMINADO.includes(etapa)) return "done";
    return "proceso";
}

function OrdenCard({ orden, onEdit, onDragStart }) {
    const etapaType = getEtapaType(orden.etapa);

    return (
        <div
            draggable
            onDragStart={(event) => onDragStart(event, orden.id)}
            onDoubleClick={() => onEdit(orden)}
            className="cursor-grab rounded-lg w-72 border border-black/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
            title="Arrastra para cambiar etapa. Doble clic para editar."
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-[#131E5C]">{orden.cliente}</div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-500">{orden.no_orden || "Sin preorden"} • {orden.agencia || "—"}</div>
                </div>
                <Badge type={etapaType}>{orden.subtrabajos.length} trab.</Badge>
            </div>

            <div className="mt-3 grid gap-1 text-xs text-slate-600">
                <div className="flex items-center gap-2"><CarFront className="h-3.5 w-3.5 text-[#131E5C]" /> <span className="truncate">{orden.modelo || orden.vin || "—"}</span><UserCog className="h-3.5 w-3.5 text-[#131E5C]" /> <span className="truncate">{orden.tecnico || "Sin técnico"}</span></div>
                <div className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-[#131E5C]" /> <span>{orden.horasTotales.toFixed(1)} h asignadas</span></div>
            </div>

            <div className="mt-3 space-y-1">
                {orden.subtrabajos.slice(0, 4).map((trabajo) => (
                    <div key={trabajo.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">
                        <span className="truncate">{trabajo.nombre}</span>
                        <span className="shrink-0 text-[#131E5C]">{Number(trabajo.horas || 0).toFixed(1)} h</span>
                    </div>
                ))}
                {orden.subtrabajos.length > 4 ? <div className="text-[11px] font-bold text-slate-400">+{orden.subtrabajos.length - 4} más</div> : null}
            </div>
        </div>
    );
}

function KanbanColumn({ title, ordenes, onDropOrden, onEdit, onDragStart }) {
    const [over, setOver] = useState(false);
    const etapaType = getEtapaType(title);

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
                event.preventDefault();
                setOver(false);
                const ordenId = event.dataTransfer.getData("text/plain");
                onDropOrden(ordenId, title);
            }}
            className={["flex min-h-[360px] w-[310px] shrink-0 flex-col rounded-2xl border bg-slate-50/80", over ? "border-[#131E5C] ring-2 ring-[#131E5C]/15" : "border-black/10"].join(" ")}
        >
            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-black/10 bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-[#131E5C]">{title}</div>
                        <div className="text-[11px] font-semibold text-slate-400">{ordenes.length} ordenes</div>
                    </div>
                    <Badge type={etapaType}>{etapaType.toUpperCase()}</Badge>
                </div>
            </div>

            <div className="grid gap-3 p-3">
                {ordenes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs font-bold text-slate-400">Arrastra una orden aquí</div>
                ) : (
                    ordenes.map((orden) => <OrdenCard key={orden.id} orden={orden} onEdit={onEdit} onDragStart={onDragStart} />)
                )}
            </div>
        </div>
    );
}

export default function Taller() {
    const { user } = useAuth();

    const permisos = user?.permisos || [];
    const rol = normalizeKey(user?.rol);
    const isAdmin = useMemo(() => rol === "administrador" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN") || permisos.includes("CRM_DIGITALES"), [rol, permisos]);

    const userAgencias = useMemo(() => String(user?.agencia || "").split("|").map(normalizeStr).filter(Boolean), [user?.agencia]);
    const userAgencia = userAgencias[0] || "";

    const [rows, setRows] = useState([]);
    const [localState, setLocalState] = useState(() => loadLocalState());
    const [loadingList, setLoadingList] = useState(false);
    const [vista, setVista] = useState("kanban");
    const [openModal, setOpenModal] = useState(false);
    const [editingOrden, setEditingOrden] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState({ q: "", agencia: "Todos", tecnico: "Todos", desde: "", hasta: "" });

    const inputBase = "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none transition";
    const inputOk = "border-black/10 bg-neutral-100 focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10";

    const refreshList = useCallback(async () => {
        setLoadingList(true);
        try {
            const data = await apiHojaIngresos.list();
            setRows(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setRows([]);
            alert("No se pudo cargar taller.");
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        refreshList();
    }, [refreshList]);

    useEffect(() => {
        saveLocalState(localState);
    }, [localState]);

    const userTieneAgencia = useCallback((agenciaRegistro) => {
        if (isAdmin) return true;
        if (userAgencias.length === 0) return true;
        const agencia = normalizeKey(agenciaRegistro);
        return userAgencias.some((ua) => normalizeKey(ua) === agencia);
    }, [isAdmin, userAgencias]);

    const ordenes = useMemo(() => {
        const map = new Map();

        for (const row of rows || []) {
            if (!userTieneAgencia(row.agencia)) continue;

            const key = getOrdenKey(row);
            const saved = localState[key] || {};
            const trabajos = Array.isArray(saved.subtrabajos) && saved.subtrabajos.length > 0
                ? saved.subtrabajos
                : splitTrabajos(row.tipo_cita || row.pauta).map((nombre, index) => ({
                    id: `${key}-${index}`,
                    nombre,
                    horas: 0,
                }));

            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    rowIds: [],
                    rows: [],
                    agencia: row.agencia || "",
                    no_orden: row.no_orden || "",
                    cliente: getClienteNombre(row),
                    telefono: getTelefono(row),
                    correo: getCorreo(row),
                    vin: row.vin || "",
                    modelo: row.modelo || "",
                    fecha_ingreso: row.fecha_ingreso,
                    etapa: saved.etapa || getDefaultEtapa(row),
                    tecnico: saved.tecnico || row.tecnico_asignado || "",
                    comentarios_taller: saved.comentarios_taller || "",
                    subtrabajos: [],
                });
            }

            const orden = map.get(key);
            orden.rowIds.push(row.id);
            orden.rows.push(row);
            orden.fecha_ingreso = orden.fecha_ingreso || row.fecha_ingreso;

            for (const trabajo of trabajos) {
                const tKey = normalizeKey(trabajo.nombre);
                const exists = orden.subtrabajos.some((item) => normalizeKey(item.nombre) === tKey);
                if (!exists) orden.subtrabajos.push({ ...trabajo, id: `${key}-${orden.subtrabajos.length}` });
            }
        }

        return Array.from(map.values()).map((orden) => ({
            ...orden,
            horasTotales: orden.subtrabajos.reduce((sum, item) => sum + Number(item.horas || 0), 0),
        }));
    }, [rows, localState, userTieneAgencia]);

    const dealers = useMemo(() => {
        if (!isAdmin && userAgencias.length > 0) return ["Todos", ...userAgencias];
        const set = new Set((rows || []).map((row) => normalizeStr(row.agencia)).filter(Boolean));
        return ["Todos", ...DEALERS, ...Array.from(set)].filter((value, index, array) => array.indexOf(value) === index);
    }, [rows, isAdmin, userAgencias]);

    const tecnicosFiltro = useMemo(() => {
        const set = new Set([...TECNICOS, ...ordenes.map((orden) => orden.tecnico)].map(normalizeStr).filter(Boolean));
        return ["Todos", ...Array.from(set)];
    }, [ordenes]);

    const filtered = useMemo(() => {
        const q = normalizeKey(filters.q);
        const desdeInt = ymdToInt(filters.desde);
        const hastaInt = ymdToInt(filters.hasta);

        return ordenes.filter((orden) => {
            const matchQ = !q || [orden.cliente, orden.telefono, orden.no_orden, orden.vin, orden.modelo, orden.tecnico, orden.etapa, ...orden.subtrabajos.map((t) => t.nombre)].some((value) => normalizeKey(value).includes(q));
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(orden.agencia) === normalizeStr(filters.agencia);
            const matchTecnico = filters.tecnico === "Todos" || normalizeStr(orden.tecnico) === normalizeStr(filters.tecnico);

            let matchFecha = true;
            if (desdeInt !== null || hastaInt !== null) {
                const actualInt = ymdToInt(orden.fecha_ingreso ? toYMD(orden.fecha_ingreso) : "");
                if (!actualInt) return false;
                if (desdeInt !== null && actualInt < desdeInt) matchFecha = false;
                if (hastaInt !== null && actualInt > hastaInt) matchFecha = false;
            }

            return matchQ && matchAgencia && matchTecnico && matchFecha;
        });
    }, [ordenes, filters]);

    const stats = useMemo(() => {
        const total = filtered.length;
        const proceso = filtered.filter((o) => ETAPAS_PROCESO.includes(o.etapa)).length;
        const wip = filtered.filter((o) => ETAPAS_WIP.includes(o.etapa)).length;
        const terminado = filtered.filter((o) => ETAPAS_TERMINADO.includes(o.etapa)).length;
        const horas = filtered.reduce((sum, o) => sum + o.horasTotales, 0);
        return { total, proceso, wip, terminado, horas };
    }, [filtered]);

    const ordenesPorEtapa = useMemo(() => {
        const grouped = {};
        for (const etapa of TODAS_ETAPAS) grouped[etapa] = [];
        for (const orden of filtered) {
            const etapa = TODAS_ETAPAS.includes(orden.etapa) ? orden.etapa : "Ingreso Sin Cita";
            grouped[etapa].push(orden);
        }
        return grouped;
    }, [filtered]);

    function patchLocalOrden(ordenId, patch) {
        setLocalState((prev) => ({
            ...prev,
            [ordenId]: {
                ...(prev[ordenId] || {}),
                ...patch,
            },
        }));
    }

    function onDragStart(event, ordenId) {
        event.dataTransfer.setData("text/plain", ordenId);
        event.dataTransfer.effectAllowed = "move";
    }

    function onDropOrden(ordenId, etapa) {
        if (!ordenId || !TODAS_ETAPAS.includes(etapa)) return;
        patchLocalOrden(ordenId, { etapa });
    }

    function openEdit(orden) {
        setEditingOrden(orden);
        setDraft({
            tecnico: orden.tecnico || "",
            etapa: orden.etapa || "Ingreso Sin Cita",
            comentarios_taller: orden.comentarios_taller || "",
            subtrabajos: orden.subtrabajos.map((item, index) => ({
                id: item.id || `${orden.id}-${index}`,
                nombre: item.nombre || "",
                horas: item.horas ?? 0,
            })),
        });
        setOpenModal(true);
    }

    function openCreateManual() {
        setEditingOrden(null);
        setDraft({
            agencia: isAdmin ? "" : userAgencia,
            no_orden: "",
            cliente: "",
            telefono: "",
            vin: "",
            modelo: "",
            tecnico: "",
            etapa: "Ingreso Sin Cita",
            comentarios_taller: "",
            subtrabajos: [{ id: `manual-${Date.now()}`, nombre: "", horas: 0 }],
        });
        setOpenModal(true);
    }

    function closeModal() {
        if (saving) return;
        setOpenModal(false);
        setEditingOrden(null);
        setDraft(null);
    }

    async function saveOrden() {
        if (!draft || saving) return;

        if (!normalizeStr(draft.tecnico)) {
            alert("Selecciona un técnico asignado.");
            return;
        }

        const subtrabajos = (draft.subtrabajos || [])
            .map((item, index) => ({
                id: item.id || `${editingOrden?.id || "manual"}-${index}`,
                nombre: normalizeStr(item.nombre),
                horas: Number(item.horas || 0),
            }))
            .filter((item) => item.nombre);

        if (subtrabajos.length === 0) {
            alert("Agrega por lo menos un subtrabajo.");
            return;
        }

        setSaving(true);
        try {
            if (editingOrden?.id) {
                patchLocalOrden(editingOrden.id, {
                    tecnico: draft.tecnico,
                    etapa: draft.etapa,
                    comentarios_taller: draft.comentarios_taller || "",
                    subtrabajos,
                });
            } else {
                const manualKey = `manual:${Date.now()}`;
                const manualRow = {
                    id: manualKey,
                    agencia: draft.agencia,
                    no_orden: draft.no_orden,
                    nombre_cliente: draft.cliente,
                    telefono: draft.telefono,
                    vin: draft.vin,
                    modelo: draft.modelo,
                    fecha_ingreso: new Date().toISOString(),
                    tipo_cita: subtrabajos.map((s) => s.nombre).join(" + "),
                };
                setRows((prev) => [manualRow, ...prev]);
                patchLocalOrden(getOrdenKey(manualRow), {
                    tecnico: draft.tecnico,
                    etapa: draft.etapa,
                    comentarios_taller: draft.comentarios_taller || "",
                    subtrabajos,
                });
            }

            closeModal();
        } finally {
            setSaving(false);
        }
    }

    function addSubtrabajo() {
        setDraft((prev) => ({
            ...prev,
            subtrabajos: [...(prev.subtrabajos || []), { id: `sub-${Date.now()}`, nombre: "", horas: 0 }],
        }));
    }

    function removeSubtrabajo(index) {
        setDraft((prev) => ({
            ...prev,
            subtrabajos: prev.subtrabajos.filter((_, i) => i !== index),
        }));
    }

    function updateSubtrabajo(index, patch) {
        setDraft((prev) => ({
            ...prev,
            subtrabajos: prev.subtrabajos.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        }));
    }

    function resetFilters() {
        setFilters({ q: "", agencia: "Todos", tecnico: "Todos", desde: "", hasta: "" });
    }

    function setHoy() {
        const hoy = toYMD(new Date());
        setFilters((prev) => ({ ...prev, desde: hoy, hasta: hoy }));
    }

    const ViewToggle = () => (
        <div className="flex overflow-hidden rounded-lg border border-[#131E5C]/30">
            {[
                { key: "kanban", label: "Kanban", Icon: Columns3 },
                { key: "lista", label: "Lista", Icon: Table2 },
            ].map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setVista(key)} className={["inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition", vista === key ? "bg-[#131E5C] text-white" : "bg-white text-[#131E5C] hover:bg-[#131E5C]/10"].join(" ")}>
                    <Icon className="h-3.5 w-3.5" /> {label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-[#131E5C]">Taller</h2>
                    <p className="text-sm text-slate-400">Ordenes agrupadas por cliente. Arrastra tarjetas para cambiar etapa.</p>
                    {!isAdmin && userAgencias.length > 0 ? <p className="mt-1 text-xs font-semibold text-slate-500">Agencia asignada: <span className="text-[#131E5C]">{userAgencias.join(", ")}</span></p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <ViewToggle />
                    <button onClick={openCreateManual} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/90">
                        <Plus className="h-4 w-4" /> Nueva orden
                    </button>
                </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"><div className="text-xs font-bold text-slate-400">Ordenes</div><div className="mt-1 text-2xl font-extrabold text-[#131E5C]">{stats.total}</div></div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm"><div className="text-xs font-bold text-blue-500">En proceso</div><div className="mt-1 text-2xl font-extrabold text-blue-700">{stats.proceso}</div></div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm"><div className="text-xs font-bold text-amber-600">WIP</div><div className="mt-1 text-2xl font-extrabold text-amber-700">{stats.wip}</div></div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm"><div className="text-xs font-bold text-emerald-600">Terminadas / horas</div><div className="mt-1 text-2xl font-extrabold text-emerald-700">{stats.terminado} / {stats.horas.toFixed(1)}h</div></div>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input value={filters.q} onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))} placeholder="Buscar cliente, teléfono, VIN, orden, trabajo..." className="w-full text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400" />
                                {filters.q ? <button onClick={() => setFilters((prev) => ({ ...prev, q: "" }))} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"><X className="h-4 w-4" /></button> : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Dealer">
                            <select value={filters.agencia} onChange={(event) => setFilters((prev) => ({ ...prev, agencia: event.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none">
                                {dealers.map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Técnico">
                            <select value={filters.tecnico} onChange={(event) => setFilters((prev) => ({ ...prev, tecnico: event.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none">
                                {tecnicosFiltro.map((tecnico) => <option key={tecnico} value={tecnico}>{tecnico}</option>)}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Desde">
                            <input type="date" value={filters.desde} onChange={(event) => setFilters((prev) => ({ ...prev, desde: event.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Hasta">
                            <input type="date" value={filters.hasta} onChange={(event) => setFilters((prev) => ({ ...prev, hasta: event.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none" />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-12">
                        <div className="flex flex-wrap gap-2">
                            <button onClick={setHoy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"><CalendarDays className="h-4 w-4" /> Hoy</button>
                            <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"><X className="h-4 w-4" /> Limpiar</button>
                        </div>
                    </div>
                </div>
            </div>

            {loadingList ? (
                <div className="rounded-xl border border-black/10 bg-white p-10 text-center text-[#131E5C]"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />Cargando taller...</div>
            ) : vista === "kanban" ? (
                <div className="space-y-5">
                    <section>
                        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#131E5C]"><Wrench className="h-4 w-4" /> En proceso</div>
                        <div className="flex gap-3 overflow-x-auto pb-3">
                            {ETAPAS_PROCESO.map((etapa) => <KanbanColumn key={etapa} title={etapa} ordenes={ordenesPorEtapa[etapa] || []} onDropOrden={onDropOrden} onEdit={openEdit} onDragStart={onDragStart} />)}
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-amber-700"><PauseCircle className="h-4 w-4" /> WIP / fuera de proceso</div>
                        <div className="flex gap-3 overflow-x-auto pb-3">
                            {ETAPAS_WIP.map((etapa) => <KanbanColumn key={etapa} title={etapa} ordenes={ordenesPorEtapa[etapa] || []} onDropOrden={onDropOrden} onEdit={openEdit} onDragStart={onDragStart} />)}
                        </div>
                    </section>

                    <section>
                        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Terminado</div>
                        <div className="flex gap-3 overflow-x-auto pb-3">
                            {ETAPAS_TERMINADO.map((etapa) => <KanbanColumn key={etapa} title={etapa} ordenes={ordenesPorEtapa[etapa] || []} onDropOrden={onDropOrden} onEdit={openEdit} onDragStart={onDragStart} />)}
                        </div>
                    </section>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1200px] text-left text-sm">
                            <thead className="bg-[#131E5C] text-xs text-white">
                                <tr>
                                    {['Fecha', 'Cliente', 'Orden', 'Dealer', 'Técnico', 'Etapa', 'Subtrabajos', 'Horas'].map((h) => <th key={h} className="px-4 py-3 font-bold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="px-4 py-10 text-center text-[#131E5C]">No hay ordenes con esos filtros.</td></tr>
                                ) : filtered.map((orden) => (
                                    <tr key={orden.id} onDoubleClick={() => openEdit(orden)} className="cursor-pointer hover:bg-blue-50/50">
                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">{formatDate(orden.fecha_ingreso)}</td>
                                        <td className="px-4 py-3"><div className="font-extrabold text-[#131E5C]">{orden.cliente}</div><div className="text-xs text-slate-500">{orden.telefono}</div></td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">{orden.no_orden || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">{orden.agencia || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">{orden.tecnico || 'Sin técnico'}</td>
                                        <td className="whitespace-nowrap px-4 py-3"><Badge type={getEtapaType(orden.etapa)}>{orden.etapa}</Badge></td>
                                        <td className="px-4 py-3 text-[#131E5C]">{orden.subtrabajos.map((t) => t.nombre).join(' + ')}</td>
                                        <td className="whitespace-nowrap px-4 py-3 font-extrabold text-[#131E5C]">{orden.horasTotales.toFixed(1)} h</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal open={openModal} title={editingOrden ? `Orden de trabajo • ${editingOrden.cliente}` : "Nueva orden manual"} onClose={closeModal} footer={
                <>
                    <button onClick={closeModal} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"><X className="h-4 w-4" /> Cancelar</button>
                    <button onClick={saveOrden} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C]/90 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</button>
                </>
            }>
                {!draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        {!editingOrden ? (
                            <>
                                <Field label="Dealer" icon={Building2}>
                                    <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin && userAgencias.length <= 1} className={[inputBase, inputOk].join(" ")}>
                                        <option value="" disabled>Selecciona...</option>
                                        {(isAdmin ? DEALERS : userAgencias).map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </Field>
                                <Field label="No. orden / preorden" icon={ClipboardList}><input value={draft.no_orden} onChange={(e) => setDraft((p) => ({ ...p, no_orden: e.target.value }))} className={[inputBase, inputOk].join(" ")} /></Field>
                                <Field label="Cliente" icon={User}><input value={draft.cliente} onChange={(e) => setDraft((p) => ({ ...p, cliente: e.target.value }))} className={[inputBase, inputOk].join(" ")} /></Field>
                                <Field label="Teléfono" icon={Phone}><input value={draft.telefono} onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "") }))} className={[inputBase, inputOk].join(" ")} /></Field>
                                <Field label="VIN" icon={CarFront}><input value={draft.vin} onChange={(e) => setDraft((p) => ({ ...p, vin: e.target.value }))} className={[inputBase, inputOk].join(" ")} /></Field>
                                <Field label="Modelo" icon={CarFront}><input value={draft.modelo} onChange={(e) => setDraft((p) => ({ ...p, modelo: e.target.value }))} className={[inputBase, inputOk].join(" ")} /></Field>
                            </>
                        ) : (
                            <div className="md:col-span-3 rounded-xl border border-black/10 bg-white p-4">
                                <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                                    <div><b className="text-[#131E5C]">Cliente:</b> {editingOrden.cliente}</div>
                                    <div><b className="text-[#131E5C]">Teléfono:</b> {editingOrden.telefono}</div>
                                    <div><b className="text-[#131E5C]">Orden:</b> {editingOrden.no_orden || '—'}</div>
                                    <div><b className="text-[#131E5C]">VIN:</b> {editingOrden.vin || '—'}</div>
                                </div>
                            </div>
                        )}

                        <Field label="Técnico asignado" icon={UserCog}>
                            <select value={draft.tecnico || ""} onChange={(e) => setDraft((p) => ({ ...p, tecnico: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un técnico...</option>
                                {TECNICOS.map((tecnico) => <option key={tecnico} value={tecnico}>{tecnico}</option>)}
                            </select>
                        </Field>

                        <Field label="Etapa de taller" icon={ListChecks}>
                            <select value={draft.etapa || "Ingreso Sin Cita"} onChange={(e) => setDraft((p) => ({ ...p, etapa: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <optgroup label="En proceso">{ETAPAS_PROCESO.map((etapa) => <option key={etapa} value={etapa}>{etapa}</option>)}</optgroup>
                                <optgroup label="WIP / fuera de proceso">{ETAPAS_WIP.map((etapa) => <option key={etapa} value={etapa}>{etapa}</option>)}</optgroup>
                                <optgroup label="Terminado">{ETAPAS_TERMINADO.map((etapa) => <option key={etapa} value={etapa}>{etapa}</option>)}</optgroup>
                            </select>
                        </Field>

                        <Field label="Comentarios taller" icon={ClipboardList}>
                            <textarea value={draft.comentarios_taller || ""} onChange={(e) => setDraft((p) => ({ ...p, comentarios_taller: e.target.value }))} className={[inputBase, inputOk, "min-h-[80px]"].join(" ")} />
                        </Field>

                        <div className="md:col-span-3 rounded-xl border border-black/10 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm font-extrabold text-[#131E5C]"><Wrench className="h-4 w-4" /> Subtrabajos y horas asignadas</div>
                                <button onClick={addSubtrabajo} className="inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#131E5C]/90"><Plus className="h-3.5 w-3.5" /> Agregar</button>
                            </div>

                            <div className="grid gap-2">
                                {(draft.subtrabajos || []).map((trabajo, index) => (
                                    <div key={trabajo.id || index} className="grid gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-12">
                                        <div className="md:col-span-7">
                                            <select value={trabajo.nombre || ""} onChange={(e) => updateSubtrabajo(index, { nombre: e.target.value })} className={[inputBase, inputOk].join(" ")}>
                                                <option value="">Selecciona trabajo...</option>
                                                {TIPOS_SERVICIO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-3">
                                            <input type="number" min="0" step="0.5" value={trabajo.horas ?? 0} onChange={(e) => updateSubtrabajo(index, { horas: e.target.value })} className={[inputBase, inputOk].join(" ")} placeholder="Horas" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <button onClick={() => removeSubtrabajo(index)} disabled={(draft.subtrabajos || []).length <= 1} className="inline-flex h-full w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
