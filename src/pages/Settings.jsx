// src/pages/Settings.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
];

// ─── Helpers visuales ────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    { bg: "#e6f1fb", text: "#0c447c" },
    { bg: "#eaf3de", text: "#27500a" },
    { bg: "#faeeda", text: "#633806" },
    { bg: "#fbeaf0", text: "#721f3e" },
    { bg: "#f1efe8", text: "#444441" },
];

function getInitials(u) {
    return ((u.nombre?.[0] ?? "") + (u.apellidos?.[0] ?? "")).toUpperCase();
}

function getAvatarColor(id) {
    return AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
}

// ─── Componentes de formulario ───────────────────────────────────────────────
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

function Input({ label, value, onChange, type = "text", placeholder, disabled = false }) {
    return (
        <label className="block">
            <div className="mb-1 text-xs font-semibold text-slate-700">{label}</div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50"
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
            <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4" />
            <span className="text-sm font-semibold text-slate-800">{label}</span>
        </label>
    );
}

// ─── Avatar inline ────────────────────────────────────────────────────────────
function Avatar({ user, size = 32 }) {
    const color = getAvatarColor(user.id);
    if (user.foto_url || user.photo) {
        return (
            <img
                src={user.foto_url || user.photo}
                alt={user.nombre}
                style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: color.bg, color: color.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.35, fontWeight: 600, flexShrink: 0,
        }}>
            {getInitials(user)}
        </div>
    );
}

