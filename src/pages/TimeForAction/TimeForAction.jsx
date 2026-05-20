import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
    Plus, X, ChevronDown, ChevronRight, Paperclip,
    Trash2, Pencil, CheckCircle2, Clock3,
    Zap, Search, Calendar,
    LayoutGrid, Table2, GitBranch,
    ArrowUpDown, ChevronUp, Loader2, Save, UsersRound,
    AlertTriangle
} from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";

const BRAND_BLUE = "#131E5C";

const PRIORITIES = [
    { value: "LOW",    label: "Baja",    color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    { value: "MEDIUM", label: "Media",   color: "bg-sky-100 text-sky-700 border-sky-300" },
    { value: "HIGH",   label: "Alta",    color: "bg-amber-100 text-amber-700 border-amber-300" },
    { value: "URGENT", label: "Urgente", color: "bg-rose-100 text-rose-700 border-rose-300" },
];

const STATUS_COLS = ["Por hacer", "En proceso", "Hecho"];

const STATUS_COLORS = {
    "Por hacer":  { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-300",   dot: "bg-slate-400",   bar: "#94a3b8" },
    "En proceso": { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-300",   dot: "bg-amber-500",   bar: "#f59e0b" },
    "Hecho":      { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500", bar: "#10b981" },
};

const PRIORITY_COLORS = {
    "LOW":    "#10b981",
    "MEDIUM": "#0ea5e9",
    "HIGH":   "#f59e0b",
    "URGENT": "#ef4444",
};

const opcionesRaiz = {
    "Gestion de Clientes": [
        "Respuestas lentas a las quejas","Falta de seguimiento postventa",
        "Encuestas de satisfacción poco frecuentes o inexistentes",
        "Mala gestión de la experiencia del cliente en el showroom",
        "Falta de personal dedicado a la atención al cliente",
        "Tiempos de espera prolongados para servicios de mantenimiento",
        "Falta de comunicación proactiva con los clientes","Carencia de programas de fidelización",
        "Problemas en la gestión de citas y servicios programados",
        "Deficiencias en la personalización del servicio",
        "Falta de transparencia en la información proporcionada a los clientes",
        "Deficiencias en la gestión de la imagen y reputación",
        "Falta de atención a los comentarios y reseñas","Problemas en la gestión de garantías",
        "Falta de ofertas y promociones atractivas","Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados","Mal uso de CRM",
        "Problemas en la gestión de reclamaciones y devoluciones",
    ],
    Metodo: [
        "Procesos complejos","Procesos poco explícitos","Incumplimiento en la ejecución","Procesos limitados",
        "Falta de documentación y registro","Falta de integración entre departamentos",
        "Inconsistencias en la aplicación","Procesos no optimizados",
        "Falta de estandarización en la atención al cliente",
        "Ausencia de procedimientos claros para la gestión de garantías",
        "Falta de protocolos para la entrega de vehículos nuevos",
        "Falta de automatización en procesos administrativos","Retrasos en la tramitación de documentos",
        "Ineficiencia en la programación de citas","Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia","Deficiencias en el control de calidad",
        "Falta de auditorías internas periódicas","Problemas en la implementación de sistemas ERP",
        "Deficiencias en la gestión de proyectos","Falta de revisiones periódicas",
        "Procedimientos redundantes","Falta de actualización de manuales operativos",
        "Uso ineficiente de recursos","Falta de un sistema de gestión de calidad total",
    ],
    Materiales: [
        "Insuficiencia de materiales","Materiales en mal estado","Materiales descalibrados",
        "Difícil disponibilidad","Costos elevados","Variabilidad en la calidad","Obsolescencia",
        "Falta de stock de piezas de alta demanda","Problemas con proveedores no confiables",
        "Almacenamiento inadecuado de piezas","Pérdidas por deterioro","Falta de control de inventarios",
        "Gestión ineficaz de devoluciones","Uso de materiales no homologados",
        "Falta de piezas específicas para ciertos modelos","Problemas en la logística de entrega",
        "Retrasos en la recepción de materiales importados","Problemas en la aduana",
        "Roturas durante el transporte","Embalajes inadecuados","Falta de previsión en pedidos",
        "Fallos en la trazabilidad de piezas",
    ],
    Infraestructura: [],
    "Talento Humano": [
        "Falta de capacitación","Falta de adiestramiento","Problemas de comunicación","Desmotivación",
        "Conflictos laborales","Alta rotación de personal","Falta de reconocimiento",
        "Cargas de trabajo excesivas","Ausentismo","Falta de liderazgo efectivo",
        "Insuficiente personal de ventas durante picos de demanda",
        "Falta de técnicos especializados en postventa",
        "Ausencia de programas de desarrollo profesional y mentoría",
        "Evaluación de desempeño inadecuada","Falta de incentivos y bonificaciones",
        "Falta de claridad en las expectativas laborales",
        "Escasa participación de los empleados en la toma de decisiones",
        "Deficiencias en la gestión del talento","Falta de programas de bienestar laboral",
        "Problemas con la gestión del tiempo","Personal de nuevo ingreso",
        "Problemas de retención de talento clave","Baja moral del equipo",
        "Falta de diversidad e inclusión","Problemas con la conciliación laboral y familiar",
        "Ausencia de un plan de carrera claro","Falta de apoyo psicológico",
        "Falta de programas de salud y seguridad laboral",
    ],
};

function cls(...a) { return a.filter(Boolean).join(" "); }

function PriorityBadge({ value }) {
    const p = PRIORITIES.find(x => x.value === value) || PRIORITIES[1];
    return (
        <span className={cls("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", p.color)}>
            {p.label}
        </span>
    );
}

function StatusBadge({ name }) {
    const c = STATUS_COLORS[name] || { bg:"bg-slate-100", text:"text-slate-600", border:"border-slate-200", dot:"bg-slate-400" };
    return (
        <span className={cls("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold", c.bg, c.text, c.border)}>
            <span className={cls("h-1.5 w-1.5 rounded-full", c.dot)} />
            {name || "—"}
        </span>
    );
}

function CausaRaiz({ causa, raiz, onChangeCausa, onChangeRaiz }) {
    const raices = useMemo(() => opcionesRaiz[causa] || [], [causa]);
    const base = "w-full rounded-xl border px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none focus:border-[#131E5C] bg-white border-black/10";
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <div>
                <div className="mb-1.5 text-xs font-extrabold text-black/60">Causa</div>
                <select value={causa || ""} onChange={e => { onChangeCausa(e.target.value); onChangeRaiz(""); }} className={base}>
                    <option value="">Selecciona una causa...</option>
                    {Object.keys(opcionesRaiz).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <div className="mb-1.5 text-xs font-extrabold text-black/60">Raíz</div>
                <select value={raiz || ""} onChange={e => onChangeRaiz(e.target.value)}
                    disabled={!causa || raices.length === 0}
                    className={cls(base, "disabled:opacity-50 disabled:cursor-not-allowed")}>
                    <option value="">
                        {!causa ? "Selecciona causa primero" : raices.length ? "Selecciona una raíz..." : "Sin opciones"}
                    </option>
                    {raices.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
        </div>
    );
}

function SubtaskRow({ sub, onToggle, onDelete }) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-black/5 bg-white px-3 py-2 text-sm">
            <button type="button" onClick={() => onToggle(sub.id)}
                className={cls("shrink-0 rounded-full border-2 h-5 w-5 flex items-center justify-center transition",
                    sub.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-400")}>
                {sub.done ? <CheckCircle2 className="h-3 w-3" /> : null}
            </button>
            <span className={cls("flex-1 min-w-0 truncate text-sm", sub.done && "line-through text-black/40")}>
                {sub.title}
            </span>
            <button type="button" onClick={() => onDelete(sub.id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ConfirmDialog 
function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200">
                            <AlertTriangle className="h-5 w-5 text-rose-600" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-black">{title}</div>
                            <div className="text-xs text-black/50 mt-0.5">{message}</div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={onCancel}
                            className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button type="button" onClick={onConfirm} disabled={loading}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700 disabled:opacity-50">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// TeamsModal
function TeamsModal({ open, onClose, onCreated }) {
    const [teams, setTeams]             = useState([]);
    const [loading, setLoading]         = useState(false);
    const [creating, setCreating]       = useState(false);
    const [name, setName]               = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null); // team object
    const [deleting, setDeleting]       = useState(false);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClickup.listTeams();
            setTeams(Array.isArray(data) ? data : []);
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!open) return;
        fetchTeams();
    }, [open, fetchTeams]);

    async function createTeam() {
        const n = name.trim();
        if (!n) return;
        setCreating(true);
        try {
            await apiClickup.createTeam({ name: n, descripcion: descripcion.trim() || null });
            setName("");
            setDescripcion("");
            await fetchTeams();
            onCreated?.();
        } catch (e) {
            alert(e.message || "Error al crear equipo");
        } finally {
            setCreating(false);
        }
    }

    async function deleteTeam() {
        if (!confirmDelete) return;
        setDeleting(true);
        try {
            await apiClickup.deleteTeam(Number(confirmDelete.id));
            setConfirmDelete(null);
            await fetchTeams();
            onCreated?.();
        } catch (e) {
            alert(e.message || "Error al eliminar equipo");
        } finally {
            setDeleting(false);
        }
    }

    if (!open) return null;

    const inputBase = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]";

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4"
                        style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #1e3282 100%)` }}>
                        <div className="flex items-center gap-2">
                            <UsersRound className="h-5 w-5 text-white/80" />
                            <h3 className="text-sm font-black text-white">Equipos</h3>
                        </div>
                        <button type="button" onClick={onClose}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                        {/* Crear equipo */}
                        <div className="space-y-3">
                            <div className="text-xs font-extrabold uppercase tracking-widest text-black/35">Nuevo equipo</div>
                            <div>
                                <label className="text-xs font-extrabold text-black/60">Nombre *</label>
                                <input value={name} onChange={e => setName(e.target.value)}
                                    className={cls(inputBase, "mt-1")}
                                    placeholder="Nombre del equipo" />
                            </div>
                            <div>
                                <label className="text-xs font-extrabold text-black/60">Descripción</label>
                                <input value={descripcion} onChange={e => setDescripcion(e.target.value)}
                                    className={cls(inputBase, "mt-1")}
                                    placeholder="Descripción opcional" />
                            </div>
                            <button type="button"
                                disabled={creating || !name.trim()}
                                onClick={createTeam}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                                style={{ backgroundColor: BRAND_BLUE }}>
                                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                {creating ? "Creando..." : "Crear equipo"}
                            </button>
                        </div>

                        {/* Lista de equipos */}
                        <div>
                            <div className="text-xs font-extrabold uppercase tracking-widest text-black/35 mb-2">Equipos existentes</div>
                            {loading ? (
                                <div className="space-y-2">
                                    {[1,2,3].map(i => <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />)}
                                </div>
                            ) : teams.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">
                                    Sin equipos registrados
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {teams.map(t => (
                                        <div key={t.id}
                                            className="flex items-center justify-between rounded-xl border border-black/10 bg-slate-50 px-3 py-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-[#131E5C] truncate">{t.name}</div>
                                                {t.descripcion && (
                                                    <div className="text-xs text-black/40 truncate">{t.descripcion}</div>
                                                )}
                                            </div>
                                            <button type="button"
                                                onClick={() => setConfirmDelete(t)}
                                                className="ml-2 shrink-0 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!confirmDelete}
                title="Eliminar equipo"
                message={`¿Seguro que deseas eliminar "${confirmDelete?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={deleteTeam}
                onCancel={() => setConfirmDelete(null)}
                loading={deleting}
            />
        </>
    );
}

// TaskModal 
function TaskModal({ open, onClose, task, lists, teamId, onSaved }) {
    const [title, setTitle]           = useState("");
    const [listId, setListId]         = useState("");
    const [priority, setPriority]     = useState("MEDIUM");
    const [due, setDue]               = useState("");
    const [start, setStart]           = useState("");
    const [problema, setProblema]     = useState("");
    const [causa, setCausa]           = useState("");
    const [raiz, setRaiz]             = useState("");
    const [subtasks, setSubtasks]     = useState([]);
    const [newSub, setNewSub]         = useState("");
    const [estrategia, setEstrategia] = useState("");
    const [resultados, setResultados] = useState("");
    const [evidencias, setEvidencias] = useState([]);
    const [saving, setSaving]         = useState(false);

    useEffect(() => {
        if (!open) return;
        setTitle(task?.title || "");
        const defaultList = task?.list ? String(task.list) : (lists[0]?.id ? String(lists[0].id) : "");
        setListId(defaultList);
        setPriority(task?.priority || "MEDIUM");
        setStart(task?.start_date ? String(task.start_date).slice(0, 10) : "");
        setDue(task?.due_date ? String(task.due_date).slice(0, 10) : "");
        setProblema(task?.descripcion_problema || "");
        setCausa(task?.causa || "");
        setRaiz(task?.raiz || "");
        setEstrategia(task?.desarrollo_estrategia || "");
        setResultados(task?.resultados || "");
        setSubtasks(Array.isArray(task?.subtareas) ? task.subtareas.map(s => ({
            id: s.id || Math.random(),
            title: s.title || s.titulo || "",
            done: !!s.done,
        })) : []);
        setEvidencias([]);
    }, [open, task, lists]);

    function addSubtask() {
        const t = newSub.trim();
        if (!t) return;
        setSubtasks(prev => [...prev, { id: Math.random(), title: t, done: false }]);
        setNewSub("");
    }

    async function handleSave() {
    if (!title.trim() || !listId || !teamId) return;
    setSaving(true);
    try {
        // payload principal para la tarea
        const payload = {
            lista: Number(listId),
            titulo: title.trim(),
            prioridad: priority,
            inicio: start ? `${start}T00:00:00Z` : null, // Se agrega 'Z' para indicar UTC/ISO estándar
            vence: due ? `${due}T00:00:00Z` : null,
            descripcion_problema: problema.trim(),
            causa: causa.trim(),
            raiz: raiz.trim(),
            desarrollo_estrategia: estrategia.trim(),
            resultados: resultados.trim(),
            // Enviamos las subtareas backend 
            subtareas: subtasks.map(s => ({ titulo: s.title, done: s.done })), 
        };

        let currentTaskId = task?.id;

        // Guardamos o actualizamos la tarea base
        if (task?.id) {
            await apiClickup.updateTask(Number(teamId), Number(task.id), payload);
        } else {
            const nuevaTarea = await apiClickup.createTask(Number(teamId), payload);
            // Si es una tarea nueva, guardamos el ID retornado por el backend para poder subir archivos
            if (nuevaTarea && nuevaTarea.id) {
                currentTaskId = nuevaTarea.id;
            }
        }

        // Envío de evidencias usando MULTIPART (FormData)
        if (evidencias.length && currentTaskId) {
            const formData = new FormData();
            formData.append("tipo", "RESOLUTION"); // O "BUG" según corresponda en tu flujo
            formData.append("comentario", "Evidencias del plan de acción");
            
            // Adjuntamos cada archivo individualmente bajo la misma clave 'archivos'
            // que es lo que request.FILES.getlist('archivos') 
            evidencias.forEach((archivo) => {
                formData.append("archivos", archivo);
            });

            // Invocamos la API pasando el FormData. 
            // Recuerda que en tu instancia de Axios/Fetch no debes forzar 'application/json' para esta petición
            await apiClickup.uploadTaskEvidence(Number(teamId), Number(currentTaskId), formData);
        }

        onSaved?.();
        onClose();
    } catch (e) {
        console.error("Error al guardar el plan de acción:", e);
        alert(e.message || "Error al guardar el plan de acción");
    } finally {
        setSaving(false);
    }
}

    if (!open) return null;

    const inputBase = "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]";
    const doneCount = subtasks.filter(s => s.done).length;

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-t-3xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #1e3282 100%)` }}>
                    <div className="flex items-center gap-2.5">
                        <Zap className="h-5 w-5 text-white/80" />
                        <h3 className="text-[15px] font-black tracking-tight text-white">
                            {task?.id ? "Editar Plan de Acción" : "Nuevo Plan de Acción"}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5 space-y-5">

                    <section>
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-black/35">Información</div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-extrabold text-black/60">Título *</label>
                                <input value={title} onChange={e => setTitle(e.target.value)}
                                    className={cls(inputBase, "mt-1")}
                                    placeholder="Nombre del plan de acción" />
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-extrabold text-black/60">Columna</label>
                                    <select value={listId} onChange={e => setListId(e.target.value)}
                                        className={cls(inputBase, "mt-1 font-bold")}>
                                        {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-black/60">Prioridad</label>
                                    <select value={priority} onChange={e => setPriority(e.target.value)}
                                        className={cls(inputBase, "mt-1 font-bold")}>
                                        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-black/60">Fecha de inicio</label>
                                    <input type="date" value={start} onChange={e => setStart(e.target.value)}
                                        className={cls(inputBase, "mt-1")} />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-black/60">Fecha límite</label>
                                    <input type="date" value={due} onChange={e => setDue(e.target.value)}
                                        className={cls(inputBase, "mt-1")} />
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-black/[0.06]" />

                    <section>
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-black/35">Plan de Acción</div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-extrabold text-black/60">Descripción del Problema</label>
                                <textarea value={problema} onChange={e => setProblema(e.target.value)}
                                    className={cls(inputBase, "mt-1 min-h-[90px]")}
                                    placeholder="¿Cuál es el problema que se está atendiendo?" />
                            </div>

                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 text-xs font-extrabold text-[#131E5C]">Causa / Raíz</div>
                                <CausaRaiz causa={causa} raiz={raiz} onChangeCausa={setCausa} onChangeRaiz={setRaiz} />
                            </div>

                            <div className="rounded-xl border border-black/10 bg-slate-50 p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="text-xs font-extrabold text-[#131E5C]">
                                        Subtareas
                                        {subtasks.length > 0 && (
                                            <span className="ml-1.5 rounded-full bg-[#131E5C]/10 px-2 py-0.5 text-[10px]">
                                                {doneCount}/{subtasks.length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <input value={newSub} onChange={e => setNewSub(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && addSubtask()}
                                        className={cls(inputBase, "flex-1")}
                                        placeholder="Nueva subtarea..." />
                                    <button type="button" onClick={addSubtask}
                                        className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold text-white"
                                        style={{ backgroundColor: BRAND_BLUE }}>
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                {subtasks.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-black/10 p-4 text-center text-xs text-black/40">
                                        Sin subtareas. Agrega una arriba.
                                    </div>
                                ) : (
                                    <div className="grid gap-1.5">
                                        {subtasks.map(s => (
                                            <SubtaskRow key={s.id} sub={s}
                                                onToggle={id => setSubtasks(p => p.map(x => x.id === id ? {...x, done: !x.done} : x))}
                                                onDelete={id => setSubtasks(p => p.filter(x => x.id !== id))} />
                                        ))}
                                        <div className="mt-1 h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
                                            <div className="h-full rounded-full bg-emerald-500 transition-all"
                                                style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-extrabold text-black/60">Desarrollo de la Estrategia</label>
                                <textarea value={estrategia} onChange={e => setEstrategia(e.target.value)}
                                    className={cls(inputBase, "mt-1 min-h-[90px]")}
                                    placeholder="¿Qué estrategia se va a implementar?" />
                            </div>

                            <div>
                                <label className="text-xs font-extrabold text-black/60">Resultados</label>
                                <textarea value={resultados} onChange={e => setResultados(e.target.value)}
                                    className={cls(inputBase, "mt-1 min-h-[90px]")}
                                    placeholder="¿Qué resultados se esperan o se obtuvieron?" />
                            </div>
                        </div>
                    </section>

                    <div className="border-t border-black/[0.06]" />

                    <section>
                        <div className="mb-3 text-xs font-extrabold uppercase tracking-widest text-black/35">Evidencias</div>
                        <div className="rounded-xl border border-dashed border-black/20 bg-slate-50 p-4 text-center">
                            <Paperclip className="mx-auto mb-2 h-7 w-7 text-black/30" />
                            <label className="cursor-pointer text-sm font-extrabold text-[#131E5C] hover:underline">
                                Seleccionar archivos
                                <input type="file" multiple
                                    accept=".png,.jpg,.jpeg,.pdf,.mp4,.mov,.webm,.mp3,.wav,.m4a"
                                    className="hidden"
                                    onChange={e => setEvidencias(prev => [...prev, ...Array.from(e.target.files || [])])} />
                            </label>
                            <p className="mt-1 text-xs text-black/40">Imágenes, PDF, video y audio</p>
                        </div>
                        {evidencias.length > 0 && (
                            <div className="mt-3 grid gap-2">
                                <div className="text-xs font-extrabold text-black/50">{evidencias.length} archivo(s)</div>
                                {evidencias.map((f, i) => {
                                    const isImg   = f.type.startsWith("image/");
                                    const isPdf   = f.type === "application/pdf";
                                    const isVideo = f.type.startsWith("video/");
                                    const isAudio = f.type.startsWith("audio/");
                                    return (
                                        <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3 py-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-lg">
                                                    {isImg ? "🖼️" : isPdf ? "📄" : isVideo ? "🎬" : isAudio ? "🎵" : "📎"}
                                                </span>
                                                <span className="text-xs font-semibold text-black/70 truncate">{f.name}</span>
                                            </div>
                                            <button type="button"
                                                onClick={() => setEvidencias(prev => prev.filter((_, j) => j !== i))}
                                                className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-black/[0.07] bg-slate-50/80 px-5 py-3.5 shrink-0">
                    <button type="button" onClick={onClose}
                        className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-extrabold text-black/70 hover:bg-slate-50">
                        Cancelar
                    </button>
                    <button type="button" onClick={handleSave}
                        disabled={saving || !title.trim() || !listId}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                        style={{ backgroundColor: BRAND_BLUE }}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Guardando..." : task?.id ? "Guardar cambios" : "Crear plan"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function KanbanCard({ task, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const subtasks = Array.isArray(task.subtareas) ? task.subtareas : [];
    const done = subtasks.filter(s => s.done).length;
    const pct = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;

    return (
        <article className="rounded-2xl border border-black/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-[#131E5C] leading-snug">{task.title || "Sin título"}</h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <PriorityBadge value={task.priority} />
                            {task.due_date && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black/40">
                                    <Calendar className="h-3 w-3" />
                                    {String(task.due_date).slice(0, 10)}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => onEdit(task)}
                            className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white p-2 text-black/60 hover:bg-slate-50">
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => onDelete(task)}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {task.descripcion_problema && (
                    <p className="mt-2 line-clamp-2 text-xs text-black/55">{task.descripcion_problema}</p>
                )}

                {(task.causa || task.raiz) && (
                    <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-black/50">
                        {task.causa && <span className="font-bold text-[#131E5C]">{task.causa}</span>}
                        {task.causa && task.raiz && <span className="mx-1">·</span>}
                        {task.raiz && <span>{task.raiz}</span>}
                    </div>
                )}

                {subtasks.length > 0 && (
                    <div className="mt-3">
                        <button type="button" onClick={() => setExpanded(v => !v)}
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#131E5C] hover:underline">
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            Subtareas ({done}/{subtasks.length})
                        </button>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-black/5 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        {expanded && (
                            <div className="mt-2 grid gap-1">
                                {subtasks.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                                        {s.done
                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                            : <Clock3 className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
                                        <span className={cls("truncate", s.done && "line-through text-black/40")}>
                                            {s.title || s.titulo}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}

function KanbanView({ tasks, lists, onEdit, onDelete, onCreateInCol, loading }) {
    if (loading) {
        return (
            <div className="grid gap-4 sm:grid-cols-3">
                {STATUS_COLS.map(col => (
                    <div key={col} className="rounded-2xl border border-black/10 bg-white p-4">
                        <div className="mb-3 h-5 w-24 animate-pulse rounded bg-black/5" />
                        <div className="grid gap-3">
                            {[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5" />)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {STATUS_COLS.map(col => {
                const c = STATUS_COLORS[col];
                const colTasks = tasks.filter(t => t.list_name === col);
                const list = lists.find(l => l.name === col);
                return (
                    <div key={col} className="flex flex-col rounded-2xl border border-black/10 bg-slate-50/80 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07]">
                            <div className="flex items-center gap-2">
                                <span className={cls("h-2 w-2 rounded-full", c.dot)} />
                                <span className={cls("text-sm font-black", c.text)}>{col}</span>
                                <span className={cls("rounded-full px-2 py-0.5 text-[11px] font-bold border", c.bg, c.text, c.border)}>
                                    {colTasks.length}
                                </span>
                            </div>
                            {list && (
                                <button type="button" onClick={() => onCreateInCol(list.id)}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-black/10 bg-white text-black/50 hover:bg-slate-100 hover:text-[#131E5C]">
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[60vh]">
                            {colTasks.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-black/10 p-6 text-center text-xs text-black/30">
                                    Sin planes en esta columna
                                </div>
                            ) : (
                                colTasks.map(task => (
                                    <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TablaView({ tasks, onEdit, onDelete, loading }) {
    const [sort, setSort] = useState({ key: "due_date", dir: "asc" });

    function toggleSort(key) {
        setSort(prev => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" });
    }

    const sorted = useMemo(() => {
        const data = [...tasks];
        const mult = sort.dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            const va = String(a?.[sort.key] || "").toLowerCase();
            const vb = String(b?.[sort.key] || "").toLowerCase();
            return va < vb ? -1 * mult : va > vb ? 1 * mult : 0;
        });
    }, [tasks, sort]);

    const SortIcon = ({ k }) => (
        <span className="opacity-60 ml-1">
            {sort.key === k
                ? sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5 inline" /> : <ChevronDown className="h-3.5 w-3.5 inline" />
                : <ArrowUpDown className="h-3.5 w-3.5 inline" />}
        </span>
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-black/10 bg-[#131E5C] text-xs text-white">
                        <tr>
                            {[["title","Título"],["list_name","Estado"],["priority","Prioridad"],["due_date","Fecha límite"],["causa","Causa"]].map(([k,l]) => (
                                <th key={k} className="px-4 py-3">
                                    <button type="button" onClick={() => toggleSort(k)} className="inline-flex items-center font-bold text-xs">
                                        {l}<SortIcon k={k} />
                                    </button>
                                </th>
                            ))}
                            <th className="px-4 py-3 text-xs font-bold">Subtareas</th>
                            <th className="px-4 py-3 text-xs font-bold">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.06]">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-sm text-black/40">Sin planes con estos filtros.</td>
                            </tr>
                        ) : sorted.map(task => {
                            const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
                            const done = subs.filter(s => s.done).length;
                            return (
                                <tr key={task.id} className="hover:bg-slate-50/60 cursor-pointer" onDoubleClick={() => onEdit(task)}>
                                    <td className="px-4 py-3 font-bold text-[#131E5C] max-w-[200px]">
                                        <span className="line-clamp-2">{task.title || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge name={task.list_name} /></td>
                                    <td className="px-4 py-3"><PriorityBadge value={task.priority} /></td>
                                    <td className="px-4 py-3 text-xs text-black/50">{task.due_date ? String(task.due_date).slice(0, 10) : "—"}</td>
                                    <td className="px-4 py-3 text-xs text-black/60 max-w-[160px]">
                                        <span className="line-clamp-1">{task.causa || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {subs.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 rounded-full bg-black/5 overflow-hidden">
                                                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(done/subs.length)*100}%` }} />
                                                </div>
                                                <span className="text-xs text-black/40">{done}/{subs.length}</span>
                                            </div>
                                        ) : <span className="text-xs text-black/30">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <button type="button" onClick={() => onEdit(task)}
                                                className="rounded-lg border border-black/10 p-1.5 text-black/60 hover:bg-slate-100">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button" onClick={() => onDelete(task)}
                                                className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// TimelineView 
function TimelineView({ tasks, onEdit, onDelete, loading }) {
    const scrollRef = useRef(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

    const withDate = useMemo(() =>
        [...tasks]
            .filter(t => t.start_date || t.due_date)
            .sort((a, b) => {
                const da = a.start_date || a.due_date || "";
                const db = b.start_date || b.due_date || "";
                return String(da).localeCompare(String(db));
            }),
        [tasks]
    );
    const noDate = useMemo(() => tasks.filter(t => !t.start_date && !t.due_date), [tasks]);

    const { minDate, totalDays, months } = useMemo(() => {
        if (!withDate.length) return { minDate: today, maxDate: today, totalDays: 30, months: [] };

        let min = new Date(today);
        let max = new Date(today);

        withDate.forEach(t => {
            const s = t.start_date ? new Date(String(t.start_date).slice(0, 10)) : null;
            const e = t.due_date ? new Date(String(t.due_date).slice(0, 10)) : null;
            if (s && s < min) min = new Date(s);
            if (e && e > max) max = new Date(e);
        });

        min.setDate(min.getDate() - 3);
        max.setDate(max.getDate() + 5);

        const totalDays = Math.max(Math.round((max - min) / (1000 * 60 * 60 * 24)), 30);

        const months = [];
        let cur = new Date(min);
        cur.setDate(1);
        while (cur <= max) {
            const mStart = new Date(Math.max(cur, min));
            const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
            const clampedEnd = new Date(Math.min(mEnd, max));
            const days = Math.round((clampedEnd - mStart) / (1000 * 60 * 60 * 24)) + 1;
            months.push({
                label: cur.toLocaleDateString("es-MX", { month: "short", year: "numeric" }),
                days,
            });
            cur.setMonth(cur.getMonth() + 1);
        }

        return { minDate: min, maxDate: max, totalDays, months };
    }, [withDate]);

    const DAY_W = 32;
    const ROW_H_BASE = 64;   // altura base de cada fila (con más info)
    const SUB_H = 24;        // altura por cada subtarea expandida
    const LABEL_W = 260;     // más ancho para mostrar más info

    const todayOffset = Math.round((today - minDate) / (1000 * 60 * 60 * 24));

    useEffect(() => {
        if (scrollRef.current && todayOffset > 0) {
            scrollRef.current.scrollLeft = Math.max(0, todayOffset * DAY_W - 120);
        }
    }, [todayOffset, withDate.length]);

    // Calcula la altura real de cada fila según si está expandida
    function rowHeight(task) {
        const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
        if (expandedRows[task.id] && subs.length > 0) {
            return ROW_H_BASE + subs.length * SUB_H + 8;
        }
        return ROW_H_BASE;
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <div className="h-4 w-40 animate-pulse rounded bg-slate-100 shrink-0" />
                        <div className="h-8 animate-pulse rounded-full bg-slate-100" style={{ width: `${60 + i * 30}px` }} />
                    </div>
                ))}
            </div>
        );
    }

    if (!withDate.length && !noDate.length) {
        return (
            <div className="rounded-2xl border border-dashed border-black/10 p-10 text-center text-sm text-black/40">
                Sin planes para mostrar.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {withDate.length > 0 && (
                <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-sm">
                    {/* Leyenda */}
                    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-black/[0.06] bg-slate-50/80 flex-wrap">
                        <span className="text-xs font-extrabold text-black/40 uppercase tracking-widest">Línea de tiempo</span>
                        <div className="flex items-center gap-3 ml-auto flex-wrap">
                            {STATUS_COLS.map(col => {
                                const c = STATUS_COLORS[col];
                                return (
                                    <div key={col} className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.bar }} />
                                        <span className="text-[11px] font-semibold text-black/50">{col}</span>
                                    </div>
                                );
                            })}
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-0.5 bg-blue-500 rounded-full" />
                                <span className="text-[11px] font-semibold text-black/50">Hoy</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex overflow-hidden">
                        {/* Columna de etiquetas — ahora con más info */}
                        <div className="shrink-0 border-r border-black/[0.06]" style={{ width: LABEL_W }}>
                            {/* Header */}
                            <div className="border-b border-black/[0.06] bg-slate-50 flex items-end px-3 pb-2" style={{ height: 52 }}>
                                <span className="text-[11px] font-extrabold text-black/30 uppercase tracking-widest">Plan</span>
                            </div>

                            {withDate.map((task) => {
                                const c = STATUS_COLORS[task.list_name] || STATUS_COLORS["Por hacer"];
                                const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
                                const done = subs.filter(s => s.done).length;
                                const pct = subs.length ? Math.round((done / subs.length) * 100) : null;
                                const isExpanded = !!expandedRows[task.id];
                                const rh = rowHeight(task);

                                return (
                                    <div
                                        key={task.id}
                                        className="border-b border-black/[0.04] hover:bg-slate-50/80 transition"
                                        style={{ height: rh }}
                                    >
                                        {/* Fila principal */}
                                        <div
                                            className="flex items-start gap-2 px-3 pt-2 cursor-pointer group"
                                            onClick={() => onEdit(task)}
                                        >
                                            <span className={cls("h-2 w-2 rounded-full shrink-0 mt-1", c.dot)} />
                                            <div className="flex-1 min-w-0">
                                                {/* Título */}
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="text-xs font-black text-[#131E5C] truncate leading-tight flex-1" title={task.title}>
                                                        {task.title}
                                                    </span>
                                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 flex gap-0.5">
                                                        <button type="button"
                                                            onClick={e => { e.stopPropagation(); onEdit(task); }}
                                                            className="rounded p-0.5 text-black/40 hover:text-[#131E5C] hover:bg-slate-100">
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                        <button type="button"
                                                            onClick={e => { e.stopPropagation(); onDelete(task); }}
                                                            className="rounded p-0.5 text-black/40 hover:text-rose-600 hover:bg-rose-50">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Badges: estado + prioridad */}
                                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                    <StatusBadge name={task.list_name} />
                                                    <PriorityBadge value={task.priority} />
                                                </div>

                                                {/* Descripción del problema */}
                                                {task.descripcion_problema && (
                                                    <p className="mt-1 text-[10px] text-black/50 line-clamp-1 leading-tight">
                                                        {task.descripcion_problema}
                                                    </p>
                                                )}

                                                {/* Causa */}
                                                {task.causa && (
                                                    <p className="mt-0.5 text-[10px] font-semibold text-[#131E5C]/60 truncate">
                                                        {task.causa}{task.raiz ? ` · ${task.raiz}` : ""}
                                                    </p>
                                                )}

                                                {/* Subtareas con toggle */}
                                                {subs.length > 0 && (
                                                    <div className="mt-1">
                                                        <button
                                                            type="button"
                                                            onClick={e => { e.stopPropagation(); toggleRow(task.id); }}
                                                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#131E5C] hover:underline"
                                                        >
                                                            {isExpanded
                                                                ? <ChevronDown className="h-3 w-3" />
                                                                : <ChevronRight className="h-3 w-3" />}
                                                            Subtareas ({done}/{subs.length})
                                                            {pct !== null && (
                                                                <span className="ml-1 text-[10px] text-black/40">{pct}%</span>
                                                            )}
                                                        </button>

                                                        {/* Barra de progreso */}
                                                        <div className="mt-0.5 h-1 w-full rounded-full bg-black/5 overflow-hidden">
                                                            <div className="h-full rounded-full bg-emerald-500 transition-all"
                                                                style={{ width: `${pct ?? 0}%` }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subtareas expandidas */}
                                        {isExpanded && subs.length > 0 && (
                                            <div className="px-3 pb-1 mt-1 grid gap-0.5">
                                                {subs.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 rounded bg-slate-100/80 px-2 py-1" style={{ height: SUB_H - 2 }}>
                                                        {s.done
                                                            ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                                            : <Clock3 className="h-3 w-3 text-slate-400 shrink-0" />}
                                                        <span className={cls("text-[10px] truncate", s.done && "line-through text-black/40")}>
                                                            {s.title || s.titulo}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Área Gantt scrollable */}
                        <div ref={scrollRef} className="flex-1 overflow-x-auto" style={{ minWidth: 0 }}>
                            <div style={{ width: totalDays * DAY_W, minWidth: "100%" }}>
                                {/* Headers de mes + día */}
                                <div className="border-b border-black/[0.06] bg-slate-50" style={{ height: 52 }}>
                                    <div className="flex" style={{ height: 26 }}>
                                        {months.map((m, mi) => (
                                            <div key={mi}
                                                className="border-r border-black/[0.06] px-2 flex items-center"
                                                style={{ width: m.days * DAY_W, minWidth: m.days * DAY_W }}>
                                                <span className="text-[11px] font-extrabold text-black/50 uppercase tracking-wide truncate">
                                                    {m.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex relative" style={{ height: 26 }}>
                                        {Array.from({ length: totalDays }).map((_, di) => {
                                            const d = new Date(minDate);
                                            d.setDate(d.getDate() + di);
                                            const isToday = di === todayOffset;
                                            const isSun = d.getDay() === 0;
                                            const isSat = d.getDay() === 6;
                                            return (
                                                <div key={di}
                                                    className={cls(
                                                        "border-r border-black/[0.04] flex items-center justify-center text-[10px] font-semibold shrink-0",
                                                        isToday ? "text-blue-600 font-extrabold" : (isSat || isSun) ? "text-black/25" : "text-black/30"
                                                    )}
                                                    style={{
                                                        width: DAY_W, height: 26,
                                                        backgroundColor: isToday ? "rgba(59,130,246,0.08)" : (isSat || isSun) ? "rgba(0,0,0,0.015)" : "transparent"
                                                    }}>
                                                    {d.getDate()}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Filas Gantt — altura dinámica sincronizada con columna izquierda */}
                                <div className="relative">
                                    {/* Fondo: fines de semana + línea de hoy */}
                                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                                        {Array.from({ length: totalDays }).map((_, di) => {
                                            const d = new Date(minDate);
                                            d.setDate(d.getDate() + di);
                                            const isSat = d.getDay() === 6;
                                            const isSun = d.getDay() === 0;
                                            const isToday = di === todayOffset;
                                            return (
                                                <div key={di} className="absolute top-0 bottom-0"
                                                    style={{
                                                        left: di * DAY_W, width: DAY_W,
                                                        backgroundColor: isToday ? "rgba(59,130,246,0.07)" : (isSat || isSun) ? "rgba(0,0,0,0.018)" : "transparent",
                                                        borderLeft: isToday ? "2px solid rgba(59,130,246,0.6)" : "none",
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {withDate.map((task) => {
                                        const statusC = STATUS_COLORS[task.list_name] || STATUS_COLORS["Por hacer"];
                                        const barColor = statusC.bar;
                                        const priorityColor = PRIORITY_COLORS[task.priority] || "#0ea5e9";

                                        const startD = task.start_date
                                            ? new Date(String(task.start_date).slice(0, 10))
                                            : new Date(String(task.due_date).slice(0, 10));
                                        const endD = task.due_date
                                            ? new Date(String(task.due_date).slice(0, 10))
                                            : new Date(String(task.start_date).slice(0, 10));

                                        const startOff = Math.round((startD - minDate) / (1000 * 60 * 60 * 24));
                                        const endOff = Math.round((endD - minDate) / (1000 * 60 * 60 * 24));
                                        const barDays = Math.max(endOff - startOff + 1, 1);

                                        const subs = Array.isArray(task.subtareas) ? task.subtareas : [];
                                        const done = subs.filter(s => s.done).length;
                                        const pct = subs.length ? (done / subs.length) : 0;
                                        const isOverdue = endD < today && task.list_name !== "Hecho";
                                        const rh = rowHeight(task);

                                        return (
                                            <div key={task.id}
                                                className="relative border-b border-black/[0.04] hover:bg-slate-50/40"
                                                style={{ height: rh, zIndex: 1 }}>
                                                <div
                                                    className="absolute cursor-pointer group/bar"
                                                    style={{
                                                        left: startOff * DAY_W + 2,
                                                        top: "50%",
                                                        transform: "translateY(-50%)",
                                                        width: Math.max(barDays * DAY_W - 4, DAY_W - 4),
                                                        height: 36,
                                                        zIndex: 2,
                                                    }}
                                                    onClick={() => onEdit(task)}
                                                    title={task.title}
                                                >
                                                    <div className="h-full w-full rounded-lg overflow-hidden shadow-sm relative"
                                                        style={{ backgroundColor: barColor + "22", border: `1.5px solid ${barColor}55` }}>
                                                        {subs.length > 0 && (
                                                            <div className="absolute inset-y-0 left-0 rounded-l-lg"
                                                                style={{ width: `${pct * 100}%`, backgroundColor: barColor + "55" }} />
                                                        )}
                                                        <div className="absolute inset-0 flex items-center px-2 gap-1.5 overflow-hidden">
                                                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: priorityColor }} />
                                                            <span className="text-[11px] font-bold truncate"
                                                                style={{ color: barColor === "#94a3b8" ? "#475569" : barColor }}>
                                                                {task.title}
                                                            </span>
                                                            {subs.length > 0 && (
                                                                <span className="ml-auto shrink-0 text-[9px] font-bold text-black/40">
                                                                    {done}/{subs.length}
                                                                </span>
                                                            )}
                                                            {isOverdue && (
                                                                <span className="shrink-0 text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1">
                                                                    VENCIDA
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sin fecha */}
            {noDate.length > 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 bg-slate-50 p-4">
                    <div className="mb-3 text-xs font-extrabold text-black/40 uppercase tracking-wide">Sin fecha asignada</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {noDate.map(task => (
                            <div key={task.id}
                                className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-white p-3 hover:bg-slate-50 cursor-pointer"
                                onClick={() => onEdit(task)}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-black text-[#131E5C] truncate">{task.title}</span>
                                        <PriorityBadge value={task.priority} />
                                    </div>
                                    {task.descripcion_problema && (
                                        <p className="text-xs text-black/50 line-clamp-1">{task.descripcion_problema}</p>
                                    )}
                                    <div className="mt-1.5"><StatusBadge name={task.list_name} /></div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button type="button"
                                        onClick={e => { e.stopPropagation(); onEdit(task); }}
                                        className="rounded-lg border border-black/10 p-1.5 text-black/50 hover:bg-slate-100">
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button type="button"
                                        onClick={e => { e.stopPropagation(); onDelete(task); }}
                                        className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Page
export default function TimeForAction() {
    const [teamId, setTeamId]       = useState(() => { const v = localStorage.getItem("clickup_team_id"); return v ? Number(v) : null; });
    const [projectId, setProjectId] = useState(() => { const v = localStorage.getItem("clickup_project_id"); return v ? Number(v) : null; });

    const [teams, setTeams]         = useState([]);
    const [projects, setProjects]   = useState([]);
    const [lists, setLists]         = useState([]);
    const [tasks, setTasks]         = useState([]);
    const [loading, setLoading]     = useState(false);

    const [view, setView]           = useState("kanban");
    const [q, setQ]                 = useState("");
    const [filterStatus, setFilterStatus] = useState("Todos");

    const [modalOpen, setModalOpen]           = useState(false);
    const [editingTask, setEditingTask]       = useState(null);
    const [teamsModalOpen, setTeamsModalOpen] = useState(false);

    const [editingProject, setEditingProject] = useState(false);
    const [projectName, setProjectName]       = useState("");
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    // Delete task confirm
    const [confirmDeleteTask, setConfirmDeleteTask] = useState(null);
    const [deletingTask, setDeletingTask]           = useState(false);

    // Delete project confirm
    const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
    const [deletingProject, setDeletingProject]           = useState(false);

    const fetchTeams = useCallback(async () => {
        try {
            const data = await apiClickup.listTeams();
            const arr = Array.isArray(data) ? data : [];
            setTeams(arr);
            if (!teamId && arr[0]) setTeamId(Number(arr[0].id));
        } catch(e) { console.error(e); }
    }, [teamId]);

    useEffect(() => { fetchTeams(); }, []);

    useEffect(() => {
        if (!teamId) return;
        apiClickup.listProjects(teamId).then(data => {
            const arr = Array.isArray(data) ? data : [];
            setProjects(arr);
            if (!projectId && arr[0]) setProjectId(Number(arr[0].id));
        }).catch(console.error);
    }, [teamId]);

    const loadBoard = useCallback(async () => {
        if (!teamId || !projectId) return;
        setLoading(true);
        try {
            const res = await apiClickup.getBoard(Number(teamId), Number(projectId));
            const rawLists = res?.lists || [];
            const tasksByList = res?.tasks_by_list || {};
            setLists(rawLists);
            const flat = rawLists.flatMap(l =>
                (tasksByList[l.id] || []).map(t => ({ ...t, list_name: l.name, list_id: l.id }))
            );
            setTasks(flat);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [teamId, projectId]);

    useEffect(() => { loadBoard(); }, [loadBoard]);

    const filtered = useMemo(() => {
        const qn = q.trim().toLowerCase();
        return tasks.filter(t => {
            const matchQ = !qn
                || (t.title || "").toLowerCase().includes(qn)
                || (t.descripcion_problema || "").toLowerCase().includes(qn)
                || (t.causa || "").toLowerCase().includes(qn);
            const matchS = filterStatus === "Todos" || t.list_name === filterStatus;
            return matchQ && matchS;
        });
    }, [tasks, q, filterStatus]);

    const statCounts = useMemo(() => {
        const out = {};
        for (const col of STATUS_COLS) out[col] = tasks.filter(t => t.list_name === col).length;
        return out;
    }, [tasks]);

    function openCreate(listIdDefault = null) {
        setEditingTask(listIdDefault ? { list: listIdDefault, id: null } : null);
        setModalOpen(true);
    }

    function openEdit(task) {
        setEditingTask(task);
        setModalOpen(true);
    }

    // Task deletion via confirm dialog
    function handleDeleteTask(task) {
        setConfirmDeleteTask(task);
    }

    async function confirmTaskDelete() {
        if (!confirmDeleteTask) return;
        setDeletingTask(true);
        try {
            await apiClickup.deleteTask(Number(teamId), Number(confirmDeleteTask.id));
            setConfirmDeleteTask(null);
            await loadBoard();
        } catch (e) { alert(e.message); }
        finally { setDeletingTask(false); }
    }

    // Project deletion
    async function deleteCurrentProject() {
        if (!projectId || !teamId) return;
        setDeletingProject(true);
        try {
            await apiClickup.deleteProject(teamId, projectId);
            setConfirmDeleteProject(false);
            const data = await apiClickup.listProjects(teamId);
            const arr = Array.isArray(data) ? data : [];
            setProjects(arr);
            const next = arr[0] ? Number(arr[0].id) : null;
            setProjectId(next);
            if (next) localStorage.setItem("clickup_project_id", String(next));
            else localStorage.removeItem("clickup_project_id");
        } catch (e) { alert(e.message || "Error al eliminar proyecto"); }
        finally { setDeletingProject(false); }
    }

    const viewTabs = [
        { id: "kanban",   label: "Kanban",         Icon: LayoutGrid },
        { id: "tabla",    label: "Tabla",           Icon: Table2 },
        { id: "timeline", label: "Línea de tiempo", Icon: GitBranch },
    ];

    const currentProject = projects.find(p => Number(p.id) === Number(projectId));

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#131E5C]" />
                        <h2 className="text-lg font-extrabold text-[#131E5C]">Time For Action</h2>
                    </div>
                    <p className="mt-0.5 text-xs text-black/50">Planes de acción y seguimiento</p>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setTeamsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#131E5C] bg-white px-4 py-2 text-sm font-extrabold text-[#131E5C] hover:bg-slate-50">
                        <UsersRound className="h-4 w-4" />
                        Equipos
                    </button>
                    <button type="button" onClick={() => openCreate()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm"
                        style={{ backgroundColor: BRAND_BLUE }}>
                        <Plus className="h-4 w-4" />
                        Nuevo plan
                    </button>
                </div>
            </div>

            {/* Selectores equipo / proyecto */}
            <div className="flex flex-wrap gap-3 rounded-xl border border-black/10 bg-white p-3">
                {/* Equipo */}
                <div className="flex items-center gap-2">
                    <label className="text-xs font-extrabold text-black/50 shrink-0">Equipo</label>
                    <select value={teamId || ""}
                        onChange={e => { setTeamId(Number(e.target.value)); setProjectId(null); localStorage.setItem("clickup_team_id", e.target.value); }}
                        className="rounded-xl border border-black/10 bg-slate-50 px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]">
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                {/* Proyecto */}
                <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-extrabold text-black/50 shrink-0">Proyecto</label>
                    {editingProject ? (
                        <div className="flex items-center gap-1.5">
                            <input value={projectName} onChange={e => setProjectName(e.target.value)}
                                className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]"
                                placeholder="Nombre del proyecto" />
                            <button type="button"
                                onClick={async () => {
                                    if (!projectName.trim() || !projectId || !teamId) return;
                                    try {
                                        await apiClickup.updateProject(teamId, projectId, { name: projectName.trim(), description: "" });
                                        const data = await apiClickup.listProjects(teamId);
                                        setProjects(Array.isArray(data) ? data : []);
                                        setEditingProject(false);
                                    } catch (e) {
                                        alert(e.message || "Error al renombrar proyecto");
                                    }
                                }}
                                className="rounded-xl bg-[#131E5C] px-3 py-1.5 text-xs font-extrabold text-white hover:opacity-90">
                                Guardar
                            </button>
                            <button type="button" onClick={() => setEditingProject(false)}
                                className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-extrabold text-black/60 hover:bg-slate-50">
                                Cancelar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            <select value={projectId || ""}
                                onChange={e => { setProjectId(Number(e.target.value)); localStorage.setItem("clickup_project_id", e.target.value); }}
                                className="rounded-xl border border-black/10 bg-slate-50 px-3 py-1.5 text-sm font-bold outline-none focus:border-[#131E5C]">
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {/* Rename */}
                            <button type="button"
                                onClick={() => { const cur = projects.find(p => p.id === projectId); setProjectName(cur?.name || ""); setEditingProject(true); }}
                                className="rounded-xl border border-black/10 bg-white p-1.5 text-black/50 hover:bg-slate-100"
                                title="Renombrar proyecto">
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {/* Delete project */}
                            {projectId && (
                                <button type="button"
                                    onClick={() => setConfirmDeleteProject(true)}
                                    className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                                    title="Eliminar proyecto">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                    <button type="button" onClick={() => setProjectModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#131E5C] bg-white px-3 py-1.5 text-xs font-extrabold text-[#131E5C] hover:bg-slate-50">
                        <Plus className="h-3.5 w-3.5" />
                        Nuevo proyecto
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {STATUS_COLS.map(col => {
                    const c = STATUS_COLORS[col];
                    const active = filterStatus === col;
                    return (
                        <button key={col} type="button"
                            onClick={() => setFilterStatus(f => f === col ? "Todos" : col)}
                            className={cls("rounded-xl border p-3 text-left transition",
                                active ? "border-[#131E5C] bg-[#131E5C]/5 ring-1 ring-[#131E5C]/20" : "border-black/10 bg-white hover:bg-slate-50")}>
                            <div className={cls("text-2xl font-black", c.text)}>{statCounts[col] || 0}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={cls("h-2 w-2 rounded-full", c.dot)} />
                                <span className="text-xs font-semibold text-black/50">{col}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Filtros + tabs */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <input value={q} onChange={e => setQ(e.target.value)}
                        className="w-full rounded-xl border border-black/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#131E5C]"
                        placeholder="Buscar planes..." />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#131E5C]">
                    <option value="Todos">Todos los estados</option>
                    {STATUS_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="inline-flex overflow-hidden rounded-xl border border-[#131E5C]/20 bg-white">
                    {viewTabs.map(({ id, label, Icon }) => (
                        <button key={id} type="button" onClick={() => setView(id)}
                            className={cls("inline-flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold transition",
                                view === id ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-slate-50")}>
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Vistas */}
            {view === "kanban" && (
                <KanbanView tasks={filtered} lists={lists} onEdit={openEdit} onDelete={handleDeleteTask}
                    onCreateInCol={listId => openCreate(listId)} loading={loading} />
            )}
            {view === "tabla" && (
                <TablaView tasks={filtered} onEdit={openEdit} onDelete={handleDeleteTask} loading={loading} />
            )}
            {view === "timeline" && (
                <TimelineView tasks={filtered} onEdit={openEdit} onDelete={handleDeleteTask} loading={loading} />
            )}

            {/* Modals */}
            <TaskModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                task={editingTask}
                lists={lists}
                teamId={teamId}
                onSaved={loadBoard}
            />

            <TeamsModal
                open={teamsModalOpen}
                onClose={() => setTeamsModalOpen(false)}
                onCreated={fetchTeams}
            />

            {/* Confirm delete TASK */}
            <ConfirmDialog
                open={!!confirmDeleteTask}
                title="Eliminar plan de acción"
                message={`¿Seguro que deseas eliminar "${confirmDeleteTask?.title}"? Esta acción no se puede deshacer.`}
                onConfirm={confirmTaskDelete}
                onCancel={() => setConfirmDeleteTask(null)}
                loading={deletingTask}
            />

            {/* Confirm delete PROJECT */}
            <ConfirmDialog
                open={confirmDeleteProject}
                title="Eliminar proyecto"
                message={`¿Seguro que deseas eliminar "${currentProject?.name}"? Se eliminarán todos sus planes. Esta acción no se puede deshacer.`}
                onConfirm={deleteCurrentProject}
                onCancel={() => setConfirmDeleteProject(false)}
                loading={deletingProject}
            />

            {/* New project modal */}
            {projectModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setProjectModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4"
                            style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #1e3282 100%)` }}>
                            <h3 className="text-sm font-black text-white">Nuevo Proyecto</h3>
                            <button type="button" onClick={() => setProjectModalOpen(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 text-white/70 hover:bg-white/10">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <label className="text-xs font-extrabold text-black/60">Nombre *</label>
                                <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#131E5C]"
                                    placeholder="Ej. Plan Q2 2026" />
                            </div>
                            <button type="button"
                                disabled={!newProjectName.trim()}
                                onClick={async () => {
                                    if (!newProjectName.trim() || !teamId) return;
                                    try {
                                        const created = await apiClickup.createProject(teamId, {
                                            name: newProjectName.trim(),
                                            description: "",
                                        });
                                        await apiClickup.bootstrapProject(teamId, created.id);
                                        const data = await apiClickup.listProjects(teamId);
                                        const arr = Array.isArray(data) ? data : [];
                                        setProjects(arr);
                                        setProjectId(created.id);
                                        localStorage.setItem("clickup_project_id", String(created.id));
                                        setNewProjectName("");
                                        setProjectModalOpen(false);
                                    } catch (e) {
                                        alert(e.message || "Error al crear proyecto");
                                    }
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                                style={{ backgroundColor: BRAND_BLUE }}>
                                <Plus className="h-4 w-4" />
                                Crear proyecto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}