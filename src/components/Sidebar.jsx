// src/components/Sidebar.jsx
import React, { useMemo, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
    BadgeCheck,
    HandCoins,
    Zap,
    Settings2,
    Menu,
    X,
    ChevronsLeft,
    ChevronsRight,
    LayoutDashboard,
    Mailbox,
    CirclePower,
    UserCircle2,
    Car,
    TrendingUp,
    ClipboardCheck,
    Tag,
    QrCode,
    UserSearch,
    BrainCircuit,
    Bug,
    Lightbulb,
} from "lucide-react";

import ryr from "../assets/ryr.png";
import { useAuth } from "../auth/AuthContext";
import ClickupNotificationsBell from "./ClickupNotificationsBell";
import { apiClickup } from "../lib/apiClickup";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

const linkBase =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition";

const linkClass = ({ isActive }) =>
    isActive
        ? `${linkBase} bg-[#0f2866] text-white shadow-sm`
        : `${linkBase} text-slate-700 hover:bg-slate-100`;

function FadeSlide({ show, children, className = "" }) {
    return (
        <span
            className={cls(
                "inline-block overflow-hidden whitespace-nowrap",
                "transition-all duration-200 ease-out",
                show ? "opacity-100 translate-x-0 max-w-[240px]" : "opacity-0 -translate-x-2 max-w-0",
                className
            )}
            aria-hidden={!show}
        >
            {children}
        </span>
    );
}

function IconBtn({ onClick, title, className = "", children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-label={title}
            className={cls(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                "border border-slate-200 bg-white",
                "transition active:scale-[0.98] hover:shadow-sm",
                className
            )}
        >
            {children}
        </button>
    );
}

