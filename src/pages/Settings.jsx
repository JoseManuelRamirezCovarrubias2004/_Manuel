// src/pages/Settings.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, Users, Plus, RefreshCw, Upload, Eye, EyeOff, Building2, ChevronDown, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    { bg: "#e0e7ff", text: "#3730a3" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#e0f2fe", text: "#0369a1" },
];

function getInitials(u) {
    return ((u.nombre?.[0] ?? "") + (u.apellidos?.[0] ?? "")).toUpperCase();
}

function getAvatarColor(id) {
    return AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const inputBase = (err) => ({
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${err ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: 10,
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
});

// ─── Componentes de formulario ────────────────────────────────────────────────
function FLabel({ children }) {
    return (
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            {children}
        </span>
    );
}

function FInput({ label, value, onChange, type = "text", placeholder, disabled = false, error }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <FLabel>{label}</FLabel>
            <input
                type={type} value={value} onChange={onChange}
                placeholder={placeholder} disabled={disabled}
                style={{
                    ...inputBase(error),
                    background: disabled ? "#f8fafc" : "#fff",
                    opacity: disabled ? 0.65 : 1,
                    cursor: disabled ? "not-allowed" : "text",
                }}
                onFocus={e => {
                    if (disabled) return;
                    e.target.style.borderColor = "#131E5C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)";
                }}
                onBlur={e => {
                    e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0";
                    e.target.style.boxShadow = "none";
                }}
            />
            {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
        </label>
    );
}

function FSelect({ label, value, onChange, children }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <FLabel>{label}</FLabel>
            <select
                value={value} onChange={onChange}
                style={{ ...inputBase(), cursor: "pointer", appearance: "auto" }}
                onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            >
                {children}
            </select>
        </label>
    );
}

// ─── Checkbox de agencia (estilo original) ────────────────────────────────────
function AgencyCheck({ label, checked, onChange }) {
    return (
        <label
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                border: "1px solid #e2e8f0",
                background: checked ? "#f0f4ff" : "#f8fafc",
                transition: "background 0.12s, border-color 0.12s",
                borderColor: checked ? "#c7d2fe" : "#e2e8f0",
            }}
        >
            <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 15, height: 15, accentColor: "#131E5C", cursor: "pointer" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{label}</span>
        </label>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 32 }) {
    const color = getAvatarColor(user.id);
    if (user.foto_url || user.photo) {
        return <img src={user.foto_url || user.photo} alt={user.nombre} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: color.bg, color: color.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
        }}>
            {getInitials(user)}
        </div>
    );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
const ROLE_MAP = {
    Administrador: { bg: "#ede9fe", color: "#5b21b6" },
    Gerente:       { bg: "#fef3c7", color: "#92400e" },
    Vendedor:      { bg: "#d1fae5", color: "#065f46" },
};

function RoleBadge({ rol }) {
    const s = ROLE_MAP[rol] ?? ROLE_MAP.Vendedor;
    return (
        <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
            {rol}
        </span>
    );
}

function StatusPill({ estado }) {
    const ok = estado === "Activo";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: ok ? "#dcfce7" : "#fee2e2",
            color: ok ? "#15803d" : "#b91c1c",
            fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#16a34a" : "#dc2626" }} />
            {estado}
        </span>
    );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function ModalDivider({ label }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em" }}>{label}</span>
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
        </div>
    );
}

