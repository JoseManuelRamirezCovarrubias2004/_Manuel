// routes.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";

import ProtectedLayout from "./auth/ProtectedLayout";
import RequirePermission from "./auth/RequirePermission";

import AppShell from "./app/AppShell";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/LoginRegistro/LoginRegistro";

import Settings from "./pages/Settings";
import QR from "./pages/QR/GeneradorQR";

import CrmLayout from "./pages/crm/CrmLayout";
import CrmOverview from "./pages/crm/CrmOverview";
import CrmCases from "./pages/crm/CrmCases";

import DigitalesLayout from "./pages/Digitales/DigitalesLayout";
import DigitalesOverView from "./pages/Digitales/DigitalesOverView";
import DigitalesProspectos from "./pages/Digitales/DigitalesProspectos";
import DigitalesContacto from "./pages/Digitales/DigitalesContacto";

import CitasLayout from "./pages/Citas/CitasLayout";
import CitasOverView from "./pages/Citas/CitasOverView";
import RegistroCitas from "./pages/Citas/RegistroCitas";

import CitasPisoLayout from "./pages/CitasPiso/CitasPisoLayout";
import CitasPisoOverView from "./pages/CitasPiso/CitasPisoOverView";
import RegistroCitasPiso from "./pages/CitasPiso/RegistroCitasPiso";

import TraficoPiso from "./pages/TraficoPiso/TraficoPiso";

import PruebaManejoLayout from "./pages/PruebasManejo/PruebaManejoLayout";
import RegistroPruebaManejo from "./pages/PruebasManejo/RegistroPruebaManejo";

import EntregasLayout from "./pages/Entregas/EntregasLayout";
import RegistroEntregas from "./pages/Entregas/RegistroEntregas";

import ClickupLayout from "./pages/Clickup/ClickupLayout";
import ClickupTablero from "./pages/Clickup/ClickupTablero";

import CalidadLayout from "./pages/Calidad/CalidadLayout";
import CalidadIndex from "./pages/Calidad/CalidadIndex";

import ComercialLayout from "./pages/Comercial/ComercialLayout";
import ComercialIndex from "./pages/Comercial/ComercialIndex";

import UsadosIndex from "./pages/Usados/UsadosIndex";
import UsadosLayout from "./pages/Usados/UsadosLayout";

import FinancierosLayout from "./pages/Financieros/FinancierosLayout";
import FinancierosIndex from "./pages/Financieros/FinanierosIndex";

import AvaluosLayout from "./pages/Avaluos/AvaluosLayout";
import RegistroAvaluos from "./pages/Avaluos/RegistroAvaluos";

import PostVentaLayout from "./pages/PostVenta/PostVentaLayout";
import PostVentaIndex from "./pages/PostVenta/PostVentaIndex";

import AdministrativosIndex from "./pages/Administrativos/AdministrativosIndex";
import AdministrativosLayout from "./pages/Administrativos/AdministrativosLayout";

import CreditoLayout from "./pages/Credito/CreditoLayout";
import RegistroCredito from "./pages/Credito/RegistroCredito";

import LongDriveLayout from "./pages/LongDrive/LongLayout";
import RegistroLongDrive from "./pages/LongDrive/RegistroLong";

import RegistroSatisfaccion from "./pages/Satisfaccion/RegistroSatisfaccion";
import RegistroServicio from "./pages/Servicio/RegistroServicio";

import RegistroPiezas from "./pages/PedidoPiezas/RegistroPiezas";
import Safety from "./pages/SafetyCulture/Safety";

import Reclutamiento from "./pages/Reclutamiento/Reclutamiento";

