//src/pages/Retencion/Retencion.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    BarChart2,
    ChevronDown,
    RefreshCw,
    Search,
    SlidersHorizontal,
    TableProperties,
} from "lucide-react";

import {
    obtenerOpcionesRetencion,
    obtenerOrdenesRetencion,
} from "../../lib/apiRetencion";

const NAVY = "#131E5C";

const CHART_COLORS = [
    "#378ADD",
    "#1D9E75",
    "#D85A30",
    "#7F77DD",
    "#D4537E",
    "#F0A500",
    "#00B8D9",
    "#6B7280",
];

const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const MESES_CORTOS = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
];

const SEMANAS = Array.from({ length: 52 }, (_, i) => i + 1);

const ANIO_ACTUAL = String(new Date().getFullYear());

const TooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,.08)",
};

function parseFechaLocal(fecha) {
    if (!fecha) return null;

    const partes = String(fecha).split("-").map(Number);

    if (partes.length < 3) return null;

    const [anio, mes, dia] = partes;

    if (!anio || !mes || !dia) return null;

    return new Date(anio, mes - 1, dia);
}

function obtenerSemana(fecha) {
    const date = parseFechaLocal(fecha);

    if (!date) return 0;

    const inicio = new Date(date.getFullYear(), 0, 1);
    const dias = Math.floor((date - inicio) / 86400000);

    return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

function numeroSeguro(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;

    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : 0;
    }

    const limpio = String(valor)
        .replaceAll(",", "")
        .replace(/[^0-9.\-]/g, "");

    const numero = Number(limpio);

    return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function moneda(valor) {
    return numeroSeguro(valor).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    });
}

function numero(valor) {
    return numeroSeguro(valor).toLocaleString("es-MX");
}

function promedio(total, cantidad) {
    if (!cantidad) return 0;
    return total / cantidad;
}

function mapearOrden(item) {
    const fechaBase = item.fecha_os || item.fecha_emision || item.fecha_salida;
    const fecha = parseFechaLocal(fechaBase);

    const cliente =
        item.cliente_veiculo ||
        item.nombre ||
        "Sin cliente";

    return {
        id: `${item.num_os || "sin-os"}-${item.chassi || item.serie || ""}`,
        chassi: item.chassi || "",
        cliente,
        marca: item.marca_auto || "Sin marca",
        modelo: item.modelo_auto || "Sin modelo",
        num_os: item.num_os || "",
        fecha_os: item.fecha_os || "",
        fecha_emision: item.fecha_emision || "",
        fecha_salida: item.fecha_salida || "",
        estado: item.estado || "Sin estado",
        dias_os_a_actual: numeroSeguro(item.dias_os_a_actual),
        segmento: item.segmento || "Sin segmento",
        meses_actual_a_emision: numeroSeguro(item.meses_actual_a_emision),
        num_nota: item.num_nota || "",
        total_nota: numeroSeguro(item.total_nota_numero ?? item.total_nota),
        subtipo_os: item.subtipo_os || "Sin subtipo",
        telefono: item.telefono || "",
        correo: item.correo || "",
        nombre: item.nombre || "",
        serie: item.serie || "",
        total_servicio: numeroSeguro(
            item.total_servicio_numero ?? item.total_servicio
        ),
        anio: fecha ? fecha.getFullYear() : 0,
        mes: fecha ? fecha.getMonth() + 1 : 0,
        semana: obtenerSemana(fechaBase),
    };
}

function agruparPor(datos, obtenerClave, limite = 10) {
    const map = new Map();

    datos.forEach((item) => {
        const clave = obtenerClave(item) || "Sin dato";

        if (!map.has(clave)) {
            map.set(clave, {
                name: clave,
                ordenes: 0,
                total_servicio: 0,
                dias_total: 0,
            });
        }

        const actual = map.get(clave);

        actual.ordenes += 1;
        actual.total_servicio += item.total_servicio;
        actual.dias_total += item.dias_os_a_actual;
    });

    return Array.from(map.values())
        .map((item) => ({
            ...item,
            ticket_promedio: promedio(item.total_servicio, item.ordenes),
            dias_promedio: promedio(item.dias_total, item.ordenes),
        }))
        .sort((a, b) => b.ordenes - a.ordenes)
        .slice(0, limite);
}

function obtenerBucketAntiguedad(meses) {
    const valor = numeroSeguro(meses);

    if (!valor) return "Sin dato";
    if (valor <= 6) return "0-6 meses";
    if (valor <= 12) return "7-12 meses";
    if (valor <= 24) return "13-24 meses";
    if (valor <= 36) return "25-36 meses";

    return "+36 meses";
}

