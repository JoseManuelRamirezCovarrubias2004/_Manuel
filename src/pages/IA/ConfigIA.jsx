// src/pages/IA/ConfigAI.jsx
import { useEffect, useMemo, useState } from "react";
import {
    Bot,
    Car,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Edit3,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";

const BRAND_BLUE = "#131E5C";

const secciones = [
    {
        id: "identidad",
        titulo: "Identidad",
        placeholder:
            'Ejemplo: "Soy Vagen, asistente digital de Volkswagen Córdoba. Atiendo prospectos interesados en autos nuevos y comerciales."',
    },
    {
        id: "precios",
        titulo: "Reglas de precios",
        placeholder:
            "Ejemplo: Usar únicamente precios del catálogo registrado en el CRM. No inventar mensualidades, descuentos ni promociones.",
    },
    {
        id: "perfilamiento",
        titulo: "Perfilamiento",
        placeholder:
            "Ejemplo: Identificar nombre, modelo de interés, enganche, forma de pago, buró y plazo de compra. Hacer máximo una pregunta por mensaje.",
    },
    {
        id: "limites",
        titulo: "Límites de atención",
        placeholder:
            "Ejemplo: Si el cliente pide cotización formal, apartar unidad, mensualidad exacta o disponibilidad final, marcar pendiente y canalizar asesor.",
    },
    {
        id: "personalidad",
        titulo: "Personalidad",
        placeholder:
            "Ejemplo: Responder cálido, breve, profesional y con enfoque comercial. Evitar mensajes largos o repetitivos.",
    },
];

const CONDICIONES_FIJAS = `- No proporcionar precios finales ni cotizaciones cerradas.
- No comprometer disponibilidad de unidades sin verificación previa.
- No inventar precios, mensualidades, promociones ni descuentos.
- Siempre derivar al asesor humano para cierre comercial o cotización formal.
- Mantener el tono institucional de Grupo Automotriz R&R.`;

const NUMEROS = [
    { numero: "522712638803", label: "IA Vagen - VW Córdoba" },
    { numero: "522721111244", label: "Lizbeth Cano - VW Orizaba" },
    { numero: "522713133332", label: "Erendira Santos - VW Córdoba" },
    { numero: "527831263814", label: "Edgar Omar - VW Tuxpan" },
    { numero: "522871232641", label: "Marelly Tenorio - VW Tuxtepec" },

];

const DIAS = [
    { id: "lun", label: "Lun" },
    { id: "mar", label: "Mar" },
    { id: "mie", label: "Mié" },
    { id: "jue", label: "Jue" },
    { id: "vie", label: "Vie" },
    { id: "sab", label: "Sáb" },
    { id: "dom", label: "Dom" },
];

const emptyVehiculo = {
    id: null,
    marca: "Volkswagen",
    modelo: "",
    ano: new Date().getFullYear(),
    version: "",
    precio_lista: "",
    precio_contado: "",
    precio_financiado: "",
    resumen: "",
    ficha_tecnica: {},
    url_ficha_tecnica: "",
    imagenes: [],
    ultima_actualizacion: "",
    activo: true,
};

const horarioInicial = () =>
    Object.fromEntries(
        DIAS.map((d) => [
            d.id,
            {
                activo: d.id !== "dom",
                inicio: "09:00",
                fin: "18:00",
                hastaDia: null,
            },
        ])
    );

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");

    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;

    return digits;
}

function money(value) {
    const n = Number(value || 0);
    if (!n) return "—";

    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    }).format(n);
}

function parseNumberInput(value) {
    const clean = String(value || "").replace(/[^\d]/g, "");
    return clean ? Number(clean) : "";
}

function safeArray(value) {
    if (Array.isArray(value)) return value;
    return [];
}

function safeObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
    return {};
}

function tryJsonParse(value, fallback) {
    try {
        const parsed = JSON.parse(value);
        return parsed;
    } catch {
        return fallback;
    }
}

