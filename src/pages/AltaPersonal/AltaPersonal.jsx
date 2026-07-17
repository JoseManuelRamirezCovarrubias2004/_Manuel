import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import ModalColaborador from "./components/ModalColaborador";

export default function AltaPersonal() {

    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("Córdoba");
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [colaboradores, setColaboradores] = useState([]);

    const agencias = [
        "Córdoba",
        "Orizaba",
        "Poza Rica",
        "Tuxtepec",
        "Tuxpan"
    ];

    return (
        <div className="p-6">

            {/* Encabezado */}
            <div className="mb-6">

                <h1 className="text-3xl font-bold text-[#131E5C]">
                    Alta del Personal
                </h1>

                <p className="mt-2 text-slate-600">
                    Administración del personal por agencia.
                </p>

            </div>



            {/* Botones de agencias */}
            <div className="flex gap-3 mb-6 flex-wrap">

                {agencias.map((agencia) => (

                    <button
                        key={agencia}
                        onClick={() => setAgenciaSeleccionada(agencia)}
                        className={`
                            px-5 
                            py-2 
                            rounded-lg 
                            font-semibold
                            transition

                            ${
                                agenciaSeleccionada === agencia
                                ? "bg-[#131E5C] text-white"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }
                        `}
                    >

                        {agencia}

                    </button>

                ))}

            </div>




            {/* Buscador y botón nuevo */}
            <div className="flex justify-between items-center mb-6">


                {/* Buscador */}
                <div className="relative w-96">


                    <Search
                        size={20}
                        className="absolute left-3 top-3 text-slate-400"
                    />


                    <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        value={busqueda}
                        onChange={(e)=>setBusqueda(e.target.value)}
                        className="
                            w-full
                            pl-10
                            pr-4
                            py-2
                            border
                            rounded-lg
                            focus:outline-none
                            focus:ring-2
                            focus:ring-[#131E5C]
                        "
                    />


                </div>


                {/* Nuevo colaborador */}
                <button
                    onClick={() => {
                        console.log("Abriendo modal");
                        setMostrarModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#131E5C] text-white px-5 py-2 rounded-lg hover:opacity-90"
                >
                    <Plus size={20}/>
                    Nuevo Colaborador
                </button>


            </div>




           {/* Área donde irá la tabla */}
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-[#131E5C] text-white">

                        <tr>

                            <th className="px-4 py-3 text-left">
                                Nombre
                            </th>

                            <th className="px-4 py-3 text-left">
                                Puesto
                            </th>

                            <th className="px-4 py-3 text-left">
                                Fecha Alta
                            </th>

                            <th className="px-4 py-3 text-left">
                                Fecha Baja
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {colaboradores.length === 0 ? (

                            <tr>

                                <td
                                    colSpan={4}
                                    className="text-center py-10 text-slate-400"
                                >
                                    No hay colaboradores registrados.
                                </td>

                            </tr>

                        ) : (

                            colaboradores.map((colaborador, index) => (

                                <tr
                                    key={index}
                                    className="border-b hover:bg-slate-50"
                                >

                                    <td className="px-4 py-3">
                                        {colaborador.nombre}
                                    </td>

                                    <td className="px-4 py-3">
                                        {colaborador.puesto}
                                    </td>

                                    <td className="px-4 py-3">
                                        {colaborador.fechaAlta}
                                    </td>

                                    <td className="px-4 py-3">
                                        {colaborador.fechaBaja || "-"}
                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>

           <ModalColaborador
                open={mostrarModal}
                onClose={() => setMostrarModal(false)}
                onGuardar={(nuevo) =>
                    setColaboradores((prev) => [...prev, nuevo])
                }
            />

            </div>
    );
}