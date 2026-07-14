// src/pages/Taller/Taller.jsx
// VERSION V3: agenda + paneles laterales/inferior + tarjetas arrastrables.
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
    Building2,
    UserCog,
    Clock3,
    Table2,
    Wrench,
    CheckCircle2,
    ListChecks,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    GripVertical,
    CalendarClock,
    Coffee,
    GraduationCap,
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
];

const TECNICOS = [
    "CIRO AUGUSTO PEREZ",
    "DIEGO EMETERIO",
    "ANGEL SORIANO",
    "MISSAEL HERNANDEZ",
    "BLADIMIR CASTILLO",
    "VICTOR VAZQUEZ",
    "JOSE IGNACIO FIGUEROA",
    "CARLOS URIEL ORTEGA",
    "SALVADOR MARTINEZ",
    "TOMAS SANCHEZ",
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
    "En espera de Servicio",
    "En espera de trabajo",
    "Trabajo en Proceso",
    "En Control de Calidad",
    "En Lavado",
    "En Espera de Entrega",
    "Órdenes por Facturar",
];

const ETAPAS_WIP = [
    "En espera de Diagnóstico",
    "En espera de DISS",
    "En espera de autorización de presupuesto",
    "En espera de refacciones",
];

const ETAPAS_TERMINADO = ["Terminado", "Autos terminados no entregados"];
const TODAS_ETAPAS = [...ETAPAS_PROCESO, ...ETAPAS_WIP, ...ETAPAS_TERMINADO];

const ESTATUS_AGENDA = ["Programado", "Terminado"];

const TIPOS_BLOQUE = [
    { value: "trabajo", label: "Trabajo de taller", icon: Wrench },
    { value: "comida", label: "Comida", icon: Coffee },
    { value: "capacitacion", label: "Capacitación", icon: GraduationCap },
];

const HORA_INICIO_AGENDA = 7;
const HORA_FIN_AGENDA = 20;
const MINUTOS_INICIO_AGENDA = HORA_INICIO_AGENDA * 60;
const MINUTOS_FIN_AGENDA = HORA_FIN_AGENDA * 60;
const MINUTOS_TOTALES_AGENDA = MINUTOS_FIN_AGENDA - MINUTOS_INICIO_AGENDA;
const INTERVALO_MINUTOS = 15;
const TOTAL_INTERVALOS = MINUTOS_TOTALES_AGENDA / INTERVALO_MINUTOS;

const ANCHO_TECNICO = 230;
const ANCHO_MINIMO_LINEA = 2600;
const ALTURA_CARRIL = 100;

const PANEL_STORAGE_KEY = "taller.paneles.contenedores.v3";

const CONTENEDORES_TALLER = {
    izquierda: [
        {
            id: "proximo-trabajo",
            titulo: "Próximo Trabajo",
            etapaDestino: "En espera de trabajo",
            etapas: ["En espera de trabajo"],
            color: "#6B6865",
            icon: Clock3,
        },
        {
            id: "trabajo-proceso",
            titulo: "Trabajo en Proceso",
            etapaDestino: "Trabajo en Proceso",
            etapas: ["Trabajo en Proceso"],
            color: "#6B6865",
            icon: Wrench,
        },
        {
            id: "clientes-cita",
            titulo: "Clientes con Cita",
            etapaDestino: "Ingreso con Cita",
            etapas: ["Ingreso con Cita"],
            color: "#6B6865",
            icon: CalendarDays,
        },
        {
            id: "clientes-sin-cita",
            titulo: "Clientes sin Cita",
            etapaDestino: "Ingreso Sin Cita",
            etapas: ["Ingreso Sin Cita"],
            color: "#171717",
            icon: User,
        },
        {
            id: "espera-servicio",
            titulo: "En espera de Servicio",
            etapaDestino: "En espera de Servicio",
            etapas: ["En espera de Servicio"],
            color: "#6B6865",
            icon: CarFront,
        },
    ],
    derecha: [
        {
            id: "control-calidad",
            titulo: "En espera de Control de Calidad",
            etapaDestino: "En Control de Calidad",
            etapas: ["En Control de Calidad", "En espera de Control de Calidad"],
            color: "#6B6865",
            icon: CheckCircle2,
        },
        {
            id: "espera-lavado",
            titulo: "Espera de Lavado",
            etapaDestino: "En Lavado",
            etapas: ["En Lavado", "Espera de Lavado"],
            color: "#6B6865",
            icon: CarFront,
        },
        {
            id: "ordenes-facturar",
            titulo: "Órdenes por Facturar",
            etapaDestino: "Órdenes por Facturar",
            etapas: ["Órdenes por Facturar"],
            color: "#6B6865",
            icon: ClipboardList,
        },
    ],
    inferior: [
        {
            id: "espera-diagnostico",
            titulo: "En espera de Diagnóstico",
            etapaDestino: "En espera de Diagnóstico",
            etapas: ["En espera de Diagnóstico"],
            color: "#D5232A",
            icon: Wrench,
        },
        {
            id: "espera-diss",
            titulo: "En espera de DISS",
            etapaDestino: "En espera de DISS",
            etapas: ["En espera de DISS"],
            color: "#D5232A",
            icon: ClipboardList,
        },
        {
            id: "espera-autorizacion",
            titulo: "En espera de Autorización",
            etapaDestino: "En espera de autorización de presupuesto",
            etapas: [
                "En espera de autorización de presupuesto",
                "En espera de Autorización",
            ],
            color: "#D5232A",
            icon: CheckCircle2,
        },
        {
            id: "espera-piezas",
            titulo: "En espera de Piezas",
            etapaDestino: "En espera de refacciones",
            etapas: ["En espera de refacciones", "En espera de Piezas"],
            color: "#D5232A",
            icon: ListChecks,
        },
        {
            id: "terminados-no-entregados",
            titulo: "Autos terminados no entregados",
            etapaDestino: "Autos terminados no entregados",
            etapas: ["Autos terminados no entregados", "En Espera de Entrega"],
            color: "#D5232A",
            icon: CarFront,
        },
    ],
};

const TODOS_CONTENEDORES = Object.values(CONTENEDORES_TALLER).flat();

const DEFAULT_PANEL_STATE = {
    izquierda: true,
    derecha: true,
    inferior: true,
    contenedores: Object.fromEntries(
        TODOS_CONTENEDORES.map((contenedor) => [contenedor.id, true]),
    ),
};

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

function toDTLocal(value) {
    if (!value) return "";

    const text = String(value);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) {
        return text.slice(0, 16);
    }

    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function toYMD(value) {
    if (!value) return "";

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toHHMM(value) {
    if (!value) return "";

    const text = String(value).trim();
    const simpleMatch = text.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
        const hour = Number(simpleMatch[1]);
        const minute = Number(simpleMatch[2]);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
            return `${pad2(hour)}:${pad2(minute)}`;
        }
    }

    const local = toDTLocal(value);
    return local ? local.slice(11, 16) : "";
}

function timeToMinutes(value) {
    const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) return null;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return hour * 60 + minute;
}

function minutesToTime(minutes) {
    const safeMinutes = Math.max(0, Math.min(23 * 60 + 59, Number(minutes) || 0));
    return `${pad2(Math.floor(safeMinutes / 60))}:${pad2(safeMinutes % 60)}`;
}

function roundToQuarter(minutes) {
    return Math.round(minutes / INTERVALO_MINUTOS) * INTERVALO_MINUTOS;
}

function clampAgendaStart(value) {
    const parsed = timeToMinutes(value);
    const fallback = MINUTOS_INICIO_AGENDA;
    const minutes = parsed === null ? fallback : roundToQuarter(parsed);
    return minutesToTime(
        Math.max(
            MINUTOS_INICIO_AGENDA,
            Math.min(MINUTOS_FIN_AGENDA - INTERVALO_MINUTOS, minutes),
        ),
    );
}

function calculateEndTime(startTime, durationHours = 1) {
    const start = timeToMinutes(startTime) ?? MINUTOS_INICIO_AGENDA;
    const duration = Math.max(
        INTERVALO_MINUTOS,
        roundToQuarter(Math.max(0.25, Number(durationHours) || 1) * 60),
    );
    return minutesToTime(Math.min(MINUTOS_FIN_AGENDA, start + duration));
}

function addDaysToYMD(ymd, days) {
    const [year, month, day] = String(ymd).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return toYMD(date);
}

function formatDate(value) {
    const local = toDTLocal(value);
    return local ? local.replace("T", " ") : "—";
}