function Toggle({ value, onChange, disabled = false }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!value)}
            role="switch"
            aria-checked={value}
            disabled={disabled}
            className={[
                "relative inline-flex h-7 w-14 items-center rounded-full transition",
                disabled ? "cursor-not-allowed opacity-60" : "",
                value ? "bg-[#131E5C]" : "bg-gray-300",
            ].join(" ")}
        >
            <span
                className={[
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition",
                    value ? "translate-x-8" : "translate-x-1",
                ].join(" ")}
            />
        </button>
    );
}

function MiniToggle({ value, onChange, disabled = false }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!value)}
            role="switch"
            aria-checked={value}
            disabled={disabled}
            className={[
                "relative inline-flex h-5 w-10 items-center rounded-full transition",
                disabled ? "cursor-not-allowed opacity-60" : "",
                value ? "bg-[#131E5C]" : "bg-gray-300",
            ].join(" ")}
        >
            <span
                className={[
                    "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition",
                    value ? "translate-x-5" : "translate-x-1",
                ].join(" ")}
            />
        </button>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90]">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4 text-white"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <h2 className="truncate text-base font-black">{title}</h2>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 bg-white px-5 py-4 sm:flex-row sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

export default function ConfigIA() {
    const [tab, setTab] = useState("config");

    const [lineasIA, setLineasIA] = useState([]);
    const [numeroSeleccionado, setNumeroSeleccionado] = useState("");

    const [swiftActivo, setSwiftActivo] = useState(false);
    const [horarios, setHorarios] = useState(horarioInicial());
    const [mostrarHorarios, setMostrarHorarios] = useState(false);

    const [campos, setCampos] = useState(
        Object.fromEntries(secciones.map((s) => [s.id, ""]))
    );
    const [condicionesFijas, setCondicionesFijas] = useState(CONDICIONES_FIJAS);

    const [editando, setEditando] = useState(
        Object.fromEntries(secciones.map((s) => [s.id, false]))
    );

    const [guardandoConfig, setGuardandoConfig] = useState(false);
    const [cargandoConfig, setCargandoConfig] = useState(false);
    const [msgConfig, setMsgConfig] = useState("");

    const [vehiculos, setVehiculos] = useState([]);
    const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
    const [qCatalogo, setQCatalogo] = useState("");
    const [soloActivos, setSoloActivos] = useState(true);

    const [modalVehiculo, setModalVehiculo] = useState(false);
    const [vehiculoDraft, setVehiculoDraft] = useState(emptyVehiculo);
    const [fichaTexto, setFichaTexto] = useState("{}");
    const [imagenesTexto, setImagenesTexto] = useState("");
    const [guardandoVehiculo, setGuardandoVehiculo] = useState(false);
    const [errorVehiculo, setErrorVehiculo] = useState("");

    const resumenHorarios = useMemo(() => {
        return DIAS.filter((d) => horarios?.[d.id]?.activo)
            .map((d) => {
                const h = horarios[d.id];
                const hasta = h.hastaDia
                    ? ` → ${DIAS.find((x) => x.id === h.hastaDia)?.label} ${h.fin}`
                    : ` - ${h.fin}`;

                return `${d.label} ${h.inicio}${hasta}`;
            })
            .join(" · ");
    }, [horarios]);

    const lineaActual = useMemo(() => {
        return lineasIA.find((item) => item.numero === numeroSeleccionado) || null;
    }, [lineasIA, numeroSeleccionado]);

    const totalDiasActivos = useMemo(() => {
        return DIAS.filter((d) => horarios?.[d.id]?.activo).length;
    }, [horarios]);

    const totalVehiculosActivos = useMemo(() => {
        return vehiculos.filter((item) => item.activo).length;
    }, [vehiculos]);

    const bloqueosLinea = useMemo(() => {
        return Array.isArray(lineaActual?.bloqueos_linea) ? lineaActual.bloqueos_linea : [];
    }, [lineaActual]);

    const lineaPuedeResponder = Boolean(lineaActual?.puede_responder_linea);

    const vehiculosFiltrados = useMemo(() => {
        const q = qCatalogo.trim().toLowerCase();

        return vehiculos.filter((v) => {
            if (soloActivos && !v.activo) return false;
            if (!q) return true;

            return [
                v.marca,
                v.modelo,
                v.ano,
                v.version,
                v.resumen,
                v.url_ficha_tecnica,
            ]
                .join(" ")
                .toLowerCase()
                .includes(q);
        });
    }, [vehiculos, qCatalogo, soloActivos]);

    async function cargarLineasIA() {
        try {
            const res = await api.iaLineas();
            const items = Array.isArray(res?.items) ? res.items : [];

            setLineasIA(items);

            if (!numeroSeleccionado && items.length) {
                setNumeroSeleccionado(items[0].numero);
            }
        } catch (error) {
            console.error(error);
            setMsgConfig("No se pudieron cargar las líneas de WhatsApp.");
        }
    }

    async function cargarConfig(numero = numeroSeleccionado) {
        const numeroNormalizado = normalizaTelefonoMx(numero);
        if (!numeroNormalizado) return;

        setCargandoConfig(true);
        setMsgConfig("");

        try {
            const res = await api.get(
                `/digitales/ia/config/${encodeURIComponent(numeroNormalizado)}/`
            );

            const item = res?.item || res || {};

            setSwiftActivo(Boolean(item.activo));
            setHorarios(
                item.horarios && typeof item.horarios === "object"
                    ? item.horarios
                    : horarioInicial()
            );

            setCampos({
                identidad: item.identidad || "",
                precios: item.precios || "",
                perfilamiento: item.perfilamiento || "",
                limites: item.limites || "",
                personalidad: item.personalidad || "",
            });

            setCondicionesFijas(item.condiciones_fijas || CONDICIONES_FIJAS);
        } catch (error) {
            console.error(error);
            setSwiftActivo(false);
            setHorarios(horarioInicial());
            setCampos(Object.fromEntries(secciones.map((s) => [s.id, ""])));
            setCondicionesFijas(CONDICIONES_FIJAS);
            setMsgConfig("No se pudo cargar la configuración. Se usará una configuración vacía.");
        } finally {
            setCargandoConfig(false);
        }
    }

    async function guardarConfig(extra = {}) {
        const numeroNormalizado = normalizaTelefonoMx(numeroSeleccionado);
        if (!numeroNormalizado) return;

        setGuardandoConfig(true);
        setMsgConfig("");

        try {
            await api.patch(`/digitales/ia/config/${encodeURIComponent(numeroNormalizado)}/`, {
                activo: swiftActivo,
                horarios,
                identidad: campos.identidad || "",
                precios: campos.precios || "",
                perfilamiento: campos.perfilamiento || "",
                limites: campos.limites || "",
                personalidad: campos.personalidad || "",
                condiciones_fijas: condicionesFijas || "",
                ...extra,
            });

            setMsgConfig("Configuración guardada correctamente.");

            setTimeout(() => {
                setMsgConfig("");
            }, 2500);
        } catch (error) {
            console.error(error);
            setMsgConfig(error?.message || "No se pudo guardar la configuración.");
        } finally {
            setGuardandoConfig(false);
        }
    }

    async function publicarConfig() {
        const numeroNormalizado = normalizaTelefonoMx(numeroSeleccionado);
        if (!numeroNormalizado) return;

        setGuardandoConfig(true);
        setMsgConfig("");

        try {
            await guardarConfig();

            await api.post(
                `/digitales/ia/config/${encodeURIComponent(numeroNormalizado)}/publicar/`,
                {}
            );

            await cargarLineasIA();
            setMsgConfig("Configuración publicada correctamente.");
        } catch (error) {
            console.error(error);
            setMsgConfig(error?.message || "No se pudo publicar la configuración.");
        } finally {
            setGuardandoConfig(false);
        }
    }

    async function cargarCatalogo() {
        setCargandoCatalogo(true);

        try {
            const res = await api.get(
                `/digitales/catalogo/vehiculos/?activo=${soloActivos ? "true" : "todos"}&limit=1000`
            );

            setVehiculos(Array.isArray(res?.items) ? res.items : []);
        } catch (error) {
            console.error(error);
            setVehiculos([]);
        } finally {
            setCargandoCatalogo(false);
        }
    }

    function actualizarHorario(diaId, campo, valor) {
        setHorarios((prev) => ({
            ...prev,
            [diaId]: {
                ...(prev[diaId] || {}),
                [campo]: valor,
            },
        }));
    }

    function abrirNuevoVehiculo() {
        setVehiculoDraft({
            ...emptyVehiculo,
            ano: new Date().getFullYear(),
        });
        setFichaTexto("{}");
        setImagenesTexto("");
        setErrorVehiculo("");
        setModalVehiculo(true);
    }

    function abrirEditarVehiculo(item) {
        const draft = {
            ...emptyVehiculo,
            ...item,
            ano: item.ano || new Date().getFullYear(),
            precio_lista: item.precio_lista || "",
            precio_contado: item.precio_contado || "",
            precio_financiado: item.precio_financiado || "",
            ficha_tecnica: safeObject(item.ficha_tecnica),
            imagenes: safeArray(item.imagenes),
        };

        setVehiculoDraft(draft);
        setFichaTexto(JSON.stringify(draft.ficha_tecnica || {}, null, 2));
        setImagenesTexto((draft.imagenes || []).join("\n"));
        setErrorVehiculo("");
        setModalVehiculo(true);
    }

    function cerrarModalVehiculo() {
        if (guardandoVehiculo) return;
        setModalVehiculo(false);
        setVehiculoDraft(emptyVehiculo);
        setFichaTexto("{}");
        setImagenesTexto("");
        setErrorVehiculo("");
    }

    function patchVehiculoDraft(campo, valor) {
        setVehiculoDraft((prev) => ({
            ...prev,
            [campo]: valor,
        }));
    }

    async function guardarVehiculo() {
        setErrorVehiculo("");

        const modelo = String(vehiculoDraft.modelo || "").trim();
        const ano = Number(vehiculoDraft.ano || 0);

        if (!modelo) {
            setErrorVehiculo("El modelo es obligatorio.");
            return;
        }

        if (!ano) {
            setErrorVehiculo("El año es obligatorio.");
            return;
        }

        const ficha = tryJsonParse(fichaTexto, null);

        if (!ficha || typeof ficha !== "object" || Array.isArray(ficha)) {
            setErrorVehiculo("La ficha técnica debe ser un JSON válido. Ejemplo: {\"Motor\":\"1.4L TSI\"}");
            return;
        }

        const imagenes = imagenesTexto
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);

        const payload = {
            marca: String(vehiculoDraft.marca || "Volkswagen").trim(),
            modelo,
            ano,
            version: String(vehiculoDraft.version || "").trim(),
            precio_lista: vehiculoDraft.precio_lista || null,
            precio_contado: vehiculoDraft.precio_contado || null,
            precio_financiado: vehiculoDraft.precio_financiado || null,
            resumen: String(vehiculoDraft.resumen || "").trim(),
            ficha_tecnica: ficha,
            url_ficha_tecnica: String(vehiculoDraft.url_ficha_tecnica || "").trim(),
            imagenes,
            ultima_actualizacion: vehiculoDraft.ultima_actualizacion || null,
            activo: Boolean(vehiculoDraft.activo),
        };

        setGuardandoVehiculo(true);

        try {
            if (vehiculoDraft.id) {
                await api.patch(`/digitales/catalogo/vehiculos/${vehiculoDraft.id}/`, payload);
            } else {
                await api.post("/digitales/catalogo/vehiculos/", payload);
            }

            cerrarModalVehiculo();
            await cargarCatalogo();
        } catch (error) {
            console.error(error);
            setErrorVehiculo(error?.message || "No se pudo guardar el vehículo.");
        } finally {
            setGuardandoVehiculo(false);
        }
    }

    async function desactivarVehiculo(item) {
        const ok = confirm(
            `¿Desactivar ${item.modelo} ${item.ano}${item.version ? ` ${item.version}` : ""}?`
        );

        if (!ok) return;

        try {
            await api.delete(`/digitales/catalogo/vehiculos/${item.id}/`);
            await cargarCatalogo();
        } catch (error) {
            console.error(error);
            alert(error?.message || "No se pudo desactivar el vehículo.");
        }
    }

    async function reactivarVehiculo(item) {
        try {
            await api.patch(`/digitales/catalogo/vehiculos/${item.id}/`, {
                activo: true,
            });
            await cargarCatalogo();
        } catch (error) {
            console.error(error);
            alert(error?.message || "No se pudo reactivar el vehículo.");
        }
    }

    useEffect(() => {
        cargarConfig(numeroSeleccionado);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [numeroSeleccionado]);

    useEffect(() => {
        cargarCatalogo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [soloActivos]);

    useEffect(() => {
        cargarLineasIA();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6">
            <div className="mb-6 rounded-xl bg-[#0a1f44] px-6 py-6 text-white md:px-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-black md:text-3xl">
                            Panel de Inteligencias Artificiales
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setTab("config")}
                            className={[
                                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                                tab === "config"
                                    ? "bg-white text-[#131E5C]"
                                    : "bg-white/10 text-white hover:bg-white/20",
                            ].join(" ")}
                        >
                            <Bot className="h-4 w-4" />
                            Configuración IA
                        </button>

                        <button
                            type="button"
                            onClick={() => setTab("catalogo")}
                            className={[
                                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                                tab === "catalogo"
                                    ? "bg-white text-[#131E5C]"
                                    : "bg-white/10 text-white hover:bg-white/20",
                            ].join(" ")}
                        >
                            <Car className="h-4 w-4" />
                            Catálogo vehículos
                        </button>
                    </div>
                </div>
            </div>

            {tab === "config" ? (
                <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                            <div className="text-xs font-black uppercase text-gray-400">Línea</div>
                            <div className="mt-1 truncate text-sm font-black text-[#0a1f44]">
                                {lineaActual?.asesor_digital || "Sin línea"}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                                {lineaActual?.agencia || "—"} · {numeroSeleccionado || "—"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                            <div className="text-xs font-black uppercase text-gray-400">Estado operativo</div>
                            <div className={["mt-1 text-sm font-black", lineaPuedeResponder ? "text-emerald-700" : "text-red-600"].join(" ")}>
                                {lineaPuedeResponder ? "Puede responder" : "No responderá"}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                                {bloqueosLinea.length ? bloqueosLinea.join(" · ") : "Configuración activa y dentro de horario"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                            <div className="text-xs font-black uppercase text-gray-400">Horario</div>
                            <div className="mt-1 text-sm font-black text-[#0a1f44]">
                                {totalDiasActivos} días activos
                            </div>
                            <div className="truncate text-xs text-gray-500">
                                {lineaActual?.en_horario ? "En horario ahora" : "Fuera de horario ahora"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                            <div className="text-xs font-black uppercase text-gray-400">Catálogo IA</div>
                            <div className="mt-1 text-sm font-black text-[#0a1f44]">
                                {totalVehiculosActivos} vehículos activos
                            </div>
                            <div className="truncate text-xs text-gray-500">
                                Fuente real de precios
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white px-6 py-5 shadow">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
                            <div className="min-w-[240px]">
                                <label className="mb-1 block text-sm font-black text-[#0a1f44]">
                                    Numero a configurar
                                </label>

                                <select
                                    value={numeroSeleccionado}
                                    onChange={(e) => setNumeroSeleccionado(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-[#0a1f44] outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                                >
                                    {lineasIA.map((item) => (
                                        <option key={item.numero} value={item.numero}>
                                            {item.label} · {item.numero}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-black text-[#0a1f44]">
                                    IA activa
                                </label>

                                <div className="flex items-center gap-3">
                                    <Toggle value={swiftActivo} onChange={setSwiftActivo} />
                                    <span
                                        className={[
                                            "text-sm font-black",
                                            swiftActivo ? "text-[#131E5C]" : "text-gray-400",
                                        ].join(" ")}
                                    >
                                        {swiftActivo ? "Activo" : "Inactivo"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="block text-sm font-black text-[#0a1f44]">
                                        Horarios activos
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setMostrarHorarios((v) => !v)}
                                        className="inline-flex items-center gap-1 text-sm font-bold text-[#131E5C] hover:underline"
                                    >
                                        {mostrarHorarios ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                        {mostrarHorarios ? "Cerrar" : "Configurar"}
                                    </button>
                                </div>

                                {!mostrarHorarios ? (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {resumenHorarios || "Sin días activos configurados"}
                                    </p>
                                ) : null}

                                {mostrarHorarios ? (
                                    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                                        <div className="grid grid-cols-[70px_1fr_1fr_1fr_70px] gap-2 bg-[#0a1f44] px-4 py-2 text-xs font-bold text-white">
                                            <span>Día</span>
                                            <span>Desde</span>
                                            <span>Hasta</span>
                                            <span>Termina</span>
                                            <span className="text-center">Activo</span>
                                        </div>

                                        {DIAS.map((dia, idx) => {
                                            const h = horarios[dia.id] || {};

                                            return (
                                                <div
                                                    key={dia.id}
                                                    className={[
                                                        "grid grid-cols-[70px_1fr_1fr_1fr_70px] items-center gap-2 px-4 py-2.5 text-sm",
                                                        idx % 2 === 0 ? "bg-white" : "bg-gray-50",
                                                        !h.activo ? "opacity-50" : "",
                                                    ].join(" ")}
                                                >
                                                    <span className="font-bold text-[#0a1f44]">
                                                        {dia.label}
                                                    </span>

                                                    <input
                                                        type="time"
                                                        value={h.inicio || "09:00"}
                                                        disabled={!h.activo}
                                                        onChange={(e) =>
                                                            actualizarHorario(dia.id, "inicio", e.target.value)
                                                        }
                                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[#131E5C]/20 disabled:cursor-not-allowed"
                                                    />

                                                    <input
                                                        type="time"
                                                        value={h.fin || "18:00"}
                                                        disabled={!h.activo}
                                                        onChange={(e) =>
                                                            actualizarHorario(dia.id, "fin", e.target.value)
                                                        }
                                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[#131E5C]/20 disabled:cursor-not-allowed"
                                                    />

                                                    <select
                                                        value={h.hastaDia || ""}
                                                        disabled={!h.activo}
                                                        onChange={(e) =>
                                                            actualizarHorario(
                                                                dia.id,
                                                                "hastaDia",
                                                                e.target.value || null
                                                            )
                                                        }
                                                        className="w-full rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-[#131E5C]/20 disabled:cursor-not-allowed"
                                                    >
                                                        <option value="">Mismo día</option>
                                                        {DIAS.filter((d) => d.id !== dia.id).map((d) => (
                                                            <option key={d.id} value={d.id}>
                                                                {d.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <div className="flex justify-center">
                                                        <MiniToggle
                                                            value={Boolean(h.activo)}
                                                            onChange={(v) =>
                                                                actualizarHorario(dia.id, "activo", v)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => cargarConfig(numeroSeleccionado)}
                                disabled={cargandoConfig || guardandoConfig}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 px-4 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C]/5 disabled:opacity-60"
                            >
                                {cargandoConfig ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Recargar
                            </button>

                            <button
                                type="button"
                                onClick={() => guardarConfig()}
                                disabled={guardandoConfig}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a1f44] disabled:opacity-60"
                            >
                                {guardandoConfig ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Guardar configuración
                            </button>
                            <button
                                type="button"
                                onClick={publicarConfig}
                                disabled={guardandoConfig}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                                {guardandoConfig ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Publicar y encender IA
                            </button>
                        </div>

                        {msgConfig ? (
                            <div className="mt-4 rounded-lg border border-[#131E5C]/10 bg-[#131E5C]/5 px-4 py-3 text-sm font-semibold text-[#131E5C]">
                                {msgConfig}
                            </div>
                        ) : null}
                    </div>

                    {secciones.map((seccion) => (
                        <div key={seccion.id} className="rounded-xl bg-white px-6 py-5 shadow">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-lg font-black text-[#0a1f44]">
                                    {seccion.titulo}
                                </h2>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditando((prev) => ({
                                                ...prev,
                                                [seccion.id]: true,
                                            }))
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" />
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditando((prev) => ({
                                                ...prev,
                                                [seccion.id]: false,
                                            }));
                                            guardarConfig();
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        Aplicar
                                    </button>
                                </div>
                            </div>

                            <textarea
                                disabled={!editando[seccion.id]}
                                value={campos[seccion.id]}
                                onChange={(e) =>
                                    setCampos((prev) => ({
                                        ...prev,
                                        [seccion.id]: e.target.value,
                                    }))
                                }
                                placeholder={seccion.placeholder}
                                rows={4}
                                className={[
                                    "w-full resize-y rounded-lg border px-4 py-3 text-sm font-medium text-gray-700 outline-none transition focus:ring-2 focus:ring-[#131E5C]/20",
                                    editando[seccion.id]
                                        ? "border-[#131E5C]/30 bg-white"
                                        : "border-gray-200 bg-gray-50",
                                ].join(" ")}
                            />
                        </div>
                    ))}

                    <div className="rounded-xl bg-white px-6 py-5 shadow">
                        <h2 className="mb-3 text-lg font-black text-[#0a1f44]">
                            Condiciones fijas no negociables
                        </h2>

                        <textarea
                            value={condicionesFijas}
                            onChange={(e) => setCondicionesFijas(e.target.value)}
                            rows={6}
                            className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>
                </div>
            ) : null}

            {tab === "catalogo" ? (
                <div className="rounded-xl bg-white shadow">
                    <div className="border-b border-black/10 px-5 py-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-black text-[#0a1f44]">
                                    Catálogo de vehículos
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Este catálogo será la fuente de precios, fichas e imágenes para la IA.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={qCatalogo}
                                        onChange={(e) => setQCatalogo(e.target.value)}
                                        placeholder="Buscar modelo, versión..."
                                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20 sm:w-72"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSoloActivos((v) => !v)}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-bold text-[#131E5C] hover:bg-gray-50"
                                >
                                    <MiniToggle value={soloActivos} onChange={setSoloActivos} />
                                    Solo activos
                                </button>

                                <button
                                    type="button"
                                    onClick={cargarCatalogo}
                                    disabled={cargandoCatalogo}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 px-4 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C]/5 disabled:opacity-60"
                                >
                                    {cargandoCatalogo ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                    Recargar
                                </button>

                                <button
                                    type="button"
                                    onClick={abrirNuevoVehiculo}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 text-sm font-bold text-white hover:bg-[#0a1f44]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nuevo vehículo
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-[#0a1f44] text-left text-xs uppercase tracking-wide text-white">
                                    <th className="px-4 py-3">Vehículo</th>
                                    <th className="px-4 py-3">Versión</th>
                                    <th className="px-4 py-3">Precio lista</th>
                                    <th className="px-4 py-3">Contado</th>
                                    <th className="px-4 py-3">Financiado</th>
                                    <th className="px-4 py-3">Ficha</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {cargandoCatalogo ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-[#131E5C]" />
                                            Cargando catálogo...
                                        </td>
                                    </tr>
                                ) : vehiculosFiltrados.length ? (
                                    vehiculosFiltrados.map((item) => (
                                        <tr key={item.id} className="border-b border-black/5 hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-black text-[#0a1f44]">
                                                    {item.marca || "Volkswagen"} {item.modelo}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Año {item.ano || "—"}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 font-semibold text-gray-700">
                                                {item.version || "General"}
                                            </td>

                                            <td className="px-4 py-3 font-bold text-gray-700">
                                                {money(item.precio_lista)}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {money(item.precio_contado)}
                                            </td>

                                            <td className="px-4 py-3 text-gray-600">
                                                {money(item.precio_financiado)}
                                            </td>

                                            <td className="px-4 py-3">
                                                {item.url_ficha_tecnica ? (
                                                    <a
                                                        href={item.url_ficha_tecnica}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-bold text-[#131E5C] hover:underline"
                                                    >
                                                        Ver ficha
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">Sin ficha</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span
                                                    className={[
                                                        "inline-flex rounded-full px-3 py-1 text-xs font-black",
                                                        item.activo
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-gray-200 text-gray-600",
                                                    ].join(" ")}
                                                >
                                                    {item.activo ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => abrirEditarVehiculo(item)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#131E5C]/20 text-[#131E5C] hover:bg-[#131E5C]/5"
                                                        title="Editar"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>

                                                    {item.activo ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => desactivarVehiculo(item)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                                                            title="Desactivar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => reactivarVehiculo(item)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                            title="Reactivar"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                            No hay vehículos para mostrar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            <Modal
                open={modalVehiculo}
                title={vehiculoDraft.id ? "Editar vehículo" : "Nuevo vehículo"}
                onClose={cerrarModalVehiculo}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={cerrarModalVehiculo}
                            disabled={guardandoVehiculo}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={guardarVehiculo}
                            disabled={guardandoVehiculo}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#0a1f44] disabled:opacity-60"
                        >
                            {guardandoVehiculo ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar vehículo
                        </button>
                    </>
                }
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Marca
                        </label>
                        <input
                            value={vehiculoDraft.marca}
                            onChange={(e) => patchVehiculoDraft("marca", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Modelo
                        </label>
                        <input
                            value={vehiculoDraft.modelo}
                            onChange={(e) => patchVehiculoDraft("modelo", e.target.value)}
                            placeholder="Jetta, Taos, Transporter..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Año
                        </label>
                        <input
                            type="number"
                            value={vehiculoDraft.ano}
                            onChange={(e) => patchVehiculoDraft("ano", Number(e.target.value || 0))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Versión
                        </label>
                        <input
                            value={vehiculoDraft.version}
                            onChange={(e) => patchVehiculoDraft("version", e.target.value)}
                            placeholder="Trendline, Comfortline, Highline..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Precio lista
                        </label>
                        <input
                            inputMode="numeric"
                            value={vehiculoDraft.precio_lista}
                            onChange={(e) =>
                                patchVehiculoDraft("precio_lista", parseNumberInput(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Precio contado
                        </label>
                        <input
                            inputMode="numeric"
                            value={vehiculoDraft.precio_contado}
                            onChange={(e) =>
                                patchVehiculoDraft("precio_contado", parseNumberInput(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Precio financiado
                        </label>
                        <input
                            inputMode="numeric"
                            value={vehiculoDraft.precio_financiado}
                            onChange={(e) =>
                                patchVehiculoDraft("precio_financiado", parseNumberInput(e.target.value))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Última actualización
                        </label>
                        <input
                            type="date"
                            value={vehiculoDraft.ultima_actualizacion || ""}
                            onChange={(e) =>
                                patchVehiculoDraft("ultima_actualizacion", e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            URL ficha técnica / PDF
                        </label>
                        <input
                            value={vehiculoDraft.url_ficha_tecnica}
                            onChange={(e) =>
                                patchVehiculoDraft("url_ficha_tecnica", e.target.value)
                            }
                            placeholder="https://..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Resumen comercial
                        </label>
                        <textarea
                            value={vehiculoDraft.resumen}
                            onChange={(e) => patchVehiculoDraft("resumen", e.target.value)}
                            rows={3}
                            placeholder="Descripción breve que la IA puede usar para explicar el vehículo..."
                            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Ficha técnica en JSON
                        </label>
                        <textarea
                            value={fichaTexto}
                            onChange={(e) => setFichaTexto(e.target.value)}
                            rows={6}
                            placeholder='{"Motor":"1.4L TSI","Potencia":"150 hp","Transmisión":"Tiptronic 8"}'
                            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-black uppercase text-[#0a1f44]">
                            Imágenes
                        </label>
                        <textarea
                            value={imagenesTexto}
                            onChange={(e) => setImagenesTexto(e.target.value)}
                            rows={4}
                            placeholder={"Una URL por línea:\nhttps://...\nhttps://..."}
                            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#131E5C]/20"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <Toggle
                                value={Boolean(vehiculoDraft.activo)}
                                onChange={(v) => patchVehiculoDraft("activo", v)}
                            />
                            <div>
                                <div className="text-sm font-black text-[#0a1f44]">
                                    Vehículo activo
                                </div>
                                <div className="text-xs text-gray-500">
                                    Si está inactivo, la IA no lo debe usar en respuestas.
                                </div>
                            </div>
                        </div>
                    </div>

                    {errorVehiculo ? (
                        <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {errorVehiculo}
                        </div>
                    ) : null}
                </div>
            </Modal>
        </div>
    );
}