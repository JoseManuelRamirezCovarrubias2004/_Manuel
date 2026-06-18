// src/pages/HojaIngresos/AgendaView.jsx
import { useState, useMemo, useEffect} from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Car,
  User,
  Phone,
  Mail,
  CalendarDays,
  X,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const BRAND_BLUE = "#131E5C";

const HORARIOS = [
  "8:00","8:30",
  "9:00","9:30",
  "10:00","10:30",
  "11:00","11:30",
  "12:00","12:30",
  "13:00","13:30",
  "14:00","14:30",
  "15:00","15:30"
];

// Asesores por agencia
const ASESORES_POR_AGENCIA = {
    "VW Cordoba": [
        { id: 1, nombre: "Yamil Tepole" },
        { id: 2, nombre: "Iván Ramírez" },
        { id: 3, nombre: "Verónica González" },
    ],
    "VW Orizaba": [
        { id: 4, nombre: "Carlos Oliveros" },
        { id: 5, nombre: "Norma Angélica Reyes" },
    ],
};

// Colores de asesores (solo para el circulito)
const ASESORES_POR_DEALER = {
    "VW Cordoba": [
        {
            nombre: "Yamil Tepole",
            dotClassName: "bg-blue-600",
        },
        {
            nombre: "Iván Ramírez",
            dotClassName: "bg-slate-500",
        },
        {
            nombre: "Verónica González",
            dotClassName: "bg-emerald-600",
        },
    ],
    "VW Orizaba": [
        {
            nombre: "Carlos Oliveros",
            dotClassName: "bg-emerald-600",
        },
        {
            nombre: "Norma Angélica Reyes",
            dotClassName: "bg-yellow-500",
        },
    ],
};

function getColorAsesor(asesorNombre, agencia) {
    const dealer = ASESORES_POR_DEALER[agencia] || [];
    const found = dealer.find(a => a.nombre === asesorNombre);
    if (found) return found;
    return {
        dotClassName: "bg-gray-500",
    };
}

