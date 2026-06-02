import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Reclutamiento from "../Reclutamiento/Reclutamiento";
import Puestos from "../puestos/Puestos";

export default function AdministrativosIndex() {
    const [activeTab, setActiveTab] = useState("reclutamiento");
    const navigate = useNavigate();
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const hasAccess = hasAnyPermission(["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'puestos') {
            setActiveTab("puestos");
        } else {
            setActiveTab("reclutamiento");
        }
    }, [location]);

    if (!hasAccess) {
        navigate("/", { replace: true });
        return null;
    }

    return (
        <div className="w-full">
            {/* Botones redondeados estilo Agenda/Tabla/Gráficas */}
            <div className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setActiveTab("reclutamiento");
                            navigate("/administrativos?tab=reclutamiento");
                        }}
                        className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                            activeTab === "reclutamiento"
                                ? "bg-[#131E5C] text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Reclutamiento
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("puestos");
                            navigate("/administrativos?tab=puestos");
                        }}
                        className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                            activeTab === "puestos"
                                ? "bg-[#131E5C] text-white shadow-md"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        Puestos
                    </button>
                </div>
            </div>

            {/* Contenido según pestaña */}
            {activeTab === "reclutamiento" ? <Reclutamiento /> : <Puestos />}
        </div>
    );
}