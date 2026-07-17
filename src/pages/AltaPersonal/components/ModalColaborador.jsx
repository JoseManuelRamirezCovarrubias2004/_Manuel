import React, { useState } from "react";
import { X, UserPlus, Calendar } from "lucide-react";

export default function ModalColaborador({ open, onClose, onGuardar }) {
    const [formulario, setFormulario] = useState({
        nombre: "",
        puesto: "",
        fechaAlta: "",
        fechaBaja: "",
        indicadores: "",
        planAccion: "",
        seguimiento: ""
    });

    const handleChange = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

   const guardar = () => {

    onGuardar(formulario);

    setFormulario({
        nombre: "",
        puesto: "",
        fechaAlta: "",
        fechaBaja: "",
        indicadores: "",
        planAccion: "",
        seguimiento: ""
    });

    onClose();
};
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-[#131E5C] text-white px-6 py-4 flex justify-between items-center">

                    <div className="flex items-center gap-3">

                        <div className="bg-white/20 p-2 rounded-full">
                            <UserPlus size={20} />
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold">
                                Nuevo Colaborador
                            </h2>

                            <p className="text-xs text-blue-100">
                                Registro de personal
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-2 rounded-full transition"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Información */}
                    <div className="bg-slate-50 rounded-xl p-5 border">

                        <h3 className="font-semibold text-[#131E5C] mb-4">
                            Información del colaborador
                        </h3>

                        <div className="space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nombre Completo
                                </label>

                                <input
                                    type="text"
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Puesto
                                </label>

                                <input
                                    type="text"
                                    name="puesto"
                                    value={formulario.puesto}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fecha Alta
                                    </label>

                                    <div className="relative">

                                        <Calendar
                                            size={18}
                                            className="absolute left-3 top-3 text-slate-400"
                                        />

                                        <input
                                            type="date"
                                            name="fechaAlta"
                                            value={formulario.fechaAlta}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                        />

                                    </div>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fecha Baja
                                    </label>

                                    <div className="relative">

                                        <Calendar
                                            size={18}
                                            className="absolute left-3 top-3 text-slate-400"
                                        />

                                        <input
                                            type="date"
                                            name="fechaBaja"
                                            value={formulario.fechaBaja}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                    {/* Clima */}
                    <div className="bg-slate-50 rounded-xl p-5 border">

                        <h3 className="font-semibold text-[#131E5C] mb-4">
                            Clima Laboral
                        </h3>

                        <div className="grid grid-cols-3 gap-4">

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Indicadores
                                </label>

                                <textarea
                                    rows={2}
                                    name="indicadores"
                                    value={formulario.indicadores}
                                    onChange={handleChange}
                                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Plan de Acción
                                </label>

                                <textarea
                                    rows={2}
                                    name="planAccion"
                                    value={formulario.planAccion}
                                    onChange={handleChange}
                                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />

                            </div>

                            <div>

                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Seguimiento
                                </label>

                                <textarea
                                    rows={2}
                                    name="seguimiento"
                                    value={formulario.seguimiento}
                                    onChange={handleChange}
                                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* Footer */}
                <div className="bg-slate-100 px-6 py-4 flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-200 transition"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={guardar}
                        className="px-6 py-2 rounded-lg bg-[#131E5C] text-white hover:bg-[#0f1748] transition"
                    >
                        Guardar
                    </button>

                </div>

            </div>

        </div>
    );
}