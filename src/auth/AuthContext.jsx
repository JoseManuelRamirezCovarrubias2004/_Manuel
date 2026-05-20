// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API =
    //import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem("auth");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setToken(parsed.token ?? null);
                setUser(parsed.user ?? null);
            } catch {
                localStorage.removeItem("auth");
            }
        } else {
            const legacy = localStorage.getItem("auth.access");
            if (legacy) setToken(legacy);
        }
        setReady(true);
    }, []);

    // ✅ refresca el usuario cuando hay token (por si cambias rol/permisos)
    useEffect(() => {
        const run = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API}/conformidad/api/auth/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                setUser(data);
                localStorage.setItem("auth", JSON.stringify({ token, user: data }));
                localStorage.setItem("auth.access", token);
            } catch { }
        };
        run();
    }, [token]);

    const login = ({ token, user }) => {
        setToken(token);
        setUser(user);
        localStorage.setItem("auth", JSON.stringify({ token, user }));
        localStorage.setItem("auth.access", token);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth");
        localStorage.removeItem("auth.access");
    };

    const isAuthenticated = !!token;

    // ✅ helper de permisos (para UI)
    const hasPermission = (perm) => {
        const permisos = user?.permisos || [];
        return permisos.includes("ALL") || permisos.includes(perm);
    };

    const hasAnyPermission = (anyOf = []) => {
        const permisos = user?.permisos || [];
        if (permisos.includes("ALL")) return true;
        return anyOf.some((p) => permisos.includes(p));
    };

    const value = useMemo(
        () => ({ token, user, isAuthenticated, ready, login, logout, hasPermission, hasAnyPermission }),
        [token, user, isAuthenticated, ready]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
    return ctx;
}
