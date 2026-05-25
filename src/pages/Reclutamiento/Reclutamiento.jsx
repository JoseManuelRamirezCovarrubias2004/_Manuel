import { useState } from 'react';
import VacantesView from './VacantesView';
import PlanCapacitacion from './PlanCapacitacion';

export default function Reclutamiento() {
    const [activeTab, setActiveTab] = useState('vacantes');

    return (
        <div className="w-full">
            {/* Pestañas superiores */}
            <div className="border-b border-slate-200 bg-white px-4">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('vacantes')}
                        className={`pb-3 pt-4 text-sm font-semibold transition-all ${
                            activeTab === 'vacantes'
                                ? 'border-b-2 border-[#131E5C] text-[#131E5C]'
                                : 'text-slate-500 hover:text-[#131E5C]'
                        }`}
                    >
                        Vacantes
                    </button>
                    <button
                        onClick={() => setActiveTab('capacitacion')}
                        className={`pb-3 pt-4 text-sm font-semibold transition-all ${
                            activeTab === 'capacitacion'
                                ? 'border-b-2 border-[#131E5C] text-[#131E5C]'
                                : 'text-slate-500 hover:text-[#131E5C]'
                        }`}
                    >
                        Plan de Capacitación
                    </button>
                </div>
            </div>

            {/* Contenido según pestaña */}
            {activeTab === 'vacantes' ? <VacantesView /> : <PlanCapacitacion />}
        </div>
    );
}