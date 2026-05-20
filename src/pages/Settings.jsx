// src/pages/Settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, Users, Plus, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Mantén el mismo catálogo que usas en registro
const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

function Section({ title, desc, icon: Icon, children }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="text-[#131E5C]">
                    <h2 className="flex items-center gap-2  text-2xl font-vw-header">
                        {Icon ? <Icon className="text-[#131E5C]" size={18} /> : null}
                        {title}
                    </h2>
                    <p className="mt-1 text-base">{desc}</p>
                </div>
            </div>
            <div className="mt-4">{children}</div>
        </div>
    );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
    return (
        <label className="block">
            <div className="mb-1 text-xs font-semibold text-slate-700">{label}</div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            />
        </label>
    );
}

function Select({ label, value, onChange, children }) {
    return (
        <label className="block">
            <div className="mb-1 text-xs font-semibold text-slate-700">{label}</div>
            <select
                value={value}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10"
            >
                {children}
            </select>
        </label>
    );
}

function Checkbox({ checked, onChange, label, desc }) {
    return (
        <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="mt-1 h-4 w-4"
            />
            <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">{label}</div>
                {desc ? <div className="text-xs text-slate-600">{desc}</div> : null}
            </div>
        </label>
    );
}

export default function Settings() {
    const { token, user } = useAuth();

    const isAdminUI = useMemo(() => {
        const permisos = user?.permisos || [];
        return permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const authHeaders = useMemo(() => {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }, [token]);

    // Data
    const [roles, setRoles] = useState([]);
    const [permisos, setPermisos] = useState([]);

    // Estado para asignación por rol
    const [selectedRolId, setSelectedRolId] = useState("");
    const [rolPermisos, setRolPermisos] = useState([]); // array de claves seleccionadas

    // Form crear usuario
    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombre: "",
        apellidos: "",
        usuario: "",
        correo: "",
        contrasena: "",
        agencia: "",
        id_rol: "",
    });

    // UI
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(""), 3500);
    };

    // Carga inicial de roles y permisos
    useEffect(() => {
        const run = async () => {
            if (!token) return;

            setLoading(true);
            try {
                const [rRoles, rPerm] = await Promise.all([
                    fetch(`${API}/conformidad/api/admin/roles/`, { headers: authHeaders }),
                    fetch(`${API}/conformidad/api/admin/permisos/`, { headers: authHeaders }),
                ]);

                if (!rRoles.ok) throw new Error("No se pudieron cargar roles.");
                if (!rPerm.ok) throw new Error("No se pudieron cargar permisos.");

                const dataRoles = await rRoles.json();
                const dataPerm = await rPerm.json();

                setRoles(Array.isArray(dataRoles) ? dataRoles : []);
                setPermisos(Array.isArray(dataPerm) ? dataPerm : []);

                // default: primer rol
                if (Array.isArray(dataRoles) && dataRoles.length > 0) {
                    const firstId = String(dataRoles[0].id_rol);
                    setSelectedRolId(firstId);
                    setNuevoUsuario((p) => ({ ...p, id_rol: firstId }));
                }
            } catch (e) {
                console.error(e);
                showMsg(e.message || "Error cargando datos.");
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [token, authHeaders]);

    useEffect(() => {
        setRolPermisos([]);
    }, [selectedRolId]);

    const togglePermiso = (clave) => {
        setRolPermisos((prev) => {
            if (prev.includes(clave)) return prev.filter((x) => x !== clave);
            return [...prev, clave];
        });
    };

    const guardarPermisosRol = async () => {
        if (!selectedRolId) return showMsg("Selecciona un rol.");
        setLoading(true);
        try {
            const res = await fetch(
                `${API}/conformidad/api/admin/roles/${selectedRolId}/permisos/`,
                {
                    method: "PUT",
                    headers: authHeaders,
                    body: JSON.stringify({ permisos: rolPermisos }),
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.detail || "No se pudieron guardar permisos.");

            showMsg("Permisos actualizados ✅");
        } catch (e) {
            console.error(e);
            showMsg(e.message || "Error guardando permisos.");
        } finally {
            setLoading(false);
        }
    };

    const crearUsuario = async (e) => {
        e.preventDefault();

        const usuarioLimpio = (nuevoUsuario.usuario || "").trim();

        if (!nuevoUsuario.id_rol) return showMsg("Selecciona un rol.");
        if (!nuevoUsuario.agencia) return showMsg("Selecciona una agencia.");
        if (!usuarioLimpio) return showMsg("Captura el usuario.");
        if (usuarioLimpio.length > 10) {
            return showMsg("El campo usuario no puede tener más de 10 caracteres.");
        }

        setLoading(true);

        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                    ...nuevoUsuario,
                    usuario: usuarioLimpio,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo crear el usuario.";

                if (errores && typeof errores === "object") {
                    const partes = [];

                    for (const [campo, valor] of Object.entries(errores)) {
                        if (Array.isArray(valor)) {
                            partes.push(`${campo}: ${valor.join(", ")}`);
                        } else if (typeof valor === "string") {
                            partes.push(`${campo}: ${valor}`);
                        }
                    }

                    if (partes.length) {
                        mensaje = partes.join(" | ");
                    }
                }

                throw new Error(mensaje);
            }

            showMsg("Usuario creado ✅");

            setNuevoUsuario({
                nombre: "",
                apellidos: "",
                usuario: "",
                correo: "",
                contrasena: "",
                agencia: "",
                id_rol: selectedRolId || "",
            });
        } catch (e) {
            console.error(e);
            showMsg(e.message || "Error creando usuario.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAdminUI) {
        return (
            <div className="max-w-4xl mx-auto py-10 px-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-lg font-extrabold text-slate-900">Sin acceso</div>
                    <div className="mt-2 text-sm text-slate-600">
                        Tu cuenta no tiene permisos para administrar configuración/usuarios.
                    </div>
                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                        <ArrowLeft size={14} /> Volver
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto py-10 px-4">
            <div className="flex items-center justify-between gap-3">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                    <ArrowLeft size={14} /> Volver
                </Link>

                {msg ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                        {msg}
                    </div>
                ) : (
                    <div />
                )}
            </div>

            {/* Crear usuario */}
            <Section
                title="Gestion de usuarios"
                desc="Usuarios"
                icon={Users}
            >
                <form onSubmit={crearUsuario} className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:col-span-2">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input
                                label="Nombre(s)"
                                value={nuevoUsuario.nombre}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, nombre: e.target.value }))}
                                placeholder="Canelo"
                            />
                            <Input
                                label="Apellidos"
                                value={nuevoUsuario.apellidos}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, apellidos: e.target.value }))}
                                placeholder="Perez"
                            />
                            <Input
                                label="Usuario"
                                value={nuevoUsuario.usuario}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, usuario: e.target.value }))}
                                placeholder="max 10 caracteres"
                            />
                            <Input
                                label="Correo"
                                type="email"
                                value={nuevoUsuario.correo}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, correo: e.target.value }))}
                                placeholder="correo@gmail.com"
                            />
                            <Input
                                label="Contraseña"
                                type="password"
                                value={nuevoUsuario.contrasena}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, contrasena: e.target.value }))}
                                placeholder="••••••••"
                            />

                            <Select
                                label="Agencia"
                                value={nuevoUsuario.agencia}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, agencia: e.target.value }))}
                            >
                                <option value="">Selecciona una agencia...</option>
                                {DEALERS.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                label="Rol"
                                value={nuevoUsuario.id_rol}
                                onChange={(e) => setNuevoUsuario((p) => ({ ...p, id_rol: e.target.value }))}
                            >
                                <option value="">Selecciona rol...</option>
                                {roles.map((r) => (
                                    <option key={r.id_rol} value={String(r.id_rol)}>
                                        {r.nombre}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-base font-semibold text-slate-900">Acciones</div>
                        <p className="mt-1 text-sm text-slate-600">
                            El rol definido a cada usuario gestiona lo que ve en el menu principal.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                            <Plus size={14} /> Crear usuario
                        </button>
                    </div>
                </form>
            </Section>

            {loading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    Cargando...
                </div>
            ) : null}
        </div>
    );
}
