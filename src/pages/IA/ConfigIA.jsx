//src/pages/IA/ConfigAI.jsx
import { useState } from "react";

const secciones = [
    {
        id: "identidad",
        titulo: "Identidad",
        placeholder:
            'Panel de Texto Ajustable al tamaño del texto, en este panel, se debe controlar el nombre y referencia de la IA: "Yo soy Vagen, asesor de VW Orizaba"',
    },
    {
        id: "precios",
        titulo: "Precios",
        placeholder:
            "Panel de Texto Ajustable al tamaño del texto, en este panel, se controlará la web de origen del precio (VW.COM.MX) y directamente asignar las reglas de proporcionamiento.",
    },
    {
        id: "perfilamiento",
        titulo: "Perfilamiento",
        placeholder:
            "Panel de Texto ajustable para dar reglas de enganche, financiamiento, montos, y reglas comerciales.",
    },
    {
        id: "limites",
        titulo: "Límites de Atencionalidad",
        placeholder:
            "Panel de Texto ajustable para dar reglas de hasta donde debe llegar la atención antes de perfilarlo. Que debe escribir y contestar para no saltar los limitantes de que no debe dar precios finales y cotizaciones.",
    },
    {
        id: "personalidad",
        titulo: "Personalidad",
        placeholder:
            "Panel de Texto ajustable para dar reglas de COMO CONTESTAR, con que calidez, a que condiciones debe adaptarse. Reglas de App Loop.",
    },
];

const CONDICIONANTES_FIJAS = `\n\n---\n[CONDICIONANTES NO NEGOCIABLES - NO MODIFICAR]\n- No proporcionar precios finales ni cotizaciones cerradas.\n- No comprometerse con disponibilidad de unidades sin verificación previa.\n- Siempre derivar al asesor humano para el cierre comercial.\n- Mantener el tono institucional de Grupo Automotriz R&R en todo momento.`;

const NUMEROS = ["2717024903", "8001234567", "9511234567"];

const DIAS = [
    { id: "lun", label: "Lun" },
    { id: "mar", label: "Mar" },
    { id: "mie", label: "Mié" },
    { id: "jue", label: "Jue" },
    { id: "vie", label: "Vie" },
    { id: "sab", label: "Sáb" },
    { id: "dom", label: "Dom" },
];

const horarioInicial = () =>
    Object.fromEntries(
        DIAS.map((d) => [
            d.id,
            {
                activo: d.id !== "dom",
                inicio: "19:00",
                fin: "08:59",
                // Si el turno cruza medianoche y continúa hasta otro día
                hastaDia: null,
            },
        ])
    );

// Mini toggle reutilizable
function MiniToggle({ value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            role="switch"
            aria-checked={value}
            className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0 ${value ? "bg-[#131E5C]" : "bg-gray-300"
                }`}
        >
            <span
                className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform duration-300 ${value ? "translate-x-5" : "translate-x-1"
                    }`}
            />
        </button>
    );
}

