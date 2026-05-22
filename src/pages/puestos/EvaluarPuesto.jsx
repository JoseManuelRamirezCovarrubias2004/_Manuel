import { useState } from 'react';
import { X, User, Star, Award, TrendingUp, Target, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { obtenerFormatoEvaluacion } from './datos/formatosEvaluacion';

export default function EvaluarPuesto({ puesto, onClose, onSave }) {
    const formato = obtenerFormatoEvaluacion(puesto.nombre);
    
    // Inicializar valores de criterios según el tipo de formato
    const inicializarCriterios = () => {
        if (formato.tipo === "escala" || formato.tipo === "escala_10") {
            const criteriosObj = {};
            formato.criterios.forEach(criterio => {
                criteriosObj[criterio] = 3; // valor por defecto 3 (regular)
            });
            return criteriosObj;
        } else if (formato.tipo === "semanal") {
            const criteriosObj = {};
            formato.criterios.forEach(criterio => {
                criteriosObj[criterio.nombre] = {
                    semanas: {
                        "semana 1": "",
                        "semana 2": "",
                        "semana 3": "",
                        "semana 4": ""
                    },
                    meta: criterio.meta
                };
            });
            return criteriosObj;
        }
        return {};
    };

    const [evaluacion, setEvaluacion] = useState({
        puestoId: puesto.id,
        puestoNombre: puesto.nombre,
        evaluador: '',
        calificacion: 0,
        comentarios: '',
        criterios: inicializarCriterios()
    });

    const calcularCalificacion = (criterios) => {
        if (formato.tipo === "escala") {
            const valores = Object.values(criterios);
            const suma = valores.reduce((a, b) => a + b, 0);
            const totalPosible = formato.criterios.length * 5;
            return Math.round((suma / totalPosible) * 100);
        } else if (formato.tipo === "escala_10") {
            const valores = Object.values(criterios);
            const suma = valores.reduce((a, b) => a + b, 0);
            const totalPosible = formato.criterios.length * 10;
            return Math.round((suma / totalPosible) * 100);
        } else if (formato.tipo === "semanal") {
            // Para formato semanal, calcular promedio de metas cumplidas
            let totalCumplimiento = 0;
            let count = 0;
            Object.values(criterios).forEach(criterio => {
                const semanas = Object.values(criterio.semanas);
                semanas.forEach(valor => {
                    if (valor && criterio.meta) {
                        const valorNum = parseFloat(valor);
                        const metaNum = parseFloat(criterio.meta);
                        if (!isNaN(valorNum) && !isNaN(metaNum)) {
                            let porcentaje = (valorNum / metaNum) * 100;
                            if (porcentaje > 100) porcentaje = 100;
                            totalCumplimiento += porcentaje;
                            count++;
                        }
                    }
                });
            });
            return count > 0 ? Math.round(totalCumplimiento / count) : 0;
        }
        return 0;
    };

    const handleCriterioChange = (criterioNombre, value, semana = null) => {
        const nuevosCriterios = { ...evaluacion.criterios };
        
        if (semana) {
            nuevosCriterios[criterioNombre].semanas[semana] = value;
        } else {
            nuevosCriterios[criterioNombre] = parseInt(value);
        }
        
        const nuevaCalificacion = calcularCalificacion(nuevosCriterios);
        setEvaluacion({
            ...evaluacion,
            criterios: nuevosCriterios,
            calificacion: nuevaCalificacion
        });
    };

    const getColorCalificacion = (puntaje) => {
        if (puntaje >= 85) return 'text-emerald-600';
        if (puntaje >= 70) return 'text-amber-600';
        return 'text-red-600';
    };

    const getTextoCalificacion = (puntaje) => {
        if (puntaje >= 85) return 'Excelente';
        if (puntaje >= 70) return 'Bueno';
        if (puntaje >= 50) return 'Regular';
        return 'Necesita mejorar';
    };

    const getEscalaLabel = (valor, tipo) => {
        if (tipo === "escala") {
            const labels = { 5: "Excelente", 4: "Bueno", 3: "Regular", 2: "Tolerable", 1: "Malo" };
            return labels[valor] || "";
        } else if (tipo === "escala_10") {
            const labels = { 10: "Excelente", 9: "Muy bien", 8: "Bien", 7: "Bien", 6: "Regular", 5: "Regular", 4: "Malo", 3: "Malo", 2: "Muy mal", 1: "Muy mal", 0: "Muy mal" };
            return labels[valor] || "";
        }
        return "";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
            <div className="relative w-full max-w-4xl my-8 mx-4 bg-white rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 rounded-t-2xl p-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-[#131E5C]">Evaluar puesto</h2>
                        <p className="text-sm text-slate-500">{puesto.nombre}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Tipo de evaluación: {formato.tipo === "escala" ? "Escala 1-5" : formato.tipo === "escala_10" ? "Escala 0-10" : "Semanal por metas"}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Evaluador */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            <User className="inline h-4 w-4 mr-1" />
                            Nombre del evaluador *
                        </label>
                        <input
                            type="text"
                            value={evaluacion.evaluador}
                            onChange={(e) => setEvaluacion({ ...evaluacion, evaluador: e.target.value })}
                            placeholder="Ej: Juan Pérez, Gerente de RH"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-[#131E5C] focus:outline-none"
                        />
                    </div>

                    {/* Criterios según tipo de formato */}
                    <div className="space-y-4">
                        <h3 className="text-md font-bold text-[#131E5C] border-l-4 border-[#131E5C] pl-3">
                            Criterios de evaluación
                        </h3>

                        {formato.tipo === "escala" && (
                            <div className="space-y-4">
                                {formato.criterios.map((criterio, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-semibold text-slate-600">
                                                {criterio}
                                            </label>
                                            <span className={`text-sm font-black ${getColorCalificacion(evaluacion.criterios[criterio] * 20)}`}>
                                                {evaluacion.criterios[criterio]} - {getEscalaLabel(evaluacion.criterios[criterio], "escala")}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => handleCriterioChange(criterio, val)}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                                                        evaluacion.criterios[criterio] === val
                                                            ? 'bg-[#131E5C] text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {formato.tipo === "escala_10" && (
                            <div className="space-y-4">
                                {formato.criterios.map((criterio, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-semibold text-slate-600">
                                                {criterio}
                                            </label>
                                            <span className={`text-sm font-black ${getColorCalificacion(evaluacion.criterios[criterio] * 10)}`}>
                                                {evaluacion.criterios[criterio]} - {getEscalaLabel(evaluacion.criterios[criterio], "escala_10")}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            value={evaluacion.criterios[criterio]}
                                            onChange={(e) => handleCriterioChange(criterio, parseInt(e.target.value))}
                                            className="w-full accent-[#131E5C]"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {formato.tipo === "semanal" && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100">
                                            <th className="p-2 text-left text-[#131E5C]">Indicador</th>
                                            <th className="p-2 text-center text-[#131E5C]">Semana 1</th>
                                            <th className="p-2 text-center text-[#131E5C]">Semana 2</th>
                                            <th className="p-2 text-center text-[#131E5C]">Semana 3</th>
                                            <th className="p-2 text-center text-[#131E5C]">Semana 4</th>
                                            <th className="p-2 text-center text-[#131E5C]">Meta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formato.criterios.map((criterio, idx) => (
                                            <tr key={idx} className="border-b border-slate-100">
                                                <td className="p-2 font-semibold text-slate-700">{criterio.nombre}</td>
                                                {["semana 1", "semana 2", "semana 3", "semana 4"].map(semana => (
                                                    <td key={semana} className="p-2">
                                                        <input
                                                            type="text"
                                                            value={evaluacion.criterios[criterio.nombre]?.semanas[semana] || ''}
                                                            onChange={(e) => handleCriterioChange(criterio.nombre, e.target.value, semana)}
                                                            className="w-24 text-center px-2 py-1 border border-slate-200 rounded-lg focus:border-[#131E5C] focus:outline-none"
                                                            placeholder="Valor"
                                                        />
                                                    </td>
                                                ))}
                                                <td className="p-2 text-center text-emerald-600 font-bold">
                                                    {criterio.meta || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Calificación total */}
                    <div className="bg-gradient-to-r from-[#131E5C] to-[#1E2A7A] rounded-xl p-5 text-white text-center">
                        <div className="text-sm font-bold opacity-80">Calificación total</div>
                        <div className="text-5xl font-black mt-1">{evaluacion.calificacion}%</div>
                        <div className="mt-2 flex items-center justify-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-semibold">{getTextoCalificacion(evaluacion.calificacion)}</span>
                        </div>
                    </div>

                    {/* Comentarios */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Comentarios</label>
                        <textarea
                            rows={3}
                            value={evaluacion.comentarios}
                            onChange={(e) => setEvaluacion({ ...evaluacion, comentarios: e.target.value })}
                            placeholder="Observaciones, áreas de mejora, logros destacados..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-[#131E5C] focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 rounded-b-2xl p-5 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-xl border border-slate-300 px-6 py-2 text-sm font-semibold hover:bg-slate-50 transition">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(evaluacion)}
                        disabled={!evaluacion.evaluador}
                        className="rounded-xl bg-[#131E5C] px-6 py-2 text-sm font-semibold text-white hover:bg-[#131E5C]/85 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Guardar evaluación
                    </button>
                </div>
            </div>
        </div>
    );
}