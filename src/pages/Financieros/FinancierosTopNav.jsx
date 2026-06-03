// src/pages/Financieros/FinancierosTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { CreditCard, CarFront } from "lucide-react";
import vwWhite from "../../assets/vw_white.png";
import ryr from "../../assets/ryr.png";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

export default function FinancierosTopNav() {
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const tabs = useMemo(() => {
        const permisosFinancieros = [
            "CRM_DIGITALES",
            "CRM_FINANCIEROS",
            "CRM_VENTAS",
            "USUARIOS_ADMIN",
            "CRM_CALIDAD",
        ];

        return [
            {
                label: "Solicitudes Crédito",
                href: "/financieros/credito",
                icon: CreditCard,
                show: hasAnyPermission(permisosFinancieros),
            },
            {
                label: "Long Drive",
                href: "/financieros/long_drive",
                icon: CarFront,
                show: hasAnyPermission(permisosFinancieros),
            },
        ].filter((item) => item.show);
    }, [hasAnyPermission]);

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header className="w-full">
            <div
                className="relative overflow-hidden rounded-lg shadow-lg"
                style={{ backgroundColor: BRAND_BLUE }}
            >
                <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <h1 className="font-vw-header truncate text-lg font-extrabold text-white sm:text-xl">
                                Servicios Financieros
                            </h1>
                            <p className="mt-1 text-sm text-white/80">
                                Administración de servicios financieros.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                            <nav className="flex w-full gap-2 overflow-x-auto sm:w-auto">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const active = isActive(tab.href);

                                    return (
                                        <Link
                                            key={tab.href}
                                            to={tab.href}
                                            className={[
                                                "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition",
                                                active
                                                    ? "border-white/35 bg-white/20 text-white shadow-sm"
                                                    : "border-white/20 bg-white/10 text-white/85 hover:bg-white/15 hover:text-white",
                                            ].join(" ")}
                                        >
                                            <Icon className="h-4 w-4 opacity-90" />
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <img src={vwWhite} alt="VW" className="h-10 w-auto opacity-95" />
                                <img src={ryr} alt="RYR" className="h-10 w-auto opacity-95" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/25 via-white/50 to-white/25" />
                </div>
            </div>
        </header>
    );
}