import { useMemo, useState, useEffect } from "react";
import { Eye, EyeOff, User, Lock, Mail, Building2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

import LoginIntroPro from "./LoginIntroPro";

import vwWhite from "../../assets/vw_white.png";
import ryrBlue from "../../assets/ryr_blue.png";
import fondo4 from "../../assets/fondo4.jpg";
import fondo3 from "../../assets/fondo3.jpg";

const BRAND_BLUE = "#131E5C";
const API = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white/85 backdrop-blur px-3 py-3 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4 text-[#131E5C]" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

export default function LoginRegistro() {
    const [tab, setTab] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Intro PRO solo una vez por sesión (en /login)
    const [showIntro, setShowIntro] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const from = location.state?.from?.pathname || "/";

    const [formLogin, setFormLogin] = useState({ usuario: "", contrasena: "" });

    const [formRegistro, setFormRegistro] = useState({
        nombre: "",
        apellidos: "",
        usuario: "",
        correo: "",
        agencia: "",
        contrasena: "",
        contrasenaConfirmada: "",
    });

    useEffect(() => {
        const isLoginRoute = location.pathname === "/login";
        const already = sessionStorage.getItem("login_intro_done") === "1";

        // Si estás en /login y no se ha visto, muéstralo
        if (isLoginRoute && !already) setShowIntro(true);
    }, [location.pathname]);

    const finishIntro = () => {
        sessionStorage.setItem("login_intro_done", "1");
        setShowIntro(false);
    };

    const subtitle = useMemo(() => {
        return tab === "login"
            ? "Ingresa con tu usuario y contraseña para acceder al CRM."
            : "Crea tu cuenta para poder acceder al CRM.";
    }, [tab]);

    const imagenFondo = useMemo(() => {
        return tab === "login" ? fondo4 : fondo3;
    }, [tab]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API}/conformidad/api/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formLogin),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data?.detail || "Credenciales inválidas.");
                return;
            }

            login({ token: data.token, user: data.user });
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            alert("No se pudo iniciar sesión.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistro = async (e) => {
        e.preventDefault();

        if (formRegistro.contrasena !== formRegistro.contrasenaConfirmada) {
            alert("Las contraseñas no coinciden");
            return;
        }
        if (!formRegistro.agencia) {
            alert("Selecciona una agencia");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                nombre: formRegistro.nombre,
                apellidos: formRegistro.apellidos,
                usuario: formRegistro.usuario,
                correo: formRegistro.correo,
                contrasena: formRegistro.contrasena,
                agencia: formRegistro.agencia,
            };

            const res = await fetch(`${API}/conformidad/api/auth/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (res.status === 201) {
                alert("Registro exitoso, ahora puedes iniciar sesión.");
                setTab("login");
                setFormLogin({ usuario: payload.usuario, contrasena: "" });
            } else {
                alert(data?.detail || JSON.stringify(data));
            }
        } catch (err) {
            console.error(err);
            alert("No se pudo completar el registro.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-10 bg-slate-50">
            {/* Fondo más pro (sin WebGL): gradiente + ruido + glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#070b1a] via-[#070b1a] to-black" />
            <div
                className="absolute inset-0 opacity-[0.10]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 10% 10%, rgba(122,167,255,0.18), transparent 45%), radial-gradient(circle at 90% 30%, rgba(19,30,92,0.35), transparent 55%), radial-gradient(circle at 40% 90%, rgba(122,167,255,0.10), transparent 50%)",
                }}
            />

            {/* Card principal estilo glass */}
            <div className="relative w-full max-w-5xl">
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/75 backdrop-blur-xl shadow-2xl">
                    {/* Header */}
                    <div className="px-6 py-5 text-white" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={ryrBlue}
                                    alt="R&R"
                                    className="h-10 w-10 rounded-full bg-neutral-100 p-1"
                                />
                                <div className="min-w-0">
                                    <div className="truncate text-lg font-extrabold">
                                        Grupo Automotriz R&amp;R
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3">
                                <img src={vwWhite} alt="VW" className="h-10 opacity-90" />
                                <div className="h-8 w-px bg-white/25" />
                                <span className="text-xs font-semibold text-white/80">Gestión R&amp;R</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Panel izquierdo */}
                        <div className="hidden md:flex relative flex-col justify-between p-10 text-white overflow-hidden">
                            <img
                                src={imagenFondo}
                                alt="Agencia"
                                className="absolute inset-0 h-full w-full object-cover opacity-90"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-[#131E5C]/55 via-[#131E5C]/40 to-[#0B123A]/70" />

                            <div className="relative">
                                <h3 className="mt-10 text-3xl font-extrabold leading-tight">
                                    {subtitle}
                                </h3>
                                <p className="mt-3 text-sm text-white/80">
                                    Acceso seguro, visual moderno y rendimiento fluido.
                                </p>
                            </div>

                            <div className="relative text-xs text-white/60">
                                Acceso interno • Personal autorizado
                            </div>
                        </div>

                        {/* Panel derecho */}
                        <div className="p-6 sm:p-10">
                            <div className="mb-6 flex justify-center">
                                <div className="inline-flex rounded-xl border border-black/10 bg-white/70 backdrop-blur p-1 shadow-sm">
                                    <button
                                        onClick={() => setTab("login")}
                                        className={[
                                            "px-4 py-2 text-sm font-extrabold rounded-xl transition",
                                            tab === "login"
                                                ? "bg-white shadow text-slate-900"
                                                : "text-slate-600 hover:text-slate-900",
                                        ].join(" ")}
                                    >
                                        Iniciar sesión
                                    </button>
                                    <button
                                        onClick={() => setTab("registro")}
                                        className={[
                                            "px-4 py-2 text-sm font-extrabold rounded-xl transition",
                                            tab === "registro"
                                                ? "bg-white shadow text-slate-900"
                                                : "text-slate-600 hover:text-slate-900",
                                        ].join(" ")}
                                    >
                                        Crear cuenta
                                    </button>
                                </div>
                            </div>

                            {tab === "login" ? (
                                <form onSubmit={handleLogin} className="mx-auto w-full max-w-md space-y-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-extrabold text-slate-900">Bienvenido</div>
                                        <div className="text-sm text-slate-500">Inicia sesión para continuar</div>
                                    </div>

                                    <Field label="Usuario" icon={User}>
                                        <input
                                            value={formLogin.usuario}
                                            onChange={(e) => setFormLogin((p) => ({ ...p, usuario: e.target.value }))}
                                            className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                            placeholder="usuario"
                                            required
                                        />
                                    </Field>

                                    <Field label="Contraseña" icon={Lock}>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formLogin.contrasena}
                                                onChange={(e) => setFormLogin((p) => ({ ...p, contrasena: e.target.value }))}
                                                className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 pr-10 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((s) => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                                aria-label="Mostrar/ocultar contraseña"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </Field>

                                    <button
                                        type="submit"
                                        className="w-full rounded-xl py-3 text-sm font-extrabold text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition"
                                        style={{ backgroundColor: BRAND_BLUE }}
                                        disabled={isLoading}
                                    >
                                        Entrar
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleRegistro} className="mx-auto w-full max-w-lg space-y-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-extrabold text-slate-900">Crear cuenta</div>
                                        <div className="text-sm text-slate-500">
                                            Regístrate para probar la <b>web</b>.
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Nombre(s)" icon={User}>
                                            <input
                                                value={formRegistro.nombre}
                                                onChange={(e) => setFormRegistro((p) => ({ ...p, nombre: e.target.value }))}
                                                className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                                required
                                            />
                                        </Field>

                                        <Field label="Apellidos" icon={User}>
                                            <input
                                                value={formRegistro.apellidos}
                                                onChange={(e) => setFormRegistro((p) => ({ ...p, apellidos: e.target.value }))}
                                                className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                                required
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Nombre de Usuario" icon={User}>
                                        <input
                                            value={formRegistro.usuario}
                                            onChange={(e) => setFormRegistro((p) => ({ ...p, usuario: e.target.value }))}
                                            className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                            required
                                        />
                                    </Field>

                                    <Field label="Correo" icon={Mail}>
                                        <input
                                            type="email"
                                            value={formRegistro.correo}
                                            onChange={(e) => setFormRegistro((p) => ({ ...p, correo: e.target.value }))}
                                            className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                            required
                                        />
                                    </Field>

                                    <Field label="Agencia" icon={Building2}>
                                        <select
                                            value={formRegistro.agencia}
                                            onChange={(e) => setFormRegistro((p) => ({ ...p, agencia: e.target.value }))}
                                            className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                            required
                                        >
                                            <option value="" disabled>Selecciona una agencia...</option>
                                            {DEALERS.map((d) => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Field label="Contraseña" icon={Lock}>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={formRegistro.contrasena}
                                                    onChange={(e) => setFormRegistro((p) => ({ ...p, contrasena: e.target.value }))}
                                                    className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 pr-10 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                                    aria-label="Mostrar/ocultar contraseña"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </Field>

                                        <Field label="Confirmar" icon={Lock}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formRegistro.contrasenaConfirmada}
                                                onChange={(e) => setFormRegistro((p) => ({ ...p, contrasenaConfirmada: e.target.value }))}
                                                className="w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-[#131E5C] outline-none focus:ring-2 focus:ring-[#131E5C]/25"
                                                required
                                            />
                                        </Field>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full rounded-xl py-3 text-sm font-extrabold text-white shadow-lg hover:brightness-110 active:scale-[0.99] transition"
                                        style={{ backgroundColor: BRAND_BLUE }}
                                        disabled={isLoading}
                                    >
                                        Registrar
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Loader */}
                    {isLoading && (
                        <div className="absolute inset-0 z-[50] flex items-center justify-center bg-white/65 backdrop-blur-sm">
                            <Bouncy size="45" speed="1.55" color={BRAND_BLUE} />
                        </div>
                    )}

                    {/* Intro PRO */}
                    <AnimatePresence>
                        {showIntro && (
                            <LoginIntroPro
                                onFinish={finishIntro}
                                // Usa el logo que ya tienes (ryrBlue o vwWhite). Aquí te recomiendo R&R.
                                logoSrc={ryrBlue}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}