/**
 * En desarrollo normalmente import.meta.env.BASE_URL vale "/".
 * En producción, con vite.config.js base: "/crm/", vale "/crm/".
 *
 * Resultado:
 * - Desarrollo: basename = "/"
 * - Producción: basename = "/crm"
 */
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const router = createBrowserRouter(
    [
        {
            path: "/login",
            element: <Login />,
        },

        {
            element: <ProtectedLayout />,
            children: [
                {
                    path: "/",
                    element: <AppShell />,
                    children: [
                        {
                            index: true,
                            element: <Home />,
                        },

                        {
                            path: "calidad",
                            element: (
                                <RequirePermission anyOf={["CRM_RECLAMACIONES", "USUARIOS_ADMIN"]}>
                                    <CalidadLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <CalidadIndex />,
                                },

                                {
                                    path: "reclamaciones",
                                    element: (
                                        <RequirePermission anyOf={["CRM_RECLAMACIONES", "USUARIOS_ADMIN"]}>
                                            <CrmLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <CrmCases />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CrmOverview />,
                                        },
                                    ],
                                },

                                {
                                    path: "clickup",
                                    element: (
                                        <RequirePermission anyOf={["USUARIOS_ADMIN"]}>
                                            <ClickupLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <ClickupTablero />,
                                        },
                                    ],
                                },

                                {
                                    path: "safety",
                                    element: (
                                        <RequirePermission anyOf={["USUARIOS_ADMIN"]}>
                                            <Safety />
                                        </RequirePermission>
                                    ),
                                },

                                {
                                    path: "enc_servicio",
                                    element: (
                                        <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_POSTVENTA"]}>
                                            <RegistroServicio />
                                        </RequirePermission>
                                    ),
                                },

                                {
                                    path: "enc_satisfaccion",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]}
                                        >
                                            <RegistroSatisfaccion />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "comercial",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "CRM_DIGITALES",
                                        "CRM_VENTAS",
                                        "USUARIOS_ADMIN",
                                    ]}
                                >
                                    <ComercialLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <ComercialIndex />,
                                },

                                {
                                    path: "prospectos",
                                    element: (
                                        <RequirePermission anyOf={["CRM_DIGITALES", "USUARIOS_ADMIN"]}>
                                            <DigitalesLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <DigitalesProspectos />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <DigitalesOverView />,
                                        },
                                        {
                                            path: "contacto",
                                            element: <DigitalesContacto />,
                                        },
                                    ],
                                },

                                {
                                    path: "citas",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]}
                                        >
                                            <CitasLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCitas />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CitasOverView />,
                                        },
                                    ],
                                },

                                {
                                    path: "control_piso",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]}
                                        >
                                            <CitasPisoLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCitasPiso />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <CitasPisoOverView />,
                                        },
                                    ],
                                },

                                {
                                    path: "trafico_piso",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]}
                                        >
                                            <TraficoPiso />
                                        </RequirePermission>
                                    ),
                                },

                                {
                                    path: "pruebas_manejo",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]}
                                        >
                                            <PruebaManejoLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroPruebaManejo />,
                                        },
                                    ],
                                },

                                {
                                    path: "entregas",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_VENTAS", "USUARIOS_ADMIN"]}
                                        >
                                            <EntregasLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroEntregas />,
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            path: "usados",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "CRM_DIGITALES",
                                        "CRM_VENTAS",
                                        "USUARIOS_ADMIN",
                                    ]}
                                >
                                    <UsadosLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <UsadosIndex />,
                                },

                                {
                                    path: "avaluos",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "USUARIOS_ADMIN", "CRM_VENTAS"]}
                                        >
                                            <AvaluosLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroAvaluos />,
                                        },
                                        {
                                            path: "contacto",
                                            element: <DigitalesContacto />,
                                        },
                                    ],
                                },

                                {
                                    path: "ventas_cruzadas",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "USUARIOS_ADMIN", "CRM_VENTAS"]}
                                        >
                                            <DigitalesLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <DigitalesProspectos />,
                                        },
                                        {
                                            path: "resumen",
                                            element: <DigitalesOverView />,
                                        },
                                        {
                                            path: "contacto",
                                            element: <DigitalesContacto />,
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            path: "financieros",
                            element: (
                                <RequirePermission
                                    anyOf={[
                                        "CRM_RECLAMACIONES",
                                        "CRM_FINANCIEROS",
                                        "CRM_DIGITALES",
                                        "CRM_VENTAS",
                                        "USUARIOS_ADMIN",
                                    ]}
                                >
                                    <FinancierosLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <FinancierosIndex />,
                                },

                                {
                                    path: "credito",
                                    element: (
                                        <RequirePermission
                                            anyOf={["CRM_DIGITALES", "CRM_FINANCIEROS", "USUARIOS_ADMIN"]}
                                        >
                                            <CreditoLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroCredito />,
                                        },
                                    ],
                                },

                                {
                                    path: "long_drive",
                                    element: (
                                        <RequirePermission
                                            anyOf={[
                                                "CRM_DIGITALES",
                                                "CRM_FINANCIEROS",
                                                "CRM_VENTAS",
                                                "USUARIOS_ADMIN",
                                            ]}
                                        >
                                            <LongDriveLayout />
                                        </RequirePermission>
                                    ),
                                    children: [
                                        {
                                            index: true,
                                            element: <RegistroLongDrive />,
                                        },
                                    ],
                                },
                            ],
                        },

                        {
                            path: "postventa",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_POSTVENTA"]}>
                                    <PostVentaLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <PostVentaIndex />,
                                },

                                {
                                    path: "pedidos_piezas",
                                    element: (
                                        <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_POSTVENTA"]}>
                                            <RegistroPiezas />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "administrativos",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_RRHH"]}>
                                    <AdministrativosLayout />
                                </RequirePermission>
                            ),
                            children: [
                                {
                                    index: true,
                                    element: <AdministrativosIndex />,
                                },

                                {
                                    path: "reclutamiento",
                                    element: (
                                        <RequirePermission anyOf={["USUARIOS_ADMIN", "CRM_RRHH"]}>
                                            <Reclutamiento />
                                        </RequirePermission>
                                    ),
                                },
                            ],
                        },

                        {
                            path: "qr",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN"]}>
                                    <QR />
                                </RequirePermission>
                            ),
                        },

                        {
                            path: "configuracion",
                            element: (
                                <RequirePermission anyOf={["USUARIOS_ADMIN"]}>
                                    <Settings />
                                </RequirePermission>
                            ),
                        },

                        {
                            path: "*",
                            element: <NotFound />,
                        },
                    ],
                },
            ],
        },

        {
            path: "*",
            element: <NotFound />,
        },
    ],
    {
        basename,
    }
);