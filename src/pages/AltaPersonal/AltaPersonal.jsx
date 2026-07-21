import React, { useState, useEffect } from "react";

import {
    Search,
    Plus,
    Pencil,
    Trash2
} from "lucide-react";

import ModalColaborador from "./components/ModalColaborador";

import {
    obtenerColaboradores,
    crearColaborador,
    actualizarColaborador,
    eliminarColaborador,
} from "../../lib/apiColaboradores";


export default function AltaPersonal() {

    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("Córdoba");
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorEditar, setColaboradorEditar] =useState(null);

    const cargarColaboradores = async () => {
        try {
            const datos = await obtenerColaboradores({
                agencia: agenciaSeleccionada,
                buscar: busqueda,
            });

            setColaboradores(datos);
        } catch (error) {
            console.error("Error al cargar colaboradores:", error);
        }
    };
    useEffect(() => {
        cargarColaboradores();
    }, []);

    const agencias = [
        "Córdoba",
        "Orizaba",
        "Poza Rica",
        "Tuxtepec",
        "Tuxpan"
    ];

    const colaboradoresFiltrados = colaboradores.filter((item) => {

        const texto = busqueda.toLowerCase();

        return (
            item.nombre?.toLowerCase().includes(texto) ||
            item.puesto?.toLowerCase().includes(texto) ||
            item.curp?.toLowerCase().includes(texto) ||
            item.nss?.toLowerCase().includes(texto)
        );

    });

    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 p-8">

            <div className="max-w-7xl mx-auto">

                {/* ENCABEZADO */}

                <div className="flex justify-between items-center mb-8">

                    <div>

                        <h1 className="text-4xl font-bold text-[#131E5C]">
                            Alta del Personal
                        </h1>

                        <p className="text-slate-500 mt-1">
                            Administración del personal por agencia
                        </p>

                    </div>

                </div>

                {/* AGENCIAS */}

                <div className="flex gap-3 flex-wrap mb-8">

                    {agencias.map((agencia) => (

                        <button
                            key={agencia}
                            onClick={() => setAgenciaSeleccionada(agencia)}
                            className={`

                            px-7
                            py-2.5
                            rounded-xl
                            border
                            transition-all
                            duration-200
                            font-semibold
                            shadow-md

                            ${
                                agenciaSeleccionada === agencia
                                    ? `
                                        bg-gradient-to-b
                                        from-[#2B438E]
                                        to-[#131E5C]
                                        text-white
                                        border-[#10184B]
                                        shadow-xl
                                      `
                                    : `
                                        bg-gradient-to-b
                                        from-white
                                        to-slate-200
                                        border-slate-300
                                        text-slate-700
                                        hover:from-slate-100
                                        hover:to-slate-300
                                      `
                            }

                        `}
                        >
                            {agencia}
                        </button>

                    ))}

                </div>

                {/* BUSCADOR */}

                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

                    <div className="relative w-[360px]">

                        <Search
                            className="absolute left-4 top-3.5 text-slate-500"
                            size={20}
                        />

                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="

                                w-full
                                pl-11
                                pr-4
                                py-3
                                rounded-xl
                                border
                                border-slate-400
                                bg-gradient-to-b
                                from-white
                                to-slate-200
                                shadow-inner
                                outline-none
                                focus:ring-2
                                focus:ring-[#131E5C]

                            "
                        />

                    </div>

                    <button

                        onClick={() => setMostrarModal(true)}

                        className="

                            flex
                            items-center
                            gap-2
                            px-6
                            py-3
                            rounded-xl
                            bg-gradient-to-b
                            from-[#2B438E]
                            to-[#131E5C]
                            text-white
                            font-semibold
                            shadow-lg
                            hover:brightness-110
                            transition

                        "

                    >

                        <Plus size={20} />

                        Nuevo Colaborador

                    </button>

                </div>

                {/* TABLA */}

                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-300 bg-white">

                    <table className="min-w-full">

                        <thead className="bg-gradient-to-b from-[#2B438E] to-[#131E5C] text-white">

                            <tr>

                                <th className="px-5 py-4 text-left">
                                    Nombre
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Puesto
                                </th>

                                <th className="px-5 py-4 text-left">
                                    CURP
                                </th>

                                <th className="px-5 py-4 text-left">
                                    NSS
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Fecha Nacimiento
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Fecha Alta
                                </th>

                                <th className="px-5 py-4 text-center">
                                    Estado
                                </th>

                                <th className="px-5 py-4 text-center">
                                    Acciones
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {colaboradoresFiltrados.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={8}
                                        className="py-16 text-center text-slate-400 text-lg"
                                    >
                                        No hay colaboradores registrados.
                                    </td>

                                </tr>

                            ) : (

                                colaboradoresFiltrados.map((colaborador, index) => (

                                    <tr

                                        key={index}

                                        className={`
                                            transition
                                            hover:bg-blue-50

                                            ${
                                                index % 2 === 0
                                                    ? "bg-white"
                                                    : "bg-slate-100"
                                            }

                                        `}
                                    >

                                        <td className="px-5 py-4">

                                            {colaborador.nombre}

                                        </td>

                                        <td className="px-5 py-4">

                                            {colaborador.puesto}

                                        </td>

                                        <td className="px-5 py-4">

                                            {colaborador.curp}

                                        </td>

                                        <td className="px-5 py-4">

                                            {colaborador.nss}

                                        </td>

                                        <td className="px-5 py-4">
                                            {colaborador.fecha_nacimiento}
                                        </td>

                                        <td className="px-5 py-4">
                                            {colaborador.fecha_alta}
                                        </td>

                                        <td className="px-5 py-4 text-center">

                                            <div className="w-3 h-3 rounded-full bg-green-500 mx-auto shadow"></div>

                                        </td>

                                        <td className="px-5 py-4">

                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() => {
                                                        setColaboradorEditar(colaborador);
                                                        setMostrarModal(true);
                                                    }}
                                                    className="
                                                        w-9
                                                        h-9
                                                        rounded-lg
                                                        bg-gradient-to-b
                                                        from-slate-200
                                                        to-slate-400
                                                        hover:brightness-110
                                                        transition
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <Pencil size={17}/>
                                                </button>

                                               <button
                                                    onClick={async () => {

                                                        const confirmar = window.confirm(
                                                            `¿Deseas eliminar a "${colaborador.nombre}"?`
                                                        );

                                                        if (!confirmar) return;

                                                        try {

                                                            await eliminarColaborador(
                                                                colaborador.id_colaborador
                                                            );

                                                            await cargarColaboradores();

                                                        } catch (error) {

                                                            console.error(error);

                                                            alert("No fue posible eliminar el colaborador.");

                                                        }

                                                    }}
                                                    className="
                                                        w-9
                                                        h-9
                                                        rounded-lg
                                                        bg-gradient-to-b
                                                        from-red-300
                                                        to-red-500
                                                        text-white
                                                        hover:brightness-110
                                                        transition
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {/* MODAL */}
                <ModalColaborador
                    open={mostrarModal}
                    agencia={agenciaSeleccionada}
                    colaborador={colaboradorEditar}
                    onClose={() => {
                        setMostrarModal(false);
                        setColaboradorEditar(null);
                    }}
                    onGuardar={async (datos) => {

                        if (colaboradorEditar) {

                            await actualizarColaborador(
                                colaboradorEditar.id_colaborador,
                                datos
                            );

                        } else {

                            await crearColaborador(datos);

                        }

                        await cargarColaboradores();

                        setMostrarModal(false);
                        setColaboradorEditar(null);
                    }}
                />

            </div>

        </div>

    );

}