// src/pages/Retencion/Retencion.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    Activity,
    BarChart3,
    Car,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Gauge,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    PhoneCall,
    Plus,
    RefreshCw,
    Search,
    Table2,
    Trash2,
    Users,
    Wallet,
    Wrench,
    X,
    XCircle,
} from "lucide-react";

import {
    apiRetencion,
    obtenerOpcionesRetencion,
    obtenerOrdenesRetencion,
} from "../../lib/apiRetencion";

const NAVY = "#131E5C";
const ACCENT = "#378ADD";

const SEGMENTO_COLORS = ["#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#D4537E", "#F0A500"];
const ESTADO_COLORS = { activo: "#1D9E75", inactivo: "#D85A30" };

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SEMANAS = Array.from({ length: 52 }, (_, i) => i + 1);
const ANIO_ACTUAL = String(new Date().getFullYear());

// NUEVO: opciones de estado de contacto (solo visual por ahora)
const CONTACTO_OPCIONES = [
    "Sin contactar",
    "Contactado No Responde",
    "Contactado Con Respuesta",
];

// NUEVO: estados de las tareas del cliente
const ESTADO_TAREA_LABELS = {
    pendiente: "Pendiente",
    en_progreso: "En progreso",
    completada: "Completada",
    cancelada: "Cancelada",
};

const ESTADO_TAREA_COLORS = {
    pendiente: { bg: "#94a3b81a", text: "#64748b" },
    en_progreso: { bg: `${ACCENT}1a`, text: ACCENT },
    completada: { bg: "#1D9E751a", text: "#1D9E75" },
    cancelada: { bg: "#D85A301a", text: "#D85A30" },
};

