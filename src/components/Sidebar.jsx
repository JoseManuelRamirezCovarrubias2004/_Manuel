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
    QrCode,
    UserSearch,
} from "lucide-react";

import ryr from "../assets/ryr.png";
import { useAuth } from "../auth/AuthContext";

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

    // Drawer móvil: lo dejamos montado para animar salida
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileMounted, setMobileMounted] = useState(false);

    // Abre/cierra con animación
    useEffect(() => {
        if (mobileOpen) setMobileMounted(true);
    }, [mobileOpen]);

    // Cerrar en resize a desktop
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

    // Evita scroll del body con el menú abierto
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
                show: hasAnyPermission(["CRM_RECLAMACIONES", "CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN", "CRM_CALIDAD"]),
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
            // long drive / credito
            {
                to: "/financieros",
                label: "Servicios Financieros",
                icon: TrendingUp,
                show: hasAnyPermission(["CRM_FINANCIEROS", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"]),
            },
            // encuestas
            {
                to: "/postventa",
                label: "PostVenta",
                icon: ClipboardCheck,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD"]),
            },

            {
                to: "/administrativos",
                label: "Reclutamiento y Seleccion",
                icon: UserSearch,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"]),
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
                <nav className={cls("px-4", !showText && !isMobile && "px-2")}>
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

                <div className="mt-auto" />
            </div>
        );
    };

    return (
        <>
            {/* Topbar MOBILE: ahora también tiene los botones (solo iconos) */}
            <div className="md:hidden sticky top-0 z-40 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center gap-2">
                        <IconBtn onClick={() => setMobileOpen(true)} title="Abrir menú" className="text-slate-700 hover:bg-slate-50">
                            <Menu size={18} />
                        </IconBtn>
                    </div>

                    <NavLink to="/" className="flex items-center gap-2">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0f2866] overflow-hidden">
                            <img src={ryr} alt="R&R" className="h-full w-full object-contain" />
                        </div>
                        <div className="text-sm font-semibold text-slate-800">R&R</div>
                    </NavLink>

                    <div className="flex items-center gap-2">
                        {canSeeSettings ? (
                            <NavLink
                                to="/configuracion"
                                title="Usuarios"
                                aria-label="Usuarios"
                                className={cls(
                                    "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                                    "border border-slate-200 bg-white",
                                    "transition active:scale-[0.98] hover:bg-slate-200 hover:shadow-sm"
                                )}
                            >
                                <UserCircle2 size={18} />
                            </NavLink>
                        ) : null}

                        <IconBtn
                            onClick={logout}
                            title="Cerrar sesión"
                            className="text-red-600 hover:bg-red-600 hover:text-white"
                        >
                            <CirclePower size={18} />
                        </IconBtn>
                    </div>
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
        </>
    );
}