function formatLongDate(ymd) {
    const [year, month, day] = String(ymd).split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return "Fecha no válida";

    return new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function getMonthName(ymd) {
    const [year, month, day] = String(ymd).split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("es-MX", { month: "long" })
        .format(date)
        .toUpperCase();
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
    if (row?.citado === true || String(row?.citado).toLowerCase() === "true") {
        return "Ingreso con Cita";
    }
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
    if (row?.__manual_id) return `manual:${row.__manual_id}`;

    const noOrden = normalizeStr(row?.no_orden);
    if (noOrden) return `orden:${normalizeKey(noOrden)}`;

    const telefono = normalizeStr(getTelefono(row));
    const vin = normalizeStr(row?.vin);
    const cliente = normalizeStr(getClienteNombre(row));
    return `cliente:${normalizeKey(cliente)}|tel:${normalizeKey(telefono)}|vin:${normalizeKey(vin)}`;
}

function loadJSONStorage(key, fallback) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || "null");
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

function saveJSONStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function canonicalTechnician(value) {
    const key = normalizeKey(value);
    return TECNICOS.find((technician) => normalizeKey(technician) === key) || normalizeStr(value);
}

function inferBlockType(row, saved) {
    if (["trabajo", "comida", "capacitacion"].includes(saved?.tipo_bloque)) {
        return saved.tipo_bloque;
    }

    const searchable = normalizeKey(
        [row?.tipo_cita, row?.pauta, row?.comentarios, row?.comentarios_taller]
            .filter(Boolean)
            .join(" "),
    );

    if (searchable.includes("comida")) return "comida";
    if (searchable.includes("capacitacion")) return "capacitacion";
    return "trabajo";
}

function inferScheduleDate(row, saved) {
    return (
        toYMD(saved?.fecha_programada) ||
        toYMD(row?.fecha_programada) ||
        toYMD(row?.fecha_cita) ||
        toYMD(row?.fecha_ingreso) ||
        toYMD(row?.created_at) ||
        toYMD(new Date())
    );
}

function inferStartTime(row, saved) {
    const raw =
        saved?.hora_inicio ||
        row?.hora_inicio ||
        row?.horario_inicio ||
        row?.hora_cita ||
        toHHMM(row?.fecha_cita) ||
        toHHMM(row?.fecha_ingreso) ||
        "07:00";

    return clampAgendaStart(raw);
}

function inferEndTime(row, saved, startTime, hours) {
    const raw = saved?.hora_fin || row?.hora_fin || row?.horario_fin;
    const parsedRaw = toHHMM(raw);

    if (parsedRaw) {
        const endMinutes = timeToMinutes(parsedRaw);
        const startMinutes = timeToMinutes(startTime);
        if (
            endMinutes !== null &&
            startMinutes !== null &&
            endMinutes > startMinutes &&
            endMinutes <= MINUTOS_FIN_AGENDA
        ) {
            return minutesToTime(roundToQuarter(endMinutes));
        }
    }

    return calculateEndTime(startTime, hours || 1);
}

function getInitials(name) {
    return normalizeStr(name)
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "T";
}

function getActivityLabel(order) {
    if (order.tipo_bloque === "comida") {
        return "COMIDA";
    }

    if (order.tipo_bloque === "capacitacion") {
        return "CAPACITACIÓN";
    }

    const trabajos = (order.subtrabajos || [])
        .map((trabajo) => trabajo.nombre)
        .filter(Boolean)
        .join(", ");

    return [
        order.no_orden || order.cliente,
        order.modelo,
        trabajos,
    ]
        .filter(Boolean)
        .join(" · ");
}

function getActivityStyles(order) {
    if (order.tipo_bloque === "comida") {
        return {
            backgroundColor: "#0E7490",
            borderColor: "#155E75",
            color: "#FFFFFF",
        };
    }

    if (order.tipo_bloque === "capacitacion") {
        return {
            backgroundColor: "#EA580C",
            borderColor: "#C2410C",
            color: "#FFFFFF",
        };
    }

    if (order.estatus_agenda === "Terminado") {
        return {
            backgroundColor: "#334155",
            borderColor: "#0F172A",
            color: "#FFFFFF",
        };
    }

    return {
        backgroundColor: "#F0FDF4",
        borderColor: "#16A34A",
        color: "#14532D",
    };
}

function getActivityPosition(order) {
    const start = Math.max(
        MINUTOS_INICIO_AGENDA,
        timeToMinutes(order.hora_inicio) ?? MINUTOS_INICIO_AGENDA,
    );
    const end = Math.min(
        MINUTOS_FIN_AGENDA,
        timeToMinutes(order.hora_fin) ?? start + INTERVALO_MINUTOS,
    );

    const safeEnd = Math.max(start + INTERVALO_MINUTOS, end);
    const left = ((start - MINUTOS_INICIO_AGENDA) / MINUTOS_TOTALES_AGENDA) * 100;
    const width = ((safeEnd - start) / MINUTOS_TOTALES_AGENDA) * 100;

    return {
        left: `${left}%`,
        width: `${Math.max(width, 0.9)}%`,
    };
}

function assignLanes(orders) {
    const sorted = [...orders].sort((a, b) => {
        const startA = timeToMinutes(a.hora_inicio) ?? 0;
        const startB = timeToMinutes(b.hora_inicio) ?? 0;
        return startA - startB;
    });

    const laneEndTimes = [];
    const assigned = sorted.map((order) => {
        const start = timeToMinutes(order.hora_inicio) ?? MINUTOS_INICIO_AGENDA;
        const end = timeToMinutes(order.hora_fin) ?? start + INTERVALO_MINUTOS;

        let lane = laneEndTimes.findIndex((laneEnd) => laneEnd <= start);
        if (lane === -1) {
            lane = laneEndTimes.length;
            laneEndTimes.push(end);
        } else {
            laneEndTimes[lane] = end;
        }

        return { ...order, lane };
    });

    return {
        orders: assigned,
        laneCount: Math.max(1, laneEndTimes.length),
    };
}


function orderBelongsToContainer(order, container) {
    const currentStage = normalizeKey(order?.etapa);
    return container.etapas.some(
        (stage) => normalizeKey(stage) === currentStage,
    );
}

function DraggableOrderCard({ order, onEdit }) {
    function handleDragStart(event) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-taller-order-id", order.id);
        event.dataTransfer.setData("text/plain", order.id);
    }

    return (
        <article
            draggable
            onDragStart={handleDragStart}
            onClick={() => onEdit(order)}
            onDoubleClick={() => onEdit(order)}
            className="group cursor-grab rounded-lg border border-black/10 bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#131E5C]/40 hover:shadow-md active:cursor-grabbing"
            title="Arrastra esta tarjeta a otro contenedor para cambiar su etapa"
        >
            <div className="flex items-start gap-2">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#131E5C]" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-[11px] font-black text-[#131E5C]">
                            {order.no_orden ? `ORDEN ${order.no_orden}` : "SIN NÚMERO DE ORDEN"}
                        </div>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                            {order.hora_inicio || "--:--"}
                        </span>
                    </div>

                    <div className="mt-1 truncate text-xs font-extrabold text-slate-800">
                        {order.cliente || "Sin cliente"}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold text-slate-500">
                        {order.modelo ? (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5">
                                {order.modelo}
                            </span>
                        ) : null}
                        {order.tecnico ? (
                            <span className="max-w-full truncate rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                                {order.tecnico}
                            </span>
                        ) : (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                                Sin técnico
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

function StageContainer({
    container,
    orders,
    open,
    onToggle,
    onMoveOrder,
    onEdit,
    bottom = false,
}) {
    const [dragOver, setDragOver] = useState(false);
    const Icon = container.icon;

    function handleDrop(event) {
        event.preventDefault();
        const orderId =
            event.dataTransfer.getData("application/x-taller-order-id") ||
            event.dataTransfer.getData("text/plain");

        setDragOver(false);
        if (orderId) onMoveOrder(orderId, container.etapaDestino);
    }

    return (
        <section
            onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOver(true);
            }}
            onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setDragOver(false);
                }
            }}
            onDrop={handleDrop}
            className={[
                "overflow-hidden rounded-xl border-2 shadow-sm transition",
                dragOver
                    ? "scale-[1.01] border-[#131E5C] ring-4 ring-[#131E5C]/10"
                    : "border-transparent",
                bottom ? "min-w-[270px]" : "w-full",
            ].join(" ")}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-2 px-3 py-3 text-left text-white"
                style={{ backgroundColor: container.color }}
            >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black leading-tight">
                        {container.titulo}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-white/75">
                        {orders.length} {orders.length === 1 ? "tarjeta" : "tarjetas"}
                    </span>
                </span>

                {open ? (
                    <ChevronUp className="h-4 w-4 shrink-0" />
                ) : (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                )}
            </button>

            {open ? (
                <div
                    className={[
                        "space-y-2 overflow-y-auto bg-slate-100 p-2",
                        bottom ? "max-h-[260px] min-h-[100px]" : "max-h-[230px] min-h-[82px]",
                    ].join(" ")}
                >
                    {orders.length === 0 ? (
                        <div
                            className={[
                                "flex min-h-[66px] items-center justify-center rounded-lg border-2 border-dashed px-3 text-center text-[11px] font-bold",
                                dragOver
                                    ? "border-[#131E5C] bg-blue-50 text-[#131E5C]"
                                    : "border-slate-300 bg-white/70 text-slate-400",
                            ].join(" ")}
                        >
                            Arrastra aquí una orden
                        </div>
                    ) : (
                        orders.map((order) => (
                            <DraggableOrderCard
                                key={order.id}
                                order={order}
                                onEdit={onEdit}
                            />
                        ))
                    )}
                </div>
            ) : null}
        </section>
    );
}

