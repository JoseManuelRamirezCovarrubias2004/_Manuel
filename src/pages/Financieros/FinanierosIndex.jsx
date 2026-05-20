import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function ComercialIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        if (hasAnyPermission(["CRM_DIGITALES", "CRM_FINANCIEROS", "USUARIOS_ADMIN"])) {
            navigate("/financieros/credito", { replace: true });
            return;
        }
        if (hasAnyPermission(["CRM_VENTAS", "CRM_FINANCIEROS",])) {
            navigate("/financieros/long_drive", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}