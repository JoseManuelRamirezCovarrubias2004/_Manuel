import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Clock3,
    Filter,
    Loader2,
    MessageCircle,
    RefreshCw,
    Search,
    Send,
    Sparkles,
    Target,
    UserRound,
    Users,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";

const RESULT_STYLES = {
    respuesta_positiva: "bg-emerald-50 text-emerald-700 border-emerald-200",
    respuesta_neutral: "bg-sky-50 text-sky-700 border-sky-200",
    respuesta_negativa: "bg-rose-50 text-rose-700 border-rose-200",
    sin_respuesta: "bg-amber-50 text-amber-700 border-amber-200",
    pendiente: "bg-slate-50 text-slate-600 border-slate-200",
    fallido: "bg-red-50 text-red-700 border-red-200",
    no_aplica: "bg-violet-50 text-violet-700 border-violet-200",
};

function isoDate(daysAgo = 0) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
}

function formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function formatNumber(value) {
    return new Intl.NumberFormat("es-MX").format(Number(value || 0));
}

function ResultBadge({ value, label }) {
    const style = RESULT_STYLES[value] || RESULT_STYLES.pendiente;
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>
            {label || value || "Sin resultado"}
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, detail }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                    {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
                </div>
                <div className="rounded-xl bg-[#131E5C]/10 p-2.5 text-[#131E5C]">
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
            <Activity className="mb-3 text-slate-400" size={28} />
            <p className="text-sm text-slate-600">{text}</p>
        </div>
    );
}