function StatCard({ label, value, sub, color }) {
    return (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white px-5 py-4">
            <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                style={{ backgroundColor: color || NAVY }}
            />

            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </p>

            <p className="text-2xl font-black text-gray-800">{value}</p>

            {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
        </div>
    );
}

function SelectField({ label, value, onChange, children }) {
    return (
        <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </label>

            <div className="relative">
                <select
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-[38px] min-w-[140px] appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-200"
                >
                    {children}
                </select>

                <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
            </div>
        </div>
    );
}

function VistaTabla({ datos }) {
    const datosTabla = datos.slice(0, 1000);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {datos.length > 1000 ? (
                <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
                    Mostrando 1,000 de {numero(datos.length)} registros para mantener buen
                    rendimiento en el navegador.
                </div>
            ) : null}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr style={{ backgroundColor: NAVY }} className="text-left text-white">
                            {[
                                "OS",
                                "Fecha OS",
                                "Cliente",
                                "Chassi",
                                "Marca",
                                "Modelo",
                                "Segmento",
                                "Estado",
                                "Días",
                                "Meses",
                                "Total servicio",
                                "Teléfono",
                            ].map((header) => (
                                <th
                                    key={header}
                                    className={`px-4 py-3 font-medium ${["Días", "Meses", "Total servicio"].includes(header)
                                        ? "text-right"
                                        : ""
                                        }`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {datosTabla.map((item, index) => (
                            <tr
                                key={`${item.id}-${index}`}
                                className={`border-t border-gray-100 transition hover:bg-blue-50/40 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                                    }`}
                            >
                                <td className="whitespace-nowrap px-4 py-3 font-bold text-gray-800">
                                    {item.num_os || "—"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                    {item.fecha_os || "—"}
                                </td>

                                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-800">
                                    {item.cliente}
                                </td>

                                <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">
                                    {item.chassi || item.serie || "—"}
                                </td>

                                <td className="px-4 py-3 text-gray-600">{item.marca}</td>

                                <td className="max-w-[180px] truncate px-4 py-3 text-gray-600">
                                    {item.modelo}
                                </td>

                                <td className="px-4 py-3">
                                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                        {item.segmento}
                                    </span>
                                </td>

                                <td className="px-4 py-3">
                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                        {item.estado}
                                    </span>
                                </td>

                                <td className="px-4 py-3 text-right text-gray-700">
                                    {numero(item.dias_os_a_actual)}
                                </td>

                                <td className="px-4 py-3 text-right text-gray-700">
                                    {numero(item.meses_actual_a_emision)}
                                </td>

                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                    {moneda(item.total_servicio)}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                    {item.telefono || "—"}
                                </td>
                            </tr>
                        ))}

                        {datosTabla.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-4 py-10 text-center text-gray-400">
                                    Sin resultados para los filtros seleccionados.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children, className = "" }) {
    return (
        <div
            className={`min-w-0 rounded-xl border border-gray-200 bg-white p-5 ${className}`}
        >
            <p className="text-lg font-bold" style={{ color: NAVY }}>
                {title}
            </p>

            {subtitle ? <p className="mb-4 text-sm text-gray-400">{subtitle}</p> : null}

            {children}
        </div>
    );
}

function VistaGraficas({ datos }) {
    const porMes = useMemo(() => {
        const map = new Map();

        datos.forEach((item) => {
            if (!item.anio || !item.mes) return;

            const key = `${item.anio}-${String(item.mes).padStart(2, "0")}`;

            if (!map.has(key)) {
                map.set(key, {
                    key,
                    name: `${MESES[item.mes - 1]?.slice(0, 3) || "Mes"} ${item.anio}`,
                    ordenes: 0,
                    total_servicio: 0,
                });
            }

            const actual = map.get(key);

            actual.ordenes += 1;
            actual.total_servicio += item.total_servicio;
        });

        return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    }, [datos]);

    const porSegmento = useMemo(
        () => agruparPor(datos, (item) => item.segmento, 8),
        [datos]
    );

    const porEstado = useMemo(
        () => agruparPor(datos, (item) => item.estado, 8),
        [datos]
    );

    const porMarca = useMemo(
        () => agruparPor(datos, (item) => item.marca, 10),
        [datos]
    );

    const porModelo = useMemo(
        () => agruparPor(datos, (item) => item.modelo, 10),
        [datos]
    );

    const porAntiguedad = useMemo(
        () =>
            agruparPor(
                datos,
                (item) => obtenerBucketAntiguedad(item.meses_actual_a_emision),
                10
            ),
        [datos]
    );

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartCard
                    title="Órdenes por mes"
                    subtitle="Cantidad de órdenes y total de servicio por período"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={porMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                                tickFormatter={(value) => `$${Number(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value, name) => {
                                    if (name === "Total servicio") return [moneda(value), name];
                                    return [numero(value), name];
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="ordenes"
                                name="Órdenes"
                                stroke="#378ADD"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="total_servicio"
                                name="Total servicio"
                                stroke="#1D9E75"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Distribución por segmento"
                    subtitle="Relación de órdenes por segmento"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={porSegmento}
                                dataKey="ordenes"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={105}
                                innerRadius={50}
                            >
                                {porSegmento.map((_, index) => (
                                    <Cell
                                        key={index}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value) => [numero(value), "Órdenes"]}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartCard
                    title="Top marcas"
                    subtitle="Marcas con mayor cantidad de órdenes"
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={porMarca} margin={{ top: 10, right: 10, left: -10, bottom: 55 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-30}
                                textAnchor="end"
                                height={70}
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value, name) => {
                                    if (name === "Total servicio") return [moneda(value), name];
                                    return [numero(value), name];
                                }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                                dataKey="ordenes"
                                name="Órdenes"
                                fill={NAVY}
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Top modelos"
                    subtitle="Modelos con mayor recurrencia"
                >
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={porModelo} margin={{ top: 10, right: 10, left: -10, bottom: 65 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-35}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value) => [numero(value), "Órdenes"]}
                            />
                            <Bar
                                dataKey="ordenes"
                                name="Órdenes"
                                fill="#378ADD"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <ChartCard
                    title="Retención por antigüedad"
                    subtitle="Meses desde emisión hasta fecha actual"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={porAntiguedad}
                            margin={{ top: 10, right: 10, left: -10, bottom: 30 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={55}
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value) => [numero(value), "Órdenes"]}
                            />
                            <Bar
                                dataKey="ordenes"
                                name="Órdenes"
                                fill="#1D9E75"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Estado de órdenes"
                    subtitle="Estatus operativo de las órdenes"
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={porEstado}
                            margin={{ top: 10, right: 10, left: -10, bottom: 35 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="name"
                                interval={0}
                                angle={-20}
                                textAnchor="end"
                                height={60}
                                tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip
                                contentStyle={TooltipStyle}
                                formatter={(value) => [numero(value), "Órdenes"]}
                            />
                            <Bar
                                dataKey="ordenes"
                                name="Órdenes"
                                fill="#D85A30"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

export default function Retencion() {
    const [vista, setVista] = useState("tabla");

    const [anio, setAnio] = useState(ANIO_ACTUAL);
    const [mes, setMes] = useState("Todos");
    const [semana, setSemana] = useState("Todas");
    const [segmento, setSegmento] = useState("Todos");
    const [estado, setEstado] = useState("Todos");
    const [marca, setMarca] = useState("Todas");
    const [busqueda, setBusqueda] = useState("");

    const [datosRaw, setDatosRaw] = useState([]);

    const [opciones, setOpciones] = useState({
        anios: [],
        anio_mes: [],
        meses_por_anio: {},
        estados: [],
        segmentos: [],
        marcas: [],
        modelos: [],
        subtipos: [],
    });

    const [loading, setLoading] = useState(true);
    const [loadingOpciones, setLoadingOpciones] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const cacheRef = useRef(new Map());

    useEffect(() => {
        const controller = new AbortController();

        async function cargarOpciones() {
            try {
                setLoadingOpciones(true);

                const data = await obtenerOpcionesRetencion({
                    signal: controller.signal,
                });

                setOpciones({
                    anios: Array.isArray(data.anios) ? data.anios : [],
                    anio_mes: Array.isArray(data.anio_mes) ? data.anio_mes : [],
                    meses_por_anio:
                        data.meses_por_anio && typeof data.meses_por_anio === "object"
                            ? data.meses_por_anio
                            : {},
                    estados: Array.isArray(data.estados) ? data.estados : [],
                    segmentos: Array.isArray(data.segmentos) ? data.segmentos : [],
                    marcas: Array.isArray(data.marcas) ? data.marcas : [],
                    modelos: Array.isArray(data.modelos) ? data.modelos : [],
                    subtipos: Array.isArray(data.subtipos) ? data.subtipos : [],
                });
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoadingOpciones(false);
            }
        }

        cargarOpciones();

        return () => controller.abort();
    }, []);

    const cargarOrdenes = useCallback(
        async (filtros, signal) => {
            const cacheKey = JSON.stringify(filtros);

            if (cacheRef.current.has(cacheKey)) {
                return cacheRef.current.get(cacheKey);
            }

            const data = await obtenerOrdenesRetencion(filtros, { signal });
            const lista = Array.isArray(data) ? data : data.results ?? [];
            const mapeado = lista.map(mapearOrden);

            cacheRef.current.set(cacheKey, mapeado);

            return mapeado;
        },
        []
    );

    useEffect(() => {
        const controller = new AbortController();

        async function cargarDatos() {
            try {
                setLoading(true);
                setError(null);

                const datos = await cargarOrdenes(
                    {
                        anio,
                        mes,
                        segmento,
                        estado,
                        marca,
                        ordering: "-fecha_os",
                        limit: 10000,
                    },
                    controller.signal
                );

                setDatosRaw(datos);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        }

        cargarDatos();

        return () => controller.abort();
    }, [anio, mes, segmento, estado, marca, cargarOrdenes, refreshKey]);

    const aniosDisponibles = useMemo(() => {
        if (opciones.anios.length > 0) return opciones.anios;

        return [...new Set(datosRaw.map((item) => item.anio))]
            .filter(Boolean)
            .sort((a, b) => b - a);
    }, [opciones.anios, datosRaw]);

    const mesesDisponibles = useMemo(() => {
        if (anio === "Todos") {
            const meses = opciones.anio_mes
                .map((item) => item.mes)
                .filter(Boolean);

            return [...new Set(meses)].sort((a, b) => a - b);
        }

        const desdeOpciones = opciones.anio_mes
            .filter((item) => String(item.anio) === String(anio))
            .map((item) => item.mes)
            .filter(Boolean);

        if (desdeOpciones.length > 0) {
            return [...new Set(desdeOpciones)].sort((a, b) => a - b);
        }

        return [...new Set(datosRaw.map((item) => item.mes))]
            .filter(Boolean)
            .sort((a, b) => a - b);
    }, [anio, opciones.anio_mes, datosRaw]);

    const datosFiltrados = useMemo(() => {
        let datos = [...datosRaw];

        if (semana !== "Todas") {
            const semanaNumero = Number(semana);
            datos = datos.filter((item) => item.semana === semanaNumero);
        }

        const texto = normalizarTexto(busqueda);

        if (texto) {
            datos = datos.filter((item) => {
                const acumulado = [
                    item.num_os,
                    item.chassi,
                    item.serie,
                    item.cliente,
                    item.nombre,
                    item.telefono,
                    item.correo,
                    item.marca,
                    item.modelo,
                ]
                    .map(normalizarTexto)
                    .join(" ");

                return acumulado.includes(texto);
            });
        }

        return datos;
    }, [datosRaw, semana, busqueda]);

    const resumen = useMemo(() => {
        const totalOrdenes = datosFiltrados.length;
        const totalServicio = datosFiltrados.reduce(
            (acc, item) => acc + item.total_servicio,
            0
        );
        const totalDias = datosFiltrados.reduce(
            (acc, item) => acc + item.dias_os_a_actual,
            0
        );

        const clientesUnicos = new Set(
            datosFiltrados
                .map((item) => item.chassi || item.serie || item.telefono || item.cliente)
                .filter(Boolean)
        ).size;

        const conTelefono = datosFiltrados.filter((item) => item.telefono).length;

        return {
            totalOrdenes,
            totalServicio,
            ticketPromedio: promedio(totalServicio, totalOrdenes),
            diasPromedio: promedio(totalDias, totalOrdenes),
            clientesUnicos,
            conTelefono,
        };
    }, [datosFiltrados]);

    const loadingGeneral = loading || loadingOpciones;

    function limpiarFiltros() {
        setAnio(ANIO_ACTUAL);
        setMes("Todos");
        setSemana("Todas");
        setSegmento("Todos");
        setEstado("Todos");
        setMarca("Todas");
        setBusqueda("");
    }

    function refrescarDatos() {
        cacheRef.current.clear();
        setRefreshKey((prev) => prev + 1);
    }

    if (loadingGeneral) {
        return (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
                    Cargando retención…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="max-w-md rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-bold text-red-500">
                        Error al cargar retención
                    </p>
                    <p className="mt-1 text-xs text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 p-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-black text-gray-800">Retención</h2>
                    <p className="text-xs text-gray-500">
                        Análisis de órdenes de servicio, segmentos, antigüedad y rendimiento.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={refrescarDatos}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>

                    {["tabla", "graficas"].map((item) => (
                        <button
                            key={item}
                            onClick={() => setVista(item)}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${vista === item
                                ? "border-transparent text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                            style={vista === item ? { backgroundColor: NAVY } : {}}
                        >
                            {item === "tabla" ? (
                                <>
                                    <TableProperties size={15} />
                                    Tabla
                                </>
                            ) : (
                                <>
                                    <BarChart2 size={15} />
                                    Gráficas
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3">
                    <SlidersHorizontal size={15} className="text-gray-400" />

                    {aniosDisponibles.map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                setAnio(anio === String(item) ? "Todos" : String(item));
                                setMes("Todos");
                            }}
                            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${anio === String(item)
                                ? "border-transparent text-white"
                                : "border-gray-300 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600"
                                }`}
                            style={anio === String(item) ? { backgroundColor: NAVY } : {}}
                        >
                            {item}
                        </button>
                    ))}

                    <button
                        onClick={() => {
                            setAnio("Todos");
                            setMes("Todos");
                        }}
                        className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${anio === "Todos"
                            ? "border-transparent text-white"
                            : "border-gray-300 bg-white text-gray-600 hover:border-blue-300"
                            }`}
                        style={anio === "Todos" ? { backgroundColor: NAVY } : {}}
                    >
                        Todos
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 px-4 py-3">
                    {MESES_CORTOS.map((item, index) => {
                        const mesNumero = index + 1;
                        const disponible =
                            anio === "Todos" || mesesDisponibles.includes(mesNumero);

                        return (
                            <button
                                key={item}
                                onClick={() => {
                                    if (!disponible) return;
                                    setMes(mes === String(mesNumero) ? "Todos" : String(mesNumero));
                                }}
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${mes === String(mesNumero)
                                    ? "border-transparent text-white"
                                    : disponible
                                        ? "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                                    }`}
                                style={mes === String(mesNumero) ? { backgroundColor: NAVY } : {}}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-end gap-4 px-4 py-3">
                    <SelectField label="Semana" value={semana} onChange={setSemana}>
                        <option value="Todas">Todas</option>
                        {SEMANAS.map((item) => (
                            <option key={item} value={String(item)}>
                                Semana {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Segmento" value={segmento} onChange={setSegmento}>
                        <option value="Todos">Todos</option>
                        {opciones.segmentos.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Estado" value={estado} onChange={setEstado}>
                        <option value="Todos">Todos</option>
                        {opciones.estados.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField label="Marca" value={marca} onChange={setMarca}>
                        <option value="Todas">Todas</option>
                        {opciones.marcas.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </SelectField>

                    <div className="min-w-[240px] flex-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Buscar
                        </label>

                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                                placeholder="OS, cliente, chassi, teléfono, correo..."
                                className="h-[38px] w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-200"
                            />
                        </div>
                    </div>

                    <button
                        onClick={limpiarFiltros}
                        className="h-[38px] rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard
                    label="Órdenes"
                    value={numero(resumen.totalOrdenes)}
                    sub="registros filtrados"
                    color="#378ADD"
                />

                <StatCard
                    label="Clientes / unidades"
                    value={numero(resumen.clientesUnicos)}
                    sub="únicos por chassi, serie o contacto"
                    color="#1D9E75"
                />

                <StatCard
                    label="Total servicio"
                    value={moneda(resumen.totalServicio)}
                    sub="importe acumulado"
                    color="#D85A30"
                />

                <StatCard
                    label="Ticket promedio"
                    value={moneda(resumen.ticketPromedio)}
                    sub="servicio promedio"
                    color="#7F77DD"
                />

                <StatCard
                    label="Días promedio"
                    value={resumen.diasPromedio.toFixed(1)}
                    sub="OS a fecha actual"
                    color="#F0A500"
                />

                <StatCard
                    label="Con teléfono"
                    value={numero(resumen.conTelefono)}
                    sub="contactables"
                    color="#D4537E"
                />
            </div>

            {vista === "tabla" ? (
                <VistaTabla datos={datosFiltrados} />
            ) : (
                <VistaGraficas datos={datosFiltrados} />
            )}
        </div>
    );
}