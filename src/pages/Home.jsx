import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    ClipboardList,
    Filter,
    Globe,
    KanbanSquare,
    TrendingUp,
    Users,
    CalendarDays,
    CarFront,
    SmilePlus,
    TriangleAlert,
    RefreshCw,
    BarChart3,
    X,
    SlidersHorizontal,
    Building2,
    UserRound,
    Funnel,
    BadgeCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

const COLOR_PRINCIPAL = "#131E5C";
const PALETA = [
    "#335C13",
    "#9C5D48",
    "#131E5C",
    "#3B478F",
    "#6C9C48",
    "#C6CDF5",
];
const CACHE_TTL_MS = 1000 * 60 * 10;

const API_URL =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/";

const RUTAS_API = {
    casos: "/conformidad/api/casos/",
    prospectos: "/digitales/api/prospectos/",
    citas: "/citas/api/citas/",
    registroPiso: "/citas/api/registro-piso/",
    pruebas: "/citas/api/pruebas-manejo/",
    entregas: "/citas/api/entregas/",
    encuestas: "/api/encuestas/satisfaccion/",
};

const CAMPOS_POR_MODULO = {
    casos: {
        fecha: ["fecha_reclamacion", "fecha_atencion", "creado", "creado_en"],
        asesor: ["asesor", "asesor_digital", "asesor_piso", "asesor_ventas"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
    prospectos: {
        fecha: ["creado", "created_at", "ultimo_contacto_at", "actualizado"],
        asesor: ["asesor_digital", "asesor", "asesor_piso", "asesor_ventas"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
    citas: {
        fecha: ["fecha_hora_cita", "fecha", "creado_en", "created_at"],
        asesor: ["asesor_digital", "asesor_piso", "asesor", "asesor_ventas"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
    registroPiso: {
        fecha: ["fecha_hora_cita", "fecha", "creado_en", "created_at"],
        asesor: ["asesor_piso", "asesor_digital", "asesor", "asesor_ventas"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
    pruebas: {
        fecha: ["fecha_hora_cita", "fecha", "creado_en", "created_at"],
        asesor: ["asesor_piso", "asesor_digital", "asesor", "asesor_ventas"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
    entregas: {
        fecha: ["fecha_hora_entrega", "fecha", "creado_en", "created_at"],
        asesor: ["asesor_ventas", "asesor_piso", "asesor_digital", "asesor"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
    encuestas: {
        fecha: ["creado", "created_at", "fecha", "creado_en"],
        asesor: ["asesor_ventas", "asesor", "asesor_digital", "asesor_piso"],
        dealer: ["dealer", "agencia", "sucursal", "distribuidor"],
    },
};

const FILTROS_INICIALES = {
    fechaInicio: "",
    fechaFin: "",
    asesor: "todos",
    dealer: "todos",
};

const MODULOS_CON_FILTRO_ASESOR = new Set([
    "prospectos",
    "citas",
    "registroPiso",
    "pruebas",
    "entregas",
]);

function Card({ icon: Icon, title, desc, to }) {
    return (
        <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#131E5C] text-white shadow-lg shadow-[#131E5C]/20">
                    <Icon size={18} />
                </div>

                <Link
                    to={to}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                    Abrir <ArrowRight size={14} />
                </Link>
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
        </div>
    );
}

function MetricCard({ icon: Icon, title, value, accent = COLOR_PRINCIPAL, detail }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div
                    className="grid h-11 w-11 place-items-center rounded-2xl text-white shadow-lg"
                    style={{ backgroundColor: accent, boxShadow: `0 14px 28px -16px ${accent}` }}
                >
                    <Icon size={18} />
                </div>
            </div>

            <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
                {detail ? <p className="mt-2 text-xs font-medium text-slate-500">{detail}</p> : null}
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children, action }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
                </div>

                {action ? (
                    <div className="inline-flex self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {action}
                    </div>
                ) : null}
            </div>

            {children}
        </div>
    );
}

function EmptyChart({ text = "No hay datos suficientes para mostrar esta gráfica." }) {
    return (
        <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-500">
            <div className="max-w-sm px-6">{text}</div>
        </div>
    );
}

function TooltipGrafica({ active, payload, label }) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
            {label ? <p className="mb-2 text-sm font-semibold text-slate-900">{label}</p> : null}

            <div className="space-y-1.5">
                {payload.map((item, index) => (
                    <div key={`${item.dataKey}-${index}`} className="flex items-center gap-2 text-sm">
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color || COLOR_PRINCIPAL }}
                        />
                        <span className="text-slate-600">{item.name}:</span>
                        <span className="font-semibold text-slate-900">
                            {formatearNumero(item.value)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="h-5 w-44 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="h-11 w-11 rounded-2xl bg-slate-200" />
                        <div className="mt-5 h-4 w-28 rounded bg-slate-200" />
                        <div className="mt-3 h-8 w-24 rounded bg-slate-100" />
                        <div className="mt-3 h-4 w-36 rounded bg-slate-100" />
                    </div>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="h-4 w-48 rounded bg-slate-200" />
                        <div className="mt-3 h-[320px] rounded-2xl bg-slate-100" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function PeriodButton({ active, children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${active
                ? "bg-[#131E5C] text-white shadow-lg shadow-[#131E5C]/20"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
        >
            {children}
        </button>
    );
}

function SelectFiltro({ label, value, onChange, options = [], icon: Icon }) {
    return (
        <label className="block space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {Icon ? <Icon size={14} /> : null}
                {label}
            </span>
            <select
                value={value}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#131E5C] focus:ring-4 focus:ring-[#131E5C]/10"
            >
                {options.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function InputFecha({ label, value, onChange }) {
    return (
        <label className="block space-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <CalendarDays size={14} />
                {label}
            </span>
            <input
                type="date"
                value={value}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#131E5C] focus:ring-4 focus:ring-[#131E5C]/10"
            />
        </label>
    );
}

function ChipFiltro({ children }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
            {children}
        </div>
    );
}

function PanelFiltros({
    abierto,
    onClose,
    filtros,
    setFiltros,
    dealersDisponibles,
    asesoresDisponibles,
    aplicarPeriodoRapido,
    periodoActivo,
    totalRegistrosFiltrados,
    registrosPisoFiltrados,
    citasFiltradas,
}) {
    const limpiarFiltros = () => setFiltros(FILTROS_INICIALES);

    const contenido = (
        <div className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-4 shadow-xl xl:sticky xl:top-24 xl:h-auto xl:max-h-[calc(100vh-7rem)] xl:overflow-auto">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#131E5C]/8 px-3 py-1 text-xs font-semibold text-[#131E5C]">
                        <Filter size={14} />
                        Filtros operativos
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 xl:hidden"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Ventanas rápidas
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <PeriodButton active={periodoActivo === 30} onClick={() => aplicarPeriodoRapido(30)}>
                            30 días
                        </PeriodButton>
                        <PeriodButton active={periodoActivo === 90} onClick={() => aplicarPeriodoRapido(90)}>
                            90 días
                        </PeriodButton>
                        <PeriodButton active={periodoActivo === 180} onClick={() => aplicarPeriodoRapido(180)}>
                            180 días
                        </PeriodButton>
                        <PeriodButton active={periodoActivo === 0} onClick={() => aplicarPeriodoRapido(0)}>
                            Todo
                        </PeriodButton>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <InputFecha
                        label="Fecha inicio"
                        value={filtros.fechaInicio}
                        onChange={(e) =>
                            setFiltros((prev) => ({ ...prev, fechaInicio: e.target.value }))
                        }
                    />
                    <InputFecha
                        label="Fecha fin"
                        value={filtros.fechaFin}
                        onChange={(e) =>
                            setFiltros((prev) => ({ ...prev, fechaFin: e.target.value }))
                        }
                    />
                </div>

                <SelectFiltro
                    label="Dealer / agencia"
                    icon={Building2}
                    value={filtros.dealer}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, dealer: e.target.value }))}
                    options={[
                        { value: "todos", label: "Todos los dealers" },
                        ...dealersDisponibles.map((item) => ({ value: item, label: item })),
                    ]}
                />

                <SelectFiltro
                    label="Asesor"
                    icon={UserRound}
                    value={filtros.asesor}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, asesor: e.target.value }))}
                    options={[
                        { value: "todos", label: "Todos los asesores" },
                        ...asesoresDisponibles.map((item) => ({ value: item, label: item })),
                    ]}
                />

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Registros filtrados
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {formatearNumero(totalRegistrosFiltrados)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Citas activas
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {formatearNumero(citasFiltradas)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Registro piso
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {formatearNumero(registrosPisoFiltrados)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Limpiar filtros
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden xl:block">{contenido}</div>

            {abierto ? (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
                    <div className="absolute right-0 top-0 h-full w-full max-w-md p-3">
                        {contenido}
                    </div>
                </div>
            ) : null}
        </>
    );
}

function parsearJsonSeguro(valor, fallback = null) {
    try {
        return JSON.parse(valor);
    } catch {
        return fallback;
    }
}

function limpiarTokenSesion(valor) {
    const token = String(valor || "").replace(/^Bearer\s+/i, "").trim();

    if (!token) return "";
    if (token === "undefined") return "";
    if (token === "null") return "";

    return token;
}

function pareceJwt(valor) {
    const token = limpiarTokenSesion(valor);
    return token.split(".").length === 3;
}

function leerPayloadJwt(token) {
    try {
        const partes = limpiarTokenSesion(token).split(".");
        if (partes.length !== 3) return null;

        const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
        const normalizado = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

        return JSON.parse(window.atob(normalizado));
    } catch {
        return null;
    }
}

function tokenJwtExpirado(token) {
    const payload = leerPayloadJwt(token);

    if (!payload?.exp) return false;

    // Margen de 30 segundos para evitar peticiones justo al expirar.
    return Date.now() >= (Number(payload.exp) - 30) * 1000;
}

function obtenerJwtDeObjeto(obj) {
    if (!obj || typeof obj !== "object") return "";

    const candidatos = [
        obj?.access,
        obj?.access_token,
        obj?.accessToken,
        obj?.jwt,

        obj?.auth?.access,
        obj?.auth?.access_token,
        obj?.auth?.accessToken,
        obj?.auth?.jwt,

        obj?.tokens?.access,
        obj?.tokens?.access_token,
        obj?.tokens?.accessToken,

        obj?.session?.access,
        obj?.session?.access_token,
        obj?.session?.accessToken,

        // Al final porque en versiones viejas puede contener token firmado.
        obj?.token,
        obj?.authToken,
        obj?.auth?.token,
        obj?.session?.token,
    ];

    for (const candidato of candidatos) {
        const token = limpiarTokenSesion(candidato);

        if (pareceJwt(token) && !tokenJwtExpirado(token)) {
            return token;
        }
    }

    return "";
}

function obtenerRefreshDeObjeto(obj) {
    if (!obj || typeof obj !== "object") return "";

    const candidatos = [
        obj?.refresh,
        obj?.refresh_token,
        obj?.refreshToken,

        obj?.auth?.refresh,
        obj?.auth?.refresh_token,
        obj?.auth?.refreshToken,

        obj?.tokens?.refresh,
        obj?.tokens?.refresh_token,
        obj?.tokens?.refreshToken,

        obj?.session?.refresh,
        obj?.session?.refresh_token,
        obj?.session?.refreshToken,
    ];

    for (const candidato of candidatos) {
        const token = limpiarTokenSesion(candidato);

        if (pareceJwt(token) && !tokenJwtExpirado(token)) {
            return token;
        }
    }

    return "";
}

function extraerTokenDeStorage(storage) {
    if (!storage) return "";

    /*
        Orden importante:
        1. Llaves nuevas JWT del CRM.
        2. Llaves compatibles.
        3. Llaves viejas solo si realmente contienen JWT.
    */
    const clavesDirectas = [
        "@token_access_jwt",
        "access",
        "accessToken",
        "auth.access",
        "access_token",
        "jwt",
        "token",
        "authToken",
        "crm_token",
    ];

    for (const clave of clavesDirectas) {
        const token = limpiarTokenSesion(storage.getItem(clave));

        if (pareceJwt(token) && !tokenJwtExpirado(token)) {
            return token;
        }
    }

    const clavesJson = ["auth", "crm_auth", "session", "user_session"];

    for (const clave of clavesJson) {
        const valor = storage.getItem(clave);
        if (!valor) continue;

        const obj = parsearJsonSeguro(valor, null);
        const token = obtenerJwtDeObjeto(obj);

        if (token) return token;
    }

    return "";
}

function extraerRefreshDeStorage(storage) {
    if (!storage) return "";

    const clavesDirectas = [
        "@token_refresh_jwt",
        "refresh",
        "refreshToken",
        "auth.refresh",
        "refresh_token",
    ];

    for (const clave of clavesDirectas) {
        const token = limpiarTokenSesion(storage.getItem(clave));

        if (pareceJwt(token) && !tokenJwtExpirado(token)) {
            return token;
        }
    }

    const clavesJson = ["auth", "crm_auth", "session", "user_session"];

    for (const clave of clavesJson) {
        const valor = storage.getItem(clave);
        if (!valor) continue;

        const obj = parsearJsonSeguro(valor, null);
        const token = obtenerRefreshDeObjeto(obj);

        if (token) return token;
    }

    return "";
}

function obtenerTokenSesion() {
    if (typeof window === "undefined") return "";

    return (
        extraerTokenDeStorage(window.localStorage) ||
        extraerTokenDeStorage(window.sessionStorage) ||
        ""
    );
}

function obtenerRefreshSesion() {
    if (typeof window === "undefined") return "";

    return (
        extraerRefreshDeStorage(window.localStorage) ||
        extraerRefreshDeStorage(window.sessionStorage) ||
        ""
    );
}

function guardarJwtSesion({ access, refresh } = {}) {
    if (typeof window === "undefined") return;

    const accessToken = limpiarTokenSesion(access);
    const refreshToken = limpiarTokenSesion(refresh);

    if (!pareceJwt(accessToken)) return;

    const authAnterior = parsearJsonSeguro(window.localStorage.getItem("auth"), {}) || {};

    const authActualizado = {
        ...authAnterior,
        token: accessToken,
        access: accessToken,
        ...(pareceJwt(refreshToken) ? { refresh: refreshToken } : {}),
    };

    window.localStorage.setItem("auth", JSON.stringify(authActualizado));
    window.localStorage.setItem("@token_access_jwt", accessToken);
    window.localStorage.setItem("auth.access", accessToken);
    window.localStorage.setItem("access", accessToken);

    if (pareceJwt(refreshToken)) {
        window.localStorage.setItem("@token_refresh_jwt", refreshToken);
        window.localStorage.setItem("auth.refresh", refreshToken);
        window.localStorage.setItem("refresh", refreshToken);
    }
}

function limpiarJwtSesionExpirada() {
    if (typeof window === "undefined") return;

    const claves = [
        "@token_access_jwt",
        "@token_refresh_jwt",
        "auth.access",
        "auth.refresh",
        "access",
        "accessToken",
        "refresh",
        "refreshToken",
    ];

    claves.forEach((clave) => {
        try {
            window.localStorage.removeItem(clave);
        } catch {
            // sin acción
        }
    });

    const auth = parsearJsonSeguro(window.localStorage.getItem("auth"), null);

    if (auth && typeof auth === "object") {
        delete auth.access;
        delete auth.refresh;
        delete auth.access_token;
        delete auth.refresh_token;
        delete auth.jwt;

        if (pareceJwt(auth.token)) {
            delete auth.token;
        }

        window.localStorage.setItem("auth", JSON.stringify(auth));
    }
}

function resolverUrl(ruta) {
    if (/^https?:\/\//i.test(ruta)) {
        return ruta;
    }

    const path = ruta.startsWith("/") ? ruta : `/${ruta}`;
    return API_URL ? `${API_URL.replace(/\/+$/, "")}${path}` : path;
}

async function renovarAccessToken() {
    const refresh = obtenerRefreshSesion();

    if (!refresh) {
        throw new Error("No hay refresh token JWT disponible.");
    }

    const respuesta = await fetch(resolverUrl("/conformidad/api/auth/token/refresh/"), {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        credentials: "omit",
        body: JSON.stringify({ refresh }),
    });

    const payload = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok || !payload?.access) {
        limpiarJwtSesionExpirada();
        throw new Error(payload?.detail || "No se pudo renovar la sesión JWT.");
    }

    guardarJwtSesion({
        access: payload.access,
        refresh,
    });

    return payload.access;
}

async function obtenerTokenSesionVigente() {
    const token = obtenerTokenSesion();

    if (token && !tokenJwtExpirado(token)) {
        return token;
    }

    try {
        return await renovarAccessToken();
    } catch {
        return "";
    }
}

async function headersBase() {
    const token = await obtenerTokenSesionVigente();

    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

function normalizarLista(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
}

async function solicitarJson(url, { intentarRefresh = true } = {}) {
    const respuesta = await fetch(url, {
        method: "GET",
        headers: await headersBase(),
        credentials: "omit",
    });

    if ((respuesta.status === 401 || respuesta.status === 403) && intentarRefresh) {
        try {
            await renovarAccessToken();
            return solicitarJson(url, { intentarRefresh: false });
        } catch {
            // Continúa para lanzar el error original.
        }
    }

    if (!respuesta.ok) {
        const texto = await respuesta.text().catch(() => "");
        throw new Error(`HTTP ${respuesta.status} en ${url}${texto ? ` - ${texto}` : ""}`);
    }

    return respuesta.json();
}

async function solicitarTodasLasPaginas(ruta) {
    const acumulado = [];
    let siguiente = resolverUrl(ruta);
    let pagina = 0;

    while (siguiente && pagina < 25) {
        const payload = await solicitarJson(siguiente);

        if (Array.isArray(payload)) {
            acumulado.push(...payload);
            break;
        }

        acumulado.push(...normalizarLista(payload));
        siguiente = payload?.next ? resolverUrl(payload.next) : null;
        pagina += 1;
    }

    return acumulado;
}

async function solicitarRecursoModulo(ruta) {
    return await solicitarTodasLasPaginas(ruta);
}

function obtenerCacheKey() {
    const token = obtenerTokenSesion();
    return `home-dashboard-v4-${token ? token.slice(-12) : "anon"}`;
}

function leerCache() {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.sessionStorage.getItem(obtenerCacheKey());
        if (!raw) return null;

        const data = JSON.parse(raw);
        if (!data?.timestamp || !data?.payload) return null;

        if (Date.now() - data.timestamp > CACHE_TTL_MS) {
            return null;
        }

        return data.payload;
    } catch {
        return null;
    }
}

function guardarCache(payload) {
    if (typeof window === "undefined") return;

    try {
        window.sessionStorage.setItem(
            obtenerCacheKey(),
            JSON.stringify({
                timestamp: Date.now(),
                payload,
            })
        );
    } catch {
        // sin acción
    }
}

function formatearNumero(valor) {
    return new Intl.NumberFormat("es-MX").format(Number(valor || 0));
}

function formatearPorcentaje(valor) {
    return `${redondear(valor, 1)}%`;
}

function redondear(valor, decimales = 1) {
    const numero = Number(valor || 0);
    if (!Number.isFinite(numero)) return 0;
    return Number(numero.toFixed(decimales));
}

function numeroSeguro(valor) {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
}

function promedio(valores) {
    const limpios = valores.filter((valor) => Number.isFinite(Number(valor)));
    if (!limpios.length) return 0;
    return limpios.reduce((acc, valor) => acc + Number(valor), 0) / limpios.length;
}

function porcentaje(parte, total) {
    if (!total) return 0;
    return (parte / total) * 100;
}

function normalizarTexto(valor, fallback = "Sin dato") {
    const texto = String(valor ?? "").trim();
    return texto || fallback;
}

function normalizarAgencia(valor) {
    return normalizarTexto(valor, "Sin agencia");
}

function crearFechaSegura(valor) {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function obtenerFecha(item, campos) {
    for (const campo of campos) {
        const fecha = crearFechaSegura(item?.[campo]);
        if (fecha) return fecha;
    }
    return null;
}

function extraerCampo(item, campos = [], fallback = "") {
    for (const campo of campos) {
        const valor = item?.[campo];
        if (valor !== undefined && valor !== null && String(valor).trim()) {
            return String(valor).trim();
        }
    }
    return fallback;
}

function inicioDelDia(fecha) {
    const copia = new Date(fecha);
    copia.setHours(0, 0, 0, 0);
    return copia;
}

function finDelDia(fecha) {
    const copia = new Date(fecha);
    copia.setHours(23, 59, 59, 999);
    return copia;
}

function formatearFechaInput(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function obtenerRangoDesdeDias(dias) {
    const hoy = new Date();
    const fin = finDelDia(hoy);

    if (!dias) {
        return {
            fechaInicio: "",
            fechaFin: formatearFechaInput(hoy),
        };
    }

    const inicio = inicioDelDia(hoy);
    inicio.setDate(inicio.getDate() - dias + 1);

    return {
        fechaInicio: formatearFechaInput(inicio),
        fechaFin: formatearFechaInput(fin),
    };
}

function detectarPeriodoActivo(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return null;

    const inicio = crearFechaSegura(`${fechaInicio}T00:00:00`);
    const fin = crearFechaSegura(`${fechaFin}T23:59:59`);
    if (!inicio || !fin) return null;

    const hoy = new Date();
    const finHoy = finDelDia(hoy);
    const diferenciaFin = Math.abs(finHoy.getTime() - fin.getTime());
    if (diferenciaFin > 36 * 60 * 60 * 1000) return null;

    const dias = Math.round((finDelDia(fin).getTime() - inicioDelDia(inicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if ([30, 90, 180].includes(dias)) return dias;
    return null;
}

function estaEnRango(fecha, fechaInicio, fechaFin) {
    if (!fecha) return false;

    let inicio = fechaInicio ? crearFechaSegura(`${fechaInicio}T00:00:00`) : null;
    let fin = fechaFin ? crearFechaSegura(`${fechaFin}T23:59:59`) : null;

    if (inicio && fin && inicio > fin) {
        const temporal = inicio;
        inicio = fin;
        fin = temporal;
    }

    if (inicio && fecha < inicio) return false;
    if (fin && fecha > fin) return false;
    return true;
}

function claveMes(fecha) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function etiquetaMes(fecha) {
    return new Intl.DateTimeFormat("es-MX", {
        month: "short",
        year: "2-digit",
    })
        .format(fecha)
        .replace(".", "");
}

function construirSerieMensual(data, rango) {
    const fechaFinBase = rango.fechaFin
        ? crearFechaSegura(`${rango.fechaFin}T23:59:59`)
        : finDelDia(new Date());
    const meses = rango.fechaInicio && rango.fechaFin ? 12 : 6;
    const fin = fechaFinBase || finDelDia(new Date());
    const serie = [];

    for (let i = meses - 1; i >= 0; i -= 1) {
        const base = new Date(fin.getFullYear(), fin.getMonth() - i, 1);
        serie.push({
            clave: claveMes(base),
            mes: etiquetaMes(base),
            prospectos: 0,
            reclamaciones: 0,
            encuestas: 0,
            entregas: 0,
            citas: 0,
            registrosPiso: 0,
        });
    }

    const mapa = new Map(serie.map((item) => [item.clave, item]));

    const registrar = (lista, nombreCampo, obtenerFechaItem) => {
        lista.forEach((item) => {
            const fecha = obtenerFechaItem(item);
            if (!fecha) return;

            const clave = claveMes(fecha);
            if (mapa.has(clave)) {
                mapa.get(clave)[nombreCampo] += 1;
            }
        });
    };

    registrar(data.prospectos, "prospectos", (item) => obtenerFecha(item, CAMPOS_POR_MODULO.prospectos.fecha));
    registrar(data.casos, "reclamaciones", (item) => obtenerFecha(item, CAMPOS_POR_MODULO.casos.fecha));
    registrar(data.encuestas, "encuestas", (item) => obtenerFecha(item, CAMPOS_POR_MODULO.encuestas.fecha));
    registrar(data.entregas, "entregas", (item) => obtenerFecha(item, CAMPOS_POR_MODULO.entregas.fecha));
    registrar(data.citas, "citas", (item) => obtenerFecha(item, CAMPOS_POR_MODULO.citas.fecha));
    registrar(data.registroPiso, "registrosPiso", (item) => obtenerFecha(item, CAMPOS_POR_MODULO.registroPiso.fecha));

    return serie;
}

function agruparConteo(lista, obtenerClave) {
    const mapa = new Map();

    lista.forEach((item) => {
        const clave = obtenerClave(item);
        mapa.set(clave, (mapa.get(clave) || 0) + 1);
    });

    return [...mapa.entries()].map(([name, value]) => ({ name, value }));
}

function scoreEncuesta(encuesta) {
    return promedio([
        numeroSeguro(encuesta?.atencion_asesor),
        numeroSeguro(encuesta?.seguimiento_asesor),
        numeroSeguro(encuesta?.tiempo_entrega_unidad),
        numeroSeguro(encuesta?.experiencia_recepcion),
    ]);
}

function scoreCierreAgencia(item) {
    return (
        numeroSeguro(item.prospectos) +
        numeroSeguro(item.citas) * 1.5 +
        numeroSeguro(item.pruebas) * 2 +
        numeroSeguro(item.entregas) * 3 +
        numeroSeguro(item.registroPiso) * 1.2 +
        numeroSeguro(item.casos) * 1.2
    );
}

function obtenerDealerItem(item, modulo) {
    return normalizarAgencia(extraerCampo(item, CAMPOS_POR_MODULO[modulo]?.dealer, "Sin agencia"));
}

function obtenerAsesorItem(item, modulo) {
    return normalizarTexto(extraerCampo(item, CAMPOS_POR_MODULO[modulo]?.asesor, "Sin asignar"), "Sin asignar");
}

function obtenerFechaItem(item, modulo) {
    return obtenerFecha(item, CAMPOS_POR_MODULO[modulo]?.fecha || []);
}

function filtrarModulo(lista, modulo, filtros) {
    return lista.filter((item) => {
        const fecha = obtenerFechaItem(item, modulo);
        if ((filtros.fechaInicio || filtros.fechaFin) && !estaEnRango(fecha, filtros.fechaInicio, filtros.fechaFin)) {
            return false;
        }

        if (filtros.dealer !== "todos") {
            const dealer = obtenerDealerItem(item, modulo);
            if (dealer !== filtros.dealer) return false;
        }

        if (filtros.asesor !== "todos" && MODULOS_CON_FILTRO_ASESOR.has(modulo)) {
            const asesor = obtenerAsesorItem(item, modulo);
            if (asesor !== filtros.asesor) return false;
        }

        return true;
    });
}

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [actualizadoEn, setActualizadoEn] = useState(null);
    const [errores, setErrores] = useState([]);
    const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false);
    const [filtros, setFiltros] = useState(() => ({
        ...FILTROS_INICIALES,
        ...obtenerRangoDesdeDias(180),
    }));
    const [data, setData] = useState({
        casos: [],
        prospectos: [],
        citas: [],
        registroPiso: [],
        pruebas: [],
        entregas: [],
        encuestas: [],
    });

    const cargarDatos = async ({ forzar = false } = {}) => {
        if (forzar) {
            setRefrescando(true);
        } else {
            setLoading(true);
        }

        try {
            if (!forzar) {
                const cache = leerCache();
                if (cache) {
                    setData(cache.data);
                    setErrores(cache.errores || []);
                    setActualizadoEn(cache.actualizadoEn || null);
                    setLoading(false);
                    return;
                }
            }

            const entradas = Object.entries(RUTAS_API);
            const respuestas = await Promise.allSettled(
                entradas.map(async ([nombre, ruta]) => {
                    const registros = await solicitarRecursoModulo(ruta);
                    return [nombre, registros];
                })
            );

            const siguienteData = {
                casos: [],
                prospectos: [],
                citas: [],
                registroPiso: [],
                pruebas: [],
                entregas: [],
                encuestas: [],
            };

            const modulosConError = [];

            respuestas.forEach((resultado, index) => {
                const [nombre] = entradas[index];

                if (resultado.status === "fulfilled") {
                    const [clave, registros] = resultado.value;
                    siguienteData[clave] = Array.isArray(registros) ? registros : [];
                } else {
                    modulosConError.push(nombre);
                }
            });

            const payload = {
                data: siguienteData,
                errores: modulosConError,
                actualizadoEn: new Date().toISOString(),
            };

            guardarCache(payload);
            setData(siguienteData);
            setErrores(modulosConError);
            setActualizadoEn(payload.actualizadoEn);
        } catch {
            setErrores(["dashboard"]);
        } finally {
            setLoading(false);
            setRefrescando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const periodoActivo = useMemo(
        () => detectarPeriodoActivo(filtros.fechaInicio, filtros.fechaFin),
        [filtros.fechaInicio, filtros.fechaFin]
    );

    const dealersDisponibles = useMemo(() => {
        const valores = new Set();

        Object.keys(CAMPOS_POR_MODULO).forEach((modulo) => {
            (data[modulo] || []).forEach((item) => {
                const dealer = obtenerDealerItem(item, modulo);
                if (dealer && dealer !== "Sin agencia") {
                    valores.add(dealer);
                }
            });
        });

        return [...valores].sort((a, b) => a.localeCompare(b, "es"));
    }, [data]);

    const asesoresDisponibles = useMemo(() => {
        const valores = new Set();

        ["prospectos", "citas", "registroPiso", "pruebas", "entregas", "encuestas", "casos"].forEach((modulo) => {
            (data[modulo] || []).forEach((item) => {
                const asesor = obtenerAsesorItem(item, modulo);
                if (asesor && asesor !== "Sin asignar") {
                    valores.add(asesor);
                }
            });
        });

        return [...valores].sort((a, b) => a.localeCompare(b, "es"));
    }, [data]);

    const aplicarPeriodoRapido = (dias) => {
        const rango = obtenerRangoDesdeDias(dias);
        setFiltros((prev) => ({
            ...prev,
            fechaInicio: rango.fechaInicio,
            fechaFin: rango.fechaFin,
        }));
    };

    const analitica = useMemo(() => {
        const casosFiltrados = filtrarModulo(data.casos, "casos", filtros);
        const prospectosFiltrados = filtrarModulo(data.prospectos, "prospectos", filtros);
        const citasFiltradas = filtrarModulo(data.citas, "citas", filtros);
        const registroPisoFiltrado = filtrarModulo(data.registroPiso, "registroPiso", filtros);
        const pruebasFiltradas = filtrarModulo(data.pruebas, "pruebas", filtros);
        const entregasFiltradas = filtrarModulo(data.entregas, "entregas", filtros);
        const encuestasFiltradas = filtrarModulo(data.encuestas, "encuestas", filtros);

        const estadosCierre = new Set([
            "cerrado",
            "cerrada",
            "resuelto",
            "resuelta",
            "solucionado",
            "solucionada",
            "concluido",
            "concluida",
            "finalizado",
            "finalizada",
        ]);

        const reclamacionesAbiertas = casosFiltrados.filter((item) => {
            const estado = String(item?.estado || "").trim().toLowerCase();
            return !estadosCierre.has(estado);
        }).length;

        const asistenciaTotal =
            citasFiltradas.filter((item) => Boolean(item?.asistencia)).length +
            registroPisoFiltrado.filter((item) => Boolean(item?.asistencia)).length +
            pruebasFiltradas.filter((item) => Boolean(item?.asistencia)).length;

        const totalEventosConAsistencia =
            citasFiltradas.length + registroPisoFiltrado.length + pruebasFiltradas.length;

        const promedioEncuestas = promedio(encuestasFiltradas.map(scoreEncuesta));

        const resumen = {
            totalProspectos: prospectosFiltrados.length,
            totalCitas: citasFiltradas.length,
            totalPruebas: pruebasFiltradas.length,
            totalEntregas: entregasFiltradas.length,
            totalRegistrosPiso: registroPisoFiltrado.length,
            totalDealersActivos: new Set([
                ...prospectosFiltrados.map((item) => obtenerDealerItem(item, "prospectos")),
                ...citasFiltradas.map((item) => obtenerDealerItem(item, "citas")),
                ...registroPisoFiltrado.map((item) => obtenerDealerItem(item, "registroPiso")),
                ...pruebasFiltradas.map((item) => obtenerDealerItem(item, "pruebas")),
                ...entregasFiltradas.map((item) => obtenerDealerItem(item, "entregas")),
            ].filter((item) => item && item !== "Sin agencia")).size,
            totalAsesoresActivos: new Set([
                ...prospectosFiltrados.map((item) => obtenerAsesorItem(item, "prospectos")),
                ...citasFiltradas.map((item) => obtenerAsesorItem(item, "citas")),
                ...registroPisoFiltrado.map((item) => obtenerAsesorItem(item, "registroPiso")),
                ...pruebasFiltradas.map((item) => obtenerAsesorItem(item, "pruebas")),
                ...entregasFiltradas.map((item) => obtenerAsesorItem(item, "entregas")),
            ].filter((item) => item && item !== "Sin asignar")).size,
            conversionProspectoEntrega: redondear(
                porcentaje(entregasFiltradas.length, prospectosFiltrados.length),
                1
            ),
            asistenciaGeneral: redondear(
                porcentaje(asistenciaTotal, totalEventosConAsistencia),
                1
            ),
            promedioEncuestas: redondear(promedioEncuestas, 1),
            reclamacionesAbiertas,
            encuestasTotales: encuestasFiltradas.length,
            casosTotales: casosFiltrados.length,
            totalRegistrosFiltrados:
                casosFiltrados.length +
                prospectosFiltrados.length +
                citasFiltradas.length +
                registroPisoFiltrado.length +
                pruebasFiltradas.length +
                entregasFiltradas.length +
                encuestasFiltradas.length,
        };

        const embudo = [
            { etapa: "Prospectos", cantidad: prospectosFiltrados.length },
            { etapa: "Citas", cantidad: citasFiltradas.length },
            { etapa: "Registro piso", cantidad: registroPisoFiltrado.length },
            { etapa: "Pruebas", cantidad: pruebasFiltradas.length },
            { etapa: "Entregas", cantidad: entregasFiltradas.length },
        ];

        const agenciasMap = new Map();

        const asegurarAgencia = (agencia) => {
            const nombre = normalizarAgencia(agencia);

            if (!agenciasMap.has(nombre)) {
                agenciasMap.set(nombre, {
                    agencia: nombre,
                    prospectos: 0,
                    citas: 0,
                    pruebas: 0,
                    entregas: 0,
                    registroPiso: 0,
                    casos: 0,
                    encuestas: 0,
                    promedioSatisfaccion: 0,
                    _sumaEncuestas: 0,
                });
            }

            return agenciasMap.get(nombre);
        };

        prospectosFiltrados.forEach((item) => {
            asegurarAgencia(obtenerDealerItem(item, "prospectos")).prospectos += 1;
        });

        citasFiltradas.forEach((item) => {
            asegurarAgencia(obtenerDealerItem(item, "citas")).citas += 1;
        });

        registroPisoFiltrado.forEach((item) => {
            asegurarAgencia(obtenerDealerItem(item, "registroPiso")).registroPiso += 1;
        });

        pruebasFiltradas.forEach((item) => {
            asegurarAgencia(obtenerDealerItem(item, "pruebas")).pruebas += 1;
        });

        entregasFiltradas.forEach((item) => {
            asegurarAgencia(obtenerDealerItem(item, "entregas")).entregas += 1;
        });

        casosFiltrados.forEach((item) => {
            asegurarAgencia(obtenerDealerItem(item, "casos")).casos += 1;
        });

        encuestasFiltradas.forEach((item) => {
            const agencia = asegurarAgencia(obtenerDealerItem(item, "encuestas"));
            agencia.encuestas += 1;
            agencia._sumaEncuestas += scoreEncuesta(item);
        });

        const rendimientoPorAgencia = [...agenciasMap.values()]
            .map((item) => ({
                ...item,
                promedioSatisfaccion: item.encuestas
                    ? redondear(item._sumaEncuestas / item.encuestas, 1)
                    : 0,
                actividadTotal:
                    item.prospectos +
                    item.citas +
                    item.pruebas +
                    item.entregas +
                    item.registroPiso +
                    item.casos,
            }))
            .sort((a, b) => scoreCierreAgencia(b) - scoreCierreAgencia(a))
            .slice(0, 8);

        const estatusProspectos = agruparConteo(
            prospectosFiltrados,
            (item) => normalizarTexto(item?.estado, "Sin estado")
        )
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const origenReclamaciones = agruparConteo(
            casosFiltrados,
            (item) => normalizarTexto(item?.origen, "Sin origen")
        )
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const satisfaccionPorAgencia = encuestasFiltradas.length
            ? [...agenciasMap.values()]
                .filter((item) => item.encuestas > 0)
                .map((item) => ({
                    agencia: item.agencia,
                    promedio: redondear(item._sumaEncuestas / item.encuestas, 1),
                    encuestas: item.encuestas,
                }))
                .sort((a, b) => b.promedio - a.promedio)
                .slice(0, 8)
            : [];

        const asesoresMap = new Map();

        const asegurarAsesor = (nombre) => {
            const asesor = normalizarTexto(nombre, "Sin asignar");

            if (!asesoresMap.has(asesor)) {
                asesoresMap.set(asesor, {
                    asesor,
                    prospectos: 0,
                    citas: 0,
                    registroPiso: 0,
                    entregas: 0,
                    pruebas: 0,
                });
            }

            return asesoresMap.get(asesor);
        };

        prospectosFiltrados.forEach((item) => {
            asegurarAsesor(obtenerAsesorItem(item, "prospectos")).prospectos += 1;
        });

        citasFiltradas.forEach((item) => {
            asegurarAsesor(obtenerAsesorItem(item, "citas")).citas += 1;
        });

        registroPisoFiltrado.forEach((item) => {
            asegurarAsesor(obtenerAsesorItem(item, "registroPiso")).registroPiso += 1;
        });

        pruebasFiltradas.forEach((item) => {
            asegurarAsesor(obtenerAsesorItem(item, "pruebas")).pruebas += 1;
        });

        entregasFiltradas.forEach((item) => {
            asegurarAsesor(obtenerAsesorItem(item, "entregas")).entregas += 1;
        });

        const topAsesores = [...asesoresMap.values()]
            .sort(
                (a, b) =>
                    b.entregas * 3 +
                    b.pruebas * 2 +
                    b.registroPiso * 1.3 +
                    b.citas * 1.5 +
                    b.prospectos -
                    (a.entregas * 3 +
                        a.pruebas * 2 +
                        a.registroPiso * 1.3 +
                        a.citas * 1.5 +
                        a.prospectos)
            )
            .slice(0, 8);

        const timeline = construirSerieMensual(
            {
                prospectos: prospectosFiltrados,
                casos: casosFiltrados,
                encuestas: encuestasFiltradas,
                entregas: entregasFiltradas,
                citas: citasFiltradas,
                registroPiso: registroPisoFiltrado,
            },
            {
                fechaInicio: filtros.fechaInicio,
                fechaFin: filtros.fechaFin,
            }
        );

        const insights = [];

        if (rendimientoPorAgencia.length) {
            const top = rendimientoPorAgencia[0];
            insights.push({
                titulo: "Dealer más activo",
                descripcion: `${top.agencia} lidera el periodo con ${formatearNumero(
                    top.actividadTotal
                )} movimientos operativos combinados.`,
            });
        }

        if (topAsesores.length) {
            const top = topAsesores[0];
            insights.push({
                titulo: "Asesor con mayor empuje",
                descripcion: `${top.asesor} concentra ${formatearNumero(
                    top.prospectos
                )} prospectos, ${formatearNumero(top.citas)} citas, ${formatearNumero(
                    top.registroPiso
                )} registros de piso y ${formatearNumero(top.entregas)} entregas.`,
            });
        }

        if (satisfaccionPorAgencia.length) {
            const top = satisfaccionPorAgencia[0];
            insights.push({
                titulo: "Mejor percepción del cliente",
                descripcion: `${top.agencia} encabeza satisfacción con promedio de ${top.promedio}/5 en ${formatearNumero(
                    top.encuestas
                )} encuestas.`,
            });
        }

        if (origenReclamaciones.length) {
            const top = origenReclamaciones[0];
            insights.push({
                titulo: "Origen crítico en reclamaciones",
                descripcion: `${top.name} es el origen con más incidencia del periodo, con ${formatearNumero(
                    top.value
                )} registros.`,
            });
        }

        return {
            resumen,
            embudo,
            rendimientoPorAgencia,
            estatusProspectos,
            origenReclamaciones,
            satisfaccionPorAgencia,
            topAsesores,
            timeline,
            insights,
            datasetsFiltrados: {
                casosFiltrados,
                prospectosFiltrados,
                citasFiltradas,
                registroPisoFiltrado,
                pruebasFiltradas,
                entregasFiltradas,
                encuestasFiltradas,
            },
        };
    }, [data, filtros]);

    if (loading) {
        return <LoadingState />;
    }

    const hayDatos =
        data.casos.length ||
        data.prospectos.length ||
        data.citas.length ||
        data.registroPiso.length ||
        data.pruebas.length ||
        data.entregas.length ||
        data.encuestas.length;

    const BRAND_BLUE = "#131E5C";
    const totalRegistrosFiltrados = analitica.resumen.totalRegistrosFiltrados;

    return (
        <div className="space-y-6">
            <div
                className="relative overflow-hidden rounded-lg border border-slate-200 p-6 shadow-sm"
                style={{ backgroundColor: BRAND_BLUE }}
            >
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-28 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-black/15" />
                </div>
                <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="font-vw-header truncate text-lg font-extrabold text-white sm:text-xl">
                                Métricas del CRM
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-white/80">
                            Panel operativo para analizar prospectos, citas, piso, pruebas y entregas.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
                            {totalRegistrosFiltrados ? `${formatearNumero(totalRegistrosFiltrados)} registros filtrados` : "Sin resultados"}
                        </div>

                        <button
                            type="button"
                            onClick={() => setMenuFiltrosAbierto(true)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 xl:hidden"
                        >
                            <SlidersHorizontal size={16} />
                            Filtros
                        </button>

                        <button
                            type="button"
                            onClick={() => cargarDatos({ forzar: true })}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                            <RefreshCw size={16} className={refrescando ? "animate-spin" : ""} />
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            {!hayDatos ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                        <BarChart3 size={20} />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">
                        Aún no hay datos para construir el panel
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        En cuanto existan registros en los módulos del CRM, aquí se mostrarán
                        automáticamente las métricas y gráficas.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-6">
                        {errores.length ? (
                            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <TriangleAlert className="mt-0.5" size={18} />
                                    <div>
                                        <p className="font-semibold">Algunos módulos no se cargaron por completo</p>
                                        <p className="mt-1 text-sm">
                                            Revisa los endpoints de: {errores.join(", ")}. El resto del panel se calculó con la información disponible.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {!totalRegistrosFiltrados ? (
                            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
                                    <Funnel size={20} />
                                </div>
                                <h2 className="mt-4 text-lg font-semibold text-slate-900">
                                    No hay coincidencias con los filtros actuales
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    Ajusta el rango de fechas, asesor o dealer para volver a visualizar actividad operativa.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                                    <MetricCard
                                        icon={Users}
                                        title="Prospectos digitales"
                                        value={formatearNumero(analitica.resumen.totalProspectos)}
                                        accent="#131E5C"
                                    />
                                    <MetricCard
                                        icon={CalendarDays}
                                        title="Citas"
                                        value={formatearNumero(analitica.resumen.totalCitas)}
                                        accent="#24357D"
                                    />
                                    <MetricCard
                                        icon={KanbanSquare}
                                        title="Registro piso"
                                        value={formatearNumero(analitica.resumen.totalRegistrosPiso)}
                                        accent="#2F4792"
                                    />
                                    <MetricCard
                                        icon={CarFront}
                                        title="Entregas"
                                        value={formatearNumero(analitica.resumen.totalEntregas)}
                                        accent="#3A50A3"
                                    />
                                    <MetricCard
                                        icon={SmilePlus}
                                        title="Satisfacción"
                                        value={`${analitica.resumen.promedioEncuestas}/5`}
                                        accent="#6C80CF"
                                    />
                                    <MetricCard
                                        icon={ClipboardList}
                                        title="Reclamaciones abiertas"
                                        value={formatearNumero(analitica.resumen.reclamacionesAbiertas)}
                                        accent="#8FA0E3"
                                    />
                                </div>

                                <div className="grid gap-4 xl:grid-cols-3">
                                    <div className="xl:col-span-2">
                                        <ChartCard
                                            title="Tendencia consolidada"
                                            action={periodoActivo ? `Últimos ${periodoActivo} días` : "Rango personalizado"}
                                        >
                                            {analitica.timeline.some(
                                                (item) =>
                                                    item.prospectos ||
                                                    item.citas ||
                                                    item.registrosPiso ||
                                                    item.reclamaciones ||
                                                    item.entregas ||
                                                    item.encuestas
                                            ) ? (
                                                <div className="h-[360px]">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={analitica.timeline}>
                                                            <defs>
                                                                <linearGradient id="grad-prospectos" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#131E5C" stopOpacity={0.35} />
                                                                    <stop offset="95%" stopColor="#131E5C" stopOpacity={0.03} />
                                                                </linearGradient>
                                                                <linearGradient id="grad-entregas" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#5C73C8" stopOpacity={0.35} />
                                                                    <stop offset="95%" stopColor="#5C73C8" stopOpacity={0.03} />
                                                                </linearGradient>
                                                            </defs>

                                                            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                                            <XAxis dataKey="mes" tick={{ fill: "#475569", fontSize: 12 }} />
                                                            <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                                                            <Tooltip content={<TooltipGrafica />} />
                                                            <Legend />

                                                            <Area
                                                                type="monotone"
                                                                dataKey="prospectos"
                                                                name="Prospectos"
                                                                stroke="#335C13"
                                                                fill="url(#grad-prospectos)"
                                                                strokeWidth={2.5}
                                                                animationDuration={900}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="citas"
                                                                name="Citas"
                                                                stroke="#9C5D48"
                                                                fillOpacity={0}
                                                                strokeWidth={2}
                                                                animationDuration={1000}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="registrosPiso"
                                                                name="Registro piso"
                                                                stroke="#131E5C"
                                                                fillOpacity={0}
                                                                strokeWidth={2}
                                                                animationDuration={1100}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="reclamaciones"
                                                                name="Reclamaciones"
                                                                stroke="#3B478F"
                                                                fillOpacity={0}
                                                                strokeWidth={2.2}
                                                                animationDuration={1150}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="entregas"
                                                                name="Entregas"
                                                                stroke="#6C9C48"
                                                                fill="url(#grad-entregas)"
                                                                strokeWidth={2.5}
                                                                animationDuration={1200}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="encuestas"
                                                                name="Encuestas"
                                                                stroke="#C6CDF5"
                                                                fillOpacity={0}
                                                                strokeWidth={2}
                                                                animationDuration={1300}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            ) : (
                                                <EmptyChart text="No hay suficiente actividad histórica para construir la tendencia." />
                                            )}
                                        </ChartCard>
                                    </div>

                                    <ChartCard
                                        title="Embudo comercial"
                                        action={`Asistencia general ${formatearPorcentaje(
                                            analitica.resumen.asistenciaGeneral
                                        )}`}
                                    >
                                        {analitica.embudo.some((item) => item.cantidad > 0) ? (
                                            <div className="h-[360px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analitica.embudo}
                                                        layout="vertical"
                                                        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                                                    >
                                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                                        <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="etapa"
                                                            width={96}
                                                            tick={{ fill: "#475569", fontSize: 12 }}
                                                        />
                                                        <Tooltip content={<TooltipGrafica />} />
                                                        <Bar
                                                            dataKey="cantidad"
                                                            name="Cantidad"
                                                            fill="#131E5C"
                                                            radius={[0, 14, 14, 0]}
                                                            animationDuration={900}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <EmptyChart text="No hay registros suficientes para calcular el embudo comercial." />
                                        )}
                                    </ChartCard>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <ChartCard
                                        title="Carga operativa por dealer"
                                    >
                                        {analitica.rendimientoPorAgencia.length ? (
                                            <div className="h-[380px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analitica.rendimientoPorAgencia}
                                                        margin={{ top: 10, right: 20, left: 0, bottom: 26 }}
                                                    >
                                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="agencia"
                                                            tick={{ fill: "#475569", fontSize: 11 }}
                                                            angle={-14}
                                                            textAnchor="end"
                                                            height={72}
                                                        />
                                                        <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                                                        <Tooltip content={<TooltipGrafica />} />
                                                        <Legend />
                                                        <Bar dataKey="prospectos" name="Prospectos" stackId="a" fill="#335C13" radius={[10, 10, 0, 0]} />
                                                        <Bar dataKey="citas" name="Citas" stackId="a" fill="#9C5D48" />
                                                        <Bar dataKey="registroPiso" name="Registro piso" stackId="a" fill="#131E5C" />
                                                        <Bar dataKey="pruebas" name="Pruebas" stackId="a" fill="#3B478F" />
                                                        <Bar dataKey="entregas" name="Entregas" stackId="a" fill="#6C9C48" />
                                                        <Bar dataKey="casos" name="Reclamaciones" stackId="a" fill="#C6CDF5" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <EmptyChart text="No hay actividad por dealer suficiente en el periodo seleccionado." />
                                        )}
                                    </ChartCard>

                                    <ChartCard
                                        title="Distribución de estatus de prospectos"
                                        action="Top 6 estatus"
                                    >
                                        {analitica.estatusProspectos.length ? (
                                            <div className="h-[380px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={analitica.estatusProspectos}
                                                            dataKey="value"
                                                            nameKey="name"
                                                            innerRadius={72}
                                                            outerRadius={118}
                                                            paddingAngle={3}
                                                            animationDuration={900}
                                                        >
                                                            {analitica.estatusProspectos.map((item, index) => (
                                                                <Cell
                                                                    key={`${item.name}-${index}`}
                                                                    fill={PALETA[index % PALETA.length]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip content={<TooltipGrafica />} />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <EmptyChart text="No se encontraron estatus de prospectos para mostrar." />
                                        )}
                                    </ChartCard>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <ChartCard
                                        title="Satisfacción por dealer"
                                        action={`${formatearNumero(analitica.resumen.encuestasTotales)} encuestas`}
                                    >
                                        {analitica.satisfaccionPorAgencia.length ? (
                                            <div className="h-[360px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analitica.satisfaccionPorAgencia}
                                                        layout="vertical"
                                                        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                                                    >
                                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                                        <XAxis
                                                            type="number"
                                                            domain={[0, 5]}
                                                            tick={{ fill: "#475569", fontSize: 12 }}
                                                        />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="agencia"
                                                            width={120}
                                                            tick={{ fill: "#475569", fontSize: 12 }}
                                                        />
                                                        <Tooltip content={<TooltipGrafica />} />
                                                        <Bar
                                                            dataKey="promedio"
                                                            name="Promedio"
                                                            fill="#131E5C"
                                                            radius={[0, 14, 14, 0]}
                                                            animationDuration={1000}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <EmptyChart text="Aún no hay suficientes encuestas para comparar satisfacción por dealer." />
                                        )}
                                    </ChartCard>

                                    <ChartCard
                                        title="Origen de reclamaciones"
                                        action={`${formatearNumero(analitica.resumen.casosTotales)} reclamaciones`}
                                    >
                                        {analitica.origenReclamaciones.length ? (
                                            <div className="h-[360px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analitica.origenReclamaciones}
                                                        margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
                                                    >
                                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fill: "#475569", fontSize: 11 }}
                                                            angle={-15}
                                                            textAnchor="end"
                                                            height={70}
                                                        />
                                                        <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                                                        <Tooltip content={<TooltipGrafica />} />
                                                        <Bar
                                                            dataKey="value"
                                                            name="Reclamaciones"
                                                            fill="#24357D"
                                                            radius={[10, 10, 0, 0]}
                                                            animationDuration={950}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <EmptyChart text="No hay reclamaciones suficientes para identificar orígenes dominantes." />
                                        )}
                                    </ChartCard>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-1">
                                    <ChartCard
                                        title="Asesores más destacados"
                                        action="Top 8 asesores"
                                    >
                                        {analitica.topAsesores.length ? (
                                            <div className="h-[380px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={analitica.topAsesores}
                                                        layout="vertical"
                                                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                                                    >
                                                        <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                                                        <XAxis type="number" tick={{ fill: "#475569", fontSize: 12 }} />
                                                        <YAxis
                                                            type="category"
                                                            dataKey="asesor"
                                                            width={150}
                                                            tick={{ fill: "#475569", fontSize: 12 }}
                                                        />
                                                        <Tooltip content={<TooltipGrafica />} />
                                                        <Legend />
                                                        <Bar dataKey="prospectos" name="Prospectos" stackId="a" fill="#335C13" radius={[0, 0, 0, 0]} />
                                                        <Bar dataKey="citas" name="Citas" stackId="a" fill="#9C5D48" />
                                                        <Bar dataKey="registroPiso" name="Registro piso" stackId="a" fill="#131E5C" />
                                                        <Bar dataKey="pruebas" name="Pruebas" stackId="a" fill="#3B478F" />
                                                        <Bar dataKey="entregas" name="Entregas" stackId="a" fill="#6C9C48" radius={[0, 14, 14, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <EmptyChart text="No hay suficiente información de asesores para comparar rendimiento." />
                                        )}
                                    </ChartCard>
                                </div>
                            </>
                        )}
                    </div>

                    <PanelFiltros
                        abierto={menuFiltrosAbierto}
                        onClose={() => setMenuFiltrosAbierto(false)}
                        filtros={filtros}
                        setFiltros={setFiltros}
                        dealersDisponibles={dealersDisponibles}
                        asesoresDisponibles={asesoresDisponibles}
                        aplicarPeriodoRapido={aplicarPeriodoRapido}
                        periodoActivo={periodoActivo}
                        totalRegistrosFiltrados={analitica.resumen.totalRegistrosFiltrados}
                        registrosPisoFiltrados={analitica.resumen.totalRegistrosPiso}
                        citasFiltradas={analitica.resumen.totalCitas}
                    />
                </div>
            )}

            <button
                type="button"
                onClick={() => setMenuFiltrosAbierto(true)}
                className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#131E5C] px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-[#131E5C]/30 transition hover:scale-[1.02] xl:hidden"
            >
                <SlidersHorizontal size={16} />
                Filtros
            </button>
        </div>
    );
}