// ─── MODAL DE EDICIÓN DE USUARIO ──────────────────────────────────────────────
function UserModal({ user, roles, token, onClose, onSaved }) {
    const isNew = !user?.id;

    const [form, setForm] = useState({
        nombre:    user?.nombre    ?? "",
        apellidos: user?.apellidos ?? "",
        usuario:   user?.usuario   ?? "",
        correo:    user?.correo    ?? "",
        id_rol:    user?.id_rol    ?? "",
        estado:    user?.estado    ?? "Activo",
        agencies:  user?.agencies  ?? [],
    });
    const [foto, setFoto]             = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user?.foto_url ?? null);
    const [password, setPassword]     = useState("");
    const [password2, setPassword2]   = useState("");
    const [showP, setShowP]           = useState(false);
    const [showP2, setShowP2]         = useState(false);
    const [errors, setErrors]         = useState({});
    const [loading, setLoading]       = useState(false);
    const [msg, setMsg]               = useState("");

    function set(field, val) {
        setForm(f => ({ ...f, [field]: val }));
        setErrors(e => ({ ...e, [field]: undefined }));
    }

    function toggleAgency(ag) {
        set("agencies",
            form.agencies.includes(ag)
                ? form.agencies.filter(a => a !== ag)
                : [...form.agencies, ag]
        );
    }

    function handleFoto(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFoto(file);
        setFotoPreview(URL.createObjectURL(file));
    }

    function validate() {
        const errs = {};
        if (!form.nombre.trim())    errs.nombre    = "Requerido";
        if (!form.apellidos.trim()) errs.apellidos = "Requerido";
        if (!form.usuario.trim())   errs.usuario   = "Requerido";
        if (!form.correo.trim())    errs.correo    = "Requerido";
        if (password && password !== password2) errs.password2 = "Las contraseñas no coinciden";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setLoading(true);
        setMsg("");

        const fd = new FormData();
        fd.append("nombre",    form.nombre);
        fd.append("apellidos", form.apellidos);
        fd.append("usuario",   form.usuario);
        fd.append("correo",    form.correo);
        fd.append("id_rol",    form.id_rol);
        fd.append("estado",    form.estado);
        fd.append("agencia",   form.agencies.join("|"));
        if (password) fd.append("contrasena", password);
        if (foto)     fd.append("foto", foto);

        try {
            const url = isNew
                ? `${API}/conformidad/api/admin/usuarios/`
                : `${API}/conformidad/api/admin/usuarios/${user.id}/`;

            const res = await fetch(url, {
                method: isNew ? "POST" : "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo guardar.";
                if (errores && typeof errores === "object") {
                    const partes = [];
                    for (const [campo, valor] of Object.entries(errores)) {
                        partes.push(`${campo}: ${Array.isArray(valor) ? valor.join(", ") : valor}`);
                    }
                    if (partes.length) mensaje = partes.join(" | ");
                }
                throw new Error(mensaje);
            }

            setMsg(isNew ? "✅ Usuario creado" : "✅ Cambios guardados");
            setTimeout(() => {
                onSaved();
                onClose();
            }, 1000);
        } catch (err) {
            setMsg(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const previewUser = { ...user, ...form, foto_url: fotoPreview, id: user?.id ?? 0 };

    return (
        <div
            onClick={e => e.target === e.currentTarget && onClose()}
            style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 200, padding: "1rem",
            }}
        >
            <div style={{
                background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
                maxHeight: "92vh", overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}>
                {/* Header */}
                <div style={{
                    padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    position: "sticky", top: 0, background: "#fff", zIndex: 1,
                }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#131E5C" }}>
                        {isNew ? "Crear usuario" : "Editar usuario"}
                    </span>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888" }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: 20 }}>

                    {/* Foto */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 14, padding: 14,
                        background: "#f8fafc", borderRadius: 12, marginBottom: 20,
                        border: "1px solid #e2e8f0",
                    }}>
                        <Avatar user={previewUser} size={56} />
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: "#1a1a1a" }}>Foto de perfil</p>
                            <p style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>JPG o PNG, máx. 2 MB</p>
                            <label style={{
                                background: "none", border: "1px solid #cbd5e1",
                                padding: "6px 12px", borderRadius: 8, fontSize: 12,
                                cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, color: "#333",
                            }}>
                                📤 Cambiar foto
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
                            </label>
                        </div>
                    </div>

                    {/* Grid campos */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                            ["Nombre(s)", "nombre", "text", "Nombre(s)"],
                            ["Apellidos", "apellidos", "text", "Apellidos"],
                            ["Usuario", "usuario", "text", "usuario"],
                            ["Correo", "correo", "email", "correo@ejemplo.com"],
                        ].map(([label, field, type, ph]) => (
                            <ModalField key={field} label={label} error={errors[field]}>
                                <input
                                    style={mInputStyle(errors[field])}
                                    type={type}
                                    value={form[field]}
                                    onChange={e => set(field, e.target.value)}
                                    placeholder={ph}
                                />
                            </ModalField>
                        ))}

                        <ModalField label="Rol">
                            <select style={mInputStyle()} value={form.id_rol} onChange={e => set("id_rol", e.target.value)}>
                                <option value="">Selecciona rol...</option>
                                {roles.map(r => (
                                    <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</option>
                                ))}
                            </select>
                        </ModalField>

                        <ModalField label="Estado">
                            <select style={mInputStyle()} value={form.estado} onChange={e => set("estado", e.target.value)}>
                                <option>Activo</option>
                                <option>Inactivo</option>
                            </select>
                        </ModalField>
                    </div>

                    {/* Contraseña */}
                    <SectionDivider label="🔒 Cambiar contraseña" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <ModalField label="Nueva contraseña" style={{ gridColumn: "1/-1" }}>
                            <div style={{ position: "relative" }}>
                                <input
                                    style={{ ...mInputStyle(), paddingRight: 36, width: "100%", boxSizing: "border-box" }}
                                    type={showP ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Dejar vacío para no cambiar"
                                />
                                <button onClick={() => setShowP(v => !v)} style={eyeBtn}>{showP ? "🙈" : "👁"}</button>
                            </div>
                        </ModalField>
                        <ModalField label="Confirmar contraseña" error={errors.password2} style={{ gridColumn: "1/-1" }}>
                            <div style={{ position: "relative" }}>
                                <input
                                    style={{ ...mInputStyle(errors.password2), paddingRight: 36, width: "100%", boxSizing: "border-box" }}
                                    type={showP2 ? "text" : "password"}
                                    value={password2}
                                    onChange={e => setPassword2(e.target.value)}
                                    placeholder="Repetir contraseña"
                                />
                                <button onClick={() => setShowP2(v => !v)} style={eyeBtn}>{showP2 ? "🙈" : "👁"}</button>
                            </div>
                        </ModalField>
                    </div>

                    {/* Agencias */}
                    <SectionDivider label="🏢 Agencias asignadas" />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {DEALERS.map(ag => (
                            <label key={ag} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={form.agencies.includes(ag)}
                                    onChange={() => toggleAgency(ag)}
                                />
                                {ag}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "12px 20px", borderTop: "1px solid #e2e8f0",
                    display: "flex", flexDirection: "column", gap: 8,
                    position: "sticky", bottom: 0, background: "#fff",
                }}>
                    {msg && (
                        <p style={{ fontSize: 12, textAlign: "center", fontWeight: 500, color: msg.startsWith("✅") ? "#166534" : "#991b1b" }}>
                            {msg}
                        </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button onClick={onClose} style={btnOutline}>Cancelar</button>
                        <button onClick={handleSave} disabled={loading} style={btnPrimary}>
                            {loading ? "Guardando..." : `✓ ${isNew ? "Crear usuario" : "Guardar cambios"}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-componentes del modal ────────────────────────────────────────────────
function ModalField({ label, error, children, style }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: style?.gridColumn }}>
            <label style={{ fontSize: 12, color: "#555", fontWeight: 500 }}>{label}</label>
            {children}
            {error && <span style={{ fontSize: 11, color: "#991b1b" }}>{error}</span>}
        </div>
    );
}

function SectionDivider({ label }) {
    return (
        <div style={{ margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e2e8f0" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "#666", whiteSpace: "nowrap" }}>{label}</span>
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid #e2e8f0" }} />
        </div>
    );
}

const mInputStyle = (error) => ({
    width: "100%", padding: "8px 10px",
    border: `1px solid ${error ? "#991b1b" : "#cbd5e1"}`,
    borderRadius: 8, fontSize: 13, color: "#1a1a1a",
    background: "#fff", outline: "none", boxSizing: "border-box",
});

const eyeBtn = {
    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#888",
};

const btnPrimary = {
    background: "#131E5C", color: "#fff", border: "none",
    padding: "8px 20px", borderRadius: 8, fontSize: 13,
    cursor: "pointer", fontWeight: 500,
};

const btnOutline = {
    background: "none", border: "1px solid #cbd5e1",
    padding: "7px 14px", borderRadius: 8, fontSize: 13,
    cursor: "pointer", color: "#333",
};

// ─── TABLA DE USUARIOS POR AGENCIA ────────────────────────────────────────────
const ROLE_STYLES = {
    Administrador: { background: "#e6f1fb", color: "#0c447c" },
    Gerente:       { background: "#faeeda", color: "#633806" },
    Vendedor:      { background: "#eaf3de", color: "#27500a" },
};

function RoleBadge({ rol }) {
    const style = ROLE_STYLES[rol] ?? ROLE_STYLES.Vendedor;
    return (
        <span style={{
            ...style, fontSize: 11, padding: "3px 10px",
            borderRadius: 20, display: "inline-block", fontWeight: 500,
        }}>
            {rol}
        </span>
    );
}

function StatusDot({ estado }) {
    const active = estado === "Activo";
    return (
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: active ? "#3b6d11" : "#a32d2d", flexShrink: 0,
            }} />
            {estado}
        </span>
    );
}

function AgencyBlock({ agency, users, onEdit }) {
    const [open, setOpen] = useState(true);
    // Normaliza agencias: el backend las guarda como "VW Cordoba|VW Orizaba"
    const agUsers = users.filter(u => {
        const agencias = Array.isArray(u.agencies)
            ? u.agencies
            : String(u.agencia || "").split("|");
        return agencias.some(a => a.trim() === agency);
    });

    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            {/* Header */}
            <div
                onClick={() => setOpen(v => !v)}
                style={{
                    background: "#131E5C", padding: "10px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", userSelect: "none",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#fff", fontSize: 16 }}>🏢</span>
                    <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{agency}</span>
                    <span style={{
                        background: "rgba(255,255,255,0.2)", color: "#fff",
                        fontSize: 11, padding: "2px 9px", borderRadius: 20,
                    }}>
                        {agUsers.length} usuario{agUsers.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <span style={{
                    color: "#fff", fontSize: 18, display: "inline-block",
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                }}>⌄</span>
            </div>

            {/* Tabla */}
            {open && (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                {["", "Nombre", "Usuario", "Rol", "Estado", "Correo"].map((h, i) => (
                                    <th key={i} style={{
                                        padding: "8px 14px", textAlign: "left",
                                        fontSize: 11, color: "#64748b", fontWeight: 500,
                                        textTransform: "uppercase", letterSpacing: "0.05em",
                                        borderBottom: "1px solid #e2e8f0",
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {agUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: "center", padding: 20, fontSize: 13, color: "#94a3b8" }}>
                                        Sin usuarios en esta agencia
                                    </td>
                                </tr>
                            ) : agUsers.map((u, idx) => (
                                <tr
                                    key={u.id}
                                    onClick={() => onEdit(u)}
                                    style={{
                                        cursor: "pointer",
                                        borderBottom: idx < agUsers.length - 1 ? "1px solid #f1f5f9" : "none",
                                        transition: "background 0.12s",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={e => e.currentTarget.style.background = ""}
                                >
                                    <td style={{ padding: "10px 14px" }}>
                                        <Avatar user={u} size={30} />
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
                                        {u.nombre} {u.apellidos}
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#64748b" }}>
                                        @{u.usuario}
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <RoleBadge rol={u.rol || u.nombre_rol} />
                                    </td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <StatusDot estado={u.estado || "Activo"} />
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {u.correo}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ─── PERFIL USUARIO NORMAL ────────────────────────────────────────────────────
function PerfilUsuario({ token, user }) {
    const [formData, setFormData] = useState({
        nombre: user?.nombre || "",
        apellidos: user?.apellidos || "",
        usuario: user?.usuario || "",
        correo: user?.correo || "",
        contrasena: "",
    });
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user?.foto_url || "");
    const [editando, setEditando] = useState(false);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) { setFoto(file); setFotoPreview(URL.createObjectURL(file)); }
    };

    const guardarCambios = async () => {
        setLoading(true); setMsg("");
        const fd = new FormData();
        fd.append("nombre", formData.nombre);
        fd.append("apellidos", formData.apellidos);
        fd.append("usuario", formData.usuario);
        fd.append("correo", formData.correo);
        if (formData.contrasena) fd.append("contrasena", formData.contrasena);
        if (foto) fd.append("foto", foto);

        try {
            const res = await fetch(`${API}/conformidad/api/usuarios/${user?.id}/`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                setMsg("✅ Datos actualizados correctamente");
                setEditando(false);
                setFormData(prev => ({ ...prev, contrasena: "" }));
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const error = await res.json().catch(() => ({}));
                setMsg(`❌ Error: ${error.detail || "No se pudo actualizar"}`);
            }
        } catch (error) {
            setMsg("❌ Error de conexión");
        } finally {
            setLoading(false);
            setTimeout(() => setMsg(""), 3000);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 py-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-vw-header text-[#131E5C]">Mi perfil</h2>
                    <button
                        onClick={() => {
                            setEditando(!editando);
                            if (editando) {
                                setFormData({ nombre: user?.nombre || "", apellidos: user?.apellidos || "", usuario: user?.usuario || "", correo: user?.correo || "", contrasena: "" });
                                setFoto(null); setFotoPreview(user?.foto_url || "");
                            }
                        }}
                        className="rounded-2xl bg-[#131E5C] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                        {editando ? "Cancelar" : "Editar"}
                    </button>
                </div>
                <div className="mt-6 flex justify-center">
                    <div className="relative">
                        <img
                            src={fotoPreview || `https://ui-avatars.com/api/?background=131E5C&color=fff&name=${encodeURIComponent(formData.nombre || "User")}`}
                            className="h-24 w-24 rounded-full border-4 border-[#131E5C] object-cover"
                            alt="foto perfil"
                        />
                        {editando && (
                            <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-[#131E5C] p-1.5 text-white text-xs hover:opacity-90">
                                📷
                                <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                            </label>
                        )}
                    </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Input label="Nombre(s)" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} disabled={!editando} />
                    <Input label="Apellidos" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} disabled={!editando} />
                    <Input label="Usuario" value={formData.usuario} onChange={(e) => setFormData({ ...formData, usuario: e.target.value })} disabled={!editando} />
                    <Input label="Correo" type="email" value={formData.correo} onChange={(e) => setFormData({ ...formData, correo: e.target.value })} disabled={!editando} />
                    {editando && (
                        <Input label="Nueva contraseña" type="password" placeholder="Dejar vacío si no cambia" value={formData.contrasena} onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} />
                    )}
                </div>
                {editando && (
                    <button onClick={guardarCambios} disabled={loading} className="mt-6 w-full rounded-2xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                        {loading ? "Guardando..." : "Guardar cambios"}
                    </button>
                )}
                {msg && <div className="mt-4 text-center text-sm font-semibold">{msg}</div>}
            </div>
            <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm text-[#131E5C] hover:opacity-70">
                <ArrowLeft size={14} /> Volver al inicio
            </Link>
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Settings() {
    const { token, user } = useAuth();

    const isAdminUI = useMemo(() => {
        const permisos = user?.permisos || [];
        return permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const authHeaders = useMemo(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    }), [token]);

    // ── Estado del formulario de creación ──
    const [roles, setRoles]   = useState([]);
    const [selectedRolId, setSelectedRolId] = useState("");
    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombre: "", apellidos: "", usuario: "", correo: "",
        contrasena: "", agencia: "", id_rol: "", foto: null,
    });
    const [agenciasSeleccionadas, setAgenciasSeleccionadas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg]         = useState("");

    // ── Estado de la tabla de usuarios ──
    const [usuarios, setUsuarios]       = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [modalUser, setModalUser]     = useState(null);
    const [modalOpen, setModalOpen]     = useState(false);

    const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

    // ── Carga roles y usuarios ──
    const cargarUsuarios = useCallback(async () => {
        if (!token) return;
        setLoadingTable(true);
        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/`, {
                headers: authHeaders,
            });
            if (!res.ok) throw new Error("No se pudieron cargar los usuarios.");
            const data = await res.json();
            // Normaliza el campo agencia → agencies (array)
            console.log("RESPUESTA API:", data);
            const lista = (Array.isArray(data) ? data : data.results ?? []).map(u => ({
                ...u,
                agencies: Array.isArray(u.agencies)
                    ? u.agencies
                    : String(u.agencia || "").split("|").map(a => a.trim()).filter(Boolean),
            }));

            console.log("USUARIOS PROCESADOS:", lista);
            setUsuarios(lista);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTable(false);
        }
    }, [token, authHeaders]);

    useEffect(() => {
        if (!token || !isAdminUI) return;
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/conformidad/api/admin/roles/`, { headers: authHeaders });
                if (!res.ok) throw new Error("No se pudieron cargar los roles.");
                const dataRoles = await res.json();
                const rolesList = Array.isArray(dataRoles) ? dataRoles : [];
                setRoles(rolesList);
                if (rolesList.length > 0) {
                    const firstId = String(rolesList[0].id_rol);
                    setSelectedRolId(firstId);
                    setNuevoUsuario(prev => ({ ...prev, id_rol: firstId }));
                }
            } catch (error) {
                showMsg(error.message || "Error cargando datos.");
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
        cargarUsuarios();
    }, [token, isAdminUI, authHeaders, cargarUsuarios]);

    const toggleAgencia = (agencia) => {
        setAgenciasSeleccionadas(prev =>
            prev.includes(agencia) ? prev.filter(i => i !== agencia) : [...prev, agencia]
        );
    };

    const limpiarFormulario = () => {
        setNuevoUsuario({ nombre: "", apellidos: "", usuario: "", correo: "", contrasena: "", agencia: "", id_rol: selectedRolId || "", foto: null });
        setAgenciasSeleccionadas([]);
    };

    const crearUsuario = async (e) => {
        e.preventDefault();
        const usuarioLimpio = String(nuevoUsuario.usuario || "").trim();
        const agenciaFinal  = agenciasSeleccionadas.join("|");

        if (!nuevoUsuario.id_rol)           return showMsg("Selecciona un rol.");
        if (agenciasSeleccionadas.length === 0) return showMsg("Selecciona al menos una agencia.");
        if (!usuarioLimpio)                 return showMsg("Captura el usuario.");
        if (usuarioLimpio.length > 10)      return showMsg("El usuario no puede tener más de 10 caracteres.");

        setLoading(true);
        const fd = new FormData();
        fd.append("nombre",    nuevoUsuario.nombre);
        fd.append("apellidos", nuevoUsuario.apellidos);
        fd.append("usuario",   usuarioLimpio);
        fd.append("correo",    nuevoUsuario.correo);
        fd.append("contrasena", nuevoUsuario.contrasena);
        fd.append("agencia",   agenciaFinal);
        fd.append("id_rol",    nuevoUsuario.id_rol);
        if (nuevoUsuario.foto) fd.append("foto", nuevoUsuario.foto);

        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo crear el usuario.";
                if (errores && typeof errores === "object") {
                    const partes = [];
                    for (const [campo, valor] of Object.entries(errores)) {
                        partes.push(`${campo}: ${Array.isArray(valor) ? valor.join(", ") : valor}`);
                    }
                    if (partes.length) mensaje = partes.join(" | ");
                }
                throw new Error(mensaje);
            }
            showMsg("Usuario creado ✅");
            limpiarFormulario();
            cargarUsuarios(); // 👈 refresca la tabla
        } catch (error) {
            showMsg(error.message || "Error creando usuario.");
        } finally {
            setLoading(false);
        }
    };

    // ── Modal edición ──
    function openEdit(u) {
        setModalUser(u);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setModalUser(null);
    }

    // ── Vista usuario normal ──
    if (!isAdminUI) return <PerfilUsuario token={token} user={user} />;

    // ── Vista admin ──
    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
            {/* Top bar */}
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
                ) : <div />}
            </div>

            {/* Sección crear usuario */}
            <Section title="Gestión de usuarios" desc="Crear usuarios y asignar agencias." icon={Users}>
                <form onSubmit={crearUsuario} className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 lg:col-span-2">
                        <div className="grid gap-3 md:grid-cols-2">
                            <Input label="Nombre(s)" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario(p => ({ ...p, nombre: e.target.value }))} placeholder="Canelo" />
                            <Input label="Apellidos" value={nuevoUsuario.apellidos} onChange={e => setNuevoUsuario(p => ({ ...p, apellidos: e.target.value }))} placeholder="Pérez" />
                            <Input label="Usuario" value={nuevoUsuario.usuario} onChange={e => setNuevoUsuario(p => ({ ...p, usuario: e.target.value }))} placeholder="máx 10 caracteres" />
                            <Input label="Correo" type="email" value={nuevoUsuario.correo} onChange={e => setNuevoUsuario(p => ({ ...p, correo: e.target.value }))} placeholder="correo@gmail.com" />
                            <Input label="Contraseña" type="password" value={nuevoUsuario.contrasena} onChange={e => setNuevoUsuario(p => ({ ...p, contrasena: e.target.value }))} placeholder="••••••••" />
                            <Select label="Rol" value={nuevoUsuario.id_rol} onChange={e => { setSelectedRolId(e.target.value); setNuevoUsuario(p => ({ ...p, id_rol: e.target.value })); }}>
                                <option value="">Selecciona rol...</option>
                                {roles.map(r => <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</option>)}
                            </Select>
                            <label className="block">
                                <div className="mb-1 text-xs font-semibold text-slate-700">Foto de perfil</div>
                                <input
                                    type="file" accept="image/*"
                                    onChange={e => setNuevoUsuario(p => ({ ...p, foto: e.target.files[0] }))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm file:mr-2 file:rounded-2xl file:border-0 file:bg-[#131E5C] file:px-3 file:py-1 file:text-xs file:text-white hover:file:opacity-90"
                                />
                            </label>
                        </div>

                        <div className="mt-5">
                            <div className="mb-2 text-xs font-semibold text-slate-700">Agencias</div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {DEALERS.map(dealer => (
                                    <AgenciaCheckbox key={dealer} label={dealer} checked={agenciasSeleccionadas.includes(dealer)} onChange={() => toggleAgencia(dealer)} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-base font-semibold text-slate-900">Acciones</div>
                        <button
                            type="submit" disabled={loading}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#131E5C] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                            <Plus size={14} />
                            {loading ? "Guardando..." : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </Section>

            {/* ── Tabla de usuarios por agencia ── */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#131E5C", marginBottom: 2 }}>
                            👥 Usuarios por agencia
                        </h2>
                        <p style={{ fontSize: 13, color: "#64748b" }}>
                            Haz clic en un usuario para editar sus datos.
                        </p>
                    </div>
                    <button
                        onClick={cargarUsuarios}
                        style={{
                            background: "none", border: "1px solid #cbd5e1",
                            padding: "6px 14px", borderRadius: 8, fontSize: 12,
                            cursor: "pointer", color: "#475569",
                        }}
                    >
                        🔄 Actualizar
                    </button>
                </div>

                {loadingTable ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                        Cargando usuarios...
                    </div>
                ) : (
                    DEALERS.map(ag => (
                        <AgencyBlock
                            key={ag}
                            agency={ag}
                            users={usuarios}
                            onEdit={openEdit}
                        />
                    ))
                )}
            </div>

            {/* Modal edición */}
            {modalOpen && (
                <UserModal
                    user={modalUser}
                    roles={roles}
                    token={token}
                    onClose={closeModal}
                    onSaved={cargarUsuarios}
                />
            )}
        </div>
    );
}
