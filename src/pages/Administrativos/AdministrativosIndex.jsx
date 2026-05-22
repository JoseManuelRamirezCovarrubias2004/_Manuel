import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function AdministrativosIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        if (hasAnyPermission(["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"])) {
            navigate("/administrativos/reclutamiento", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}