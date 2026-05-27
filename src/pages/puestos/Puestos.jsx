import { useState } from 'react';
import EvaluacionView from './EvaluacionView';
import ListaPuestosView from './ListaPuestosView';

export default function Puestos() {
    const [activeTab, setActiveTab] = useState('evaluacion');

    return (
        <div className="w-full">
            {/* Pestañas superiores */}
            <div className="border-b border-slate-200 bg-white px-4 sticky top-0 z-10">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('evaluacion')}
                        className={`pb-3 pt-4 text-sm font-semibold transition-all ${
                            activeTab === 'evaluacion'
                                ? 'border-b-2 border-[#131E5C] text-[#131E5C]'
                                : 'text-slate-500 hover:text-[#131E5C]'
                        }`}
                    >
                        Evaluación de puestos
                    </button>
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`pb-3 pt-4 text-sm font-semibold transition-all ${
                            activeTab === 'lista'
                                ? 'border-b-2 border-[#131E5C] text-[#131E5C]'
                                : 'text-slate-500 hover:text-[#131E5C]'
                        }`}
                    >
                        Lista de puestos
                    </button>
                </div>
            </div>

            {/* Contenido según pestaña */}
            {activeTab === 'evaluacion' ? <EvaluacionView /> : <ListaPuestosView />}
        </div>
    );
}