const TooltipStyle = {
    fontSize: 12,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 24px rgba(19,30,92,.12)",
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
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    const limpio = String(valor).replaceAll(",", "").replace(/[^0-9.\-]/g, "");
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

function formatDate(fecha) {
    const date = parseFechaLocal(fecha);
    if (!date) return "—";
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTelefono(telefono) {
    const limpio = String(telefono || "").trim();
    if (!limpio) return "";
    return `+52 ${limpio}`;
}

function iniciales(nombre) {
    const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function mapearOrden(item) {
    const fechaBase = item.fecha_ultima_os || item.fecha_venta;
    const fechaParseada = parseFechaLocal(fechaBase);

    return {
        id: item.vin,
        vin: item.vin || "",
        agencia: item.agencia || "Sin agencia",
        fecha_venta: item.fecha_venta || "",
        fecha_salida: item.fecha_salida || "",
        numero_nota: item.numero_nota || "",
        total_nota: numeroSeguro(item.total_nota_numero ?? item.total_nota),
        marca: item.marca || "Sin marca",
        modelo_codigo: item.modelo_codigo || "",
        modelo_nombre: item.modelo_nombre || "Sin modelo",
        condicion_vehiculo: item.condicion_vehiculo || "",
        nombre_cliente: item.nombre_cliente || "Sin cliente",
        telefono_cliente: item.telefono_cliente || "",
        telefono_cliente2: item.telefono_cliente2 || "",
        telefono_cliente3: item.telefono_cliente3 || "",
        correo_cliente: item.correo_cliente || "",
        ultima_orden_servicio: item.ultima_orden_servicio || "",
        tipo_orden: item.tipo_orden || "",
        subtipo_orden: item.subtipo_orden || "Sin subtipo",
        fecha_ultima_os: item.fecha_ultima_os || "",
        situacion_os: item.situacion_os || "Sin situación",
        cliente_vehiculo: item.cliente_vehiculo || "",
        placa_vehiculo: item.placa_vehiculo || "",
        kilometraje: item.kilometraje || "",
        medio_contacto: item.medio_contacto || "Sin dato",
        total_ultimo_servicio: numeroSeguro(item.total_ultimo_servicio_numero ?? item.total_ultimo_servicio),
        estado_actividad: item.estado_actividad || "Sin estado",
        meses_desde_venta: numeroSeguro(item.meses_desde_venta),
        segmento: item.segmento || "Sin segmento",
        anio: fechaParseada ? fechaParseada.getFullYear() : 0,
        mes: fechaParseada ? fechaParseada.getMonth() + 1 : 0,
        semana: obtenerSemana(fechaBase),
    };
}

function estadoBadgeClass(estado) {
    const valor = normalizarTexto(estado);
    if (valor === "activo") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    if (valor === "inactivo") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

// ---- KPI ----
function KpiCard({ icon: Icon, label, value, sub, color }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-lg hover:shadow-slate-200/60">
            <div
                className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.07] transition group-hover:scale-110"
                style={{ backgroundColor: color }}
            />
            <div className="flex items-center gap-3">
                <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}18`, color }}
                >
                    <Icon className="h-5 w-5" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                </div>
            </div>
            <div className="mt-4 text-3xl font-black text-slate-800">{value}</div>
            {sub ? <div className="mt-1 text-xs font-medium text-slate-400">{sub}</div> : null}
        </div>
    );
}

// ---- Filtros ----
function PillSelect({ value, onChange, children, icon: Icon }) {
    return (
        <div className="relative">
            {Icon ? (
                <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            ) : null}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`h-9 appearance-none rounded-full border border-slate-200 bg-white py-1.5 ${Icon ? "pl-8" : "pl-3"} pr-7 text-xs font-bold text-slate-600 outline-none transition hover:border-slate-300 focus:ring-2 focus:ring-blue-100`}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
        </div>
    );
}

// ---- Tabla ----
function TablaClientes({ datos, onAbrirDetalle }) {
    const datosTabla = datos.slice(0, 1000);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                <div className="text-sm font-extrabold text-slate-700">
                    {numero(datos.length)} vehículos
                </div>
                <div className="text-xs font-medium text-slate-400">
                    Doble click en una fila para ver el historial completo
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full table-fixed text-sm">
                    <colgroup>
                        <col className="w-[8%]" />
                        <col className="w-[21%]" />
                        <col className="w-[14%]" />
                        <col className="w-[10%]" />
                        <col className="w-[8%]" />
                        <col className="w-[6%]" />
                        <col className="w-[9%]" />
                        <col className="w-[15%]" />
                        <col className="w-[9%]" />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            <th className="px-4 py-3">Dealer</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Vehículo</th>
                            <th className="px-4 py-3">Segmento</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-right">Meses</th>
                            <th className="px-4 py-3">Última OS</th>
                            <th className="px-4 py-3 text-right">Total servicio</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {datosTabla.map((item, index) => (
                            <tr
                                key={`${item.vin}-${index}`}
                                onDoubleClick={() => onAbrirDetalle(item)}
                                className="cursor-pointer border-b border-slate-50 transition hover:bg-blue-50/40"
                            >
                                <td className="px-4 py-2.5">
                                    <span className="block truncate text-xs font-bold text-slate-600">{item.agencia}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                                            style={{ backgroundColor: NAVY }}
                                        >
                                            {iniciales(item.nombre_cliente)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate font-bold text-slate-800">
                                                {item.nombre_cliente}
                                            </div>
                                            <div className="truncate text-xs text-slate-400">
                                                {item.telefono_cliente ? formatTelefono(item.telefono_cliente) : "Sin teléfono"}
                                            </div>
                                            {item.telefono_cliente2 ? (
                                                <div className="truncate text-xs text-slate-400">
                                                    {formatTelefono(item.telefono_cliente2)}
                                                </div>
                                            ) : null}
                                            {item.telefono_cliente3 ? (
                                                <div className="truncate text-xs text-slate-400">
                                                    {formatTelefono(item.telefono_cliente3)}
                                                </div>
                                            ) : null}
                                            <div className="truncate text-xs text-slate-400">
                                                {item.correo_cliente || "Sin correo"}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="truncate font-semibold text-slate-700">
                                        {item.marca} {item.modelo_nombre}
                                    </div>
                                    <div className="truncate text-xs text-slate-400">{item.vin || "—"}</div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className="inline-block whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                        {item.segmento}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5">
                                    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${estadoBadgeClass(item.estado_actividad)}`}>
                                        {item.estado_actividad}
                                    </span>
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-600">
                                    {numero(item.meses_desde_venta)}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                    <div className="truncate">{item.ultima_orden_servicio || "—"}</div>
                                    <div className="text-xs text-slate-400">{formatDate(item.fecha_ultima_os)}</div>
                                </td>
                                <td className="px-4 py-2.5 text-right font-black text-slate-800">
                                    {moneda(item.total_ultimo_servicio)}
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Enviar mensaje"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {datosTabla.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-14 text-center text-slate-400">
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

// ---- Ranking con barras de progreso ----
const RANK_COLORS = ["#F0A500", "#94a3b8", "#D85A30"];

function RankList({ items, from, to, valueFormatter = numero, startRank = 0, max: maxOverride }) {
    const max = maxOverride ?? (items.reduce((acc, i) => Math.max(acc, i.value), 1) || 1);

    return (
        <div className="space-y-3.5">
            {items.map((item, index) => {
                const pct = Math.max((item.value / max) * 100, 4);
                const rank = startRank + index;
                const rankColor = RANK_COLORS[rank] || NAVY;
                return (
                    <div key={item.name} className="flex items-center gap-3">
                        <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                            style={{ backgroundColor: rankColor }}
                        >
                            {rank + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-bold text-slate-600">{item.name}</span>
                                <span className="shrink-0 text-xs font-black text-slate-800">
                                    {valueFormatter(item.value)}
                                </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${pct}%`,
                                        background: `linear-gradient(90deg, ${from}, ${to})`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ---- Gráficas ----
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
                    vehiculos: 0,
                    total_servicio: 0,
                });
            }
            const actual = map.get(key);
            actual.vehiculos += 1;
            actual.total_servicio += item.total_ultimo_servicio;
        });
        return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
    }, [datos]);

    const porSegmento = useMemo(() => {
        const map = new Map();
        datos.forEach((item) => {
            const clave = item.segmento || "Sin segmento";
            map.set(clave, (map.get(clave) || 0) + 1);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [datos]);

    const porDealer = useMemo(() => {
        const map = new Map();
        datos.forEach((item) => {
            const clave = item.agencia || "Sin dealer";
            if (!map.has(clave)) map.set(clave, { name: clave, vehiculos: 0, total_servicio: 0 });
            const actual = map.get(clave);
            actual.vehiculos += 1;
            actual.total_servicio += item.total_ultimo_servicio;
        });
        return Array.from(map.values()).sort((a, b) => b.vehiculos - a.vehiculos).slice(0, 10);
    }, [datos]);

    const porEstado = useMemo(() => {
        const map = new Map();
        datos.forEach((item) => {
            const clave = item.estado_actividad || "Sin estado";
            map.set(clave, (map.get(clave) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [datos]);

    const porMarca = useMemo(() => {
        const map = new Map();
        datos.forEach((item) => {
            const clave = item.marca || "Sin marca";
            map.set(clave, (map.get(clave) || 0) + 1);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [datos]);

    // NUEVO: distribución por modelo
    const porModelo = useMemo(() => {
        const map = new Map();
        datos.forEach((item) => {
            const clave = item.modelo_nombre || "Sin modelo";
            map.set(clave, (map.get(clave) || 0) + 1);
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [datos]);

    const totalSegmentos = porSegmento.reduce((acc, i) => acc + i.value, 0);
    const totalEstados = porEstado.reduce((acc, i) => acc + i.value, 0);

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            {/* Vehículos por mes */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-3">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>
                    Vehículos por mes
                </p>
                <p className="mb-4 text-sm text-slate-400">Actividad de servicio por período</p>

                <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={porMes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradVehiculos" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradServicio" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 11, fill: "#94a3b8" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `$${Number(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={TooltipStyle}
                            formatter={(value, name) =>
                                name === "Total servicio" ? [moneda(value), name] : [numero(value), name]
                            }
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="vehiculos"
                            name="Vehículos"
                            stroke={ACCENT}
                            strokeWidth={3}
                            fill="url(#gradVehiculos)"
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="total_servicio"
                            name="Total servicio"
                            stroke="#1D9E75"
                            strokeWidth={3}
                            fill="url(#gradServicio)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Distribución por segmento */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>
                    Distribución por segmento
                </p>
                <p className="mb-4 text-sm text-slate-400">Relación de vehículos por segmento</p>

                <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                        <Pie
                            data={porSegmento}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={90}
                            paddingAngle={2}
                        >
                            {porSegmento.map((_, index) => (
                                <Cell key={index} fill={SEGMENTO_COLORS[index % SEGMENTO_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={TooltipStyle} formatter={(v) => [numero(v), "Vehículos"]} />
                    </PieChart>
                </ResponsiveContainer>

                <div className="mt-2 space-y-2">
                    {porSegmento.map((item, index) => {
                        const pct = totalSegmentos > 0 ? ((item.value / totalSegmentos) * 100).toFixed(1) : "0.0";
                        return (
                            <div key={item.name} className="flex items-center gap-2 text-sm">
                                <div
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: SEGMENTO_COLORS[index % SEGMENTO_COLORS.length] }}
                                />
                                <span className="font-semibold text-slate-600">{item.name}</span>
                                <span className="ml-auto font-black text-slate-800">
                                    {pct}% <span className="font-medium text-slate-400">({numero(item.value)})</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top dealers */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-3">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>
                    Vehículos por dealer
                </p>
                <p className="mb-4 text-sm text-slate-400">Top 10 dealers con más vehículos activos en retención</p>

                <RankList items={porDealer.map((d) => ({ name: d.name, value: d.vehiculos }))} from="#6BB3F0" to={ACCENT} />
            </div>

            {/* Estado de actividad */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>
                    Estado de actividad
                </p>
                <p className="mb-4 text-sm text-slate-400">Vehículos activos vs. inactivos</p>

                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                        <Pie
                            data={porEstado}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={48}
                            outerRadius={75}
                            paddingAngle={2}
                        >
                            {porEstado.map((item) => (
                                <Cell
                                    key={item.name}
                                    fill={ESTADO_COLORS[normalizarTexto(item.name)] || "#94a3b8"}
                                />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={TooltipStyle} formatter={(v) => [numero(v), "Vehículos"]} />
                        <Legend
                            verticalAlign="bottom"
                            height={24}
                            formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
                    {porEstado.map((item) => {
                        const pct = totalEstados > 0 ? (item.value / totalEstados) * 100 : 0;
                        const color = ESTADO_COLORS[normalizarTexto(item.name)] || "#94a3b8";
                        return (
                            <div key={item.name} style={{ width: `${pct}%`, backgroundColor: color }} />
                        );
                    })}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {porEstado.map((item) => {
                        const pct = totalEstados > 0 ? ((item.value / totalEstados) * 100).toFixed(1) : "0.0";
                        const esActivo = normalizarTexto(item.name) === "activo";
                        const color = ESTADO_COLORS[normalizarTexto(item.name)] || "#94a3b8";
                        const Icon = esActivo ? CheckCircle2 : XCircle;
                        return (
                            <div
                                key={item.name}
                                className="rounded-xl p-4"
                                style={{ backgroundColor: `${color}12` }}
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" style={{ color }} />
                                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="mt-2 text-2xl font-black" style={{ color }}>
                                    {pct}%
                                </div>
                                <div className="text-xs font-medium text-slate-400">
                                    {numero(item.value)} vehículos
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* NUEVO: Distribución por modelo */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-3">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>
                    Distribución por modelo
                </p>
                <p className="mb-4 text-sm text-slate-400">Top 10 modelos con más vehículos en retención</p>

                <RankList
                    items={porModelo}
                    from="#6BD6C2"
                    to="#1D9E75"
                />
            </div>

            {/* Marca */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2">
                <p className="text-lg font-extrabold" style={{ color: NAVY }}>
                    Vehículos por marca
                </p>
                <p className="mb-4 text-sm text-slate-400">Top 8 marcas</p>

                <RankList
                    items={porMarca}
                    from="#A79CF0"
                    to="#7F77DD"
                />
            </div>
        </div>
    );
}

// ---- Tarjeta de tarea individual (editable) ----
function TareaCard({ tarea, onActualizar, onEliminar }) {
    const [titulo, setTitulo] = useState(tarea.titulo);
    const [descripcion, setDescripcion] = useState(tarea.descripcion || "");
    const colores = ESTADO_TAREA_COLORS[tarea.estado] || ESTADO_TAREA_COLORS.pendiente;

    useEffect(() => {
        setTitulo(tarea.titulo);
        setDescripcion(tarea.descripcion || "");
    }, [tarea.id, tarea.titulo, tarea.descripcion]);

    function guardarTitulo() {
        const limpio = titulo.trim();
        if (!limpio) {
            setTitulo(tarea.titulo);
            return;
        }
        if (limpio !== tarea.titulo) onActualizar(tarea.id, { titulo: limpio });
    }

    function guardarDescripcion() {
        if (descripcion !== (tarea.descripcion || "")) {
            onActualizar(tarea.id, { descripcion });
        }
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    onBlur={guardarTitulo}
                    placeholder="Título de la tarea"
                    className="min-w-0 flex-1 rounded-lg bg-transparent text-sm font-bold text-slate-800 outline-none transition focus:bg-slate-50"
                />
                <button
                    type="button"
                    onClick={() => onEliminar(tarea.id)}
                    title="Eliminar tarea"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onBlur={guardarDescripcion}
                placeholder="Agregar descripción..."
                rows={2}
                className="mt-1.5 w-full resize-none rounded-lg bg-transparent text-xs text-slate-500 outline-none transition focus:bg-slate-50"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
                <select
                    value={tarea.estado}
                    onChange={(e) => onActualizar(tarea.id, { estado: e.target.value })}
                    className="h-7 appearance-none rounded-full border-none px-3 text-[11px] font-bold outline-none"
                    style={{ backgroundColor: colores.bg, color: colores.text }}
                >
                    {Object.entries(ESTADO_TAREA_LABELS).map(([valor, label]) => (
                        <option key={valor} value={valor}>
                            {label}
                        </option>
                    ))}
                </select>
                <span className="text-[11px] font-medium text-slate-400">
                    {formatDate(String(tarea.created_at || "").slice(0, 10))}
                </span>
            </div>
        </div>
    );
}

// ---- Apartado de tareas del cliente (dentro del modal) ----
function TareasCliente({ telefono, tareas, loading, error, onCrear, onActualizar, onEliminar }) {
    return (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" style={{ color: NAVY }} />
                    <span className="text-sm font-extrabold" style={{ color: NAVY }}>
                        Tareas
                    </span>
                    {telefono ? (
                        <span className="text-xs font-medium text-slate-400">
                            · {formatTelefono(telefono)}
                        </span>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={onCrear}
                    disabled={!telefono}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: NAVY }}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva tarea
                </button>
            </div>

            <div className="p-4">
                {!telefono ? (
                    <div className="py-6 text-center text-sm font-medium text-slate-400">
                        Este cliente no tiene teléfono registrado, no se pueden ligar tareas.
                    </div>
                ) : loading ? (
                    <div className="py-6 text-center text-sm font-semibold text-slate-400">
                        Cargando tareas...
                    </div>
                ) : error ? (
                    <div className="py-4 text-sm font-bold text-red-600">{error}</div>
                ) : tareas.length === 0 ? (
                    <div className="py-6 text-center text-sm font-medium text-slate-400">
                        Sin tareas para este cliente todavía.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {tareas.map((tarea) => (
                            <TareaCard
                                key={tarea.id}
                                tarea={tarea}
                                onActualizar={onActualizar}
                                onEliminar={onEliminar}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Modal de historial ----
function DetalleModal({
    open,
    cliente,
    historial,
    loading,
    error,
    tareas,
    loadingTareas,
    errorTareas,
    onCrearTarea,
    onActualizarTarea,
    onEliminarTarea,
    onClose,
}) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#131E5C]/20 bg-white shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: NAVY }}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-black text-white">
                                {iniciales(cliente?.nombre_cliente)}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-lg font-extrabold text-white">
                                    {cliente?.nombre_cliente || "Detalle del cliente"}
                                </div>
                                <div className="truncate text-xs font-semibold text-white/70">
                                    VIN: {cliente?.vin || "—"}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[78vh] overflow-y-auto bg-slate-50 p-5">
                        {cliente ? (
                            <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
                                <InfoItem icon={Phone} label="Teléfono" value={cliente.telefono_cliente} />
                                <InfoItem icon={Mail} label="Correo" value={cliente.correo_cliente} />
                                <InfoItem icon={Car} label="Vehículo" value={`${cliente.marca} ${cliente.modelo_nombre}`} />
                                <InfoItem icon={MapPin} label="Placa" value={cliente.placa_vehiculo} />
                                <InfoItem icon={Wrench} label="Dealer" value={cliente.agencia} />
                                <InfoItem icon={PhoneCall} label="Medio de contacto" value={cliente.medio_contacto} />
                            </div>
                        ) : null}

                        {/* NUEVO: apartado de tareas ligado al teléfono del cliente */}
                        <TareasCliente
                            telefono={cliente?.telefono_cliente}
                            tareas={tareas}
                            loading={loadingTareas}
                            error={errorTareas}
                            onCrear={onCrearTarea}
                            onActualizar={onActualizarTarea}
                            onEliminar={onEliminarTarea}
                        />

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-4 py-3 text-sm font-extrabold text-[#131E5C]">
                                Historial de órdenes de servicio
                            </div>

                            {loading ? (
                                <div className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                                    Cargando historial...
                                </div>
                            ) : error ? (
                                <div className="px-4 py-6 text-sm font-bold text-red-600">{error}</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-100 text-left text-xs font-bold text-slate-500">
                                                <th className="px-4 py-2">Orden de Servicio</th>
                                                <th className="px-4 py-2">Fecha</th>
                                                <th className="px-4 py-2">Tipo</th>
                                                <th className="px-4 py-2">Subtipo</th>
                                                <th className="px-4 py-2">Situación</th>
                                                <th className="px-4 py-2">Medio contacto</th>
                                                <th className="px-4 py-2 text-right">Total servicio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historial.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                                        Sin órdenes registradas para este vehículo.
                                                    </td>
                                                </tr>
                                            ) : (
                                                historial.map((os) => (
                                                    <tr key={os.numero_orden_servicio} className="border-t border-slate-100 hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-bold text-[#131E5C]">{os.numero_orden_servicio}</td>
                                                        <td className="px-4 py-3 text-slate-600">{formatDate(os.fecha_os)}</td>
                                                        <td className="px-4 py-3 text-slate-600">{os.tipo_orden || "—"}</td>
                                                        <td className="px-4 py-3 text-slate-600">{os.subtipo_orden || "—"}</td>
                                                        <td className="px-4 py-3">
                                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                                                                {os.situacion_os || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{os.medio_contacto || "—"}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                                                            {moneda(os.total_servicio)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 text-[#131E5C]" />
            <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase text-slate-400">{label}</div>
                <div className="truncate text-sm font-bold text-slate-700">{value || "—"}</div>
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
    const [agencia, setAgencia] = useState("Todos");
    const [estado, setEstado] = useState("Todos");
    const [marca, setMarca] = useState("Todas");
    const [contacto, setContacto] = useState("Todos"); // NUEVO: filtro visual de contacto
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
        agencias: [],
        condiciones: [],
    });

    const [loading, setLoading] = useState(true);
    const [loadingOpciones, setLoadingOpciones] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [modalOpen, setModalOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [errorHistorial, setErrorHistorial] = useState(null);

    // NUEVO: estado de tareas del cliente abierto en el modal
    const [tareas, setTareas] = useState([]);
    const [loadingTareas, setLoadingTareas] = useState(false);
    const [errorTareas, setErrorTareas] = useState(null);

    const cacheRef = useRef(new Map());

    useEffect(() => {
        const controller = new AbortController();

        async function cargarOpciones() {
            try {
                setLoadingOpciones(true);
                const data = await obtenerOpcionesRetencion({ signal: controller.signal });

                setOpciones({
                    anios: Array.isArray(data.anios) ? data.anios : [],
                    anio_mes: Array.isArray(data.anio_mes) ? data.anio_mes : [],
                    meses_por_anio: data.meses_por_anio && typeof data.meses_por_anio === "object" ? data.meses_por_anio : {},
                    estados: Array.isArray(data.estados) ? data.estados : [],
                    segmentos: Array.isArray(data.segmentos) ? data.segmentos : [],
                    marcas: Array.isArray(data.marcas) ? data.marcas : [],
                    modelos: Array.isArray(data.modelos) ? data.modelos : [],
                    agencias: Array.isArray(data.agencias) ? data.agencias : [],
                    condiciones: Array.isArray(data.condiciones) ? data.condiciones : [],
                });
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                setLoadingOpciones(false);
            }
        }

        cargarOpciones();
        return () => controller.abort();
    }, []);

    const cargarOrdenes = useCallback(async (filtros, signal) => {
        const cacheKey = JSON.stringify(filtros);
        if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey);

        const data = await obtenerOrdenesRetencion(filtros, { signal });
        const lista = Array.isArray(data) ? data : data.results ?? [];
        const mapeado = lista.map(mapearOrden);

        cacheRef.current.set(cacheKey, mapeado);
        return mapeado;
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function cargarDatos() {
            try {
                setLoading(true);
                setError(null);

                const datos = await cargarOrdenes(
                    { anio, mes, segmento, agencia, estado, marca, ordering: "-fecha_ultima_os", limit: 50000 },
                    controller.signal
                );

                setDatosRaw(datos);
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        cargarDatos();
        return () => controller.abort();
    }, [anio, mes, segmento, agencia, estado, marca, cargarOrdenes, refreshKey]);

    const aniosDisponibles = useMemo(() => {
        if (opciones.anios.length > 0) return opciones.anios;
        return [...new Set(datosRaw.map((item) => item.anio))].filter(Boolean).sort((a, b) => b - a);
    }, [opciones.anios, datosRaw]);

    const mesesDisponibles = useMemo(() => {
        if (anio === "Todos") {
            const meses = opciones.anio_mes.map((item) => item.mes).filter(Boolean);
            return [...new Set(meses)].sort((a, b) => a - b);
        }
        const desdeOpciones = opciones.anio_mes
            .filter((item) => String(item.anio) === String(anio))
            .map((item) => item.mes)
            .filter(Boolean);
        if (desdeOpciones.length > 0) return [...new Set(desdeOpciones)].sort((a, b) => a - b);
        return [...new Set(datosRaw.map((item) => item.mes))].filter(Boolean).sort((a, b) => a - b);
    }, [anio, opciones.anio_mes, datosRaw]);

    const datosFiltrados = useMemo(() => {
        let datos = [...datosRaw];

        if (semana !== "Todas") {
            const semanaNumero = Number(semana);
            datos = datos.filter((item) => item.semana === semanaNumero);
        }

        // NOTA: el filtro de "Contacto" es solo visual por ahora; el backend
        // todavía no expone un campo de estado de contacto para filtrar por él.

        const texto = normalizarTexto(busqueda);
        if (texto) {
            datos = datos.filter((item) => {
                const acumulado = [
                    item.vin, item.numero_nota, item.ultima_orden_servicio, item.nombre_cliente,
                    item.telefono_cliente, item.correo_cliente, item.marca, item.agencia, item.modelo_nombre, item.placa_vehiculo,
                ].map(normalizarTexto).join(" ");
                return acumulado.includes(texto);
            });
        }

        return datos;
    }, [datosRaw, semana, busqueda]);

    const resumen = useMemo(() => {
        const totalVehiculos = datosFiltrados.length;
        const totalServicio = datosFiltrados.reduce((acc, item) => acc + item.total_ultimo_servicio, 0);
        const totalMeses = datosFiltrados.reduce((acc, item) => acc + item.meses_desde_venta, 0);
        const activos = datosFiltrados.filter((item) => normalizarTexto(item.estado_actividad) === "activo").length;
        const conTelefono = datosFiltrados.filter((item) => item.telefono_cliente).length;

        return {
            totalVehiculos,
            totalServicio,
            ticketPromedio: promedio(totalServicio, totalVehiculos),
            mesesPromedio: promedio(totalMeses, totalVehiculos),
            activos,
            conTelefono,
        };
    }, [datosFiltrados]);

    const loadingGeneral = loading || loadingOpciones;

    function limpiarFiltros() {
        setAnio(ANIO_ACTUAL);
        setMes("Todos");
        setSemana("Todas");
        setSegmento("Todos");
        setAgencia("Todos");
        setEstado("Todos");
        setMarca("Todas");
        setContacto("Todos");
        setBusqueda("");
    }

    function refrescarDatos() {
        cacheRef.current.clear();
        setRefreshKey((prev) => prev + 1);
    }

    async function abrirDetalle(cliente) {
        setClienteSeleccionado(cliente);
        setModalOpen(true);
        setHistorial([]);
        setErrorHistorial(null);
        setLoadingHistorial(true);
        setTareas([]);
        setErrorTareas(null);

        try {
            const data = await apiRetencion.historial(cliente.vin);
            setHistorial(Array.isArray(data) ? data : []);
        } catch (err) {
            setErrorHistorial(err.message || "No se pudo cargar el historial.");
        } finally {
            setLoadingHistorial(false);
        }

        if (cliente.telefono_cliente) {
            setLoadingTareas(true);
            try {
                const data = await apiRetencion.tareas(cliente.telefono_cliente);
                const lista = Array.isArray(data) ? data : data.results ?? [];
                setTareas(lista);
            } catch (err) {
                setErrorTareas(err.message || "No se pudieron cargar las tareas.");
            } finally {
                setLoadingTareas(false);
            }
        }
    }

    function cerrarDetalle() {
        setModalOpen(false);
        setClienteSeleccionado(null);
        setHistorial([]);
        setErrorHistorial(null);
        setTareas([]);
        setErrorTareas(null);
    }

    // NUEVO: crear una tarea nueva ligada al cliente abierto en el modal
    async function crearTarea() {
        if (!clienteSeleccionado?.telefono_cliente) return;
        try {
            const nueva = await apiRetencion.crearTarea({
                telefono_cliente: clienteSeleccionado.telefono_cliente,
                nombre_cliente: clienteSeleccionado.nombre_cliente,
                titulo: "Nueva tarea",
                estado: "pendiente",
            });
            setTareas((prev) => [nueva, ...prev]);
        } catch (err) {
            setErrorTareas(err.message || "No se pudo crear la tarea.");
        }
    }

    // NUEVO: actualizar título, descripción o estado de una tarea (optimista)
    async function actualizarTarea(id, cambios) {
        setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, ...cambios } : t)));
        try {
            await apiRetencion.actualizarTarea(id, cambios);
        } catch (err) {
            setErrorTareas(err.message || "No se pudo actualizar la tarea.");
        }
    }

    // NUEVO: eliminar una tarea (optimista, con rollback si falla)
    async function eliminarTarea(id) {
        const anterior = tareas;
        setTareas((prev) => prev.filter((t) => t.id !== id));
        try {
            await apiRetencion.eliminarTarea(id);
        } catch (err) {
            setTareas(anterior);
            setErrorTareas(err.message || "No se pudo eliminar la tarea.");
        }
    }

    if (loadingGeneral) {
        return (
            <div className="flex items-center justify-center py-24 text-sm text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
                    Cargando retención…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="max-w-md rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-center">
                    <p className="text-sm font-bold text-red-500">Error al cargar retención</p>
                    <p className="mt-1 text-xs text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">Retención</h2>
                    <p className="text-sm text-slate-400">
                        Vehículos vendidos, su actividad de servicio y su historial completo.
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1">
                    <button
                        onClick={() => setVista("tabla")}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${vista === "tabla" ? "text-white" : "text-slate-500 hover:bg-slate-50"
                            }`}
                        style={vista === "tabla" ? { backgroundColor: NAVY } : {}}
                    >
                        <Table2 className="h-3.5 w-3.5" />
                        Tabla
                    </button>
                    <button
                        onClick={() => setVista("graficas")}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${vista === "graficas" ? "text-white" : "text-slate-500 hover:bg-slate-50"
                            }`}
                        style={vista === "graficas" ? { backgroundColor: NAVY } : {}}
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Gráficas
                    </button>
                    <button
                        onClick={refrescarDatos}
                        className="ml-1 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <KpiCard icon={Car} label="Vehículos" value={numero(resumen.totalVehiculos)} sub="registros filtrados" color={ACCENT} />
                <KpiCard icon={Activity} label="Activos" value={numero(resumen.activos)} sub="con actividad de servicio" color="#1D9E75" />
                <KpiCard icon={Wallet} label="Total servicio" value={moneda(resumen.totalServicio)} sub="último servicio, acumulado" color="#D85A30" />
                <KpiCard icon={Gauge} label="Meses promedio" value={resumen.mesesPromedio.toFixed(1)} sub="desde la venta" color="#F0A500" />
                <KpiCard icon={Users} label="Contactables" value={numero(resumen.conTelefono)} sub="con teléfono registrado" color="#D4537E" />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <PillSelect value={anio} onChange={(v) => { setAnio(v); setMes("Todos"); }}>
                    <option value="Todos">Todos los años</option>
                    {aniosDisponibles.map((item) => (
                        <option key={item} value={String(item)}>{item}</option>
                    ))}
                </PillSelect>

                <PillSelect value={mes} onChange={setMes}>
                    <option value="Todos">Todos los meses</option>
                    {mesesDisponibles.map((m) => (
                        <option key={m} value={String(m)}>{MESES[m - 1]}</option>
                    ))}
                </PillSelect>

                <PillSelect value={agencia} onChange={setAgencia}>
                    <option value="Todos">Todos los Dealers</option>
                    {opciones.agencias.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </PillSelect>

                <PillSelect value={semana} onChange={setSemana}>
                    <option value="Todas">Todas las semanas</option>
                    {SEMANAS.map((item) => (
                        <option key={item} value={String(item)}>Semana {item}</option>
                    ))}
                </PillSelect>

                <PillSelect value={segmento} onChange={setSegmento}>
                    <option value="Todos">Todos los segmentos</option>
                    {opciones.segmentos.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </PillSelect>

                <PillSelect value={estado} onChange={setEstado}>
                    <option value="Todos">Todos los estados</option>
                    {opciones.estados.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </PillSelect>

                <PillSelect value={marca} onChange={setMarca}>
                    <option value="Todas">Todas las marcas</option>
                    {opciones.marcas.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </PillSelect>

                {/* NUEVO: filtro de Contacto (visual) */}
                <PillSelect value={contacto} onChange={setContacto} icon={PhoneCall}>
                    <option value="Todos">Todos los contactos</option>
                    {CONTACTO_OPCIONES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </PillSelect>

                <div className="relative ml-auto min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar VIN, cliente, placa, teléfono..."
                        className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs font-medium text-slate-600 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    onClick={limpiarFiltros}
                    className="h-9 shrink-0 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
                >
                    Limpiar
                </button>
            </div>

            {vista === "tabla" ? (
                <TablaClientes datos={datosFiltrados} onAbrirDetalle={abrirDetalle} />
            ) : (
                <VistaGraficas datos={datosFiltrados} />
            )}

            <DetalleModal
                open={modalOpen}
                cliente={clienteSeleccionado}
                historial={historial}
                loading={loadingHistorial}
                error={errorHistorial}
                tareas={tareas}
                loadingTareas={loadingTareas}
                errorTareas={errorTareas}
                onCrearTarea={crearTarea}
                onActualizarTarea={actualizarTarea}
                onEliminarTarea={eliminarTarea}
                onClose={cerrarDetalle}
            />
        </div>
    );
}