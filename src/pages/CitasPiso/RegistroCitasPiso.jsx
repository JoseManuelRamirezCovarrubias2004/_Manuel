import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    CircleDashed,
    Clock3,
    Filter,
    Loader2,
    MessageCircle,
    Search,
    Send,
    Sparkles,
    Target,
    TrendingUp,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";

const RESULTADOS = [
    { value: "pendiente", label: "Esperando respuesta", grupo: "pendiente" },
    { value: "respuesta_positiva", label: "Respondió con interés", grupo: "positivo" },
    { value: "respuesta_neutral", label: "Respondió", grupo: "neutral" },
    { value: "respuesta_negativa", label: "Respondió negativamente", grupo: "negativo" },
    { value: "sin_respuesta", label: "No respondió", grupo: "sin_respuesta" },
    { value: "fallido", label: "Falló el envío", grupo: "fallido" },
    { value: "no_aplica", label: "No aplica", grupo: "no_aplica" },
    { value: "cita_agendada", label: "Cita agendada", grupo: "positivo" },
];

const RESULT_STYLES = {
    positivo: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-sky-50 text-sky-700 border-sky-200",
    negativo: "bg-rose-50 text-rose-700 border-rose-200",
    sin_respuesta: "bg-amber-50 text-amber-700 border-amber-200",
    pendiente: "bg-slate-50 text-slate-600 border-slate-200",
    fallido: "bg-red-50 text-red-700 border-red-200",
    no_aplica: "bg-violet-50 text-violet-700 border-violet-200",
};

function getResultadoConfig(value) {
    return (
        RESULTADOS.find((item) => item.value === value) || {
            value: value || "pendiente",
            label: String(value || "Sin resultado")
                .replaceAll("_", " ")
                .replace(/\b\w/g, (letter) => letter.toUpperCase()),
            grupo: "pendiente",
        }
    );
}

function isoDate(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
}

