// src/pages/Comercial/ComercialTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Globe, CalendarDays, Building2, createLucideIcon, MessageCircle, PackageCheck, ThumbsUp } from "lucide-react";
import vwWhite from "../../assets/vw_white.png";
import ryr from "../../assets/ryr.png";
import { steeringWheel } from "@lucide/lab";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";
const SteeringWheelLab = createLucideIcon("SteeringWheelLab", steeringWheel);

export default function ComercialTopNav() {
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const inProspectos = location.pathname.startsWith("/comercial/prospectos");
    const canSeeContacto = hasAnyPermission(["CRM_DIGITALES", "USUARIOS_ADMIN"]);

    const tabs = useMemo(() => {
        const items = [
            {
                label: "Prospectos Digitales",
                href: "/comercial/prospectos",
                icon: Globe,
                show: hasAnyPermission(["CRM_DIGITALES", "USUARIOS_ADMIN"]),
            },
            {
                label: "Contacto",
                href: "/comercial/prospectos/contacto",
                icon: MessageCircle,
                show: canSeeContacto && inProspectos,
            },
            {
                label: "Citas",
                href: "/comercial/citas",
                icon: CalendarDays,
                show: hasAnyPermission(["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
            {
                label: "Control piso",
                href: "/comercial/control_piso",
                icon: Building2,
                show: hasAnyPermission(["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
            {
                label: "Trafico piso",
                href: "/comercial/trafico_piso",
                icon: Building2,
                show: hasAnyPermission(["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
            {
                label: "Pruebas",
                href: "/comercial/pruebas_manejo",
                icon: SteeringWheelLab,
                show: hasAnyPermission(["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
            {
                label: "Entregas",
                href: "/comercial/entregas",
                icon: PackageCheck,
                show: hasAnyPermission(["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]),
            },
        ];

        return items.filter((x) => x.show);
    }, [hasAnyPermission, canSeeContacto, inProspectos]);

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
                                Gestion Comercial
                            </h1>
                            <p className="mt-1 text-sm text-white/80">
                                Administracion de procesos comerciales.
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
                                <img src={vwWhite} alt="VW" className="h-10 w-auto opacity-95" loading="lazy" />
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