function ClientDrawer({ open, client, onClose, onResultChanged }) {
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState("");

    useEffect(() => {
        if (!open || !client?.expediente_id) return;

        let active = true;
        setLoading(true);
        setError("");
        setDetail(null);

        api
            .digitalesAnaliticaCliente(client.expediente_id, {
                numero_asesor: client.numero_asesor,
            })
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
        setUpdatingId(eventoId);
        try {
            const response = await api.digitalesAnaliticaActualizarResultado(eventoId, resultado);
            setDetail((current) => ({
                ...current,
                eventos: (current?.eventos || []).map((item) =>
                    item.id === eventoId ? response.evento : item,
                ),
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
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" role="dialog" aria-modal="true">
            <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar detalle" />
            <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
                <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bitácora del cliente</p>
                            <h2 className="mt-1 text-xl font-semibold text-slate-900">{client?.nombre || "Prospecto"}</h2>
                            <p className="mt-1 text-sm text-slate-500">{client?.telefono}</p>
                        </div>
                        <button className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" onClick={onClose}>
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
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-3">
                                    <p className="text-xs text-slate-500">Estado actual</p>
                                    <p className="mt-1 font-medium text-slate-900">{detail?.cliente?.estado || "Sin estado"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-3">
                                    <p className="text-xs text-slate-500">Vehículo de interés</p>
                                    <p className="mt-1 font-medium text-slate-900">{detail?.cliente?.auto_interes || "Sin definir"}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {(detail?.eventos || []).map((item) => (
                                    <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.tipo_label}</span>
                                                    <ResultBadge value={item.resultado} label={item.resultado_label} />
                                                </div>
                                                <h3 className="mt-2 font-medium text-slate-900">{item.accion}</h3>
                                                {item.detalle ? <p className="mt-1 text-sm text-slate-600">{item.detalle}</p> : null}
                                            </div>
                                            <time className="text-xs text-slate-500">{formatDate(item.creado)}</time>
                                        </div>

                                        {item.respuesta_texto ? (
                                            <div className="mt-3 rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs font-medium text-slate-500">Respuesta del cliente</p>
                                                <p className="mt-1 text-sm text-slate-700">{item.respuesta_texto}</p>
                                                <p className="mt-2 text-xs text-slate-500">Tiempo: {item.tiempo_respuesta_label}</p>
                                            </div>
                                        ) : null}

                                        {["mensaje", "plantilla", "media"].includes(item.tipo) ? (
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <label className="text-xs text-slate-500" htmlFor={`resultado-${item.id}`}>Corregir clasificación:</label>
                                                <select
                                                    id={`resultado-${item.id}`}
                                                    value={item.resultado}
                                                    disabled={updatingId === item.id}
                                                    onChange={(event) => updateResult(item.id, event.target.value)}
                                                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700"
                                                >
                                                    <option value="pendiente">Esperando respuesta</option>
                                                    <option value="respuesta_positiva">Respondió con interés</option>
                                                    <option value="respuesta_neutral">Respondió</option>
                                                    <option value="respuesta_negativa">Respondió negativamente</option>
                                                    <option value="sin_respuesta">No respondió</option>
                                                    <option value="fallido">Falló el envío</option>
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

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        api
            .digitalesAnaliticaAsesores(filters)
            .then((response) => {
                if (active) setData(response);
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

    const maxAdvisorMessages = useMemo(
        () => Math.max(1, ...(data?.asesores || []).map((item) => Number(item.mensajes || 0))),
        [data?.asesores],
    );

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

    const summary = data?.resumen || {};

    return (
        <div className="min-h-full bg-slate-50 p-4 md:p-6">
            <div className="mx-auto max-w-[1500px] space-y-5">
                <section className="rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Filter size={17} /> Filtros
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <label className="text-sm text-slate-600">
                            Desde
                            <input type="date" value={filters.fecha_desde} onChange={(e) => setFilter("fecha_desde", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" />
                        </label>
                        <label className="text-sm text-slate-600">
                            Hasta
                            <input type="date" value={filters.fecha_hasta} onChange={(e) => setFilter("fecha_hasta", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" />
                        </label>
                        <label className="text-sm text-slate-600">
                            Asesor / línea
                            <select value={filters.numero_asesor} onChange={(e) => setFilter("numero_asesor", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900">
                                <option value="">Todas mis líneas</option>
                                {(data?.lineas || []).map((item) => (
                                    <option key={item.numero} value={item.numero}>{item.asesor_digital} · {item.agencia}</option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm text-slate-600">
                            Resultado
                            <select value={filters.resultado} onChange={(e) => setFilter("resultado", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900">
                                <option value="">Todos</option>
                                {(data?.catalogos?.resultados || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </label>
                        <label className="text-sm text-slate-600">
                            Acción
                            <select value={filters.tipo} onChange={(e) => setFilter("tipo", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900">
                                <option value="">Todas</option>
                                {(data?.catalogos?.tipos || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                            </select>
                        </label>
                        <form onSubmit={submitSearch} className="text-sm text-slate-600">
                            Buscar cliente
                            <div className="mt-1 flex gap-2">
                                <input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Nombre o teléfono" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-slate-900" />
                                <button className="rounded-xl bg-slate-900 px-3 text-white" aria-label="Buscar"><Search size={18} /></button>
                            </div>
                        </form>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {[7, 30, 90].map((days) => (
                            <button key={days} type="button" onClick={() => applyPreset(days)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                                Últimos {days} días
                            </button>
                        ))}
                    </div>
                </section>

                {error ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={20} /> {error}
                    </div>
                ) : null}

                {loading && !data ? (
                    <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                        <Loader2 className="mr-2 animate-spin" size={22} /> Calculando indicadores...
                    </div>
                ) : (
                    <>
                        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <MetricCard icon={Users} label="Clientes atendidos" value={formatNumber(summary.clientes)} detail={`${formatNumber(summary.acciones)} acciones registradas`} />
                            <MetricCard icon={Send} label="Mensajes enviados" value={formatNumber(summary.mensajes)} detail={`${formatNumber(summary.plantillas)} plantillas`} />
                            <MetricCard icon={MessageCircle} label="Respuestas" value={formatNumber(summary.respuestas)} detail={`${summary.tasa_respuesta || 0}% de tasa`} />
                            <MetricCard icon={Target} label="Respuesta positiva" value={`${summary.tasa_respuesta_positiva || 0}%`} detail={`${formatNumber(summary.respuestas_positivas)} conversaciones`} />
                            <MetricCard icon={Clock3} label="Tiempo promedio" value={summary.promedio_respuesta_label || "—"} detail={`Ventana sin respuesta: ${data?.horas_sin_respuesta || 48} h`} />
                            <MetricCard icon={AlertCircle} label="Sin respuesta" value={formatNumber(summary.sin_respuesta)} detail={`${formatNumber(summary.fallidos)} envíos fallidos`} />
                        </section>

                        <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold text-slate-900">Desempeño por asesor</h2>
                                        <p className="mt-1 text-sm text-slate-500">Volumen, respuesta y calidad comercial.</p>
                                    </div>
                                    <Sparkles className="text-[#131E5C]" size={20} />
                                </div>
                                <div className="mt-5 space-y-4">
                                    {(data?.asesores || []).map((item, index) => (
                                        <article key={item.numero_asesor} className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C] text-sm font-semibold text-white">{index + 1}</div>
                                                    <div>
                                                        <h3 className="font-medium text-slate-900">{item.asesor_digital || item.numero_asesor}</h3>
                                                        <p className="text-xs text-slate-500">{item.agencia} · {item.clientes} clientes</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-slate-900">{item.tasa_respuesta}%</p>
                                                    <p className="text-xs text-slate-500">tasa de respuesta</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-[#131E5C]" style={{ width: `${Math.max(4, (Number(item.mensajes || 0) / maxAdvisorMessages) * 100)}%` }} />
                                            </div>
                                            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                                                <div><p className="font-semibold text-slate-900">{item.mensajes}</p><p className="text-slate-500">Mensajes</p></div>
                                                <div><p className="font-semibold text-slate-900">{item.respuestas}</p><p className="text-slate-500">Respuestas</p></div>
                                                <div><p className="font-semibold text-emerald-700">{item.positivas}</p><p className="text-slate-500">Positivas</p></div>
                                                <div><p className="font-semibold text-amber-700">{item.sin_respuesta}</p><p className="text-slate-500">Sin respuesta</p></div>
                                            </div>
                                        </article>
                                    ))}
                                    {!data?.asesores?.length ? <EmptyState text="No hay actividad para los filtros seleccionados." /> : null}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div>
                                    <h2 className="font-semibold text-slate-900">Plantillas con mejor desempeño</h2>
                                    <p className="mt-1 text-sm text-slate-500">Compara uso y respuesta por nombre de plantilla.</p>
                                </div>
                                <div className="mt-5 space-y-3">
                                    {(data?.plantillas || []).map((item) => (
                                        <div key={item.plantilla_nombre} className="rounded-xl border border-slate-200 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-900">{item.plantilla_nombre}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{item.envios} envíos · {item.respuestas} respuestas</p>
                                                </div>
                                                <span className="rounded-full bg-[#131E5C]/10 px-2.5 py-1 text-xs font-semibold text-[#131E5C]">{item.tasa_respuesta}%</span>
                                            </div>
                                        </div>
                                    ))}
                                    {!data?.plantillas?.length ? <EmptyState text="No hay plantillas registradas en este periodo." /> : null}
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-900">Resultados por cliente</h2>
                                    <p className="mt-1 text-sm text-slate-500">Abre un registro para revisar toda la secuencia de acciones y respuestas.</p>
                                </div>
                                <span className="text-sm text-slate-500">{formatNumber(data?.paginacion?.total)} clientes</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3">Cliente</th>
                                            <th className="px-4 py-3">Asesor</th>
                                            <th className="px-4 py-3 text-center">Mensajes</th>
                                            <th className="px-4 py-3 text-center">Plantillas</th>
                                            <th className="px-4 py-3 text-center">Respuestas</th>
                                            <th className="px-4 py-3">Última acción</th>
                                            <th className="px-4 py-3">Resultado</th>
                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(data?.clientes || []).map((item) => (
                                            <tr key={`${item.expediente_id}-${item.numero_asesor}`} className="hover:bg-slate-50/70">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-xl bg-slate-100 p-2 text-slate-600"><UserRound size={18} /></div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{item.nombre}</p>
                                                            <p className="text-xs text-slate-500">{item.telefono} · {item.estado || "Sin estado"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-slate-700">{item.asesor_digital || item.numero_asesor}</td>
                                                <td className="px-4 py-4 text-center font-medium text-slate-900">{item.mensajes}</td>
                                                <td className="px-4 py-4 text-center text-slate-700">{item.plantillas}</td>
                                                <td className="px-4 py-4 text-center text-slate-700">{item.respuestas}</td>
                                                <td className="max-w-xs px-4 py-4">
                                                    <p className="truncate text-slate-700">{item.ultima_accion || "—"}</p>
                                                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.ultima_actividad)}</p>
                                                </td>
                                                <td className="px-4 py-4"><ResultBadge value={item.ultimo_resultado} label={(data?.catalogos?.resultados || []).find((x) => x.value === item.ultimo_resultado)?.label} /></td>
                                                <td className="px-5 py-4 text-right">
                                                    <button type="button" onClick={() => setSelectedClient(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Ver bitácora</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!data?.clientes?.length ? <div className="p-5"><EmptyState text="No se encontraron clientes con esos filtros." /></div> : null}
                            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                                <button
                                    type="button"
                                    disabled={!data?.paginacion?.has_previous}
                                    onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ArrowLeft size={16} /> Anterior
                                </button>
                                <span className="text-sm text-slate-500">Página {data?.paginacion?.page || 1} de {data?.paginacion?.pages || 1}</span>
                                <button
                                    type="button"
                                    disabled={!data?.paginacion?.has_next}
                                    onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Siguiente <ArrowRight size={16} />
                                </button>
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