import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function ComercialIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        // Preferencia de landing:
        // 1) si tiene CRM_DIGITALES => prospectos
        // 2) si tiene CRM_VENTAS => citas
        // 3) si admin => prospectos
        if (hasAnyPermission(["CRM_DIGITALES", "USUARIOS_ADMIN"])) {
            navigate("/comercial/prospectos", { replace: true });
            return;
        }
        if (hasAnyPermission(["CRM_VENTAS"])) {
            navigate("/comercial/citas", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}