function ModalCita({ open, cita, asesor, hora, onClose, onSave }) {
  const [formData, setFormData] = useState({
    cliente: cita?.cliente || cita?.nombre_cliente || "",
    telefono: cita?.telefono || "",
    email: cita?.email || "",
    longDrive: cita?.longDrive || false,
    citado: cita?.citado || false,
    asistido: cita?.asistido || cita?.asistencia || null,
  });

  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar la cita");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[#131E5C] bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 px-6 py-4" style={{ backgroundColor: BRAND_BLUE }}>
            <div className="text-base font-extrabold text-white">
              {cita ? "Editar cita" : "Nueva cita"}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#131E5C]" />
                <span className="font-semibold">{asesor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#131E5C]" />
                <span className="font-semibold">{hora}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#131E5C] mb-1">Cliente *</label>
              <input
                type="text"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10 transition-all"
                placeholder="Nombre del cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#131E5C] mb-1">Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10 transition-all"
                placeholder="10 dígitos"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#131E5C] mb-1">Correo electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#131E5C] outline-none focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10 transition-all"
                placeholder="cliente@mail.com"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#131E5C]">
                <input
                  type="checkbox"
                  checked={formData.longDrive}
                  onChange={(e) => setFormData({ ...formData, longDrive: e.target.checked })}
                  className="h-4 w-4 accent-[#131E5C]"
                />
                Long Drive
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-[#131E5C]">
                <input
                  type="checkbox"
                  checked={formData.citado}
                  onChange={(e) => setFormData({ ...formData, citado: e.target.checked })}
                  className="h-4 w-4 accent-[#131E5C]"
                />
                Citado
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#131E5C]">Asistido:</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, asistido: true })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    formData.asistido === true
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, asistido: false })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    formData.asistido === false
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !formData.cliente.trim()}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: BRAND_BLUE }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function CeldaCita({ cita, esFuturo, onClick }) {

  if (!cita) {
    return (
      <div className="
        w-full 
        h-full 
        min-h-[50px] 
        bg-white 
        border 
        border-gray-100 
        rounded-lg
      " />
    );
  }


  const nombreCliente =
    cita.cliente_nombre ||
    cita.nombre_cliente ||
    "Sin nombre";

  // 👇 AGREGA ESTO
  const horaCita = (fecha) => {
    if (!fecha) return "";

    const date = new Date(fecha);

    return date.toLocaleTimeString(
      "es-MX",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  };


  return (
    <button
      onClick={() => onClick(cita)}
      className={`
        w-full
        h-[170px]
        rounded-2xl
        p-3
        text-left
        hover:shadow-lg
        transition-all
        overflow-hidden
        ${
          esFuturo
            ? "bg-yellow-50 border border-yellow-200 hover:border-yellow-400"
            : "bg-green-50 border border-green-200 hover:border-green-400"
        }
      `}
      title="Clic para editar"
    >

      {/* Cliente + estado */}
      <div className="flex justify-between items-start gap-2">

        <div className="
          font-extrabold
          text-[15px]
          leading-tight
          text-[#131E5C]
          line-clamp-2
        ">
          {nombreCliente}
        </div>


        <span className={`
          rounded-full
          px-2
          py-1
          text-[10px]
          font-bold
          whitespace-nowrap
          ${
            cita.citado
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : "bg-red-100 text-red-700 border border-red-200"
          }
        `}>
          {cita.citado ? "Citado" : "No citado"}
        </span>

      </div>


      {/* Hora */}
      <div className="mt-3">
        <span className="
          inline-flex
          items-center
          gap-1
          rounded-full
          bg-white
          border
          px-3
          py-1
          text-xs
          font-bold
          text-gray-700
        ">
          🕒 {horaCita(cita.fecha_ingreso || cita.fecha_cita)}
        </span>
      </div>


      {/* Servicio */}
      {cita.tipo_cita && (
        <div className="mt-2">

          <span className="
            inline-flex
            items-center
            rounded-full
            bg-green-100
            border
            border-green-300
            px-3
            py-1
            text-xs
            font-bold
            text-green-800
          ">
            🔧 {cita.tipo_cita}
          </span>

        </div>
      )}


      <div className="my-3 border-t border-green-200" />


      {/* Datos */}
      <div className="
        flex
        flex-col
        gap-1
        text-[11px]
        font-semibold
        text-[#131E5C]
      ">

        <span>
          🚗 {cita.modelo || "Vehículo"}
        </span>

        <span>
          🛞 {cita.kilometraje || "0"} km
        </span>

        <span>
          ☎ {cita.telefono || "Sin teléfono"}
        </span>

      </div>


    </button>
  );
}

export default function AgendaView({
  citas = [],
  onSaveCita,
  abrirEditar,
  selectedDate = new Date().toISOString().split("T")[0],
  setSelectedDate = () => {},
  agenciaSeleccionada = "VW Cordoba",
  setAgenciaSeleccionada = () => {}
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState({
    asesor: null,
    hora: null,
    cita: null
  });

   // 👇 PEGA ESTO AQUÍ
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraActual(new Date());
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  const asesores = useMemo(() => {
    return ASESORES_POR_AGENCIA[agenciaSeleccionada] || [];
    
  }, [agenciaSeleccionada]);

  const posicionLineaTiempo = useMemo(() => {

  const hoy = new Date().toISOString().split("T")[0];

  if (selectedDate !== hoy) return null;

  const hora = horaActual.getHours();
  const minutos = horaActual.getMinutes();

  const minutosActuales = (hora * 60) + minutos;

  const inicioAgenda = 8 * 60;
  const finAgenda = (15 * 60) + 30;

  if (
    minutosActuales < inicioAgenda ||
    minutosActuales > finAgenda
  ) {
    return null;
  }

  const minutosDesdeInicio =
    minutosActuales - inicioAgenda;

  const totalMinutosAgenda =
    finAgenda - inicioAgenda;

  const anchoAsesor = 220;
  const anchoSlot = 90;

  const totalSlots = HORARIOS.length;

  const anchoAgenda =
    totalSlots * anchoSlot;

  return (
    anchoAsesor +
    (minutosDesdeInicio / totalMinutosAgenda) *
    anchoAgenda
  );

}, [horaActual, selectedDate]);

  const getHoraFromFecha = (fecha) => {
    if (!fecha) return null;
    const date = new Date(fecha);
    return date.toLocaleTimeString(
      'es-MX',
      {
        hour:'2-digit',
        minute:'2-digit'
      }
    );

  };

 const citasDeLaFecha = useMemo(() => {
    if (!citas || !Array.isArray(citas))
        return [];
    return citas.filter(c => {
        const fechaCita =
            c.fecha_ingreso ||
            c.fecha_cita;
        if (!fechaCita)
            return false;
        const date = new Date(fechaCita);
        const fechaStr =
            date.toISOString().split("T")[0];
        const mismaFecha =
            fechaStr === selectedDate;
        const mismaAgencia =
            !c.agencia ||
            c.agencia === agenciaSeleccionada;
        return mismaFecha && mismaAgencia;
    });
}, [
    citas,
    selectedDate,
    agenciaSeleccionada
]);

  const changeDate = (days)=>{
    const date =
      new Date(selectedDate);
    date.setDate(
      date.getDate()+days
    );
    setSelectedDate(
      date.toISOString().split("T")[0]
    );
  };

  const estadisticas = useMemo(() => {
    const hoy = new Date().toISOString().split("T")[0];
    const esFechaFutura = selectedDate > hoy;
    
    const citados = citasDeLaFecha.filter(c => c.citado === true).length;
    const noCitados = citasDeLaFecha.filter(c => c.citado === false || c.citado === null).length;
    const asistidos = citasDeLaFecha.filter(c => c.asistido === true || c.asistencia === true).length; // 👈 NUEVO
    const noAhora = citasDeLaFecha.filter(c => (c.asistido === null || c.asistencia === null) && c.citado === true).length;
    const entradasTotales = citasDeLaFecha.length;
    
    const mantenimientos = citasDeLaFecha.filter(c => c.tipo_cita?.includes("Mtto") || c.tipo_cita?.includes("Mantenimiento")).length;
    const reparaciones = citasDeLaFecha.filter(c => c.tipo_cita?.includes("Reparacion")).length;
    const diagnosticos = citasDeLaFecha.filter(c => c.tipo_cita?.includes("Diagnóstico") || c.tipo_cita?.includes("Diagnostico")).length;
    const campanias = citasDeLaFecha.filter(c => c.tipo_cita?.includes("Campaña") || c.tipo_cita?.includes("Campaña")).length;
    
    return {
      citados,
      noCitados,
      asistidos,
      noAhora: esFechaFutura ? citasDeLaFecha.filter(c => c.citado === true).length : noAhora,
      entradasTotales,
      mantenimientos: mantenimientos || 0,
      reparaciones: reparaciones || 0,
      diagnosticos: diagnosticos || 0,
      campanias: campanias || 0,
      esFuturo: esFechaFutura,
    };
  }, [citasDeLaFecha, selectedDate]);

const getCita = (asesorNombre, horaSlot) => {
    return citasDeLaFecha.find(c => {
        const asesor = c.asesor || c.nombre_asesor;
        const fechaCita = c.fecha_ingreso || c.fecha_cita;

        if (!fechaCita) return false;

        const date = new Date(fechaCita);

        const horaCita =
            `${date.getHours()}:${String(
                date.getMinutes()
            ).padStart(2,"0")}`;

        return (
            asesor === asesorNombre &&
            horaCita === horaSlot
        );
    });
};

  const handleCellClick = (cita) => {
    if (!cita) return;
    setSelectedCell({ 
      asesor: cita.asesor || cita.nombre_asesor, 
      hora: getHoraFromFecha(cita.fecha_ingreso || cita.fecha_cita), 
      cita 
    });
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    console.log("Guardar cita:", { ...selectedCell, ...formData, fecha: selectedDate });
    
    if (onSaveCita) {
      await onSaveCita({
        ...selectedCell,
        ...formData,
        fecha: selectedDate,
      });
    } else {
      alert(`Cita guardada para ${selectedCell.asesor} a las ${selectedCell.hora}\nCliente: ${formData.cliente}`);
    }
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const hoy = new Date().toISOString().split("T")[0];
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split("T")[0];
    
    if (dateStr === hoy) return "Hoy";
    if (dateStr === mananaStr) return "Mañana";
    return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="w-full space-y-4">
      {/* Indicadores en dos líneas - Diseño mejorado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-3 space-y-2">
        {/* Línea 1: Flujo de Ingresos */}
        <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-extrabold text-[#131E5C] uppercase tracking-wider">
                Flujo de Ingresos:
            </span>
            
            <div className="flex items-center gap-2">
                {/* Citados */}
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    <span className="text-[11px] font-semibold text-gray-600">Citados</span>
                    <span className="text-sm font-extrabold text-emerald-600">{estadisticas.citados}</span>
                </div>
                
                {/* No citados */}
                <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                    <span className="text-[11px] font-semibold text-gray-600">No citados</span>
                    <span className="text-sm font-extrabold text-red-600">{estadisticas.noCitados}</span>
                </div>
                
                {/* 👇 NUEVO: Asistidos */}
                <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <span className="text-[11px] font-semibold text-gray-600">Asistidos</span>
                    <span className="text-sm font-extrabold text-blue-600">{estadisticas.asistidos}</span>
                </div>
                
                {/* No ahora */}
                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                    <span className="text-[11px] font-semibold text-gray-600">No show</span>
                    <span className="text-sm font-extrabold text-yellow-600">{estadisticas.noAhora}</span>
                </div>
                
                {/* Total */}
                <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    <span className="text-[11px] font-semibold text-gray-600">Total</span>
                    <span className="text-sm font-extrabold text-[#131E5C]">{estadisticas.entradasTotales}</span>
                </div>
            </div>
        </div>
        {/* Línea 2: Por Tipo */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-extrabold text-[#131E5C] uppercase tracking-wider">
            Por Tipo:
          </span>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              <span className="text-[11px] font-semibold text-gray-600">Mantenimientos</span>
              <span className="text-sm font-extrabold text-purple-600">{estadisticas.mantenimientos}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <span className="text-[11px] font-semibold text-gray-600">Reparaciones</span>
              <span className="text-sm font-extrabold text-indigo-600">{estadisticas.reparaciones}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
              <span className="text-[11px] font-semibold text-gray-600">Diagnósticos</span>
              <span className="text-sm font-extrabold text-cyan-600">{estadisticas.diagnosticos}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
              <span className="text-[11px] font-semibold text-gray-600">Campañas</span>
              <span className="text-sm font-extrabold text-pink-600">{estadisticas.campanias}</span>
            </div>
          </div>
        </div>
      </div>

        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
    </div>

      {/* Tabla de agenda */}
     <div
        className="
        relative
        overflow-auto
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-xl
        max-h-[650px]

        [&::-webkit-scrollbar]:h-3
        [&::-webkit-scrollbar]:w-3
        [&::-webkit-scrollbar-track]:bg-slate-100
        [&::-webkit-scrollbar-thumb]:bg-slate-400
        [&::-webkit-scrollbar-thumb]:rounded-full
        "
        >
        
        {/* 👇 PEGA ESTO AQUÍ */}
        {posicionLineaTiempo !== null && (

        <div
        className="
        absolute
        top-0
        bottom-0
        w-[3px]
        bg-blue-500
        z-[60]
        pointer-events-none
        "
        style={{
        left: `${posicionLineaTiempo}px`
        }}
        >

        <div
        className="
        absolute
        -top-2
        left-1/2
        -translate-x-1/2
        w-4
        h-4
        rounded-full
        bg-blue-500
        border-2
        border-white
        "
        />

        </div>

        )}

        <table className="min-w-[1400px] table-fixed border-separate border-spacing-0">

        <thead>

        <tr
        className="
        bg-gradient-to-r
        from-[#131E5C]
        to-[#1E2B7B]
        text-white
        sticky
        top-0
        z-20
        shadow-lg
        "
        >

        <th
        className="
        px-4
        py-4
        sticky
        left-0
        bg-[#131E5C]
        z-30
        min-w-[220px]
        text-center
        font-bold
        text-lg
        border-r
        border-white/10
        "
        >
        Asesor
        </th>

        {HORARIOS.filter(h=>h.includes(":00")).map((hora)=>(

        <th
        key={hora}
        colSpan={2}
        className="
        text-center
        font-bold
        text-lg
        border-l
        border-white/10
        "
        >

        {hora}

        </th>

        ))}

        </tr>

        <tr
        className="
        bg-slate-50
        sticky
        top-[56px]
        z-10
        shadow-sm
        "
        >

        <th
        className="
        sticky
        left-0
        bg-slate-50
        z-20
        border-r
        "
        >
        </th>

        {HORARIOS.map((slot)=>(

        <th
        key={slot}
        className="
        text-center
        text-[11px]
        font-bold
        text-slate-500
        py-2
        border-b
        border-slate-200
        "
        >
        {slot}
        </th>

        ))}

        </tr>

        </thead>

        <tbody>

        {asesores.map((asesor)=>{

        const color=getColorAsesor(
        asesor.nombre,
        agenciaSeleccionada
        );

        return(

        <tr
        key={asesor.id}
        className="
        hover:bg-slate-50/30
        transition-all
        "
        >

        <td
        className="
        sticky
        left-0
        bg-white
        border-r
        border-slate-200
        px-4
        min-w-[220px]
        shadow-sm
        z-10
        "
        >

        <div className="flex items-center gap-3 py-4">

        <div
        className={`
        h-3
        w-3
        rounded-full
        ${color.dotClassName}
        shadow-sm
        `}
        />
        <div>
        <div className="font-bold text-[#131E5C]">
        {asesor.nombre}
        </div>
        <div className="text-[11px] text-slate-400">
        Asesor de servicio
        </div>
        </div>
        </div>
        </td>

        {HORARIOS.map((slot)=>{

        const cita=getCita(
        asesor.nombre,
        slot
        );
        return(
        <td
        key={`${asesor.id}-${slot}`}
        className="
        w-[90px]
        h-[120px]
        align-top
        p-2
        border-b
        border-r
        border-slate-100
        bg-gradient-to-b
        from-white
        to-slate-50
        hover:bg-blue-50/40
        transition-all
        duration-300
        "
        >
       <CeldaCita
         cita={cita}
        esFuturo={false}
        onClick={(citaSeleccionada) => {

            abrirEditar(citaSeleccionada);

        }}
        />

        </td>

        );

        })}

        </tr>

        );

        })}

        </tbody>

        </table>

        </div>
      {/* Leyenda de colores */}
      <div className="flex items-center justify-end gap-3 text-[10px] text-gray-400 border-t border-gray-100 pt-3">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Hoy
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
          Futuro
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Citado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          No citado
        </span>
      </div>

      {/* Modal de cita */}
      <ModalCita
        open={modalOpen}
        cita={selectedCell.cita}
        asesor={selectedCell.asesor}
        hora={selectedCell.hora}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}