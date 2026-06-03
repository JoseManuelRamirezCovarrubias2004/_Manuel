// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AuthContext = createContext(null);

function normalizarTexto(valor) {
    return String(valor || "").trim().toLowerCase();
}

function getUserAgenciasFromUser(user) {
    const agencia = user?.agencia || "";

    return String(agencia)
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean);
}

function userTieneAgenciaFromUser(user, agenciaRegistro) {
    const agenciasUsuario = getUserAgenciasFromUser(user).map(normalizarTexto);
    const agenciaActual = normalizarTexto(agenciaRegistro);

    if (!agenciaActual) return false;

    return agenciasUsuario.includes(agenciaActual);
}

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

    useEffect(() => {
        const refrescarUsuario = async () => {
            if (!token) return;

            try {
                const res = await fetch(`${API}/conformidad/api/auth/me/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) return;

                const data = await res.json();

                setUser(data);
                localStorage.setItem("auth", JSON.stringify({ token, user: data }));
                localStorage.setItem("auth.access", token);
            } catch {
                // No cerramos sesión aquí para no sacar al usuario por fallos temporales de red.
            }
        };

        refrescarUsuario();
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

    const hasPermission = (perm) => {
        const permisos = user?.permisos || [];
        return permisos.includes("ALL") || permisos.includes(perm);
    };

    const hasAnyPermission = (anyOf = []) => {
        const permisos = user?.permisos || [];

        if (permisos.includes("ALL")) return true;

        return anyOf.some((permiso) => permisos.includes(permiso));
    };

    const getUserAgencias = () => {
        return getUserAgenciasFromUser(user);
    };

    const userTieneAgencia = (agenciaRegistro) => {
        return userTieneAgenciaFromUser(user, agenciaRegistro);
    };

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated,
            ready,
            login,
            logout,
            hasPermission,
            hasAnyPermission,
            getUserAgencias,
            userTieneAgencia,
        }),
        [token, user, isAuthenticated, ready]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider />");
    }

    return ctx;
}