function SideContainerPanel({
    side,
    title,
    open,
    containers,
    orders,
    panelState,
    onTogglePanel,
    onToggleContainer,
    onMoveOrder,
    onEdit,
}) {
    if (!open) {
        return (
            <button
                type="button"
                onClick={() => onTogglePanel(side)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-800 px-3 text-xs font-black text-white shadow-sm xl:h-[72vh] xl:w-12 xl:flex-col"
                title={`Abrir ${title}`}
            >
                {side === "izquierda" ? (
                    <ChevronRight className="h-5 w-5" />
                ) : (
                    <ChevronLeft className="h-5 w-5" />
                )}
                <span className="xl:[writing-mode:vertical-rl] xl:rotate-180">
                    {title}
                </span>
            </button>
        );
    }

    return (
        <aside className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg xl:w-[290px]">
            <div className="flex items-center justify-between gap-2 bg-slate-800 px-3 py-3 text-white">
                <div className="text-sm font-black tracking-wide">{title}</div>
                <button
                    type="button"
                    onClick={() => onTogglePanel(side)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
                    title="Contraer panel"
                >
                    {side === "izquierda" ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
            </div>

            <div className="max-h-[calc(72vh-52px)] space-y-3 overflow-y-auto bg-slate-200 p-3">
                {containers.map((container) => (
                    <StageContainer
                        key={container.id}
                        container={container}
                        orders={orders.filter((order) =>
                            orderBelongsToContainer(order, container),
                        )}
                        open={panelState.contenedores?.[container.id] !== false}
                        onToggle={() => onToggleContainer(container.id)}
                        onMoveOrder={onMoveOrder}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </aside>
    );
}

function BottomContainerPanel({
    open,
    containers,
    orders,
    panelState,
    onTogglePanel,
    onToggleContainer,
    onMoveOrder,
    onEdit,
}) {
    return (
        <section className="mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg">
            <button
                type="button"
                onClick={() => onTogglePanel("inferior")}
                className="flex w-full items-center justify-between gap-3 bg-slate-800 px-4 py-3 text-left text-white"
            >
                <div>
                </div>
                {open ? (
                    <ChevronUp className="h-5 w-5" />
                ) : (
                    <ChevronDown className="h-5 w-5" />
                )}
            </button>

            {open ? (
                <div className="overflow-x-auto bg-slate-200 p-3">
                    <div className="grid min-w-max grid-flow-col auto-cols-[290px] gap-3">
                        {containers.map((container) => (
                            <StageContainer
                                key={container.id}
                                container={container}
                                orders={orders.filter((order) =>
                                    orderBelongsToContainer(order, container),
                                )}
                                open={panelState.contenedores?.[container.id] !== false}
                                onToggle={() => onToggleContainer(container.id)}
                                onMoveOrder={onMoveOrder}
                                onEdit={onEdit}
                                bottom
                            />
                        ))}
                    </div>
                </div>
            ) : null}
        </section>
    );
}

function WorkshopBoardLayout({ agendaOrders, containerOrders, technicians, selectedDate, onEdit, onMoveOrder, onScheduleOrder, panelState, onTogglePanel, onToggleContainer, }) {
    return (
        <div>

            <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-start">
                <SideContainerPanel
                    side="izquierda"
                    open={panelState.izquierda}
                    containers={CONTENEDORES_TALLER.izquierda}
                    orders={containerOrders}
                    panelState={panelState}
                    onTogglePanel={onTogglePanel}
                    onToggleContainer={onToggleContainer}
                    onMoveOrder={onMoveOrder}
                    onEdit={onEdit}
                />

                <div className="min-w-0">
                    <AgendaBoard
                        orders={agendaOrders}
                        technicians={technicians}
                        selectedDate={selectedDate}
                        onEdit={onEdit}
                        onScheduleOrder={onScheduleOrder}
                    />
                </div>

                <SideContainerPanel
                    side="derecha"
                    open={panelState.derecha}
                    containers={CONTENEDORES_TALLER.derecha}
                    orders={containerOrders}
                    panelState={panelState}
                    onTogglePanel={onTogglePanel}
                    onToggleContainer={onToggleContainer}
                    onMoveOrder={onMoveOrder}
                    onEdit={onEdit}
                />
            </div>

            <BottomContainerPanel
                open={panelState.inferior}
                containers={CONTENEDORES_TALLER.inferior}
                orders={containerOrders}
                panelState={panelState}
                onTogglePanel={onTogglePanel}
                onToggleContainer={onToggleContainer}
                onMoveOrder={onMoveOrder}
                onEdit={onEdit}
            />
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
                <div className="w-full max-w-6xl overflow-hidden rounded-xl border border-[#131E5C] bg-neutral-100 shadow-2xl">
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
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[75vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-black/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children, className = "" }) {
    return (
        <div className={`rounded-xl border border-black/10 bg-white p-4 ${className}`}>
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

function StatusBadge({ status }) {
    const finished = status === "Terminado";

    return (
        <span
            className={[
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold",
                finished
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-blue-200 bg-blue-50 text-blue-700",
            ].join(" ")}
        >
            {status}
        </span>
    );
}

function TimelineLines({ showCurrentTime = false }) {
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const currentTimeVisible =
        showCurrentTime &&
        currentMinutes >= MINUTOS_INICIO_AGENDA &&
        currentMinutes <= MINUTOS_FIN_AGENDA;

    return (
        <div className="pointer-events-none absolute inset-0 z-0">
            {Array.from({ length: TOTAL_INTERVALOS + 1 }, (_, index) => {
                const isHour = index % 4 === 0;
                return (
                    <div
                        key={index}
                        className="absolute inset-y-0"
                        style={{
                            left: `${(index / TOTAL_INTERVALOS) * 100}%`,
                            borderLeft: isHour
                                ? "1px solid rgba(71, 85, 105, 0.42)"
                                : "1px dotted rgba(100, 116, 139, 0.35)",
                        }}
                    />
                );
            })}

            {currentTimeVisible ? (
                <div
                    className="absolute inset-y-0 z-20 w-[2px] bg-red-500"
                    style={{
                        left: `${((currentMinutes - MINUTOS_INICIO_AGENDA) / MINUTOS_TOTALES_AGENDA) * 100}%`,
                    }}
                    title="Hora actual"
                />
            ) : null}
        </div>
    );
}

function TimeHeader() {
    return (
        <div className="relative h-[62px] border-l border-slate-400 bg-slate-200">
            <TimelineLines />

            <div
                className="absolute inset-0 z-10 grid"
                style={{
                    gridTemplateColumns: `repeat(${HORA_FIN_AGENDA - HORA_INICIO_AGENDA}, minmax(0, 1fr))`,
                }}
            >
                {Array.from({ length: HORA_FIN_AGENDA - HORA_INICIO_AGENDA }, (_, index) => {
                    const hour = HORA_INICIO_AGENDA + index;
                    return (
                        <div key={hour} className="relative border-r border-slate-400/40">
                            <div className="px-1 pt-1 text-center text-[14px] font-black text-slate-700">
                                {hour}:00
                            </div>
                            <div className="absolute inset-x-0 bottom-1 grid grid-cols-4 text-center text-[12px] font-bold text-slate-500">
                                <span>00</span>
                                <span>15</span>
                                <span>30</span>
                                <span>45</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="absolute right-0 top-1 z-20 translate-x-1/2 text-[12px] font-black text-slate-700">
                20:00
            </div>
        </div>
    );
}

function ActivityBar({ order, onEdit }) {
    const position = getActivityPosition(order);
    const styles = getActivityStyles(order);
    const label = getActivityLabel(order);

    function handleDragStart(event) {
        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
            "application/x-taller-order-id",
            String(order.id),
        );

        event.dataTransfer.setData(
            "text/plain",
            String(order.id),
        );
    }

    return (
        <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            onDoubleClick={() => onEdit(order)}
            onClick={() => onEdit(order)}
            className="
                absolute
                z-10
                flex
                h-[30px]
                cursor-grab
                items-center
                overflow-hidden
                rounded
                border
                px-2
                text-left
                text-[10px]
                font-extrabold
                shadow-sm
                transition
                hover:z-30
                hover:brightness-95
                active:cursor-grabbing
                focus:outline-none
                focus:ring-2
                focus:ring-[#131E5C]/40
            "
            style={{
                ...position,
                ...styles,
                top: `${order.lane * ALTURA_CARRIL + 4}px`,
            }}
            title={`${label}\n${order.hora_inicio} - ${order.hora_fin}\nArrastra para cambiar técnico u horario`}
        >
            <span className="truncate">{label}</span>
        </button>
    );
}

function TimelineRow({
    orders,
    technician,
    selectedDate,
    onEdit,
    onScheduleOrder,
}) {
    const [dragOver, setDragOver] = useState(false);
    const [dropMinutes, setDropMinutes] = useState(null);

    const laneData = useMemo(
        () => assignLanes(orders),
        [orders],
    );

    const rowHeight = laneData.laneCount * ALTURA_CARRIL;
    const isToday = selectedDate === toYMD(new Date());

    function calculateDropMinutes(event) {
        const rectangle = event.currentTarget.getBoundingClientRect();

        const relativeX = Math.max(
            0,
            Math.min(
                rectangle.width,
                event.clientX - rectangle.left,
            ),
        );

        const percentage =
            rectangle.width > 0
                ? relativeX / rectangle.width
                : 0;

        const rawMinutes =
            MINUTOS_INICIO_AGENDA +
            percentage * MINUTOS_TOTALES_AGENDA;

        const roundedMinutes = roundToQuarter(rawMinutes);

        return Math.max(
            MINUTOS_INICIO_AGENDA,
            Math.min(
                MINUTOS_FIN_AGENDA - INTERVALO_MINUTOS,
                roundedMinutes,
            ),
        );
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";

        const minutes = calculateDropMinutes(event);

        setDragOver(true);
        setDropMinutes(minutes);
    }

    function handleDragLeave(event) {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setDragOver(false);
            setDropMinutes(null);
        }
    }

    function handleDrop(event) {
        event.preventDefault();

        const orderId =
            event.dataTransfer.getData(
                "application/x-taller-order-id",
            ) ||
            event.dataTransfer.getData("text/plain");

        const minutes = calculateDropMinutes(event);

        setDragOver(false);
        setDropMinutes(null);

        if (!orderId) return;

        onScheduleOrder(
            orderId,
            technician,
            selectedDate,
            minutesToTime(minutes),
        );
    }

    const previewPosition =
        dropMinutes === null
            ? 0
            : (
                (dropMinutes - MINUTOS_INICIO_AGENDA) /
                MINUTOS_TOTALES_AGENDA
            ) * 100;

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
                "relative border-b border-slate-400/60 bg-white transition",
                dragOver
                    ? "bg-blue-50 ring-2 ring-inset ring-[#131E5C]/30"
                    : "",
            ].join(" ")}
            style={{
                height: `${rowHeight}px`,
                minHeight: `${ALTURA_CARRIL}px`,
            }}
        >
            <TimelineLines showCurrentTime={isToday} />

            {dragOver && dropMinutes !== null ? (
                <>
                    <div
                        className="
                            pointer-events-none
                            absolute
                            inset-y-0
                            z-40
                            w-[3px]
                            bg-[#131E5C]
                        "
                        style={{
                            left: `${previewPosition}%`,
                        }}
                    />

                    <div
                        className="
                            pointer-events-none
                            absolute
                            top-1
                            z-50
                            -translate-x-1/2
                            rounded
                            bg-[#131E5C]
                            px-2
                            py-1
                            text-[10px]
                            font-black
                            text-white
                            shadow
                        "
                        style={{
                            left: `${previewPosition}%`,
                        }}
                    >
                        {minutesToTime(dropMinutes)}
                    </div>
                </>
            ) : null}

            {laneData.orders.map((order) => (
                <ActivityBar
                    key={order.id}
                    order={order}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
}

function AgendaBoard({ orders, technicians, selectedDate, onEdit, onScheduleOrder, }) {
    const rowsByTechnician = useMemo(() => {
        const grouped = new Map();

        technicians.forEach((technician) => {
            grouped.set(technician, []);
        });

        orders.forEach((order) => {
            const technician =
                canonicalTechnician(order.tecnico) || "SIN TÉCNICO";

            if (!grouped.has(technician)) {
                grouped.set(technician, []);
            }

            grouped.get(technician).push(order);
        });

        return grouped;
    }, [orders, technicians]);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg">
            <div className="max-h-[72vh] overflow-auto">
                <div
                    style={{
                        minWidth: `${ANCHO_TECNICO + ANCHO_MINIMO_LINEA}px`,
                    }}
                >
                    {/* Encabezado */}
                    <div
                        className="sticky top-0 z-30 grid border-b border-slate-400 bg-white"
                        style={{
                            gridTemplateColumns: `${ANCHO_TECNICO}px minmax(${ANCHO_MINIMO_LINEA}px, 1fr)`,
                        }}
                    >
                        {/* Columna técnico */}
                        <div
                            className="sticky left-0 z-30 flex h-[62px] items-center border-r border-slate-400 bg-[#0F6475] px-4 text-white"
                            style={{ width: `${ANCHO_TECNICO}px` }}
                        >
                            <div>
                                <div className="text-xs font-black tracking-widest">
                                    {getMonthName(selectedDate)}
                                </div>

                                <div className="mt-1 text-[11px] font-semibold text-white/80">
                                    TÉCNICO
                                </div>
                            </div>
                        </div>

                        {/* Horario */}
                        <TimeHeader />
                    </div>

                    {/* Filas de técnicos */}
                    {technicians.map((technician, technicianIndex) => {
                        const technicianOrders =
                            rowsByTechnician.get(technician) || [];

                        const laneData = assignLanes(technicianOrders);
                        const rowHeight =
                            laneData.laneCount * ALTURA_CARRIL;

                        return (
                            <div
                                key={technician}
                                className="grid border-b border-slate-500"
                                style={{
                                    gridTemplateColumns: `${ANCHO_TECNICO}px minmax(${ANCHO_MINIMO_LINEA}px, 1fr)`,
                                }}
                            >
                                {/* Información del técnico */}
                                <div
                                    className="sticky left-0 z-30 flex items-center gap-3 border-r border-slate-400 bg-white px-3"
                                    style={{
                                        width: `${ANCHO_TECNICO}px`,
                                        height: `${rowHeight}px`,
                                        minHeight: `${ALTURA_CARRIL}px`,
                                    }}
                                >
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black text-slate-400">
                                            {pad2(technicianIndex + 1)}
                                        </div>

                                        <div className="text-xs font-extrabold leading-tight text-[#131E5C]">
                                            {technician}
                                        </div>
                                    </div>
                                </div>

                                {/* Todas las actividades juntas */}
                                <TimelineRow
                                    orders={technicianOrders}
                                    technician={technician}
                                    selectedDate={selectedDate}
                                    onEdit={onEdit}
                                    onScheduleOrder={onScheduleOrder}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
export default function Taller() {
    const { user } = useAuth();

    const permisos = user?.permisos || [];
    const rol = normalizeKey(user?.rol);
    const isAdmin = useMemo(
        () =>
            rol === "administrador" ||
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN") ||
            permisos.includes("CRM_DIGITALES") ||
            permisos.includes("TALLER_ADMIN"),
        [rol, permisos],
    );

    const userAgencias = useMemo(
        () =>
            String(user?.agencia || "")
                .split("|")
                .map(normalizeStr)
                .filter(Boolean),
        [user?.agencia],
    );
    const userAgencia = userAgencias[0] || "";

    const [remoteRows, setRemoteRows] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [vista, setVista] = useState("agenda");
    const [openModal, setOpenModal] = useState(false);
    const [editingOrden, setEditingOrden] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState({
        q: "",
        agencia: "Todos",
        tecnico: "Todos",
        fecha: toYMD(new Date()),
    });
    const [panelState, setPanelState] = useState(() => {
        const stored = loadJSONStorage(PANEL_STORAGE_KEY, DEFAULT_PANEL_STATE);
        return {
            ...DEFAULT_PANEL_STATE,
            ...stored,
            contenedores: {
                ...DEFAULT_PANEL_STATE.contenedores,
                ...(stored?.contenedores || {}),
            },
        };
    });

    const inputBase =
        "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none transition";
    const inputOk =
        "border-black/10 bg-neutral-100 focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10";

    const refreshList = useCallback(async () => {
        setLoadingList(true);

        try {
            const data = await apiHojaIngresos.list();

            setRemoteRows(
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                        ? data.results
                        : [],
            );
        } catch (error) {
            console.error(error);
            setRemoteRows([]);

            alert(
                error?.message ||
                "No se pudo cargar la información del taller.",
            );
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        refreshList();
    }, [refreshList]);

    useEffect(() => {
        saveJSONStorage(PANEL_STORAGE_KEY, panelState);
    }, [panelState]);

    const userTieneAgencia = useCallback(
        (agenciaRegistro) => {
            if (isAdmin) return true;
            if (userAgencias.length === 0) return true;

            const agencia = normalizeKey(agenciaRegistro);
            return userAgencias.some((assigned) => normalizeKey(assigned) === agencia);
        },
        [isAdmin, userAgencias],
    );

    const ordenes = useMemo(() => {
        return (remoteRows || [])
            .filter((row) => userTieneAgencia(row.agencia))
            .map((row) => {
                const serviciosBase =
                    row.tipo_servicio ||
                    row.tipo_cita ||
                    row.pauta ||
                    "";

                const subtrabajos =
                    Array.isArray(row.subtrabajos) && row.subtrabajos.length > 0
                        ? row.subtrabajos.map((work, index) => ({
                            id: work.id ?? `${row.id}-${index}`,
                            nombre: normalizeStr(work.nombre),
                            horas: Number(work.horas || 0),
                            orden: Number(work.orden ?? index),
                        }))
                        : splitTrabajos(serviciosBase).map((nombre, index) => ({
                            id: `${row.id}-${index}`,
                            nombre,
                            horas: 0,
                            orden: index,
                        }));

                /*
                 * No inventamos fecha ni horario para ingresos que todavía
                 * no se han arrastrado a la agenda. Esos registros deben vivir
                 * solamente en sus contenedores operativos.
                 */
                const fechaProgramada = toYMD(row.fecha_programada);
                const horaInicio = toHHMM(row.hora_inicio);
                const horaFin = toHHMM(row.hora_fin);
                const tecnico = canonicalTechnician(row.tecnico || "");

                const inicioMinutos = timeToMinutes(horaInicio);
                const finMinutos = timeToMinutes(horaFin);

                const horasCalculadas =
                    inicioMinutos !== null &&
                        finMinutos !== null &&
                        finMinutos > inicioMinutos
                        ? (finMinutos - inicioMinutos) / 60
                        : 0;

                const horasTrabajos = subtrabajos.reduce(
                    (sum, work) => sum + Number(work.horas || 0),
                    0,
                );

                const tieneAgenda = Boolean(
                    tecnico &&
                    fechaProgramada &&
                    horaInicio &&
                    horaFin,
                );

                return {
                    ...row,
                    id: String(row.id),
                    rowIds: [],
                    rows: [],
                    isManual:
                        row.isManual === true ||
                        row.is_manual === true ||
                        row.cliente_id == null,
                    manualRowId: null,
                    agencia: row.agencia || "",
                    no_orden: row.no_orden || "",
                    cliente:
                        row.cliente ||
                        row.cliente_nombre ||
                        row.nombre_cliente ||
                        "Sin nombre",
                    telefono:
                        row.telefono ||
                        row.cliente_telefono ||
                        "—",
                    correo:
                        row.correo ||
                        row.cliente_correo_electronico ||
                        "",
                    vin: row.vin || "",
                    modelo: row.modelo || "",
                    fecha_ingreso: row.fecha_ingreso || row.creado_en,
                    etapa: row.etapa || "Ingreso con Cita",
                    tecnico,
                    comentarios_taller: row.comentarios_taller || "",
                    tipo_bloque: row.tipo_bloque || "trabajo",
                    tipo_servicio: serviciosBase,
                    fecha_programada: fechaProgramada,
                    estatus_agenda: row.estatus_agenda || "Programado",
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    subtrabajos,
                    tieneAgenda,
                    horasTotales: Number(
                        row.horasTotales ??
                        row.horas_totales ??
                        horasTrabajos,
                    ),
                    horasAgenda: Number(
                        row.horasAgenda ??
                        row.horas_agenda ??
                        horasCalculadas,
                    ),
                };
            });
    }, [remoteRows, userTieneAgencia]);

    const dealers = useMemo(() => {
        if (!isAdmin && userAgencias.length > 0) {
            return ["Todos", ...userAgencias];
        }

        const set = new Set(
            (ordenes || [])
                .map((row) => normalizeStr(row.agencia))
                .filter(Boolean),
        );

        return ["Todos", ...DEALERS, ...Array.from(set)].filter(
            (value, index, array) => array.indexOf(value) === index,
        );
    }, [ordenes, isAdmin, userAgencias]);

    const techniciansFilter = useMemo(() => {
        const extras = ordenes
            .map((order) => canonicalTechnician(order.tecnico))
            .filter(Boolean)
            .filter(
                (technician) =>
                    !TECNICOS.some(
                        (official) => normalizeKey(official) === normalizeKey(technician),
                    ),
            );

        return ["Todos", ...TECNICOS, ...Array.from(new Set(extras))];
    }, [ordenes]);

    const filtered = useMemo(() => {
        const query = normalizeKey(filters.q);

        return ordenes.filter((order) => {
            const matchesQuery =
                !query ||
                [
                    order.cliente,
                    order.telefono,
                    order.no_orden,
                    order.vin,
                    order.modelo,
                    order.tecnico,
                    order.etapa,
                    order.tipo_bloque,
                    ...order.subtrabajos.map((work) => work.nombre),
                ].some((value) => normalizeKey(value).includes(query));

            const matchesDealer =
                filters.agencia === "Todos" ||
                normalizeKey(order.agencia) === normalizeKey(filters.agencia);

            const matchesTechnician =
                filters.tecnico === "Todos" ||
                normalizeKey(order.tecnico) === normalizeKey(filters.tecnico);

            const matchesDate = order.fecha_programada === filters.fecha;

            return matchesQuery && matchesDealer && matchesTechnician && matchesDate;
        });
    }, [ordenes, filters]);

    const agendaOrders = useMemo(
        () => filtered.filter((order) => order.tieneAgenda),
        [filtered],
    );

    const containerOrders = useMemo(() => {
        const query = normalizeKey(filters.q);

        return ordenes.filter((order) => {
            if (order.tipo_bloque !== "trabajo") return false;

            const matchesQuery =
                !query ||
                [
                    order.cliente,
                    order.telefono,
                    order.no_orden,
                    order.vin,
                    order.modelo,
                    order.tecnico,
                    order.etapa,
                    ...order.subtrabajos.map((work) => work.nombre),
                ].some((value) => normalizeKey(value).includes(query));

            const matchesDealer =
                filters.agencia === "Todos" ||
                normalizeKey(order.agencia) === normalizeKey(filters.agencia);

            const matchesTechnician =
                filters.tecnico === "Todos" ||
                normalizeKey(order.tecnico) === normalizeKey(filters.tecnico);

            return matchesQuery && matchesDealer && matchesTechnician;
        });
    }, [ordenes, filters.q, filters.agencia, filters.tecnico]);

    const techniciansInAgenda = useMemo(() => {
        if (filters.tecnico !== "Todos") return [filters.tecnico];

        const extras = filtered
            .map((order) => canonicalTechnician(order.tecnico) || "SIN TÉCNICO")
            .filter(
                (technician) =>
                    !TECNICOS.some(
                        (official) => normalizeKey(official) === normalizeKey(technician),
                    ),
            );

        return [...TECNICOS, ...Array.from(new Set(extras))];
    }, [filtered, filters.tecnico]);

    const stats = useMemo(() => {
        const programmed = filtered.filter(
            (order) => order.estatus_agenda === "Programado",
        ).length;
        const finished = filtered.filter(
            (order) => order.estatus_agenda === "Terminado",
        ).length;
        const lunch = filtered.filter((order) => order.tipo_bloque === "comida").length;
        const training = filtered.filter(
            (order) => order.tipo_bloque === "capacitacion",
        ).length;
        const hours = filtered.reduce((sum, order) => sum + order.horasAgenda, 0);

        return {
            total: filtered.length,
            programmed,
            finished,
            lunch,
            training,
            hours,
        };
    }, [filtered]);

    async function scheduleOrder(
        orderId,
        technician,
        selectedDate,
        startTime,
    ) {
        const order = ordenes.find(
            (item) => String(item.id) === String(orderId),
        );

        if (!order) {
            alert("No se encontró la actividad seleccionada.");
            return;
        }

        const currentStart =
            timeToMinutes(order.hora_inicio) ??
            MINUTOS_INICIO_AGENDA;

        const currentEnd =
            timeToMinutes(order.hora_fin) ??
            currentStart + 60;

        /*
         * Si la duración actual no es válida,
         * utiliza una hora.
         */
        const durationMinutes = Math.max(
            INTERVALO_MINUTOS,
            currentEnd - currentStart,
        );

        let newStartMinutes =
            timeToMinutes(startTime) ??
            MINUTOS_INICIO_AGENDA;

        /*
         * Evita que el trabajo termine después
         * del final de la agenda.
         */
        const lastPossibleStart =
            MINUTOS_FIN_AGENDA - durationMinutes;

        newStartMinutes = Math.max(
            MINUTOS_INICIO_AGENDA,
            Math.min(newStartMinutes, lastPossibleStart),
        );

        newStartMinutes = roundToQuarter(newStartMinutes);

        const newEndMinutes =
            newStartMinutes + durationMinutes;

        const payload = {
            tecnico: canonicalTechnician(technician),
            fecha_programada: selectedDate,
            hora_inicio: minutesToTime(newStartMinutes),
            hora_fin: minutesToTime(newEndMinutes),
            estatus_agenda: "Programado",

            /*
             * La tarjeta ya fue colocada en la agenda,
             * pero puede conservar su etapa "Ingreso con Cita".
             */
            etapa: order.etapa || "Ingreso con Cita",
        };

        const previousRows = remoteRows;

        /*
         * Movimiento visual inmediato.
         */
        setRemoteRows((previous) =>
            previous.map((row) =>
                String(row.id) === String(orderId)
                    ? {
                        ...row,
                        ...payload,
                    }
                    : row,
            ),
        );

        try {
            const updated = await apiHojaIngresos.patch(
                orderId,
                payload,
            );

            /*
             * IMPORTANTE:
             * No reemplazar completamente el registro.
             * Se mezclan los datos anteriores, el payload
             * y la respuesta del backend.
             */
            setRemoteRows((previous) =>
                previous.map((row) => {
                    if (String(row.id) !== String(orderId)) {
                        return row;
                    }

                    return {
                        ...row,
                        ...payload,
                        ...(updated || {}),
                        tecnico:
                            updated?.tecnico ||
                            payload.tecnico,
                        fecha_programada:
                            toYMD(updated?.fecha_programada) ||
                            payload.fecha_programada,
                        hora_inicio:
                            toHHMM(updated?.hora_inicio) ||
                            payload.hora_inicio,
                        hora_fin:
                            toHHMM(updated?.hora_fin) ||
                            payload.hora_fin,
                    };
                }),
            );
        } catch (error) {
            console.error(error);

            setRemoteRows(previousRows);

            alert(
                error?.message ||
                "No se pudo cambiar el técnico o el horario.",
            );
        }
    }

    async function moveOrderToStage(orderId, targetStage) {
        const previousRows = remoteRows;

        // Movimiento visual inmediato.
        setRemoteRows((previous) =>
            previous.map((row) =>
                String(row.id) === String(orderId)
                    ? { ...row, etapa: targetStage }
                    : row,
            ),
        );

        try {
            const updated = await apiHojaIngresos.patch(orderId, {
                etapa: targetStage,
            });

            setRemoteRows((previous) =>
                previous.map((row) =>
                    String(row.id) === String(orderId)
                        ? {
                            ...row,
                            etapa: targetStage,
                            ...(updated || {}),
                        }
                        : row,
                ),
            );
        } catch (error) {
            console.error(error);
            setRemoteRows(previousRows);

            alert(
                error?.message ||
                "No se pudo cambiar la etapa de la orden.",
            );
        }
    }

    function togglePanel(panelName) {
        setPanelState((previous) => ({
            ...previous,
            [panelName]: !previous[panelName],
        }));
    }

    function toggleContainer(containerId) {
        setPanelState((previous) => ({
            ...previous,
            contenedores: {
                ...(previous.contenedores || {}),
                [containerId]: previous.contenedores?.[containerId] === false,
            },
        }));
    }

    function openEdit(order) {
        setEditingOrden(order);
        setDraft({
            agencia: order.agencia || "",
            no_orden: order.no_orden || "",
            cliente: order.cliente === "Sin nombre" ? "" : order.cliente,
            telefono: order.telefono === "—" ? "" : order.telefono,
            correo: order.correo || "",
            vin: order.vin || "",
            modelo: order.modelo || "",
            tecnico: order.tecnico || "",
            etapa: order.etapa || "Ingreso con Cita",
            comentarios_taller: order.comentarios_taller || "",
            tipo_bloque: order.tipo_bloque || "trabajo",
            fecha_programada: order.fecha_programada || filters.fecha,
            hora_inicio: order.hora_inicio || "07:00",
            hora_fin: order.hora_fin || "08:00",
            estatus_agenda: order.estatus_agenda || "Programado",
            subtrabajos: order.subtrabajos.map((item, index) => ({
                id: item.id || `${order.id}-${index}`,
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
            correo: "",
            vin: "",
            modelo: "",
            tecnico: filters.tecnico !== "Todos" ? filters.tecnico : "",
            etapa: "Ingreso con Cita",
            comentarios_taller: "",
            tipo_bloque: "trabajo",
            fecha_programada: filters.fecha,
            hora_inicio: "07:00",
            hora_fin: "08:00",
            estatus_agenda: "Programado",
            subtrabajos: [
                {
                    id: `manual-${Date.now()}`,
                    nombre: "",
                    horas: 1,
                },
            ],
        });
        setOpenModal(true);
    }

    function closeModal() {
        if (saving) return;
        setOpenModal(false);
        setEditingOrden(null);
        setDraft(null);
    }

    function validateSchedule() {
        const start = timeToMinutes(draft?.hora_inicio);
        const end = timeToMinutes(draft?.hora_fin);

        if (!draft?.fecha_programada) {
            alert("Selecciona la fecha programada.");
            return false;
        }

        if (start === null || end === null) {
            alert("Indica una hora de inicio y una hora de fin válidas.");
            return false;
        }

        if (start < MINUTOS_INICIO_AGENDA || end > MINUTOS_FIN_AGENDA) {
            alert("El horario debe estar dentro de las 07:00 y las 20:00 horas.");
            return false;
        }

        if (end <= start) {
            alert("La hora de fin debe ser posterior a la hora de inicio.");
            return false;
        }

        return true;
    }

    async function saveOrder() {
        if (!draft || saving) return;

        if (!normalizeStr(draft.agencia)) {
            alert("Selecciona el dealer de la actividad.");
            return;
        }

        if (!normalizeStr(draft.tecnico)) {
            alert("Selecciona un técnico asignado.");
            return;
        }

        if (!validateSchedule()) return;

        let subtrabajos = [];

        if (draft.tipo_bloque === "trabajo") {
            subtrabajos = (draft.subtrabajos || [])
                .map((item, index) => ({
                    nombre: normalizeStr(item.nombre),
                    horas: Number(item.horas || 0),
                    orden: index,
                }))
                .filter((item) => item.nombre);

            if (subtrabajos.length === 0) {
                alert("Agrega por lo menos un trabajo de taller.");
                return;
            }

            if (!normalizeStr(draft.cliente)) {
                alert("Escribe el nombre del cliente.");
                return;
            }

            if (!editingOrden && !normalizeStr(draft.telefono)) {
                alert("Escribe el teléfono del cliente.");
                return;
            }
        }

        const stage =
            draft.estatus_agenda === "Terminado"
                ? "Terminado"
                : draft.etapa === "Terminado"
                    ? "Trabajo en Proceso"
                    : draft.etapa;

        const payload = {
            agencia: normalizeStr(draft.agencia),
            no_orden: normalizeStr(draft.no_orden),
            cliente:
                draft.tipo_bloque === "trabajo"
                    ? normalizeStr(draft.cliente)
                    : "",
            telefono: normalizeStr(draft.telefono).replace(/\D/g, ""),
            correo: normalizeStr(draft.correo || editingOrden?.correo),
            vin: normalizeStr(draft.vin),
            modelo: normalizeStr(draft.modelo),
            tecnico: canonicalTechnician(draft.tecnico),
            tipo_bloque: draft.tipo_bloque,
            tipo_servicio:
                draft.tipo_bloque === "trabajo"
                    ? subtrabajos.map((item) => item.nombre).join(" + ")
                    : draft.tipo_bloque === "comida"
                        ? "Comida"
                        : "Capacitación",
            etapa: stage,
            estatus_agenda: draft.estatus_agenda,
            fecha_programada: draft.fecha_programada,
            hora_inicio: draft.hora_inicio,
            hora_fin: draft.hora_fin,
            comentarios_taller: normalizeStr(draft.comentarios_taller),
            ...(draft.tipo_bloque === "trabajo" ? { subtrabajos } : {}),
        };

        setSaving(true);

        try {
            const saved = editingOrden?.id
                ? await apiHojaIngresos.patch(editingOrden.id, payload)
                : await apiHojaIngresos.create(payload);

            setRemoteRows((previous) => {
                const exists = previous.some(
                    (row) => String(row.id) === String(saved.id),
                );

                if (!exists) return [saved, ...previous];

                return previous.map((row) =>
                    String(row.id) === String(saved.id)
                        ? {
                            ...row,
                            ...payload,
                            ...saved,
                        }
                        : row,
                );
            });

            setFilters((previous) => ({
                ...previous,
                fecha: saved.fecha_programada || draft.fecha_programada,
            }));

            setOpenModal(false);
            setEditingOrden(null);
            setDraft(null);
        } catch (error) {
            console.error(error);
            alert(error?.message || "No se pudo guardar la actividad de taller.");
        } finally {
            setSaving(false);
        }
    }

    function addSubtask() {
        setDraft((previous) => ({
            ...previous,
            subtrabajos: [
                ...(previous.subtrabajos || []),
                {
                    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    nombre: "",
                    horas: 0,
                },
            ],
        }));
    }

    function removeSubtask(index) {
        setDraft((previous) => ({
            ...previous,
            subtrabajos: previous.subtrabajos.filter((_, current) => current !== index),
        }));
    }

    function updateSubtask(index, patch) {
        setDraft((previous) => ({
            ...previous,
            subtrabajos: previous.subtrabajos.map((item, current) =>
                current === index ? { ...item, ...patch } : item,
            ),
        }));
    }

    function resetFilters() {
        setFilters({
            q: "",
            agencia: "Todos",
            tecnico: "Todos",
            fecha: toYMD(new Date()),
        });
    }

    function goToToday() {
        setFilters((previous) => ({ ...previous, fecha: toYMD(new Date()) }));
    }

    function moveDate(days) {
        setFilters((previous) => ({
            ...previous,
            fecha: addDaysToYMD(previous.fecha, days),
        }));
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-extrabold text-[#131E5C]">
                            Progreso y Control de Trabajos a Taller
                        </h2>
                    </div>
                    {!isAdmin && userAgencias.length > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada:{" "}
                            <span className="text-[#131E5C]">
                                {userAgencias.join(", ")}
                            </span>
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex overflow-hidden rounded-lg border border-[#131E5C]/30">
                        <button
                            type="button"
                            onClick={() => setVista("agenda")}
                            className={[
                                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition",
                                vista === "agenda"
                                    ? "bg-[#131E5C] text-white"
                                    : "bg-white text-[#131E5C] hover:bg-[#131E5C]/10",
                            ].join(" ")}
                        >
                            <CalendarClock className="h-3.5 w-3.5" /> Agenda
                        </button>
                        <button
                            type="button"
                            onClick={() => setVista("lista")}
                            className={[
                                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition",
                                vista === "lista"
                                    ? "bg-[#131E5C] text-white"
                                    : "bg-white text-[#131E5C] hover:bg-[#131E5C]/10",
                            ].join(" ")}
                        >
                            <Table2 className="h-3.5 w-3.5" /> Lista
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateManual}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/90"
                    >
                        <Plus className="h-4 w-4" /> Nueva actividad
                    </button>
                </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                    <div className="text-xs font-bold text-slate-400">Actividades</div>
                    <div className="mt-1 text-2xl font-extrabold text-[#131E5C]">
                        {stats.total}
                    </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                    <div className="text-xs font-bold text-blue-500">Programadas</div>
                    <div className="mt-1 text-2xl font-extrabold text-blue-700">
                        {stats.programmed}
                    </div>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                    <div className="text-xs font-bold text-emerald-600">Terminadas</div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-700">
                        {stats.finished}
                    </div>
                </div>

                <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4 shadow-sm">
                    <div className="text-xs font-bold text-cyan-700">Comida / Capacitación</div>
                    <div className="mt-1 text-2xl font-extrabold text-cyan-800">
                        {stats.lunch} / {stats.training}
                    </div>
                </div>

                <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
                    <div className="text-xs font-bold text-violet-600">Horas programadas</div>
                    <div className="mt-1 text-2xl font-extrabold text-violet-800">
                        {stats.hours.toFixed(2)} h
                    </div>
                </div>
            </div>

            <div className="mb-4 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-12">
                    <div className="xl:col-span-4">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={filters.q}
                                    onChange={(event) =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            q: event.target.value,
                                        }))
                                    }
                                    placeholder="Cliente, teléfono, VIN, orden o trabajo..."
                                    className="w-full text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                />
                                {filters.q ? (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFilters((previous) => ({
                                                ...previous,
                                                q: "",
                                            }))
                                        }
                                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-2">
                        <FilterBlock label="Dealer">
                            <select
                                value={filters.agencia}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
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

                    <div className="xl:col-span-2">
                        <FilterBlock label="Técnico">
                            <select
                                value={filters.tecnico}
                                onChange={(event) =>
                                    setFilters((previous) => ({
                                        ...previous,
                                        tecnico: event.target.value,
                                    }))
                                }
                                className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            >
                                {techniciansFilter.map((technician) => (
                                    <option key={technician} value={technician}>
                                        {technician}
                                    </option>
                                ))}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-4">
                        <FilterBlock label="Fecha de la agenda">
                            <div className="flex items-center overflow-hidden rounded-lg border border-[#131E5C] bg-white">
                                <button
                                    type="button"
                                    onClick={() => moveDate(-1)}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#131E5C] hover:bg-[#131E5C]/10"
                                    title="Día anterior"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <input
                                    type="date"
                                    value={filters.fecha}
                                    onChange={(event) =>
                                        setFilters((previous) => ({
                                            ...previous,
                                            fecha: event.target.value,
                                        }))
                                    }
                                    className="h-10 min-w-0 flex-1 border-x border-[#131E5C]/30 px-3 text-center text-sm font-bold text-[#131E5C] outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => moveDate(1)}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#131E5C] hover:bg-[#131E5C]/10"
                                    title="Día siguiente"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="xl:col-span-12">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={goToToday}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                            >
                                <CalendarDays className="h-4 w-4" /> Hoy
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                            >
                                <X className="h-4 w-4" /> Limpiar
                            </button>

                            <div className="flex items-center gap-2 ml-5">
                                <span className="h-3 w-6 rounded border border-green-600 bg-green-50" />
                                Trabajo programado
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-6 rounded border border-slate-900 bg-slate-700" />
                                Trabajo terminado
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-6 rounded border border-cyan-800 bg-cyan-700" />
                                Comida
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-6 rounded border border-orange-700 bg-orange-600" />
                                Capacitación
                            </div>

                            <div className="ml-auto hidden text-right lg:block">
                                <div className="text-sm font-extrabold capitalize text-[#131E5C]">
                                    {formatLongDate(filters.fecha)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loadingList ? (
                <div className="rounded-xl border border-black/10 bg-white p-10 text-center text-[#131E5C]">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Cargando taller...
                </div>
            ) : vista === "agenda" ? (
                <WorkshopBoardLayout
                    agendaOrders={agendaOrders}
                    containerOrders={containerOrders}
                    technicians={techniciansInAgenda}
                    selectedDate={filters.fecha}
                    onEdit={openEdit}
                    onMoveOrder={moveOrderToStage}
                    panelState={panelState}
                    onTogglePanel={togglePanel}
                    onToggleContainer={toggleContainer}
                    onScheduleOrder={scheduleOrder}
                />
            ) : (
                <div className="overflow-hidden rounded-xl bg-white shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-[1450px] text-left text-sm">
                            <thead className="bg-[#131E5C] text-xs text-white">
                                <tr>
                                    {[
                                        "Fecha",
                                        "Horario",
                                        "Cliente / actividad",
                                        "Orden",
                                        "Dealer",
                                        "Técnico",
                                        "Estatus",
                                        "Tipo",
                                        "Trabajos",
                                        "Duración",
                                    ].map((heading) => (
                                        <th key={heading} className="px-4 py-3 font-bold">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/10">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={10}
                                            className="px-4 py-10 text-center text-[#131E5C]"
                                        >
                                            No hay actividades para esta fecha y filtros.
                                        </td>
                                    </tr>
                                ) : (
                                    [...filtered]
                                        .sort((a, b) =>
                                            `${a.tecnico}-${a.hora_inicio}`.localeCompare(
                                                `${b.tecnico}-${b.hora_inicio}`,
                                            ),
                                        )
                                        .map((order) => (
                                            <tr
                                                key={order.id}
                                                onDoubleClick={() => openEdit(order)}
                                                className="cursor-pointer hover:bg-blue-50/50"
                                            >
                                                <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                    {order.fecha_programada}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-bold text-[#131E5C]">
                                                    {order.hora_inicio} - {order.hora_fin}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-extrabold text-[#131E5C]">
                                                        {getActivityLabel(order)}
                                                    </div>
                                                    {order.tipo_bloque === "trabajo" ? (
                                                        <div className="text-xs text-slate-500">
                                                            {order.telefono}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                    {order.no_orden || "—"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                    {order.agencia || "—"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-[#131E5C]">
                                                    {order.tecnico || "Sin técnico"}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <StatusBadge status={order.estatus_agenda} />
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-bold capitalize text-[#131E5C]">
                                                    {order.tipo_bloque === "capacitacion"
                                                        ? "Capacitación"
                                                        : order.tipo_bloque}
                                                </td>
                                                <td className="px-4 py-3 text-[#131E5C]">
                                                    {order.subtrabajos
                                                        .map((work) => work.nombre)
                                                        .join(" + ")}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 font-extrabold text-[#131E5C]">
                                                    {order.horasAgenda.toFixed(2)} h
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                open={openModal}
                title={
                    editingOrden
                        ? `Editar actividad • ${getActivityLabel(editingOrden)}`
                        : "Nueva actividad de taller"
                }
                onClose={closeModal}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" /> Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={saveOrder}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C]/90 disabled:opacity-60"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Guardar
                        </button>
                    </>
                }
            >
                {!draft ? null : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Tipo de actividad" icon={ListChecks}>
                            <select
                                value={draft.tipo_bloque}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        tipo_bloque: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                {TIPOS_BLOQUE.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Técnico asignado" icon={UserCog}>
                            <select
                                value={draft.tecnico || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        tecnico: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="" disabled>
                                    Selecciona un técnico...
                                </option>
                                {TECNICOS.map((technician) => (
                                    <option key={technician} value={technician}>
                                        {technician}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Estatus" icon={CheckCircle2}>
                            <select
                                value={draft.estatus_agenda}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        estatus_agenda: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                {ESTATUS_AGENDA.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Fecha programada" icon={CalendarDays}>
                            <input
                                type="date"
                                value={draft.fecha_programada || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        fecha_programada: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Hora de inicio" icon={Clock3}>
                            <input
                                type="time"
                                min="07:00"
                                max="19:45"
                                step="900"
                                value={draft.hora_inicio || "07:00"}
                                onChange={(event) => {
                                    const start = event.target.value;
                                    const currentEnd = timeToMinutes(draft.hora_fin);
                                    const startMinutes = timeToMinutes(start);
                                    const nextEnd =
                                        currentEnd !== null &&
                                            startMinutes !== null &&
                                            currentEnd > startMinutes
                                            ? draft.hora_fin
                                            : calculateEndTime(start, 1);

                                    setDraft((previous) => ({
                                        ...previous,
                                        hora_inicio: start,
                                        hora_fin: nextEnd,
                                    }));
                                }}
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Hora de fin" icon={Clock3}>
                            <input
                                type="time"
                                min="07:15"
                                max="20:00"
                                step="900"
                                value={draft.hora_fin || "08:00"}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        hora_fin: event.target.value,
                                    }))
                                }
                                className={[inputBase, inputOk].join(" ")}
                            />
                        </Field>

                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        agencia: event.target.value,
                                    }))
                                }
                                disabled={
                                    Boolean(editingOrden && !editingOrden.isManual) ||
                                    (!isAdmin && userAgencias.length <= 1)
                                }
                                className={[inputBase, inputOk].join(" ")}
                            >
                                <option value="">Sin dealer</option>
                                {(isAdmin ? DEALERS : userAgencias).map((dealer) => (
                                    <option key={dealer} value={dealer}>
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {draft.tipo_bloque === "trabajo" ? (
                            <>
                                {editingOrden && !editingOrden.isManual ? (
                                    <div className="rounded-xl border border-black/10 bg-white p-4 md:col-span-2 xl:col-span-4">
                                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                                            <div>
                                                <b className="text-[#131E5C]">Cliente:</b>{" "}
                                                {editingOrden.cliente}
                                            </div>
                                            <div>
                                                <b className="text-[#131E5C]">Teléfono:</b>{" "}
                                                {editingOrden.telefono}
                                            </div>
                                            <div>
                                                <b className="text-[#131E5C]">Orden:</b>{" "}
                                                {editingOrden.no_orden || "—"}
                                            </div>
                                            <div>
                                                <b className="text-[#131E5C]">VIN:</b>{" "}
                                                {editingOrden.vin || "—"}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Field label="No. orden / preorden" icon={ClipboardList}>
                                            <input
                                                value={draft.no_orden}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        no_orden: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="Cliente" icon={User}>
                                            <input
                                                value={draft.cliente}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        cliente: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="Teléfono" icon={Phone}>
                                            <input
                                                value={draft.telefono}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        telefono: event.target.value.replace(
                                                            /\D/g,
                                                            "",
                                                        ),
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="VIN" icon={CarFront}>
                                            <input
                                                value={draft.vin}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        vin: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>

                                        <Field label="Modelo" icon={CarFront}>
                                            <input
                                                value={draft.modelo}
                                                onChange={(event) =>
                                                    setDraft((previous) => ({
                                                        ...previous,
                                                        modelo: event.target.value,
                                                    }))
                                                }
                                                className={[inputBase, inputOk].join(" ")}
                                            />
                                        </Field>
                                    </>
                                )}

                                <Field label="Etapa operativa" icon={ListChecks}>
                                    <select
                                        value={draft.etapa || "Ingreso con Cita"}
                                        onChange={(event) =>
                                            setDraft((previous) => ({
                                                ...previous,
                                                etapa: event.target.value,
                                            }))
                                        }
                                        className={[inputBase, inputOk].join(" ")}
                                    >
                                        <optgroup label="En proceso">
                                            {ETAPAS_PROCESO.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Fuera de proceso / WIP">
                                            {ETAPAS_WIP.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Terminado">
                                            {ETAPAS_TERMINADO.map((stage) => (
                                                <option key={stage} value={stage}>
                                                    {stage}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </Field>
                            </>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 md:col-span-2 xl:col-span-4">
                                {draft.tipo_bloque === "comida" ? (
                                    <div className="flex items-center gap-2">
                                        <Coffee className="h-5 w-5 text-cyan-700" />
                                        Este bloque aparecerá en color azul dentro del horario del técnico.
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-orange-600" />
                                        Este bloque aparecerá en color naranja dentro del horario del técnico.
                                    </div>
                                )}
                            </div>
                        )}

                        <Field
                            label="Comentarios de taller"
                            icon={ClipboardList}
                            className="md:col-span-2 xl:col-span-4"
                        >
                            <textarea
                                value={draft.comentarios_taller || ""}
                                onChange={(event) =>
                                    setDraft((previous) => ({
                                        ...previous,
                                        comentarios_taller: event.target.value,
                                    }))
                                }
                                className={[
                                    inputBase,
                                    inputOk,
                                    "min-h-[90px] resize-y",
                                ].join(" ")}
                                placeholder="Notas internas para el equipo de taller..."
                            />
                        </Field>

                        {draft.tipo_bloque === "trabajo" ? (
                            <div className="rounded-xl border border-black/10 bg-white p-4 md:col-span-2 xl:col-span-4">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#131E5C]">
                                        <Wrench className="h-4 w-4" /> Trabajos asignados
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSubtask}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#131E5C]/90"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Agregar
                                    </button>
                                </div>

                                <div className="grid gap-2">
                                    {(draft.subtrabajos || []).map((work, index) => (
                                        <div
                                            key={work.id || index}
                                            className="grid gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-12"
                                        >
                                            <div className="md:col-span-7">
                                                <select
                                                    value={work.nombre || ""}
                                                    onChange={(event) =>
                                                        updateSubtask(index, {
                                                            nombre: event.target.value,
                                                        })
                                                    }
                                                    className={[inputBase, inputOk].join(" ")}
                                                >
                                                    <option value="">Selecciona trabajo...</option>
                                                    {TIPOS_SERVICIO.map((type) => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="md:col-span-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.25"
                                                    value={work.horas ?? 0}
                                                    onChange={(event) =>
                                                        updateSubtask(index, {
                                                            horas: event.target.value,
                                                        })
                                                    }
                                                    className={[inputBase, inputOk].join(" ")}
                                                    placeholder="Horas"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubtask(index)}
                                                    disabled={(draft.subtrabajos || []).length <= 1}
                                                    className="inline-flex h-full w-full items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}