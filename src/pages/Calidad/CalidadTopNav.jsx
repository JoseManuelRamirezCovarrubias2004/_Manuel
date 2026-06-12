// src/pages/Calidad/CalidadTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { BadgeCheck, ShieldCheck, Cog, ThumbsUp, UndoDot, ClipboardPenLine, Store } from "lucide-react";
import vwWhite from "../../assets/vw_white.png";
import ryr from "../../assets/ryr.png";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

export default function CalidadTopNav() {
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const tabs = useMemo(() => {
        const items = [
            {
                label: "Reclamaciones",
                href: "/calidad/reclamaciones",
                icon: BadgeCheck,
                show: hasAnyPermission(["CRM_RECLAMACIONES", "USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },

            {
    label: "Experiencia de Piso",
    href: "/calidad/enc_piso",
    icon: Store, // o el icono que prefieras
    show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD"]),
},

            {
                label: "Safety Culture",
                href: "/calidad/safety",
                icon: ShieldCheck,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },
            {
                label: "Experiencia de Entrega",
                href: "/calidad/enc_satisfaccion",
                icon: ThumbsUp,
                show: hasAnyPermission(["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN", "CRM_CALIDAD"]),
            },
            {
                label: "Experiencia de Servicio",
                href: "/calidad/enc_servicio",
                icon: Cog,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD"]),
            },
            {
                label: "Retencion",
                href: "/calidad/retencion",
                icon: UndoDot,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD"]),
            },
            {
                label: "Encuestas JD Power",
                href: "/calidad/jdpower",
                icon: ClipboardPenLine,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD"]),
            },
        ];

        return items.filter((x) => x.show);
    }, [hasAnyPermission]);

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header className="w-full">
            <div className="relative overflow-hidden rounded-lg shadow-lg" style={{ backgroundColor: BRAND_BLUE }}>
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-black/15" />
                </div>

                <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="font-vw-header truncate text-lg font-extrabold text-white sm:text-xl">
                                Gestion de Calidad
                            </h1>
                            <p className="mt-1 text-sm text-white/80">
                                Administracion de procesos de calidad y herramientas para equipos de trabajo.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                            <nav className="flex w-full gap-2 sm:w-auto overflow-x-auto">
                                {tabs.map((t) => {
                                    const Icon = t.icon;
                                    const active = isActive(t.href);
                                    return (
                                        <Link
                                            key={t.href}
                                            to={t.href}
                                            className={[
                                                "group inline-flex w-auto shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition",
                                                "border",
                                                active
                                                    ? "border-white/35 bg-white/20 text-white shadow-sm"
                                                    : "border-white/20 bg-white/10 text-white/85 hover:bg-white/15 hover:text-white",
                                            ].join(" ")}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            <Icon className="h-4 w-4 opacity-90" />
                                            {t.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <img src={ryr} alt="RYR" className="h-10 w-auto opacity-95" loading="lazy" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/25 via-white/50 to-white/25" />
                </div>
            </div>
        </header>
    );
}