function UserModal({ user, roles, token, onClose, onSaved }) {
    const isNew = !user?.id;
    const [form, setForm] = useState({
        nombre: user?.nombre ?? "", apellidos: user?.apellidos ?? "",
        usuario: user?.usuario ?? "", correo: user?.correo ?? "",
        id_rol: user?.id_rol ?? "", estado: user?.estado ?? "Activo",
        agencies: user?.agencies ?? [],
    });
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user?.foto_url ?? null);
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [showP, setShowP] = useState(false);
    const [showP2, setShowP2] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    function set(field, val) {
        setForm(f => ({ ...f, [field]: val }));
        setErrors(e => ({ ...e, [field]: undefined }));
    }

    function toggleAgency(ag) {
        set("agencies", form.agencies.includes(ag)
            ? form.agencies.filter(a => a !== ag)
            : [...form.agencies, ag]);
    }

    function handleFoto(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFoto(file);
        setFotoPreview(URL.createObjectURL(file));
    }

    function validate() {
        const errs = {};
        if (!form.nombre.trim()) errs.nombre = "Requerido";
        if (!form.apellidos.trim()) errs.apellidos = "Requerido";
        if (!form.usuario.trim()) errs.usuario = "Requerido";
        if (!form.correo.trim()) errs.correo = "Requerido";
        if (password && password !== password2) errs.password2 = "Las contraseñas no coinciden";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setLoading(true); setMsg("");
        const fd = new FormData();
        fd.append("nombre", form.nombre); fd.append("apellidos", form.apellidos);
        fd.append("usuario", form.usuario); fd.append("correo", form.correo);
        fd.append("id_rol", form.id_rol); fd.append("estado", form.estado);
        fd.append("agencia", form.agencies.join("|"));
        if (password) fd.append("contrasena", password);
        if (foto) fd.append("foto", foto);
        try {
            const url = isNew
                ? `${API}/conformidad/api/admin/usuarios/`
                : `${API}/conformidad/api/admin/usuarios/${user.id}/`;
            const res = await fetch(url, { method: isNew ? "POST" : "PATCH", headers: { Authorization: `Bearer ${token}` }, body: fd });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo guardar.";
                if (errores && typeof errores === "object") {
                    const partes = [];
                    for (const [campo, valor] of Object.entries(errores)) partes.push(`${campo}: ${Array.isArray(valor) ? valor.join(", ") : valor}`);
                    if (partes.length) mensaje = partes.join(" | ");
                }
                throw new Error(mensaje);
            }
            setMsg(isNew ? "✓ Usuario creado" : "✓ Cambios guardados");
            setTimeout(() => { onSaved(); onClose(); }, 900);
        } catch (err) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const previewUser = { ...user, ...form, foto_url: fotoPreview, id: user?.id ?? 0 };

    return (
        <div
            onClick={e => e.target === e.currentTarget && onClose()}
            style={{
                position: "fixed", inset: 0,
                background: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(3px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 200, padding: "1rem",
            }}
        >
            <div style={{
                background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
                maxHeight: "92vh", overflowY: "auto",
                boxShadow: "0 25px 50px rgba(0,0,0,0.12)",
                border: "1px solid #e2e8f0",
            }}>
                {/* Header */}
                <div style={{
                    padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    position: "sticky", top: 0, background: "#fff", zIndex: 1,
                    borderRadius: "16px 16px 0 0",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={15} color="#131E5C" />
                        </div>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                {isNew ? "Nuevo usuario" : "Editar usuario"}
                            </p>
                            {!isNew && <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>@{user?.usuario}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 14 }}>
                        ✕
                    </button>
                </div>

                <div style={{ padding: "20px" }}>
                    {/* Foto preview */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#f8fafc", borderRadius: 10, marginBottom: 18, border: "1px solid #f1f5f9" }}>
                        <Avatar user={previewUser} size={50} />
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 2px" }}>
                                {form.nombre || "Nombre"} {form.apellidos}
                            </p>
                            <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 8px" }}>Foto de perfil · JPG o PNG, máx. 2 MB</p>
                            <label style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 500 }}>
                                <Upload size={11} /> Cambiar foto
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
                            </label>
                        </div>
                    </div>

                    {/* Campos */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                        {[["Nombre(s)", "nombre", "text", "Nombre(s)"], ["Apellidos", "apellidos", "text", "Apellidos"], ["Usuario", "usuario", "text", "usuario"], ["Correo electrónico", "correo", "email", "correo@ejemplo.com"]].map(([label, field, type, ph]) => (
                            <FInput key={field} label={label} error={errors[field]} type={type} value={form[field]} onChange={e => set(field, e.target.value)} placeholder={ph} />
                        ))}
                        <FSelect label="Rol" value={form.id_rol} onChange={e => set("id_rol", e.target.value)}>
                            <option value="">Selecciona rol...</option>
                            {roles.map(r => <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</option>)}
                        </FSelect>
                        <FSelect label="Estado" value={form.estado} onChange={e => set("estado", e.target.value)}>
                            <option>Activo</option><option>Inactivo</option>
                        </FSelect>
                    </div>

                    {/* Contraseña */}
                    <ModalDivider label="Cambiar contraseña" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                        {[[" Nueva contraseña", password, setPassword, showP, setShowP, "Dejar vacío para no cambiar", null], ["Confirmar contraseña", password2, setPassword2, showP2, setShowP2, "Repetir contraseña", errors.password2]].map(([label, val, setVal, show, setShow, ph, err]) => (
                            <label key={label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                <FLabel>{label}</FLabel>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={show ? "text" : "password"} value={val}
                                        onChange={e => setVal(e.target.value)} placeholder={ph}
                                        style={{ ...inputBase(err), paddingRight: 36 }}
                                        onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                                        onBlur={e => { e.target.style.borderColor = err ? "#fca5a5" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                                    />
                                    <button type="button" onClick={() => setShow(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                                        {show ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>
                                {err && <span style={{ fontSize: 11, color: "#ef4444" }}>{err}</span>}
                            </label>
                        ))}
                    </div>

                    {/* Agencias */}
                    <ModalDivider label="Agencias asignadas" />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {DEALERS.map(ag => (
                            <AgencyCheck key={ag} label={ag} checked={form.agencies.includes(ag)} onChange={() => toggleAgency(ag)} />
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 10, position: "sticky", bottom: 0, background: "#fff", borderRadius: "0 0 16px 16px" }}>
                    {msg && (
                        <div style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, textAlign: "center", background: msg.startsWith("✓") ? "#dcfce7" : "#fee2e2", color: msg.startsWith("✓") ? "#15803d" : "#b91c1c" }}>
                            {msg}
                        </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 9, fontSize: 13, cursor: "pointer", border: "1px solid #e2e8f0", background: "#fff", color: "#374151", fontWeight: 500 }}>
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={loading} style={{ padding: "8px 20px", borderRadius: 9, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", border: "none", background: loading ? "#94a3b8" : "#131E5C", color: "#fff", fontWeight: 600 }}>
                            {loading ? "Guardando..." : (isNew ? "Crear usuario" : "Guardar cambios")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── TABLA POR AGENCIA ────────────────────────────────────────────────────────
function AgencyBlock({ agency, users, onEdit }) {
    const [open, setOpen] = useState(true);
    const agUsers = users.filter(u => {
        const agencias = Array.isArray(u.agencies) ? u.agencies : String(u.agencia || "").split("|");
        return agencias.some(a => a.trim() === agency);
    });

    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 10, background: "#fff" }}>
            <div
                onClick={() => setOpen(v => !v)}
                style={{ padding: "11px 18px", background: "#131E5C", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Building2 size={13} color="#fff" />
                    </div>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{agency}</span>
                    <span style={{ background: "rgba(255,255,255,0.15)", color: "#e0e7ff", fontSize: 11, padding: "1px 9px", borderRadius: 20, fontWeight: 500 }}>
                        {agUsers.length} {agUsers.length === 1 ? "usuario" : "usuarios"}
                    </span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <ChevronDown size={15} />
                </div>
            </div>

            {open && (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#fafafa" }}>
                                {["", "Nombre", "Usuario", "Rol", "Estado", "Correo", ""].map((h, i) => (
                                    <th key={i} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {agUsers.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#94a3b8" }}>Sin usuarios en esta agencia</td></tr>
                            ) : agUsers.map((u, idx) => (
                                <tr
                                    key={u.id}
                                    style={{ borderBottom: idx < agUsers.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                                >
                                    <td style={{ padding: "10px 14px" }}><Avatar user={u} size={32} /></td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.nombre} {u.apellidos}</span>
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>@{u.usuario}</td>
                                    <td style={{ padding: "10px 14px" }}><RoleBadge rol={u.rol || u.nombre_rol} /></td>
                                    <td style={{ padding: "10px 14px" }}><StatusPill estado={u.estado || "Activo"} /></td>
                                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.correo}</td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <button
                                            onClick={() => onEdit(u)}
                                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, color: "#374151", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#131E5C"; e.currentTarget.style.color = "#131E5C"; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#374151"; }}
                                        >
                                            <Pencil size={10} /> Editar
                                        </button>
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
    const [formData, setFormData] = useState({ nombre: user?.nombre || "", apellidos: user?.apellidos || "", usuario: user?.usuario || "", correo: user?.correo || "", contrasena: "" });
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
        fd.append("nombre", formData.nombre); fd.append("apellidos", formData.apellidos);
        fd.append("usuario", formData.usuario); fd.append("correo", formData.correo);
        if (formData.contrasena) fd.append("contrasena", formData.contrasena);
        if (foto) fd.append("foto", foto);
        try {
            const res = await fetch(`${API}/conformidad/api/usuarios/${user?.id}/`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: fd });
            if (res.ok) {
                setMsg("✓ Datos actualizados correctamente");
                setEditando(false);
                setFormData(prev => ({ ...prev, contrasena: "" }));
                setTimeout(() => window.location.reload(), 1500);
            } else {
                const error = await res.json().catch(() => ({}));
                setMsg(`Error: ${error.detail || "No se pudo actualizar"}`);
            }
        } catch { setMsg("Error de conexión"); }
        finally { setLoading(false); setTimeout(() => setMsg(""), 3000); }
    };

    return (
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 16px", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <div style={{ height: 64, background: "#131E5C" }} />
                <div style={{ padding: "0 28px 28px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
                        <div style={{ position: "relative", marginTop: -26 }}>
                            <img
                                src={fotoPreview || `https://ui-avatars.com/api/?background=131E5C&color=fff&name=${encodeURIComponent(formData.nombre || "U")}&size=96`}
                                style={{ width: 68, height: 68, borderRadius: "50%", border: "3px solid #fff", objectFit: "cover" }}
                                alt="perfil"
                            />
                            {editando && (
                                <label style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#131E5C", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Upload size={10} color="#fff" />
                                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFotoChange} />
                                </label>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setEditando(!editando);
                                if (editando) { setFormData({ nombre: user?.nombre || "", apellidos: user?.apellidos || "", usuario: user?.usuario || "", correo: user?.correo || "", contrasena: "" }); setFoto(null); setFotoPreview(user?.foto_url || ""); }
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: editando ? "#fff" : "#131E5C", border: editando ? "1px solid #e2e8f0" : "none", color: editando ? "#374151" : "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                            {editando ? "Cancelar" : <><Pencil size={11} /> Editar perfil</>}
                        </button>
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>{formData.nombre} {formData.apellidos}</p>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 22px" }}>@{formData.usuario}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {[["Nombre(s)", "nombre", "text"], ["Apellidos", "apellidos", "text"], ["Usuario", "usuario", "text"], ["Correo", "correo", "email"]].map(([label, field, type]) => (
                            <FInput key={field} label={label} type={type} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} disabled={!editando} />
                        ))}
                        {editando && <FInput label="Nueva contraseña" type="password" placeholder="Dejar vacío si no cambia" value={formData.contrasena} onChange={e => setFormData({ ...formData, contrasena: e.target.value })} />}
                    </div>
                    {editando && (
                        <button onClick={guardarCambios} disabled={loading} style={{ marginTop: 18, width: "100%", padding: "10px", borderRadius: 9, border: "none", background: loading ? "#94a3b8" : "#131E5C", color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                            {loading ? "Guardando..." : "Guardar cambios"}
                        </button>
                    )}
                    {msg && <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 8, background: msg.startsWith("✓") ? "#dcfce7" : "#fee2e2", color: msg.startsWith("✓") ? "#15803d" : "#b91c1c", fontSize: 12, fontWeight: 500, textAlign: "center" }}>{msg}</div>}
                </div>
            </div>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 12, color: "#131E5C", textDecoration: "none" }}>
                <ArrowLeft size={12} /> Volver al inicio
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

    const authHeaders = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

    const [roles, setRoles] = useState([]);
    const [selectedRolId, setSelectedRolId] = useState("");
    const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", apellidos: "", usuario: "", correo: "", contrasena: "", agencia: "", id_rol: "", foto: null });
    const [agenciasSeleccionadas, setAgenciasSeleccionadas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [usuarios, setUsuarios] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [modalUser, setModalUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

    const cargarUsuarios = useCallback(async () => {
        if (!token) return;
        setLoadingTable(true);
        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/`, { headers: authHeaders });
            if (!res.ok) throw new Error("No se pudieron cargar los usuarios.");
            const data = await res.json();
            const lista = (Array.isArray(data) ? data : data.results ?? []).map(u => ({
                ...u,
                agencies: Array.isArray(u.agencies) ? u.agencies : String(u.agencia || "").split("|").map(a => a.trim()).filter(Boolean),
            }));
            setUsuarios(lista);
        } catch (err) { console.error(err); }
        finally { setLoadingTable(false); }
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
            } catch (error) { showMsg(error.message || "Error cargando datos."); }
            finally { setLoading(false); }
        };
        cargarDatos();
        cargarUsuarios();
    }, [token, isAdminUI, authHeaders, cargarUsuarios]);

    const toggleAgencia = (agencia) => {
        setAgenciasSeleccionadas(prev => prev.includes(agencia) ? prev.filter(i => i !== agencia) : [...prev, agencia]);
    };

    const limpiarFormulario = () => {
        setNuevoUsuario({ nombre: "", apellidos: "", usuario: "", correo: "", contrasena: "", agencia: "", id_rol: selectedRolId || "", foto: null });
        setAgenciasSeleccionadas([]);
    };

    const crearUsuario = async (e) => {
        e.preventDefault();
        const usuarioLimpio = String(nuevoUsuario.usuario || "").trim();
        const agenciaFinal = agenciasSeleccionadas.join("|");
        if (!nuevoUsuario.id_rol) return showMsg("Selecciona un rol.");
        if (agenciasSeleccionadas.length === 0) return showMsg("Selecciona al menos una agencia.");
        if (!usuarioLimpio) return showMsg("Captura el usuario.");
        if (usuarioLimpio.length > 10) return showMsg("El usuario no puede tener más de 10 caracteres.");
        setLoading(true);
        const fd = new FormData();
        fd.append("nombre", nuevoUsuario.nombre); fd.append("apellidos", nuevoUsuario.apellidos);
        fd.append("usuario", usuarioLimpio); fd.append("correo", nuevoUsuario.correo);
        fd.append("contrasena", nuevoUsuario.contrasena); fd.append("agencia", agenciaFinal);
        fd.append("id_rol", nuevoUsuario.id_rol);
        if (nuevoUsuario.foto) fd.append("foto", nuevoUsuario.foto);
        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo crear el usuario.";
                if (errores && typeof errores === "object") {
                    const partes = [];
                    for (const [campo, valor] of Object.entries(errores)) partes.push(`${campo}: ${Array.isArray(valor) ? valor.join(", ") : valor}`);
                    if (partes.length) mensaje = partes.join(" | ");
                }
                throw new Error(mensaje);
            }
            showMsg("✓ Usuario creado exitosamente");
            limpiarFormulario();
            cargarUsuarios();
        } catch (error) { showMsg(error.message || "Error creando usuario."); }
        finally { setLoading(false); }
    };

    function openEdit(u) { setModalUser(u); setModalOpen(true); }
    function closeModal() { setModalOpen(false); setModalUser(null); }

    if (!isAdminUI) return <PerfilUsuario token={token} user={user} />;

    return (
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 9, background: "#131E5C", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                    <ArrowLeft size={13} /> Volver
                </Link>
                {msg && (
                    <div style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 500, background: msg.startsWith("✓") ? "#dcfce7" : "#fee2e2", color: msg.startsWith("✓") ? "#15803d" : "#b91c1c", border: `1px solid ${msg.startsWith("✓") ? "#bbf7d0" : "#fecaca"}` }}>
                        {msg}
                    </div>
                )}
            </div>

            {/* ── Card principal crear usuario ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", marginBottom: 24, overflow: "hidden" }}>
                {/* Header card */}
                <div style={{ padding: "16px 22px", background: "#131E5C", display: "flex", alignItems: "center", gap: 12, borderRadius: "16px 16px 0 0" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Users size={16} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Gestión de usuarios</h2>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>Crear usuarios y asignar agencias.</p>
                    </div>
                </div>

                {/* Cuerpo formulario */}
                <form onSubmit={crearUsuario}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 240px" }}>
                        {/* Campos */}
                        <div style={{ padding: "20px 22px", borderRight: "1px solid #f1f5f9" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                                <FInput label="Nombre(s)" value={nuevoUsuario.nombre} onChange={e => setNuevoUsuario(p => ({ ...p, nombre: e.target.value }))} placeholder="Canelo" />
                                <FInput label="Apellidos" value={nuevoUsuario.apellidos} onChange={e => setNuevoUsuario(p => ({ ...p, apellidos: e.target.value }))} placeholder="Pérez" />
                                <FInput label="Usuario" value={nuevoUsuario.usuario} onChange={e => setNuevoUsuario(p => ({ ...p, usuario: e.target.value }))} placeholder="máx 10 caracteres" />
                                <FInput label="Correo electrónico" type="email" value={nuevoUsuario.correo} onChange={e => setNuevoUsuario(p => ({ ...p, correo: e.target.value }))} placeholder="correo@gmail.com" />
                                <FInput label="Contraseña" type="password" value={nuevoUsuario.contrasena} onChange={e => setNuevoUsuario(p => ({ ...p, contrasena: e.target.value }))} placeholder="••••••••" />
                                <FSelect label="Rol" value={nuevoUsuario.id_rol} onChange={e => { setSelectedRolId(e.target.value); setNuevoUsuario(p => ({ ...p, id_rol: e.target.value })); }}>
                                    <option value="">Selecciona rol...</option>
                                    {roles.map(r => <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</option>)}
                                </FSelect>

                                {/* Foto */}
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <FLabel>Foto de perfil</FLabel>
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, padding: "9px 14px", borderRadius: 10, border: "1px dashed #cbd5e1", background: "#f8fafc", cursor: "pointer" }}>
                                        <Upload size={13} color="#94a3b8" />
                                        <span style={{ fontSize: 12, color: nuevoUsuario.foto ? "#0f172a" : "#94a3b8" }}>
                                            {nuevoUsuario.foto ? nuevoUsuario.foto.name : "Elegir archivo · No se eligió ningún archivo"}
                                        </span>
                                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => setNuevoUsuario(p => ({ ...p, foto: e.target.files[0] }))} />
                                    </label>
                                </div>
                            </div>

                            {/* Agencias */}
                            <div>
                                <FLabel>Agencias</FLabel>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, marginTop: 8 }}>
                                    {DEALERS.map(dealer => (
                                        <AgencyCheck key={dealer} label={dealer} checked={agenciasSeleccionadas.includes(dealer)} onChange={() => toggleAgencia(dealer)} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Panel acciones */}
                        <div style={{ padding: "20px 18px", background: "#fafafa", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 12px" }}>Acciones</p>
                                <button
                                    type="submit" disabled={loading}
                                    style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: loading ? "#94a3b8" : "#131E5C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                                >
                                    <Plus size={14} />
                                    {loading ? "Guardando..." : "Crear usuario"}
                                </button>
                            </div>

                            {/* Resumen */}
                            <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", margin: "0 0 10px", letterSpacing: "0.05em" }}>RESUMEN</p>
                                {[["Total usuarios", usuarios.length], ["Agencias", DEALERS.length]].map(([label, val]) => (
                                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: "#131E5C" }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* ── Tabla usuarios ── */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>Usuarios por agencia</h2>
                        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Haz clic en "Editar" para modificar un usuario</p>
                    </div>
                    <button
                        onClick={cargarUsuarios} disabled={loadingTable}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#374151", cursor: loadingTable ? "not-allowed" : "pointer", fontWeight: 500 }}
                    >
                        <RefreshCw size={11} style={{ animation: loadingTable ? "spin 1s linear infinite" : "none" }} />
                        Actualizar
                    </button>
                </div>

                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

                {loadingTable ? (
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "36px 0", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                        Cargando usuarios...
                    </div>
                ) : (
                    DEALERS.map(ag => <AgencyBlock key={ag} agency={ag} users={usuarios} onEdit={openEdit} />)
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <UserModal user={modalUser} roles={roles} token={token} onClose={closeModal} onSaved={cargarUsuarios} />
            )}
        </div>
    );
}