function formatDate(value) {
    if (!value) return "—";

    try {
        return new Intl.DateTimeFormat("es-MX", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function formatShortDate(value) {
    if (!value) return "—";

    try {
        return new Intl.DateTimeFormat("es-MX", {
            day: "2-digit",
            month: "short",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function formatNumber(value) {
    return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function percent(numerator, denominator) {
    const a = Number(numerator || 0);
    const b = Number(denominator || 0);
    if (!b) return 0;
    return Math.round((a / b) * 1000) / 10;
}

function toneFromRate(value) {
    if (value >= 65) return "text-emerald-600";
    if (value >= 35) return "text-amber-600";
    return "text-rose-600";
}

function buildAdvisorMetrics(item) {
    const mensajes = Number(item?.mensajes || 0);
    const respuestas = Number(item?.respuestas || 0);
    const positivas = Number(item?.positivas || item?.respuestas_positivas || 0);
    const sinRespuesta = Number(item?.sin_respuesta || 0);
    const fallidos = Number(item?.fallidos || 0);
    const plantillas = Number(item?.plantillas || 0);
    const abiertas = Math.max(mensajes - respuestas - sinRespuesta - fallidos, 0);

    return {
        ...item,
        mensajes,
        respuestas,
        positivas,
        sin_respuesta: sinRespuesta,
        fallidos,
        plantillas,
        abiertas,
        tasa_respuesta_real: percent(respuestas, mensajes),
        tasa_positiva_sobre_mensajes: percent(positivas, mensajes),
        tasa_positiva_sobre_respuestas: percent(positivas, respuestas),
    };
}

function ResultBadge({ value, label, grupo }) {
    const config = getResultadoConfig(value);
    const group = grupo || config.grupo || "pendiente";
    const style = RESULT_STYLES[group] || RESULT_STYLES.pendiente;

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
            {label || config.label}
        </span>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
            <Activity className="mb-3 text-slate-400" size={28} />
            <p className="text-sm text-slate-600">{text}</p>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, detail, accent = "from-[#0f1e61] to-[#2238a7]" }) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,30,97,0.07)]">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-2 text-[28px] font-semibold leading-none text-slate-900">{value}</p>
                    {detail ? <p className="mt-2 text-xs text-slate-500">{detail}</p> : null}
                </div>
                <div className="rounded-2xl bg-[#131E5C]/10 p-3 text-[#131E5C]">
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

function SegmentedBar({ respuestas, positivas, sinRespuesta, abiertas }) {
    const total = Math.max(1, Number(respuestas || 0) + Number(positivas || 0) + Number(sinRespuesta || 0) + Number(abiertas || 0));
    const items = [
        { key: "respuestas", value: Math.max(0, Number(respuestas || 0) - Number(positivas || 0)), color: "bg-sky-400" },
        { key: "positivas", value: Number(positivas || 0), color: "bg-emerald-500" },
        { key: "sinRespuesta", value: Number(sinRespuesta || 0), color: "bg-amber-400" },
        { key: "abiertas", value: Number(abiertas || 0), color: "bg-slate-300" },
    ].filter((item) => item.value > 0);

    return (
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="flex h-full w-full overflow-hidden rounded-full">
                {items.map((item) => (
                    <div
                        key={item.key}
                        className={item.color}
                        style={{ width: `${(item.value / total) * 100}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

function PerformanceChart({ advisors }) {
    if (!advisors?.length) return <EmptyState text="No hay datos suficientes para construir la gráfica comparativa." />;

    const items = advisors.slice(0, 6);
    const maxMensajes = Math.max(1, ...items.map((item) => item.mensajes));
    const chartHeight = 210;
    const barWidth = 20;
    const gap = 20;
    const groupWidth = 88;
    const leftPad = 32;
    const bottomPad = 36;
    const topPad = 20;
    const width = leftPad + items.length * groupWidth + 12;
    const height = chartHeight + topPad + bottomPad;

    const linePoints = items
        .map((item, index) => {
            const x = leftPad + index * groupWidth + gap + barWidth * 1.5;
            const y = topPad + chartHeight - (item.tasa_respuesta_real / 100) * chartHeight;
            return `${x},${y}`;
        })
        .join(" ");

    const yTicks = [0, 25, 50, 75, 100];

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,30,97,0.06)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">Comparativo visual por asesor</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Barras: mensajes, respuestas y positivas. Línea: tasa real de respuesta.
                    </p>
                </div>
                <div className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                    <BarChart3 size={18} />
                </div>
            </div>

            <div className="mt-5 overflow-x-auto">
                <div className="min-w-[640px]">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
                        <defs>
                            <linearGradient id="vwBarMain" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#15236B" />
                                <stop offset="100%" stopColor="#2E49D1" />
                            </linearGradient>
                            <linearGradient id="vwBarMid" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#5EA8FF" />
                                <stop offset="100%" stopColor="#2B7FFF" />
                            </linearGradient>
                            <linearGradient id="vwBarPos" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#5AE0B7" />
                                <stop offset="100%" stopColor="#0FA57C" />
                            </linearGradient>
                            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {yTicks.map((tick) => {
                            const y = topPad + chartHeight - (tick / 100) * chartHeight;
                            return (
                                <g key={tick}>
                                    <line x1={leftPad} y1={y} x2={width - 8} y2={y} stroke="#E2E8F0" strokeDasharray="4 5" />
                                    <text x={2} y={y + 4} fontSize="10" fill="#64748B">{tick}%</text>
                                </g>
                            );
                        })}

                        {items.map((item, index) => {
                            const x = leftPad + index * groupWidth + gap;
                            const msgHeight = (item.mensajes / maxMensajes) * chartHeight;
                            const resHeight = (item.respuestas / maxMensajes) * chartHeight;
                            const posHeight = (item.positivas / maxMensajes) * chartHeight;
                            return (
                                <g key={item.numero_asesor}>
                                    <rect x={x} y={topPad + chartHeight - msgHeight} width={barWidth} height={msgHeight} rx="7" fill="url(#vwBarMain)" opacity="0.95" />
                                    <rect x={x + barWidth + 8} y={topPad + chartHeight - resHeight} width={barWidth} height={resHeight} rx="7" fill="url(#vwBarMid)" opacity="0.95" />
                                    <rect x={x + (barWidth + 8) * 2} y={topPad + chartHeight - posHeight} width={barWidth} height={posHeight} rx="7" fill="url(#vwBarPos)" opacity="0.98" />

                                    <text x={x + 30} y={height - 18} textAnchor="middle" fontSize="10" fill="#334155">
                                        {(item.asesor_digital || item.numero_asesor || "—").split(" ")[0]}
                                    </text>
                                    <text x={x + 30} y={height - 6} textAnchor="middle" fontSize="9" fill="#64748B">
                                        {item.tasa_respuesta_real}%
                                    </text>
                                </g>
                            );
                        })}

                        <polyline
                            points={linePoints}
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#softGlow)"
                        />
                        {items.map((item, index) => {
                            const cx = leftPad + index * groupWidth + gap + barWidth * 1.5;
                            const cy = topPad + chartHeight - (item.tasa_respuesta_real / 100) * chartHeight;
                            return (
                                <g key={`${item.numero_asesor}-dot`}>
                                    <circle cx={cx} cy={cy} r="5.5" fill="#FFF7ED" stroke="#F59E0B" strokeWidth="3" />
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#1B2B86]" /> Mensajes</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#2B7FFF]" /> Respuestas</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#0FA57C]" /> Positivas</span>
                <span className="inline-flex items-center gap-2"><span className="h-[3px] w-4 rounded-full bg-amber-500" /> Tasa real de respuesta</span>
            </div>
        </div>
    );
}

function TrendChart({ series }) {
    if (!series?.length) return <EmptyState text="No hay tendencia diaria para el periodo seleccionado." />;

    const maxValue = Math.max(
        1,
        ...series.flatMap((item) => [Number(item.mensajes || 0), Number(item.respuestas || 0)]),
    );

    const width = 700;
    const height = 260;
    const left = 36;
    const right = 20;
    const top = 16;
    const bottom = 38;
    const innerWidth = width - left - right;
    const innerHeight = height - top - bottom;
    const count = Math.max(1, series.length - 1);

    function pointX(index) {
        return left + (index / count) * innerWidth;
    }

    function pointY(value) {
        return top + innerHeight - (Number(value || 0) / maxValue) * innerHeight;
    }

    const msgPoints = series.map((item, index) => `${pointX(index)},${pointY(item.mensajes)}`).join(" ");
    const respPoints = series.map((item, index) => `${pointX(index)},${pointY(item.respuestas)}`).join(" ");

    const msgArea = `${left},${top + innerHeight} ${msgPoints} ${left + innerWidth},${top + innerHeight}`;

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,30,97,0.06)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">Tendencia de actividad</h3>
                    <p className="mt-1 text-sm text-slate-500">Evolución diaria de mensajes y respuestas durante el periodo filtrado.</p>
                </div>
                <div className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                    <TrendingUp size={18} />
                </div>
            </div>

            <div className="mt-5 overflow-x-auto">
                <div className="min-w-[720px]">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
                        <defs>
                            <linearGradient id="msgArea" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#2136A6" stopOpacity="0.32" />
                                <stop offset="100%" stopColor="#2136A6" stopOpacity="0.02" />
                            </linearGradient>
                        </defs>

                        {[0, 25, 50, 75, 100].map((tick) => {
                            const value = (maxValue * tick) / 100;
                            const y = pointY(value);
                            return (
                                <g key={tick}>
                                    <line x1={left} y1={y} x2={width - right} y2={y} stroke="#E2E8F0" strokeDasharray="4 5" />
                                    <text x={6} y={y + 4} fontSize="10" fill="#64748B">{Math.round(value)}</text>
                                </g>
                            );
                        })}

                        <polygon points={msgArea} fill="url(#msgArea)" />
                        <polyline points={msgPoints} fill="none" stroke="#162A84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points={respPoints} fill="none" stroke="#0FA57C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                        {series.map((item, index) => (
                            <g key={`${item.fecha}-${index}`}>
                                <circle cx={pointX(index)} cy={pointY(item.mensajes)} r="3.8" fill="#162A84" />
                                <circle cx={pointX(index)} cy={pointY(item.respuestas)} r="3.8" fill="#0FA57C" />
                                <text x={pointX(index)} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748B">
                                    {formatShortDate(item.fecha)}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#162A84]" /> Mensajes</span>
                <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Respuestas</span>
            </div>
        </div>
    );
}

function ClientDrawer({ open, client, onClose, onResultChanged }) {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState("");

    useEffect(() => {
        if (!open || !client?.expediente_id) return undefined;

        let active = true;
        setLoading(true);
        setError("");
        setDetail(null);

        api
            .digitalesAnaliticaCliente(client.expediente_id, { numero_asesor: client.numero_asesor })
            .then((response) => {
                if (active) setDetail(response);
            })
            .catch((err) => {
                if (active) setError(err?.message || "No fue posible cargar la bitácora.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [open, client?.expediente_id, client?.numero_asesor]);

    async function updateResult(eventoId, resultado) {
        const config = getResultadoConfig(resultado);
        setUpdatingId(eventoId);
        setError("");

        try {
            const response = await api.digitalesAnaliticaActualizarResultado(eventoId, {
                resultado: config.value,
                resultado_label: config.label,
                grupo_resultado: config.grupo,
            });

            setDetail((current) => ({
                ...current,
                eventos: (current?.eventos || []).map((item) => (item.id === eventoId ? response.evento : item)),
            }));

            onResultChanged?.();
        } catch (err) {
            setError(err?.message || "No fue posible actualizar el resultado.");
        } finally {
            setUpdatingId("");
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40" role="dialog" aria-modal="true">
            <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar panel" />
            <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#131E5C]">Bitácora analítica</p>
                            <h2 className="mt-1 text-xl font-semibold text-slate-900">{client?.nombre || "Prospecto"}</h2>
                            <p className="mt-1 text-sm text-slate-500">{client?.telefono}</p>
                        </div>
                        <button className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="space-y-5 p-5">
                    {loading ? (
                        <div className="flex min-h-52 items-center justify-center text-slate-500">
                            <Loader2 className="mr-2 animate-spin" size={20} /> Cargando bitácora...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 p-3">
                                    <p className="text-xs text-slate-500">Estado actual</p>
                                    <p className="mt-1 font-medium text-slate-900">{detail?.cliente?.estado || "Sin estado"}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 p-3">
                                    <p className="text-xs text-slate-500">Vehículo de interés</p>
                                    <p className="mt-1 font-medium text-slate-900">{detail?.cliente?.auto_interes || "Sin definir"}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(detail?.eventos || []).map((item) => (
                                    <article key={item.id} className="rounded-3xl border border-slate-200 p-4 shadow-sm">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.tipo_label}</span>
                                                    <ResultBadge value={item.resultado} label={item.resultado_label} grupo={item.resultado_grupo} />
                                                </div>
                                                <h3 className="mt-2 font-medium text-slate-900">{item.accion}</h3>
                                                {item.detalle ? <p className="mt-1 text-sm text-slate-600">{item.detalle}</p> : null}
                                            </div>
                                            <time className="text-xs text-slate-500">{formatDate(item.creado)}</time>
                                        </div>

                                        {item.respuesta_texto ? (
                                            <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                                                <p className="text-xs font-medium text-slate-500">Respuesta del cliente</p>
                                                <p className="mt-1 text-sm text-slate-700">{item.respuesta_texto}</p>
                                                <p className="mt-2 text-xs text-slate-500">Tiempo: {item.tiempo_respuesta_label}</p>
                                            </div>
                                        ) : null}

                                        {[
                                            "mensaje",
                                            "plantilla",
                                            "media",
                                        ].includes(item.tipo) ? (
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <label className="text-xs text-slate-500" htmlFor={`resultado-${item.id}`}>
                                                    Corregir clasificación:
                                                </label>
                                                <select
                                                    id={`resultado-${item.id}`}
                                                    value={item.resultado}
                                                    disabled={updatingId === item.id}
                                                    onChange={(event) => updateResult(item.id, event.target.value)}
                                                    className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700"
                                                >
                                                    {RESULTADOS.map((resultado) => (
                                                        <option key={resultado.value} value={resultado.value}>
                                                            {resultado.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {updatingId === item.id ? <Loader2 className="animate-spin text-slate-400" size={16} /> : null}
                                            </div>
                                        ) : null}
                                    </article>
                                ))}

                                {!detail?.eventos?.length ? <EmptyState text="Todavía no hay acciones registradas para este cliente." /> : null}
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </div>
    );
}

export default function DigitalesRendimiento() {
    const [filters, setFilters] = useState({
        fecha_desde: isoDate(29),
        fecha_hasta: isoDate(0),
        numero_asesor: "",
        resultado: "",
        tipo: "",
        buscar: "",
        page: 1,
        page_size: 25,
    });
    const [searchDraft, setSearchDraft] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [activeAdvisor, setActiveAdvisor] = useState("");
    const [advisorDetail, setAdvisorDetail] = useState(null);
    const [advisorDetailLoading, setAdvisorDetailLoading] = useState(false);
    const [advisorDetailError, setAdvisorDetailError] = useState("");

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        api
            .digitalesAnaliticaAsesores(filters)
            .then((response) => {
                if (!active) return;
                setData(response);
            })
            .catch((err) => {
                if (active) setError(err?.message || "No fue posible cargar la analítica.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [filters, reloadKey]);

    const advisors = useMemo(() => {
        return (data?.asesores || []).map(buildAdvisorMetrics).sort((a, b) => {
            if (b.tasa_respuesta_real !== a.tasa_respuesta_real) return b.tasa_respuesta_real - a.tasa_respuesta_real;
            if (b.positivas !== a.positivas) return b.positivas - a.positivas;
            return b.mensajes - a.mensajes;
        });
    }, [data?.asesores]);

    const summary = useMemo(() => buildAdvisorMetrics(data?.resumen || {}), [data?.resumen]);

    useEffect(() => {
        if (filters.numero_asesor) {
            setActiveAdvisor(filters.numero_asesor);
            return;
        }

        if (!advisors.length) {
            setActiveAdvisor("");
            return;
        }

        const exists = advisors.some((item) => item.numero_asesor === activeAdvisor);
        if (!activeAdvisor || !exists) {
            setActiveAdvisor(advisors[0].numero_asesor);
        }
    }, [filters.numero_asesor, advisors, activeAdvisor]);

    useEffect(() => {
        if (!activeAdvisor) {
            setAdvisorDetail(null);
            setAdvisorDetailError("");
            return undefined;
        }

        let active = true;
        setAdvisorDetailLoading(true);
        setAdvisorDetailError("");

        api
            .digitalesAnaliticaAsesores({
                ...filters,
                numero_asesor: activeAdvisor,
                page: 1,
                page_size: 100,
            })
            .then((response) => {
                if (active) setAdvisorDetail(response);
            })
            .catch((err) => {
                if (active) setAdvisorDetailError(err?.message || "No fue posible cargar el detalle del asesor.");
            })
            .finally(() => {
                if (active) setAdvisorDetailLoading(false);
            });

        return () => {
            active = false;
        };
    }, [activeAdvisor, filters.fecha_desde, filters.fecha_hasta, filters.resultado, filters.tipo, filters.buscar, reloadKey]);

    const activeAdvisorRow = useMemo(() => {
        return advisors.find((item) => item.numero_asesor === activeAdvisor) || null;
    }, [advisors, activeAdvisor]);

    const activeAdvisorSummary = useMemo(() => buildAdvisorMetrics(advisorDetail?.resumen || activeAdvisorRow || {}), [advisorDetail?.resumen, activeAdvisorRow]);

    function setFilter(name, value) {
        setFilters((current) => ({ ...current, [name]: value, page: 1 }));
    }

    function applyPreset(days) {
        setFilters((current) => ({
            ...current,
            fecha_desde: isoDate(days - 1),
            fecha_hasta: isoDate(0),
            page: 1,
        }));
    }

    function submitSearch(event) {
        event.preventDefault();
        setFilter("buscar", searchDraft.trim());
    }

    const chartSeries = data?.actividad_diaria || [];
    const clientsOfAdvisor = advisorDetail?.clientes || [];
    const totalClientsSelectedAdvisor = advisorDetail?.paginacion?.total || clientsOfAdvisor.length || 0;

    return (
        <div className="min-h-full bg-[#F3F6FB] p-4 md:p-6">
            <div className="mx-auto max-w-[1600px] space-y-6">
                <section className="relative overflow-hidden rounded-[30px] border border-[#D6DDEC] bg-white shadow-[0_20px_50px_rgba(19,30,92,0.08)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(28,66,200,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(0,128,255,0.08),transparent_28%)]" />
                    <div className="relative p-5 md:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div className="max-w-3xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#D8DFF0] bg-[#EEF2FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#131E5C]">
                                    <Sparkles size={14} /> Analítica comercial de WhatsApp
                                </div>
                                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                                    Rendimiento digital con métricas reales por asesor
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    La tasa de respuesta se calcula sobre mensajes enviados y ya no sobre casos cerrados.
                                    Además, el flujo se reorganiza por asesor para que primero evalúes desempeño y después
                                    profundices en la cartera de clientes atendidos.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[470px]">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Periodo</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{filters.fecha_desde} → {filters.fecha_hasta}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Mensajes</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatNumber(summary.mensajes)}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">Tasa real</p>
                                    <p className={`mt-1 text-sm font-semibold ${toneFromRate(summary.tasa_respuesta_real)}`}>{summary.tasa_respuesta_real}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[26px] border border-[#DCE3F1] bg-[#F8FAFE] p-4 md:p-5">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Filter size={16} /> Filtros de análisis
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                                <label className="text-sm text-slate-600">
                                    Desde
                                    <input
                                        type="date"
                                        value={filters.fecha_desde}
                                        onChange={(e) => setFilter("fecha_desde", e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                    />
                                </label>
                                <label className="text-sm text-slate-600">
                                    Hasta
                                    <input
                                        type="date"
                                        value={filters.fecha_hasta}
                                        onChange={(e) => setFilter("fecha_hasta", e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                    />
                                </label>
                                <label className="text-sm text-slate-600">
                                    Asesor / línea
                                    <select
                                        value={filters.numero_asesor}
                                        onChange={(e) => setFilter("numero_asesor", e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                    >
                                        <option value="">Todas mis líneas</option>
                                        {(data?.lineas || []).map((item) => (
                                            <option key={item.numero} value={item.numero}>
                                                {item.asesor_digital} · {item.agencia}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm text-slate-600">
                                    Resultado
                                    <select
                                        value={filters.resultado}
                                        onChange={(e) => setFilter("resultado", e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                    >
                                        <option value="">Todos</option>
                                        {RESULTADOS.map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm text-slate-600">
                                    Acción
                                    <select
                                        value={filters.tipo}
                                        onChange={(e) => setFilter("tipo", e.target.value)}
                                        className="mt-1 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                    >
                                        <option value="">Todas</option>
                                        {(data?.catalogos?.tipos || []).map((item) => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <form onSubmit={submitSearch} className="text-sm text-slate-600">
                                    Buscar cliente
                                    <div className="mt-1 flex gap-2">
                                        <input
                                            value={searchDraft}
                                            onChange={(e) => setSearchDraft(e.target.value)}
                                            placeholder="Nombre o teléfono"
                                            className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-slate-900"
                                        />
                                        <button className="rounded-2xl bg-[#131E5C] px-3 text-white" aria-label="Buscar">
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[7, 30, 90].map((days) => (
                                    <button
                                        key={days}
                                        type="button"
                                        onClick={() => applyPreset(days)}
                                        className="rounded-full border border-[#D7DDEB] bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                    >
                                        Últimos {days} días
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {error ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={20} /> {error}
                    </div>
                ) : null}

                {loading && !data ? (
                    <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                        <Loader2 className="mr-2 animate-spin" size={22} /> Calculando indicadores...
                    </div>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                            <MetricCard
                                icon={Users}
                                label="Clientes atendidos"
                                value={formatNumber(summary.clientes)}
                                detail={`${formatNumber(summary.acciones)} acciones registradas`}
                                accent="from-[#0F1E61] to-[#3048D8]"
                            />
                            <MetricCard
                                icon={Send}
                                label="Mensajes enviados"
                                value={formatNumber(summary.mensajes)}
                                detail={`${formatNumber(summary.plantillas)} plantillas · ${formatNumber(summary.fallidos)} fallidos`}
                                accent="from-[#1B2B86] to-[#4662F3]"
                            />
                            <MetricCard
                                icon={MessageCircle}
                                label="Tasa real de respuesta"
                                value={`${summary.tasa_respuesta_real}%`}
                                detail={`${formatNumber(summary.respuestas)} respuestas de ${formatNumber(summary.mensajes)} mensajes`}
                                accent="from-[#0C5FC4] to-[#34A0FF]"
                            />
                            <MetricCard
                                icon={Target}
                                label="Conversión positiva"
                                value={`${summary.tasa_positiva_sobre_mensajes}%`}
                                detail={`${formatNumber(summary.positivas)} positivas · ${summary.tasa_positiva_sobre_respuestas}% sobre respuestas`}
                                accent="from-[#0B8B64] to-[#34D399]"
                            />
                            <MetricCard
                                icon={Clock3}
                                label="Tiempo promedio"
                                value={summary.promedio_respuesta_label || "—"}
                                detail={`Ventana sin respuesta: ${data?.horas_sin_respuesta || 48} h`}
                                accent="from-[#6D28D9] to-[#8B5CF6]"
                            />
                            <MetricCard
                                icon={CircleDashed}
                                label="Conversaciones abiertas"
                                value={formatNumber(summary.abiertas)}
                                detail={`${formatNumber(summary.sin_respuesta)} sin respuesta cerrada`}
                                accent="from-[#9A6700] to-[#F59E0B]"
                            />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                            <PerformanceChart advisors={advisors} />
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,30,97,0.06)]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-slate-900">Plantillas con mejor respuesta</h3>
                                        <p className="mt-1 text-sm text-slate-500">La tasa se calcula como respuestas / envíos de plantilla.</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                                        <Sparkles size={18} />
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3">
                                    {(data?.plantillas || []).map((item) => {
                                        const tasaReal = percent(item.respuestas, item.envios);
                                        const positivaSobreEnvios = percent(item.positivas, item.envios);
                                        return (
                                            <article key={item.plantilla_nombre} className="rounded-2xl border border-slate-200 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900">{item.plantilla_nombre}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.envios} envíos · {item.respuestas} respuestas · {item.positivas} positivas
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-semibold ${toneFromRate(tasaReal)}`}>{tasaReal}%</p>
                                                        <p className="text-[11px] text-slate-500">respuesta real</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                    <div className="h-full rounded-full bg-gradient-to-r from-[#1B2B86] via-[#2B7FFF] to-[#0FA57C]" style={{ width: `${Math.max(4, tasaReal)}%` }} />
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>Positivas sobre envíos: {positivaSobreEnvios}%</span>
                                                    <span>Sin respuesta: {item.sin_respuesta || 0}</span>
                                                </div>
                                            </article>
                                        );
                                    })}
                                    {!data?.plantillas?.length ? <EmptyState text="No hay plantillas registradas en este periodo." /> : null}
                                </div>
                            </div>
                        </section>

                        <TrendChart series={chartSeries} />

                        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.25fr]">
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,30,97,0.06)]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Desempeño por asesor</h2>
                                        <p className="mt-1 text-sm text-slate-500">Selecciona un asesor para desplegar su cartera y abrir la bitácora de cada cliente.</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                                        <Users size={18} />
                                    </div>
                                </div>

                                <div className="mt-5 space-y-4">
                                    {advisors.map((item, index) => {
                                        const active = activeAdvisor === item.numero_asesor;
                                        return (
                                            <button
                                                key={item.numero_asesor}
                                                type="button"
                                                onClick={() => setActiveAdvisor(item.numero_asesor)}
                                                className={`w-full rounded-[26px] border p-4 text-left transition ${active ? "border-[#2037AB] bg-[#F6F8FF] shadow-[0_14px_30px_rgba(19,30,92,0.10)]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#131E5C] text-sm font-semibold text-white">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-slate-900">{item.asesor_digital || item.numero_asesor}</h3>
                                                                {active ? <span className="rounded-full bg-[#131E5C] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Activo</span> : null}
                                                            </div>
                                                            <p className="mt-1 text-xs text-slate-500">{item.agencia || "Sin agencia"} · {item.clientes} clientes · {item.promedio_respuesta_label || "—"} promedio</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xl font-semibold ${toneFromRate(item.tasa_respuesta_real)}`}>{item.tasa_respuesta_real}%</p>
                                                        <p className="text-xs text-slate-500">tasa real de respuesta</p>
                                                    </div>
                                                </div>

                                                <div className="mt-4">
                                                    <SegmentedBar
                                                        respuestas={item.respuestas}
                                                        positivas={item.positivas}
                                                        sinRespuesta={item.sin_respuesta}
                                                        abiertas={item.abiertas}
                                                    />
                                                </div>

                                                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{item.mensajes}</p>
                                                        <p className="text-slate-500">Mensajes</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sky-700">{item.respuestas}</p>
                                                        <p className="text-slate-500">Respuestas</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-emerald-700">{item.positivas}</p>
                                                        <p className="text-slate-500">Positivas</p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-amber-700">{item.sin_respuesta}</p>
                                                        <p className="text-slate-500">Sin respuesta</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {!advisors.length ? <EmptyState text="No hay actividad para los filtros seleccionados." /> : null}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,30,97,0.06)]">
                                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Cartera del asesor seleccionado</h2>
                                        <p className="mt-1 text-sm text-slate-500">Primero seleccionas un asesor y luego profundizas en sus clientes atendidos o registrados.</p>
                                    </div>
                                    {activeAdvisorRow ? (
                                        <div className="rounded-2xl bg-[#F6F8FF] px-4 py-3 text-sm text-slate-700">
                                            <p className="font-semibold text-slate-900">{activeAdvisorRow.asesor_digital || activeAdvisorRow.numero_asesor}</p>
                                            <p className="mt-1 text-xs text-slate-500">{activeAdvisorRow.agencia || "Sin agencia"} · {totalClientsSelectedAdvisor} clientes según filtros</p>
                                        </div>
                                    ) : null}
                                </div>

                                {activeAdvisorRow ? (
                                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">Tasa real</p>
                                            <p className={`mt-1 text-lg font-semibold ${toneFromRate(activeAdvisorSummary.tasa_respuesta_real)}`}>{activeAdvisorSummary.tasa_respuesta_real}%</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">Positivas / mensajes</p>
                                            <p className="mt-1 text-lg font-semibold text-emerald-700">{activeAdvisorSummary.tasa_positiva_sobre_mensajes}%</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">Tiempo promedio</p>
                                            <p className="mt-1 text-lg font-semibold text-slate-900">{activeAdvisorSummary.promedio_respuesta_label || "—"}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">Conversaciones abiertas</p>
                                            <p className="mt-1 text-lg font-semibold text-amber-700">{activeAdvisorSummary.abiertas}</p>
                                        </div>
                                    </div>
                                ) : null}

                                {advisorDetailError ? (
                                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{advisorDetailError}</div>
                                ) : null}

                                <div className="mt-5 space-y-3">
                                    {advisorDetailLoading ? (
                                        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
                                            <Loader2 className="mr-2 animate-spin" size={20} /> Cargando clientes del asesor...
                                        </div>
                                    ) : clientsOfAdvisor.length ? (
                                        clientsOfAdvisor.map((item) => {
                                            const responseRate = percent(item.respuestas, item.mensajes);
                                            const positiveRate = percent(item.positivas, item.mensajes);
                                            return (
                                                <article key={`${item.expediente_id}-${item.numero_asesor}`} className="rounded-[24px] border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50/60">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start gap-3">
                                                                <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-600"><UserRound size={18} /></div>
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <h3 className="truncate font-semibold text-slate-900">{item.nombre}</h3>
                                                                        <ResultBadge value={item.ultimo_resultado} label={item.ultimo_resultado_label} grupo={item.ultimo_resultado_grupo} />
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-slate-500">{item.telefono} · {item.estado || "Sin estado"} · {item.auto_interes || "Sin vehículo"}</p>
                                                                    <p className="mt-2 text-sm text-slate-700">{item.ultima_accion || "—"}</p>
                                                                    <p className="mt-1 text-xs text-slate-500">Última actividad: {formatDate(item.ultima_actividad)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid min-w-[340px] gap-3 sm:grid-cols-3 lg:min-w-[400px]">
                                                            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                                                                <p className="text-xs text-slate-500">Volumen</p>
                                                                <p className="mt-1 text-lg font-semibold text-slate-900">{item.mensajes}</p>
                                                                <p className="text-[11px] text-slate-500">mensajes / {item.plantillas} plantillas</p>
                                                            </div>
                                                            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                                                                <p className="text-xs text-slate-500">Tasa real</p>
                                                                <p className={`mt-1 text-lg font-semibold ${toneFromRate(responseRate)}`}>{responseRate}%</p>
                                                                <p className="text-[11px] text-slate-500">{item.respuestas} respuestas</p>
                                                            </div>
                                                            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
                                                                <p className="text-xs text-slate-500">Positivas</p>
                                                                <p className="mt-1 text-lg font-semibold text-emerald-700">{positiveRate}%</p>
                                                                <p className="text-[11px] text-slate-500">{item.positivas} interacciones</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <SegmentedBar
                                                                respuestas={item.respuestas}
                                                                positivas={item.positivas}
                                                                sinRespuesta={item.sin_respuesta}
                                                                abiertas={Math.max(Number(item.mensajes || 0) - Number(item.respuestas || 0) - Number(item.sin_respuesta || 0), 0)}
                                                            />
                                                            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500">
                                                                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> Respondió</span>
                                                                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Positiva</span>
                                                                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Sin respuesta</span>
                                                                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Abierta</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedClient(item)}
                                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                                        >
                                                            <ChevronRight size={16} /> Ver bitácora
                                                        </button>
                                                    </div>
                                                </article>
                                            );
                                        })
                                    ) : (
                                        <EmptyState text="No hay clientes para el asesor seleccionado con los filtros actuales." />
                                    )}
                                </div>

                                {(advisorDetail?.paginacion?.pages || 1) > 1 ? (
                                    <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                                        <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 opacity-40" disabled>
                                            <ArrowLeft size={16} /> Anterior
                                        </button>
                                        <span className="text-sm text-slate-500">Mostrando hasta {advisorDetail?.paginacion?.page_size || 100} registros del asesor</span>
                                        <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 opacity-40" disabled>
                                            Siguiente <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </>
                )}
            </div>

            <ClientDrawer
                open={Boolean(selectedClient)}
                client={selectedClient}
                onClose={() => setSelectedClient(null)}
                onResultChanged={() => setReloadKey((value) => value + 1)}
            />
        </div>
    );
}