export default function ConfigIA() {
    const [numeroSeleccionado, setNumeroSeleccionado] = useState(NUMEROS[0]);
    const [swiftActivo, setSwiftActivo] = useState(true);
    const [horarios, setHorarios] = useState(horarioInicial());
    const [mostrarHorarios, setMostrarHorarios] = useState(false);
    const [campos, setCampos] = useState(
        Object.fromEntries(secciones.map((s) => [s.id, ""]))
    );
    const [editando, setEditando] = useState(
        Object.fromEntries(secciones.map((s) => [s.id, false]))
    );
    const [guardado, setGuardado] = useState(
        Object.fromEntries(secciones.map((s) => [s.id, false]))
    );

    const handleEditar = (id) => {
        setEditando((prev) => ({ ...prev, [id]: true }));
        setGuardado((prev) => ({ ...prev, [id]: false }));
    };

    const handleAplicar = (id) => {
        setEditando((prev) => ({ ...prev, [id]: false }));
        setGuardado((prev) => ({ ...prev, [id]: true }));
        console.log(`[${id}] Guardado:`, campos[id] + CONDICIONANTES_FIJAS);
        setTimeout(() => setGuardado((prev) => ({ ...prev, [id]: false })), 2000);
    };

    const actualizarHorario = (diaId, campo, valor) => {
        setHorarios((prev) => ({
            ...prev,
            [diaId]: { ...prev[diaId], [campo]: valor },
        }));
    };

    // Resumen legible de horarios activos para mostrar en el header
    const resumenHorarios = DIAS.filter((d) => horarios[d.id].activo)
        .map((d) => {
            const h = horarios[d.id];
            const hasta = h.hastaDia
                ? ` → ${DIAS.find((x) => x.id === h.hastaDia)?.label} ${h.fin}`
                : ` - ${h.fin}`;
            return `${d.label} ${h.inicio}${hasta}`;
        })
        .join(" · ");

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="bg-[#0a1f44] text-white rounded-xl px-8 py-6 mb-6">
                <h1 className="text-3xl font-bold mb-1">
                    Panel de Inteligencias Artificiales
                </h1>
                <p className="text-sm text-blue-200">
                    Configura los criterios de atención de cada número con una
                    Inteligencia Artificial activada
                </p>
            </div>

            {/* Fila de configuración principal */}
            <div className="bg-white rounded-xl shadow px-8 py-6 mb-4">
                <div className="flex flex-wrap items-start gap-8">
                    {/* Número a configurar */}
                    <div className="flex flex-col gap-1 min-w-[220px]">
                        <span className="text-[#0a1f44] font-bold text-base mb-1">
                            Número a configurar
                        </span>
                        <select
                            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={numeroSeleccionado}
                            onChange={(e) => setNumeroSeleccionado(e.target.value)}
                        >
                            {NUMEROS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1 leading-tight max-w-[220px]">
                        </p>
                    </div>

                    {/* Swift Toggle */}
                    <div className="flex flex-col gap-1 items-start">
                        <span className="text-[#0a1f44] font-bold text-base mb-1">
                            Swift
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSwiftActivo((v) => !v)}
                                className={`relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${swiftActivo ? "bg-[#131E5C]" : "bg-gray-300"
                                    }`}
                                aria-checked={swiftActivo}
                                role="switch"
                            >
                                <span
                                    className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${swiftActivo ? "translate-x-8" : "translate-x-1"
                                        }`}
                                />
                            </button>
                            <span
                                className={`text-sm font-semibold transition-colors duration-300 ${swiftActivo ? "text-[#131E5C]" : "text-gray-400"
                                    }`}
                            >
                                {swiftActivo ? "Activo" : "Inactivo"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 leading-tight max-w-[200px]">
                        </p>
                    </div>

                    {/* Horarios activos - botón que despliega panel */}
                    <div className="flex flex-col gap-1 flex-1 min-w-[260px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[#0a1f44] font-bold text-base">
                                Horarios activos por día
                            </span>
                            <button
                                onClick={() => setMostrarHorarios((v) => !v)}
                                className="flex items-center gap-1 text-sm text-[#131E5C] font-semibold hover:underline transition-all"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-300 ${mostrarHorarios ? "rotate-180" : ""
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                                {mostrarHorarios ? "Cerrar" : "Configurar"}
                            </button>
                        </div>

                        {/* Resumen compacto cuando está cerrado */}
                        {!mostrarHorarios && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                {resumenHorarios || "Sin días activos configurados"}
                            </p>
                        )}

                        {/* Panel expandible de horarios por día */}
                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${mostrarHorarios ? "max-h-[600px] opacity-100 mt-3" : "max-h-0 opacity-0"
                                }`}
                        >
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {/* Cabecera tabla */}
                                <div className="grid grid-cols-[90px_1fr_1fr_1fr_80px] bg-[#0a1f44] text-white text-xs font-semibold px-4 py-2 gap-2">
                                    <span>Día</span>
                                    <span>Desde</span>
                                    <span>Hasta</span>
                                    <span>¿Hasta qué día?</span>
                                    <span className="text-center">Activo</span>
                                </div>

                                {DIAS.map((dia, idx) => {
                                    const h = horarios[dia.id];
                                    return (
                                        <div
                                            key={dia.id}
                                            className={`grid grid-cols-[90px_1fr_1fr_1fr_80px] items-center px-4 py-2.5 gap-2 text-sm transition-colors duration-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                                } ${!h.activo ? "opacity-40" : ""}`}
                                        >
                                            {/* Nombre día */}
                                            <span className="font-semibold text-[#0a1f44]">
                                                {dia.label}
                                            </span>

                                            {/* Hora inicio */}
                                            <input
                                                type="time"
                                                value={h.inicio}
                                                disabled={!h.activo}
                                                onChange={(e) =>
                                                    actualizarHorario(dia.id, "inicio", e.target.value)
                                                }
                                                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed w-full"
                                            />

                                            {/* Hora fin */}
                                            <input
                                                type="time"
                                                value={h.fin}
                                                disabled={!h.activo}
                                                onChange={(e) =>
                                                    actualizarHorario(dia.id, "fin", e.target.value)
                                                }
                                                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed w-full"
                                            />

                                            {/* ¿Hasta qué día? (para turnos que cruzan días) */}
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
                                                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed w-full"
                                            >
                                                <option value="">Mismo día</option>
                                                {DIAS.filter((d) => d.id !== dia.id).map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.label}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Toggle activo */}
                                            <div className="flex justify-center">
                                                <MiniToggle
                                                    value={h.activo}
                                                    onChange={(v) =>
                                                        actualizarHorario(dia.id, "activo", v)
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Nota aclaratoria */}
                            <p className="text-xs text-gray-400 mt-2 leading-tight">
                                💡 Si el turno cruza medianoche (ej. Sáb 14:00 → Lun 09:00),
                                selecciona el día de término en la columna "¿Hasta qué día?".
                            </p>

                            {/* Botón guardar horarios */}
                            <button
                                onClick={() => {
                                    console.log("[Horarios] Guardados:", horarios);
                                    setMostrarHorarios(false);
                                }}
                                className="mt-3 bg-[#0a1f44] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#131E5C] transition-colors duration-200"
                            >
                                Guardar horarios
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Secciones de configuración */}
            <div className="flex flex-col gap-4">
                {secciones.map((seccion) => (
                    <div key={seccion.id} className="bg-white rounded-xl shadow px-8 py-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[#0a1f44] font-bold text-lg">
                                {seccion.titulo}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleEditar(seccion.id)}
                                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0a1f44] transition-colors"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z"
                                        />
                                    </svg>
                                    Editar parámetro
                                </button>
                                <button
                                    onClick={() => handleAplicar(seccion.id)}
                                    className={`flex items-center gap-1 text-sm transition-colors ${guardado[seccion.id]
                                            ? "text-green-600"
                                            : "text-gray-600 hover:text-green-600"
                                        }`}
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {guardado[seccion.id] ? "¡Guardado!" : "Aplicar cambios"}
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 text-gray-400 text-lg select-none">
                                ←
                            </span>
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
                                rows={3}
                                className={`w-full border rounded-lg px-4 py-3 text-sm text-gray-600 resize-y transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${editando[seccion.id]
                                        ? "border-blue-400 bg-white"
                                        : "border-gray-200 bg-gray-50 cursor-default"
                                    }`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
