// src/pages/Settings.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

function Section({ title, desc, icon: Icon, children }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[#131E5C]">
                <h2 className="flex items-center gap-2 text-2xl font-vw-header">
                    {Icon ? <Icon className="text-[#131E5C]" size={18} /> : null}
                    {title}
                </h2>
                <p className="mt-1 text-base">{desc}</p>
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

function AgenciaCheckbox({ checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="h-4 w-4"
            />
            <span className="text-sm font-semibold text-slate-800">{label}</span>
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

    const [roles, setRoles] = useState([]);
    const [selectedRolId, setSelectedRolId] = useState("");

    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombre: "",
        apellidos: "",
        usuario: "",
        correo: "",
        contrasena: "",
        agencia: "",
        id_rol: "",
    });

    const [agenciasSeleccionadas, setAgenciasSeleccionadas] = useState([]);

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(""), 3500);
    };

    useEffect(() => {
        const cargarDatos = async () => {
            if (!token) return;

            setLoading(true);

            try {
                const res = await fetch(`${API}/conformidad/api/admin/roles/`, {
                    headers: authHeaders,
                });

                if (!res.ok) {
                    throw new Error("No se pudieron cargar los roles.");
                }

                const dataRoles = await res.json();
                const rolesList = Array.isArray(dataRoles) ? dataRoles : [];

                setRoles(rolesList);

                if (rolesList.length > 0) {
                    const firstId = String(rolesList[0].id_rol);

                    setSelectedRolId(firstId);
                    setNuevoUsuario((prev) => ({
                        ...prev,
                        id_rol: firstId,
                    }));
                }
            } catch (error) {
                console.error(error);
                showMsg(error.message || "Error cargando datos.");
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [token, authHeaders]);

    const toggleAgencia = (agencia) => {
        setAgenciasSeleccionadas((prev) => {
            if (prev.includes(agencia)) {
                return prev.filter((item) => item !== agencia);
            }

            return [...prev, agencia];
        });
    };

    const limpiarFormulario = () => {
        setNuevoUsuario({
            nombre: "",
            apellidos: "",
            usuario: "",
            correo: "",
            contrasena: "",
            agencia: "",
            id_rol: selectedRolId || "",
        });

        setAgenciasSeleccionadas([]);
    };

    const crearUsuario = async (e) => {
        e.preventDefault();

        const usuarioLimpio = String(nuevoUsuario.usuario || "").trim();
        const agenciaFinal = agenciasSeleccionadas.join("|");

        if (!nuevoUsuario.id_rol) return showMsg("Selecciona un rol.");
        if (agenciasSeleccionadas.length === 0) return showMsg("Selecciona al menos una agencia.");
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
                    agencia: agenciaFinal,
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
            limpiarFormulario();
        } catch (error) {
            console.error(error);
            showMsg(error.message || "Error creando usuario.");
        } finally {
            setLoading(false);
        }
    };

    if (!isAdminUI) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="text-lg font-extrabold text-slate-900">Sin acceso</div>
                    <div className="mt-2 text-sm text-slate-600">
                        Tu cuenta no tiene permisos para administrar configuración/usuarios.
                    </div>

                    <Link
                        to="/"
                        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                        <ArrowLeft size={14} />
                        Volver
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
            <div className="flex items-center justify-between gap-3">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                    <ArrowLeft size={14} />
                    Volver
                </Link>

                {msg ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                        {msg}
                    </div>
                ) : (
                    <div />
                )}
            </div>

            <Section title="Gestión de usuarios" desc="Crear usuarios y asignar agencias." icon={Users}>
                <form onSubmit={crearUsuario} className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:col-span-2">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input
                                label="Nombre(s)"
                                value={nuevoUsuario.nombre}
                                onChange={(e) =>
                                    setNuevoUsuario((prev) => ({
                                        ...prev,
                                        nombre: e.target.value,
                                    }))
                                }
                                placeholder="Canelo"
                            />

                            <Input
                                label="Apellidos"
                                value={nuevoUsuario.apellidos}
                                onChange={(e) =>
                                    setNuevoUsuario((prev) => ({
                                        ...prev,
                                        apellidos: e.target.value,
                                    }))
                                }
                                placeholder="Pérez"
                            />

                            <Input
                                label="Usuario"
                                value={nuevoUsuario.usuario}
                                onChange={(e) =>
                                    setNuevoUsuario((prev) => ({
                                        ...prev,
                                        usuario: e.target.value,
                                    }))
                                }
                                placeholder="máx 10 caracteres"
                            />

                            <Input
                                label="Correo"
                                type="email"
                                value={nuevoUsuario.correo}
                                onChange={(e) =>
                                    setNuevoUsuario((prev) => ({
                                        ...prev,
                                        correo: e.target.value,
                                    }))
                                }
                                placeholder="correo@gmail.com"
                            />

                            <Input
                                label="Contraseña"
                                type="password"
                                value={nuevoUsuario.contrasena}
                                onChange={(e) =>
                                    setNuevoUsuario((prev) => ({
                                        ...prev,
                                        contrasena: e.target.value,
                                    }))
                                }
                                placeholder="••••••••"
                            />

                            <Select
                                label="Rol"
                                value={nuevoUsuario.id_rol}
                                onChange={(e) => {
                                    setSelectedRolId(e.target.value);
                                    setNuevoUsuario((prev) => ({
                                        ...prev,
                                        id_rol: e.target.value,
                                    }));
                                }}
                            >
                                <option value="">Selecciona rol...</option>
                                {roles.map((rol) => (
                                    <option key={rol.id_rol} value={String(rol.id_rol)}>
                                        {rol.nombre}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 text-xs font-semibold text-slate-700">
                                Agencias
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {DEALERS.map((dealer) => (
                                    <AgenciaCheckbox
                                        key={dealer}
                                        label={dealer}
                                        checked={agenciasSeleccionadas.includes(dealer)}
                                        onChange={() => toggleAgencia(dealer)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-base font-semibold text-slate-900">
                            Acciones
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                            <Plus size={14} />
                            {loading ? "Guardando..." : "Crear usuario"}
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