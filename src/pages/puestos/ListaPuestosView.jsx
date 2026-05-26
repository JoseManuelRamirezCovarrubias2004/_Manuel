import { useState, useEffect } from 'react';
import { Search, CheckCircle } from 'lucide-react';

// Datos de puestos con su jerarquía (quién depende de quién)
const PUESTOS_JERARQUIA = [
    // === VENTAS ===
    { id: 1, nombre: "Gerente de Ventas", dependeDe: "Gerente General", categoria: "Ventas" },
    { id: 2, nombre: "Asesor de Ventas Nuevos", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 3, nombre: "Asesor de Ventas Seminuevos", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 4, nombre: "Asistente de Ventas", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 5, nombre: "Servicios Financieros", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 6, nombre: "Coordinador de AFASA", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 7, nombre: "Asesor de Ventas Digitales", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 8, nombre: "Coordinador de Ventas Digitales", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 9, nombre: "Valuador de Seminuevos", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    { id: 10, nombre: "Especialista de Entregas", dependeDe: "Gerente de Ventas", categoria: "Ventas" },
    
    // === SERVICIO ===
    { id: 11, nombre: "Gerente de Servicio", dependeDe: "Gerente General", categoria: "Servicio" },
    { id: 12, nombre: "Asesor de Servicio", dependeDe: "Gerente de Servicio", categoria: "Servicio" },
    { id: 13, nombre: "Asistente de Servicio", dependeDe: "Gerente de Servicio", categoria: "Servicio" },
    { id: 14, nombre: "Administrador de Garantía", dependeDe: "Gerente de Servicio", categoria: "Servicio" },
    { id: 15, nombre: "Jefe de Taller", dependeDe: "Gerente de Servicio", categoria: "Servicio" },
    { id: 16, nombre: "Técnico Mecánico", dependeDe: "Jefe de Taller", categoria: "Servicio" },
    { id: 17, nombre: "Técnico Master", dependeDe: "Jefe de Taller", categoria: "Servicio" },
    { id: 18, nombre: "Control de Calidad", dependeDe: "Gerente de Servicio", categoria: "Servicio" },
    
    // === REFACCIONES ===
    { id: 19, nombre: "Gerente de Refacciones", dependeDe: "Gerente General", categoria: "Refacciones" },
    { id: 20, nombre: "Asesor Refacciones Mostrador Taller", dependeDe: "Gerente de Refacciones", categoria: "Refacciones" },
    { id: 21, nombre: "Asesor Refacciones Mostrador Público", dependeDe: "Gerente de Refacciones", categoria: "Refacciones" },
    { id: 22, nombre: "Asesor Refacciones Promotoría NORA", dependeDe: "Gerente de Refacciones", categoria: "Refacciones" },
    { id: 23, nombre: "Encargado de Almacén", dependeDe: "Gerente de Refacciones", categoria: "Refacciones" },
    
    // === POSTVENTA ===
    { id: 24, nombre: "Gerente de Postventa", dependeDe: "Gerente General", categoria: "Postventa" },
    { id: 25, nombre: "Gerente de Postventa Grupo", dependeDe: "Gerente General", categoria: "Postventa" },
    { id: 26, nombre: "Preparador", dependeDe: "Gerente de Postventa", categoria: "Postventa" },
    { id: 27, nombre: "Técnico Hojalatero", dependeDe: "Gerente de Postventa", categoria: "Postventa" },
    { id: 28, nombre: "Técnico Pintor", dependeDe: "Gerente de Postventa", categoria: "Postventa" },
    
    // === HYP ===
    { id: 29, nombre: "Gerente de HYP", dependeDe: "Gerente General", categoria: "HYP" },
    { id: 30, nombre: "Asesor de HYP", dependeDe: "Gerente de HYP", categoria: "HYP" },
    
    // === ADMINISTRACIÓN ===
    { id: 31, nombre: "Gerente General", dependeDe: null, categoria: "Administración" },
    { id: 32, nombre: "Cajera", dependeDe: "Gerente General", categoria: "Administración" },
    { id: 33, nombre: "Auxiliar Contable", dependeDe: "Contador General", categoria: "Administración" },
    { id: 34, nombre: "Contador General", dependeDe: "Gerente General", categoria: "Administración" },
    { id: 35, nombre: "Contador Fiscal", dependeDe: "Contador General", categoria: "Administración" },
    { id: 36, nombre: "Auditor Interno", dependeDe: "Gerente General", categoria: "Administración" },
    { id: 37, nombre: "Oficial de Cumplimiento", dependeDe: "Gerente General", categoria: "Administración" },
    { id: 38, nombre: "Contador General de Fondos y Valores", dependeDe: "Contador General", categoria: "Administración" },
    
    // === OPERACIONES ===
    { id: 39, nombre: "Lavador", dependeDe: "Jefe de Taller", categoria: "Operaciones" },
    { id: 40, nombre: "Hostess", dependeDe: "Gerente General", categoria: "Operaciones" },
    { id: 41, nombre: "Contact Center", dependeDe: "Gerente General", categoria: "Operaciones" },
    { id: 42, nombre: "Trasladista", dependeDe: "Gerente General", categoria: "Operaciones" },
    { id: 43, nombre: "Afanador", dependeDe: "Gerente General", categoria: "Operaciones" },
    { id: 44, nombre: "Vigilancia", dependeDe: "Gerente General", categoria: "Operaciones" },
    
    // === MARKETING ===
    { id: 45, nombre: "Gerente de Marketing", dependeDe: "Gerente General", categoria: "Marketing" },
    { id: 46, nombre: "Coordinador de Marketing", dependeDe: "Gerente de Marketing", categoria: "Marketing" },
    { id: 47, nombre: "Consultor de Procesos", dependeDe: "Gerente General", categoria: "Marketing" },
    { id: 48, nombre: "Auxiliar de Diseño y Producción", dependeDe: "Gerente de Marketing", categoria: "Marketing" },
    
    // === CALIDAD ===
    { id: 49, nombre: "Gerente de Calidad", dependeDe: "Gerente General", categoria: "Calidad" },
    
    // === SISTEMAS ===
    { id: 50, nombre: "Sistemas", dependeDe: "Gerente General", categoria: "Sistemas" },
    { id: 51, nombre: "Analista de Datos y Programación", dependeDe: "Sistemas", categoria: "Sistemas" },
    
    // === RECURSOS HUMANOS ===
    { id: 52, nombre: "Desarrollo Organizacional", dependeDe: "Gerente General", categoria: "Recursos Humanos" },
    { id: 53, nombre: "Desarrollo Organizacional Grupo", dependeDe: "Gerente General", categoria: "Recursos Humanos" },
    { id: 54, nombre: "Recursos Humanos Divisional", dependeDe: "Gerente General", categoria: "Recursos Humanos" },
    
    // === FINANZAS ===
    { id: 55, nombre: "Crédito y Cobranza Divisional", dependeDe: "Gerente General", categoria: "Finanzas" },
];

export default function ListaPuestosView() {
    const [puestos, setPuestos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
    const [checkedItems, setCheckedItems] = useState({});

    useEffect(() => {
        // Cargar puestos desde localStorage o usar datos jerárquicos
        const puestosGuardados = localStorage.getItem('puestos_jerarquia');
        if (puestosGuardados) {
            setPuestos(JSON.parse(puestosGuardados));
        } else {
            setPuestos(PUESTOS_JERARQUIA);
        }
        
        // Cargar checklist guardado
        const checklistGuardado = localStorage.getItem('puestos_checklist');
        if (checklistGuardado) {
            setCheckedItems(JSON.parse(checklistGuardado));
        }
    }, []);

    // Guardar checklist cuando cambie
    useEffect(() => {
        localStorage.setItem('puestos_checklist', JSON.stringify(checkedItems));
    }, [checkedItems]);

    const handleCheck = (id) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const categorias = ["Todos", ...new Set(puestos.map(p => p.categoria))];

    const puestosFiltrados = puestos.filter(puesto => {
        if (searchTerm && !puesto.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (categoriaFiltro !== 'Todos' && puesto.categoria !== categoriaFiltro) return false;
        return true;
    });

    const stats = {
        total: puestos.length,
        completados: Object.values(checkedItems).filter(v => v === true).length,
        categorias: new Set(puestos.map(p => p.categoria)).size,
    };

    return (
        <div className="w-full p-4">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Organigrama de Puestos</h2>
                <p className="text-sm text-gray-500 mt-1">Relación jerárquica de puestos y seguimiento de competencias</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-[#131E5C]">{stats.total}</div>
                    <div className="text-xs text-gray-400">Total puestos</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-emerald-600">{stats.categorias}</div>
                    <div className="text-xs text-gray-400">Categorías</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-blue-600">{puestosFiltrados.length}</div>
                    <div className="text-xs text-gray-400">Mostrando</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="text-2xl font-bold text-amber-600">{stats.completados}</div>
                    <div className="text-xs text-gray-400">Competencias marcadas</div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre del puesto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#131E5C] focus:outline-none"
                        />
                    </div>
                    <select
                        value={categoriaFiltro}
                        onChange={(e) => setCategoriaFiltro(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#131E5C] focus:outline-none"
                    >
                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* Tabla tipo checklist */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-12">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Puesto</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Depende de</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-24">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {puestosFiltrados.map((puesto, idx) => (
                                <tr key={puesto.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-gray-400 text-sm">{idx + 1}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800">{puesto.nombre}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {puesto.dependeDe || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleCheck(puesto.id)}
                                            className="flex justify-center items-center w-full"
                                        >
                                            {checkedItems[puesto.id] ? (
                                                <CheckCircle className="h-5 w-5 text-emerald-500 hover:text-emerald-600 transition" />
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-[#131E5C] transition" />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {puestosFiltrados.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No hay puestos que coincidan con los filtros.</div>
                )}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                Mostrando {puestosFiltrados.length} de {puestos.length} puestos
                {stats.completados > 0 && ` • ${stats.completados} competencias marcadas`}
            </div>
        </div>
    );
}