export default function Sidebar() {
    const { user, hasAnyPermission, logout } = useAuth();

    const canSeeSettings = hasAnyPermission(["USUARIOS_ADMIN"]);

    const [collapsed, setCollapsed] = useState(false);

  
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileMounted, setMobileMounted] = useState(false);

    
    const [openBugModal, setOpenBugModal] = useState(false);
    const [tipoReporte, setTipoReporte] = useState("BUG");
    const [titulo, setTitulo] = useState("");
    const [descripcionBug, setDescripcionBug] = useState("");
    const [imagenes, setImagenes] = useState([]);
    const [saving, setSaving] = useState(false);

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImagenes(files);
    };

    const resetForm = () => {
        setTipoReporte("BUG");
        setTitulo("");
        setDescripcionBug("");
        setImagenes([]);
    };

    const handleSubmitBug = async (e) => {
        e.preventDefault();

        if (!titulo.trim() || !descripcionBug.trim()) return;

        setSaving(true);
        try {
            await apiClickup.createReport({
                tipo: tipoReporte,
                titulo,
                descripcion: descripcionBug,
                imagenes,
            });

            resetForm();
            setOpenBugModal(false);
            window.dispatchEvent(new Event("clickup:refresh"));
            alert("Reporte enviado correctamente. Se creó una tarea en ClickUp.");
        } catch (error) {
            alert(error.message || "No se pudo enviar el reporte.");
        } finally {
            setSaving(false);
        }
    };
    

    
    useEffect(() => {
        if (mobileOpen) setMobileMounted(true);
    }, [mobileOpen]);

   
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
                setMobileMounted(false);
            }
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    
    useEffect(() => {
        if (!mobileOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mobileOpen]);

    const links = useMemo(() => {
        const items = [
            { to: "/", label: "Inicio", icon: LayoutDashboard, show: true },
            {
                to: "/calidad",
                label: "Gestion de Calidad",
                icon: BadgeCheck,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },

            {
                to: "/timeforaction",
                label: "TimeForAction",
                icon: Zap,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },

            {
                to: "/comercial",
                label: "Gestion Comercial",
                icon: HandCoins,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_CALL_CENTER"]),
            },

            {
                to: "/encuesta_whats",
                label: "Envio Encuestas",
                icon: HandCoins,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
            //avaluos / ventas cruzadas
            {
                to: "/usados",
                label: "Autos Usados",
                icon: Car,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_VENTAS", "CRM_DIGITALES", "CRM_CALIDAD"]),
            },
            
            {
                to: "/financieros",
                label: "Servicios Financieros",
                icon: TrendingUp,
                show: hasAnyPermission(["CRM_FINANCIEROS", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"]),
            },
       
            {
                to: "/postventa",
                label: "PostVenta",
                icon: ClipboardCheck,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD", "CRM_CALL_CENTER"]),
            },

            {
                to: "/administrativos",
                label: "Reclutamiento y Seleccion",
                icon: UserSearch,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"]),
            },
            {
                to: "/catalogo_precios",
                label: "Catálogo Precios",
                icon: Tag,
                show: hasAnyPermission(["USUARIOS_ADMIN"]),
            },
            {
                to: "/configuracion_ia",
                label: "Panel de Inteligencias Artificiales",
                icon: BrainCircuit,
                show: hasAnyPermission(["USUARIOS_ADMIN"]),
            },
            {
                to: "/qr",
                label: "QR",
                icon: QrCode,
                show: hasAnyPermission(["USUARIOS_ADMIN"]),
            },
            {
                to: "/configuracion",
                label: "Configuración",
                icon: Settings2,
                show: hasAnyPermission(["USUARIOS_ADMIN"]),
            },
        ];
        return items.filter((x) => x.show);
    }, [hasAnyPermission]);

    const hasModules = links.length > 0;

    const SidebarContent = ({ isMobile = false }) => {
        const showText = isMobile ? true : !collapsed;

        return (
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className={cls("px-4 py-4", !showText && !isMobile && "px-2")}>
                    <div className={cls("flex items-center", showText ? "justify-between" : "justify-center")}>
                        {/* Brand */}
                        <NavLink to="/" className={cls("flex items-center", showText ? "gap-3" : "justify-center")}>
                            <div
                                className={cls(
                                    "grid h-10 w-10 place-items-center rounded-2xl bg-[#0f2866] text-white overflow-hidden shrink-0",
                                    "transition-transform duration-200 ease-out",
                                    !showText && !isMobile ? "scale-[0.98]" : "scale-100"
                                )}
                            >
                                <img src={ryr} alt="R&R" className="h-full w-full object-contain" />
                            </div>

                            <div className="leading-tight">
                                <FadeSlide show={showText}>
                                    <div className="text-sm font-semibold">Grupo Automotriz R&R</div>
                                    <div className="text-xs text-slate-500">{user?.agencia ? user.agencia : "Volkswagen"}</div>
                                </FadeSlide>
                            </div>
                        </NavLink>

                        {/* Collapse (solo desktop) */}
                        {!isMobile ? (
                            <button
                                type="button"
                                onClick={() => setCollapsed((v) => !v)}
                                className={cls(
                                    "ml-2 inline-flex items-center justify-center rounded-xl",
                                    "border border-slate-200 bg-white h-10 w-10",
                                    "text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition hover:shadow-sm"
                                )}
                                title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                                aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
                            >
                                {collapsed ? (
                                    <ChevronsRight size={18} className="transition-transform duration-200 ease-out hover:translate-x-[1px]" />
                                ) : (
                                    <ChevronsLeft size={18} className="transition-transform duration-200 ease-out hover:-translate-x-[1px]" />
                                )}
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Nav */}
                <nav className={cls("px-4 flex-1 overflow-y-auto", !showText && !isMobile && "px-2")}>
                    <div
                        className={cls(
                            "mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400",
                            !showText && !isMobile && "text-center px-0"
                        )}
                    >
                        {!showText && !isMobile ? "⋯" : "Módulos"}
                    </div>

                    {!hasModules ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                            Tu cuenta no tiene módulos asignados. Pide al administrador que te asigne un rol.
                        </div>
                    ) : null}
                    <div className="mt-2 flex flex-col gap-1">
                        {links.map((item) => (
                            <div key={item.label}>
                                {!item.children ? (
                                    <NavLink
                                        to={item.to}
                                        className={linkClass}
                                        title={!showText && !isMobile ? item.label : undefined}
                                        onClick={() => {
                                            if (isMobile) setMobileOpen(false);
                                        }}
                                    >
                                        <item.icon size={18} className="shrink-0" />

                                        <FadeSlide show={showText} className="text-sm">
                                            {item.label}
                                        </FadeSlide>
                                    </NavLink>
                                ) : (
                                    <div>
                                        {/* MENU PRINCIPAL */}
                                        <div className="flex items-center gap-3 rounded-xl bg-[#10216B] px-4 py-3 text-white">
                                            <item.icon size={18} className="shrink-0" />

                                            <FadeSlide show={showText} className="text-sm">
                                                {item.label}
                                            </FadeSlide>
                                        </div>

                                        {/* SUBMENU */}
                                        <div className="ml-6 mt-1 flex flex-col gap-1">
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={child.to}
                                                    to={child.to}
                                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                                                    onClick={() => {
                                                        if (isMobile) setMobileOpen(false);
                                                    }}
                                                >
                                                    <div className="h-2 w-2 rounded-full bg-[#10216B]" />

                                                    <span>{child.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

    
                <div className={cls("mt-auto border-t border-slate-200 px-4 py-3", !showText && !isMobile && "px-2")}>
                    <div className={cls("flex flex-col gap-1", !showText && !isMobile && "items-center")}>
                        <div className={cls("flex items-center", showText ? "gap-3 px-3 py-2" : "justify-center py-2")}>
                            <ClickupNotificationsBell />
                            <FadeSlide show={showText} className="text-sm font-medium text-slate-700">
                                Notificaciones
                            </FadeSlide>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setOpenBugModal(true);
                                if (isMobile) setMobileOpen(false);
                            }}
                            title="Sugerencias y errores"
                            aria-label="Sugerencias y errores"
                            className={cls(
                                linkBase,
                                "text-blue-500 hover:bg-blue-600 hover:text-white",
                                !showText && !isMobile && "justify-center px-0"
                            )}
                        >
                            <Mailbox size={18} className="shrink-0" />
                            <FadeSlide show={showText} className="text-sm">
                                Sugerencias y errores
                            </FadeSlide>
                        </button>

                        {canSeeSettings ? (
                            <NavLink
                                to="/configuracion"
                                title="Usuarios"
                                aria-label="Usuarios"
                                onClick={() => {
                                    if (isMobile) setMobileOpen(false);
                                }}
                                className={({ isActive }) =>
                                    cls(
                                        linkBase,
                                        isActive
                                            ? "bg-[#0f2866] text-white shadow-sm"
                                            : "text-slate-700 hover:bg-slate-200 hover:text-[#131E5C]",
                                        !showText && !isMobile && "justify-center px-0"
                                    )
                                }
                            >
                                <UserCircle2 size={18} className="shrink-0" />
                                <FadeSlide show={showText} className="text-sm">
                                    Usuarios
                                </FadeSlide>
                            </NavLink>
                        ) : null}

                        <button
                            type="button"
                            onClick={logout}
                            title="Cerrar sesión"
                            aria-label="Cerrar sesión"
                            className={cls(
                                linkBase,
                                "text-red-500 hover:bg-red-600 hover:text-white",
                                !showText && !isMobile && "justify-center px-0"
                            )}
                        >
                            <CirclePower size={18} className="shrink-0" />
                            <FadeSlide show={showText} className="text-sm">
                                Cerrar sesión
                            </FadeSlide>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
         
            <div className="md:hidden sticky top-0 z-40 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between px-3 py-3">
                    <IconBtn onClick={() => setMobileOpen(true)} title="Abrir menú" className="text-slate-700 hover:bg-slate-50">
                        <Menu size={18} />
                    </IconBtn>

                    <NavLink to="/" className="flex items-center gap-2">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f2866] overflow-hidden">
                            <img src={ryr} alt="R&R" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-sm font-semibold text-slate-800">R&R</div>
                    </NavLink>

                    <ClickupNotificationsBell />
                </div>
            </div>

            {/* Desktop sidebar */}
            <aside
                className={cls(
                    "sticky top-0 hidden h-screen border-r border-slate-200 bg-white md:block",
                    "transition-[width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
                    collapsed ? "w-20" : "w-72"
                )}
            >
                <SidebarContent />
            </aside>

            {/* Mobile drawer (montado para animar salida) */}
            {mobileMounted ? (
                <div className="md:hidden fixed inset-0 z-50">
                    {/* overlay */}
                    <button
                        type="button"
                        className={cls(
                            "absolute inset-0 bg-black/40",
                            "transition-opacity duration-200 ease-out",
                            mobileOpen ? "opacity-100" : "opacity-0"
                        )}
                        onClick={() => setMobileOpen(false)}
                        aria-label="Cerrar menú"
                    />

                    {/* panel */}
                    <div
                        className={cls(
                            "absolute left-0 top-0 h-full w-[85%] max-w-[320px] bg-white shadow-xl border-r border-slate-200",
                            "transition-transform duration-250 ease-[cubic-bezier(.2,.8,.2,1)]",
                            mobileOpen ? "translate-x-0" : "-translate-x-full"
                        )}
                        // cuando termina de cerrar, desmonta
                        onTransitionEnd={() => {
                            if (!mobileOpen) setMobileMounted(false);
                        }}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                            <div className="text-sm font-semibold text-slate-800">Menú</div>
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50"
                                aria-label="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <SidebarContent isMobile />
                    </div>
                </div>
            ) : null}

           
            {openBugModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setOpenBugModal(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Reportar error o sugerencia</h2>
                            <button
                                onClick={() => setOpenBugModal(false)}
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitBug} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("BUG")}
                                        className={[
                                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                                            tipoReporte === "BUG"
                                                ? "border-red-300 bg-red-50 text-red-700"
                                                : "border-slate-300 bg-white text-slate-700"
                                        ].join(" ")}
                                    >
                                        <Bug size={16} />
                                        Error
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("SUGGESTION")}
                                        className={[
                                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                                            tipoReporte === "SUGGESTION"
                                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                                : "border-slate-300 bg-white text-slate-700"
                                        ].join(" ")}
                                    >
                                        <Lightbulb size={16} />
                                        Sugerencia
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
                                <input
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: El modal de clientes no guarda"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
                                <textarea
                                    value={descripcionBug}
                                    onChange={(e) => setDescripcionBug(e.target.value)}
                                    rows={5}
                                    placeholder="Describe el problema, pasos para reproducirlo, resultado actual y resultado esperado."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Evidencias iniciales
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt,.mp4"
                                    multiple
                                    onChange={handleFilesChange}
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                                />
                                {imagenes.length > 0 ? (
                                    <p className="mt-2 text-xs text-slate-500">
                                        {imagenes.length} archivo(s) seleccionado(s)
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpenBugModal(false)}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !titulo.trim() || !descripcionBug.trim()}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {saving ? "Enviando..." : "Enviar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}