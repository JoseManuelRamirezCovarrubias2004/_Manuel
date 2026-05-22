//src/auth/RequirePermission.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequirePermission({ anyOf = [], children }) {
    const { user } = useAuth();
    const location = useLocation();

    if (!anyOf.length) return children;

    const permisos = user?.permisos || [];
    const ok = permisos.includes("ALL") || anyOf.some((p) => permisos.includes(p));

    if (!ok) return <Navigate to="/" state={{ from: location }} replace />;
    return children;
}
