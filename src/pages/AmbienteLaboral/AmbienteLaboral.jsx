// src/pages/AmbienteLaboral/AmbienteLaboral.jsx
import { useState } from "react";
import { ChevronDown, ChevronRight, Paperclip } from "lucide-react";

const BRAND_BLUE = "#131E5C";

const DATA_INICIAL = [
    {
        id: "ambiente-trabajo",
        nombre: "Ambiente de trabajo",
        dominios: [
            { id: "condiciones-peligrosas", nombre: "Condiciones peligrosas e inseguras" },
            { id: "condiciones-deficientes", nombre: "Condiciones deficientes e insalubres" },
            { id: "trabajos-peligrosos", nombre: "Trabajos peligrosos" },
        ],
    },
    {
        id: "factores-actividad",
        nombre: "Factores propios de la actividad",
        dominios: [
            { id: "carga-trabajo", nombre: "Carga de trabajo" },
            { id: "falta-control", nombre: "Falta de control sobre el trabajo" },
        ],
    },
    {
        id: "organizacion-tiempo",
        nombre: "Organización del tiempo de trabajo",
        dominios: [
            { id: "jornada-trabajo", nombre: "Jornada de trabajo" },
            { id: "interferencia-familia", nombre: "Interferencia en la relación trabajo-familia" },
        ],
    },
    {
        id: "liderazgo-relaciones",
        nombre: "Liderazgo y relaciones en el trabajo",
        dominios: [
            { id: "liderazgo", nombre: "Liderazgo" },
            { id: "relaciones-trabajo", nombre: "Relaciones en el trabajo" },
            { id: "violencia", nombre: "Violencia" },
        ],
    },
];

function crearEstadoDominios(categorias) {
    const estado = {};
    categorias.forEach((cat) => {
        cat.dominios.forEach((dom) => {
            estado[dom.id] = {
                puntuacion: "",
                planAccion: "",
                seguimiento: "",
            };
        });
    });
    return estado;
}

export default function AmbienteLaboral() {
    const [dealer, setDealer] = useState("VW Cordoba");
    const [anio, setAnio] = useState("2026");
    const [categoriaAbierta, setCategoriaAbierta] = useState("factores-actividad");
    const [valores, setValores] = useState(() => crearEstadoDominios(DATA_INICIAL));

    const actualizarDominio = (dominioId, campo, valor) => {
        setValores((prev) => ({
            ...prev,
            [dominioId]: {
                ...prev[dominioId],
                [campo]: valor,
            },
        }));
    };

    const toggleCategoria = (catId) => {
        setCategoriaAbierta((prev) => (prev === catId ? null : catId));
    };

    const totalDominios = DATA_INICIAL.reduce((acc, cat) => acc + cat.dominios.length, 0);
    const conSeguimiento = Object.values(valores).filter((v) => v.seguimiento.trim() !== "").length;
    const puntuaciones = Object.values(valores)
        .map((v) => Number(v.puntuacion))
        .filter((n) => !Number.isNaN(n) && n > 0);
    const promedio = puntuaciones.length
        ? (puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length).toFixed(1)
        : "-";

    return (
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-14">
           <h1
                className="text-3xl font-extrabold tracking-[-0.02em] md:text-4xl"
                style={{ color: BRAND_BLUE }}
            >
                Ambiente laboral
            </h1>
            <p className="mb-6 text-base text-slate-500">
                Evaluación anual por categoría y dominio, con plan de acción, seguimiento y evidencias.
            </p>

            {/* Filtros */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <select
                    value={dealer}
                    onChange={(e) => setDealer(e.target.value)}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: `${BRAND_BLUE}33` }}
                >
                    <option>VW Cordoba</option>
                    <option>VW Tuxpan</option>
                    <option>VW Orizaba</option>
                    <option>VW Tuxtepec</option>
                </select>
                <select
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:w-32"
                    style={{ borderColor: `${BRAND_BLUE}33` }}
                >
                    <option>2026</option>
                    <option>2025</option>
                </select>
            </div>

            {/* Resumen */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metrica label="Categorías" valor={DATA_INICIAL.length} />
                <Metrica label="Dominios" valor={totalDominios} />
                <Metrica label="Promedio general" valor={promedio} />
                <Metrica label="Con seguimiento" valor={`${conSeguimiento} / ${totalDominios}`} />
            </div>

            {/* Categorías */}
            <div className="space-y-3">
                {DATA_INICIAL.map((cat) => {
                    const abierta = categoriaAbierta === cat.id;
                    return (
                        <div
                            key={cat.id}
                            className="overflow-hidden rounded-xl border bg-white"
                            style={{ borderColor: `${BRAND_BLUE}22` }}
                        >
                            <button
                                onClick={() => toggleCategoria(cat.id)}
                                className="flex w-full items-center justify-between px-6 py-4 text-left"
                            >
                                <span className="flex items-center gap-2 text-lg font-bold" style={{ color: BRAND_BLUE }}>
                                    {abierta ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    {cat.nombre}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {cat.dominios.length} dominios
                                </span>
                            </button>

                            {abierta && (
                                <div className="border-t" style={{ borderColor: `${BRAND_BLUE}15` }}>
                                    {cat.dominios.map((dom) => (
                                        <div
                                            key={dom.id}
                                            className="border-b px-4 py-3 last:border-b-0"
                                            style={{ borderColor: `${BRAND_BLUE}10` }}
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {dom.nombre}
                                                </span>
                                               <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    step="0.1"
                                                    placeholder="1.0 - 5.0"
                                                    value={valores[dom.id].puntuacion}
                                                    onChange={(e) =>
                                                        actualizarDominio(dom.id, "puntuacion", e.target.value)
                                                    }
                                                    className="w-24 rounded-lg border px-2 py-1 text-xs font-bold text-right"
                                                    style={{ borderColor: `${BRAND_BLUE}33`, color: BRAND_BLUE }}
                                                />
                                            </div>

                                            <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                <input
                                                    type="text"
                                                    placeholder="Plan de acción"
                                                    value={valores[dom.id].planAccion}
                                                    onChange={(e) =>
                                                        actualizarDominio(dom.id, "planAccion", e.target.value)
                                                    }
                                                    className="rounded-lg border px-3 py-2 text-sm"
                                                    style={{ borderColor: `${BRAND_BLUE}22` }}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Seguimiento"
                                                    value={valores[dom.id].seguimiento}
                                                    onChange={(e) =>
                                                        actualizarDominio(dom.id, "seguimiento", e.target.value)
                                                    }
                                                    className="rounded-lg border px-3 py-2 text-sm"
                                                    style={{ borderColor: `${BRAND_BLUE}22` }}
                                                />
                                            </div>

                                            <button
                                                className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
                                                style={{ borderColor: `${BRAND_BLUE}33`, color: BRAND_BLUE }}
                                            >
                                                <Paperclip className="h-3.5 w-3.5" />
                                                Adjuntar evidencias
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Metrica({ label, valor }) {
    return (
        <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="text-3xl font-extrabold" style={{ color: BRAND_BLUE }}>
                {valor}
            </p>
        </div>
    );
}