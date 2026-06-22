// src/pages/HojaIngresos/AgendaView.jsx
import { useMemo, useState } from "react";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

const VW = {
  blue: "#001E50",
  blue2: "#0A2A66",
  electric: "#00B0F0",
  ink: "#111827",
  text: "#24324B",
  muted: "#64748B",
  soft: "#F4F7FB",
  surface: "#FFFFFF",
  line: "#D9DEE8",
  line2: "#EEF1F6",
  ok: "#008A5B",
  okSoft: "#E8F6F0",
  warn: "#B7791F",
  warnSoft: "#FFF4DE",
  danger: "#C83A3A",
  dangerSoft: "#FDECEC",
};

const HORARIOS = [
  "08:00", "08:30",
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
];

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

const TIPOS_SERVICIO = [
  "Mtto. 15 km",
  "Mtto. 30 km",
  "Mtto. 45 km",
  "Mtto. 60 km",
  "Mtto. 75 km",
  "Mtto. 90 km",
  "Diagnóstico",
  "Reparacion",
  "Reparacion Mayor",
  "Reparacion Menor",
  "Diagnostico por Testigos Encendidos",
  "Diagnostico por Ruidos y Vibraciones",
  "Diagnostico por Fallo Electrico-Electronico",
  "Diagnostico por Fallo Mecanico",
  "Garantía",
  "Hojalatería y pintura",
  "Campaña",
  "Reclamación",
  "Otro",
];

const MODELOS = [
  "AMAROK GP", "BEETLE", "BORA A5", "CADDY", "CLASICO", "CRAFTER", "GOL",
  "GOL SEDAN", "GOLF", "JETTA", "JETTA A6", "JETTA A7", "PASSAT", "POLO",
  "SAVEIRO GP", "T CROSS", "TAOS", "TERAMONT", "TIGUAN", "TIGUAN LWB",
  "TRANSPORTER", "VENTO", "VIRTUS", "NIVUS", "TERA",
];

const MEDIOS_CONCERTACION = [
  "WhatsApp",
  "Llamada entrante",
  "Llamada saliente",
  "Facebook",
  "Base de datos",
  "Cartera",
  "Piso",
  "Web",
  "Otro",
];

const ADVISOR_W = 228;
const SLOT_W = 200;
const ROW_H = 146;
const HEADER_H = 82;

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeStr(value) {
  return String(value ?? "").trim();
}

function normalizeKey(value) {
  return normalizeStr(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateHuman(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

function addDaysToYMD(value, days) {
  const [year, month, day] = String(value || localDateKey()).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function getFechaCita(cita) {
  return cita?.fecha_ingreso || cita?.fecha_cita || cita?.fecha || "";
}

function getClienteNombre(cita) {
  return cita?.cliente_nombre || cita?.nombre_cliente || cita?.cliente?.nombre || cita?.cliente || "Sin cliente";
}

function getTelefono(cita) {
  return cita?.cliente_telefono || cita?.telefono || cita?.cliente?.telefono || "";
}

function getCorreo(cita) {
  return cita?.cliente_correo_electronico || cita?.correo_electronico || cita?.cliente?.correo_electronico || "";
}

function boolFromAny(value) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes"].includes(text);
}

function slotFromDate(fecha) {
  if (!fecha) return null;
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;

  const total = date.getHours() * 60 + date.getMinutes();
  const start = 8 * 60;
  const end = 15 * 60 + 30;
  if (total < start || total > end) return null;

  const rounded = start + Math.floor((total - start) / 30) * 30;
  return `${pad2(Math.floor(rounded / 60))}:${pad2(rounded % 60)}`;
}

function timeFromDate(fecha) {
  if (!fecha) return "—";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "—";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function servicioMeta(tipo) {
  const text = String(tipo || "").toLowerCase();

  if (text.includes("mtto") || text.includes("mantenimiento")) {
    return { label: "Mantenimiento", bg: "#EAF1FF", text: VW.blue, line: "#BFD0F3" };
  }
  if (text.includes("diagn")) {
    return { label: "Diagnóstico", bg: "#EEF2F7", text: "#334155", line: "#D5DCE8" };
  }
  if (text.includes("garant")) {
    return { label: "Garantía", bg: "#E7F7F2", text: VW.ok, line: "#B8E5D4" };
  }
  if (text.includes("campa")) {
    return { label: "Campaña", bg: "#F0ECFF", text: "#5B45C4", line: "#D7CDFB" };
  }
  if (text.includes("repar")) {
    return { label: "Reparación", bg: VW.dangerSoft, text: VW.danger, line: "#F3C1C1" };
  }

  return { label: tipo || "Servicio", bg: VW.soft, text: VW.muted, line: VW.line };
}

function advisorColor(nombre) {
  const palette = [
    { dot: VW.blue, bg: "#EAF1FF" },
    { dot: "#007C92", bg: "#E6F6F8" },
    { dot: "#6D5BD0", bg: "#F0ECFF" },
    { dot: VW.ok, bg: VW.okSoft },
    { dot: VW.warn, bg: VW.warnSoft },
    { dot: VW.danger, bg: VW.dangerSoft },
  ];

  let hash = 0;
  const value = normalizeStr(nombre);
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return palette[hash % palette.length] || palette[0];
}

function StatusBadge({ cita }) {
  const citado = boolFromAny(cita?.citado);
  const asistencia = boolFromAny(cita?.asistencia ?? cita?.asistido);

  if (asistencia) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: VW.okSoft, color: VW.ok }}>
        <CheckCircle2 className="h-3 w-3" /> Asistió
      </span>
    );
  }

  if (citado) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#EAF1FF", color: VW.blue }}>
        <ShieldCheck className="h-3 w-3" /> Citado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: VW.dangerSoft, color: VW.danger }}>
      <XCircle className="h-3 w-3" /> Pendiente
    </span>
  );
}

function Metric({ label, value, tone = "blue" }) {
  const tones = {
    blue: { bg: "#EAF1FF", text: VW.blue },
    green: { bg: VW.okSoft, text: VW.ok },
    amber: { bg: VW.warnSoft, text: VW.warn },
    red: { bg: VW.dangerSoft, text: VW.danger },
    gray: { bg: VW.soft, text: VW.text },
  };
  const color = tones[tone] || tones.blue;

  return (
    <div className="rounded-2xl border px-4 py-3" style={{ background: color.bg, borderColor: "rgba(0,0,0,0.04)" }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: VW.muted }}>{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: color.text }}>{value}</div>
    </div>
  );
}

function CitaCard({ citas, onOpen }) {
  if (!citas?.length) return null;

  const cita = citas[0];
  const extra = citas.length - 1;

  const servicio = servicioMeta(cita.tipo_cita);
  const cliente = getClienteNombre(cita);
  const telefono = getTelefono(cita);
  const hora = timeFromDate(getFechaCita(cita));
  const modelo = normalizeStr(cita.modelo || cita.modelo_vehiculo || cita.vehiculo);
  const orden = normalizeStr(cita.no_orden || cita.preorden || cita.orden);

  return (
    <button
      type="button"
      onClick={() => onOpen(cita)}
      className="
        group
        relative
        h-[112px]
        w-full
        overflow-hidden
        rounded-[18px]
        border
        bg-white
        px-3
        py-2.5
        text-left
        shadow-[0_8px_22px_rgba(0,30,80,0.08)]
        transition
        hover:-translate-y-0.5
        hover:shadow-[0_14px_34px_rgba(0,30,80,0.16)]
      "
      style={{
        borderColor: servicio.line,
        boxShadow: "0 8px 22px rgba(0,30,80,0.08)",
      }}
      title="Clic para editar cita"
    >
      {/* Barra lateral semántica */}
      <span
        className="absolute bottom-0 left-0 top-0 w-1"
        style={{ background: servicio.text }}
      />

      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="min-w-0">
          <div
            className="truncate text-[13px] font-black leading-tight"
            style={{ color: VW.ink }}
          >
            {cliente}
          </div>

          <div
            className="mt-1 flex min-w-0 items-center gap-1.5 text-[10.5px] font-semibold"
            style={{ color: VW.muted }}
          >
            <Phone className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {telefono || "Sin teléfono"}
            </span>
          </div>
        </div>

        <span
          className="
            shrink-0
            rounded-full
            px-2
            py-1
            text-[10.5px]
            font-black
            tabular-nums
          "
          style={{
            background: "#EAF1FF",
            color: VW.blue,
          }}
        >
          {hora}
        </span>
      </div>

      {/* Servicio */}
      <div className="mt-2 pl-1">
        <div
          className="
            inline-flex
            max-w-full
            items-center
            gap-1.5
            rounded-full
            border
            px-2
            py-1
            text-[10.5px]
            font-black
          "
          style={{
            background: servicio.bg,
            borderColor: servicio.line,
            color: servicio.text,
          }}
        >
          <Wrench className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {servicio.label}
          </span>
        </div>
      </div>

      {/* Datos inferiores */}
      <div className="mt-2 flex items-center justify-between gap-2 pl-1">
        <div
          className="flex min-w-0 items-center gap-1.5 text-[10.5px] font-semibold"
          style={{ color: VW.muted }}
        >
          <CarFront className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {modelo || orden || "Sin vehículo"}
          </span>
        </div>

        <StatusBadge cita={cita} />
      </div>

      {/* Citas adicionales en la misma celda */}
      {extra > 0 ? (
        <div
          className="
            absolute
            bottom-2
            right-2
            rounded-full
            px-2
            py-0.5
            text-[10px]
            font-black
            text-white
            shadow-sm
          "
          style={{ background: VW.blue }}
        >
          +{extra}
        </div>
      ) : null}
    </button>
  );
}
function QuickCitaModal({ open, slot, agencia, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_correo_electronico: "",
    tipo_cita: "Mtto. 15 km",
    modelo: "",
    medio_concertacion: "WhatsApp",
    comentarios: "",
    citado: true,
  });

  if (!open || !slot) return null;

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    const cliente = normalizeStr(form.cliente_nombre);
    const telefono = normalizeStr(form.cliente_telefono).replace(/\D/g, "");

    if (!cliente) {
      alert("Captura el nombre del cliente.");
      return;
    }

    if (telefono && !/^(?:\d{10}|52\d{10})$/.test(telefono)) {
      alert("El teléfono debe tener 10 dígitos o iniciar con 52 y tener 12 dígitos.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        agencia,
        asesor: slot.asesor,
        fecha_ingreso: `${slot.fecha}T${slot.hora}`,
        cliente_nombre: cliente,
        cliente_telefono: telefono,
        cliente_correo_electronico: normalizeStr(form.cliente_correo_electronico),
        tipo_cita: form.tipo_cita ? [form.tipo_cita] : [],
        modelo: form.modelo || "",
        medio_concertacion: form.medio_concertacion || "WhatsApp",
        comentarios: form.comentarios || "",
        citado: !!form.citado,
        asistencia: false,
        agendado_por: "Call Center",
        venta_mano_obra: "0",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} aria-label="Cerrar" />

      <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
          <div className="border-b px-6 py-5" style={{ borderColor: VW.line2 }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: VW.blue }}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border text-[10px]" style={{ borderColor: VW.blue }}>VW</span>
                  Nueva cita de servicio
                </div>
                <h3 className="mt-2 text-xl font-semibold" style={{ color: VW.ink }}>
                  {slot.asesor} · {slot.hora}
                </h3>
                <p className="mt-1 text-sm" style={{ color: VW.muted }}>
                  {formatDateHuman(slot.fecha)} · {agencia}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white"
                style={{ borderColor: VW.line }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2" style={{ background: VW.soft }}>
            <label className="md:col-span-2">
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>
                <UserRound className="h-3.5 w-3.5" /> Cliente
              </span>
              <input
                value={form.cliente_nombre}
                onChange={(event) => setValue("cliente_nombre", event.target.value)}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
                placeholder="Nombre completo del cliente"
              />
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>
                <Phone className="h-3.5 w-3.5" /> Teléfono
              </span>
              <input
                value={form.cliente_telefono}
                onChange={(event) => setValue("cliente_telefono", event.target.value.replace(/\D/g, "").slice(0, 12))}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
                placeholder="10 dígitos"
              />
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>
                <Mail className="h-3.5 w-3.5" /> Correo
              </span>
              <input
                type="email"
                value={form.cliente_correo_electronico}
                onChange={(event) => setValue("cliente_correo_electronico", event.target.value)}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
                placeholder="correo@dominio.com"
              />
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>
                <Wrench className="h-3.5 w-3.5" /> Servicio
              </span>
              <select
                value={form.tipo_cita}
                onChange={(event) => setValue("tipo_cita", event.target.value)}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
              >
                {TIPOS_SERVICIO.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>
                <CarFront className="h-3.5 w-3.5" /> Modelo
              </span>
              <select
                value={form.modelo}
                onChange={(event) => setValue("modelo", event.target.value)}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
              >
                <option value="">Selecciona modelo...</option>
                {MODELOS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>
                <Search className="h-3.5 w-3.5" /> Medio
              </span>
              <select
                value={form.medio_concertacion}
                onChange={(event) => setValue("medio_concertacion", event.target.value)}
                className="h-11 w-full rounded-2xl border bg-white px-4 text-sm font-semibold outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
              >
                {MEDIOS_CONCERTACION.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label className="flex items-end">
              <span className="flex h-11 w-full items-center justify-between rounded-2xl border bg-white px-4 text-sm font-bold" style={{ borderColor: VW.line, color: VW.text }}>
                Marcar como citado
                <input
                  type="checkbox"
                  checked={form.citado}
                  onChange={(event) => setValue("citado", event.target.checked)}
                  className="h-4 w-4"
                  style={{ accentColor: VW.blue }}
                />
              </span>
            </label>

            <label className="md:col-span-2">
              <span className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: VW.text }}>Comentarios</span>
              <textarea
                value={form.comentarios}
                onChange={(event) => setValue("comentarios", event.target.value)}
                className="min-h-[92px] w-full rounded-2xl border bg-white px-4 py-3 text-sm font-medium outline-none focus:ring-4"
                style={{ borderColor: VW.line, color: VW.ink, "--tw-ring-color": "rgba(0,176,240,0.16)" }}
                placeholder="Notas internas para recepción o asesor de servicio..."
              />
            </label>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t bg-white px-6 py-4 sm:flex-row sm:justify-end" style={{ borderColor: VW.line2 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-bold"
              style={{ borderColor: VW.line, color: VW.text }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: VW.blue }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cita
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgendaView({
  citas = [],
  onSaveCita,
  abrirEditar,
  selectedDate = localDateKey(),
  setSelectedDate = () => { },
  agenciaSeleccionada = "VW Cordoba",
  setAgenciaSeleccionada = () => { },
}) {
  const [quickSlot, setQuickSlot] = useState(null);

  const asesores = useMemo(() => ASESORES_POR_AGENCIA[agenciaSeleccionada] || [], [agenciaSeleccionada]);

  const citasDeLaFecha = useMemo(() => {
    if (!Array.isArray(citas)) return [];

    return citas.filter((cita) => {
      const fecha = getFechaCita(cita);
      if (!fecha) return false;
      const mismaFecha = localDateKey(fecha) === selectedDate;
      const mismaAgencia = !cita.agencia || normalizeKey(cita.agencia) === normalizeKey(agenciaSeleccionada);
      return mismaFecha && mismaAgencia;
    });
  }, [citas, selectedDate, agenciaSeleccionada]);

  const citasPorCelda = useMemo(() => {
    const map = new Map();

    citasDeLaFecha.forEach((cita) => {
      const asesor = normalizeStr(cita.asesor || cita.nombre_asesor);
      const slot = slotFromDate(getFechaCita(cita));
      if (!asesor || !slot) return;

      const key = `${normalizeKey(asesor)}|${slot}`;
      const current = map.get(key) || [];
      current.push(cita);
      map.set(key, current);
    });

    return map;
  }, [citasDeLaFecha]);

  const metrics = useMemo(() => {
    const citados = citasDeLaFecha.filter((cita) => boolFromAny(cita.citado)).length;
    const asistencias = citasDeLaFecha.filter((cita) => boolFromAny(cita.asistencia ?? cita.asistido)).length;
    const pendientes = citasDeLaFecha.length - citados;
    const ocupacion = Math.round((citasDeLaFecha.length / Math.max(asesores.length * HORARIOS.length, 1)) * 100);

    return { total: citasDeLaFecha.length, citados, asistencias, pendientes, ocupacion };
  }, [citasDeLaFecha, asesores.length]);

  const currentLineLeft = useMemo(() => {
    const today = localDateKey();
    if (selectedDate !== today) return null;

    const now = new Date();
    const start = 8 * 60;
    const end = 15 * 60 + 30;
    const current = now.getHours() * 60 + now.getMinutes();
    if (current < start || current > end) return null;

    return ADVISOR_W + ((current - start) / 30) * SLOT_W;
  }, [selectedDate]);

  const gridTemplateColumns = `${ADVISOR_W}px repeat(${HORARIOS.length}, ${SLOT_W}px)`;
  const gridMinWidth = ADVISOR_W + HORARIOS.length * SLOT_W;

  async function handleQuickSave(payload) {
    if (!onSaveCita) return;
    await onSaveCita(payload);
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[30px] border bg-white shadow-[0_18px_50px_rgba(0,30,80,0.08)]" style={{ borderColor: VW.line2 }}>
        <div className="border-b px-5 py-5" style={{ borderColor: VW.line2 }}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border text-xs font-black" style={{ borderColor: VW.blue, color: VW.blue }}>
                  VW
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.28em]" style={{ color: VW.blue }}>
                    Volkswagen Service Planning
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: VW.ink }}>
                    Agenda de taller
                  </h2>
                </div>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: VW.muted }}>
                Vista por asesor y bloques de 30 minutos. Las columnas tienen ancho fijo para mantener la lectura operativa sin deformar la parrilla.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Metric label="Total" value={metrics.total} tone="blue" />
              <Metric label="Citados" value={metrics.citados} tone="green" />
              <Metric label="Pendientes" value={metrics.pendientes} tone="red" />
              <Metric label="Asistió" value={metrics.asistencias} tone="gray" />
              <Metric label="Ocupación" value={`${metrics.ocupacion}%`} tone="amber" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b px-5 py-4 lg:grid-cols-[1fr_auto]" style={{ background: VW.soft, borderColor: VW.line2 }}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate(addDaysToYMD(selectedDate, -1))}
              className="inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4 text-sm font-bold"
              style={{ borderColor: VW.line, color: VW.text }}
            >
              <ChevronLeft className="h-4 w-4" /> Día anterior
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(localDateKey())}
              className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-bold text-white"
              style={{ background: VW.blue }}
            >
              <CalendarDays className="h-4 w-4" /> Hoy
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(addDaysToYMD(selectedDate, 1))}
              className="inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4 text-sm font-bold"
              style={{ borderColor: VW.line, color: VW.text }}
            >
              Día siguiente <ChevronRight className="h-4 w-4" />
            </button>

            <label className="inline-flex h-10 items-center gap-2 rounded-full border bg-white px-4" style={{ borderColor: VW.line }}>
              <CalendarDays className="h-4 w-4" style={{ color: VW.blue }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="bg-transparent text-sm font-bold outline-none"
                style={{ color: VW.text }}
              />
            </label>

            <span className="ml-1 text-sm font-semibold capitalize" style={{ color: VW.muted }}>
              {formatDateHuman(selectedDate)}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            {Object.keys(ASESORES_POR_AGENCIA).map((agencia) => (
              <button
                type="button"
                key={agencia}
                onClick={() => setAgenciaSeleccionada(agencia)}
                className="h-10 rounded-full border px-4 text-sm font-black transition"
                style={
                  agenciaSeleccionada === agencia
                    ? { background: VW.blue, borderColor: VW.blue, color: "#fff" }
                    : { background: "#fff", borderColor: VW.line, color: VW.text }
                }
              >
                {agencia}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-h-[calc(100vh-330px)] min-h-[460px] overflow-auto bg-white">
          <div className="relative" style={{ minWidth: gridMinWidth }}>
            {currentLineLeft !== null ? (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-30 w-px"
                style={{ left: currentLineLeft, background: VW.electric }}
              >
                <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 bg-white" style={{ borderColor: VW.electric }} />
              </div>
            ) : null}

            <div
              className="sticky top-0 z-40 grid border-b"
              style={{ gridTemplateColumns, borderColor: VW.line2, minWidth: gridMinWidth }}
            >
              <div
                className="sticky left-0 z-50 flex items-center border-r px-5"
                style={{ height: HEADER_H, background: VW.blue, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <UsersRound className="h-4 w-4" /> Asesor
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-white/60">Servicio · Recepción</div>
                </div>
              </div>

              {HORARIOS.map((slot) => {
                const isHour = slot.endsWith(":00");
                return (
                  <div
                    key={slot}
                    className="flex flex-col items-center justify-center border-r text-center"
                    style={{ height: HEADER_H, background: VW.blue, borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    <div className={cn("font-black tabular-nums text-white", isHour ? "text-sm" : "text-xs text-white/65")}>
                      {slot}
                    </div>
                    {isHour ? <div className="mt-1 h-1 w-8 rounded-full" style={{ background: VW.electric }} /> : null}
                  </div>
                );
              })}
            </div>

            {asesores.length === 0 ? (
              <div className="flex min-h-[360px] items-center justify-center p-10 text-center" style={{ color: VW.muted }}>
                No hay asesores configurados para esta agencia.
              </div>
            ) : (
              asesores.map((asesor, rowIndex) => {
                const color = advisorColor(asesor.nombre);
                return (
                  <div
                    key={asesor.id || asesor.nombre}
                    className="grid border-b"
                    style={{ gridTemplateColumns, minWidth: gridMinWidth, borderColor: VW.line2 }}
                  >
                    <div
                      className="sticky left-0 z-20 flex items-center border-r px-5"
                      style={{ minHeight: ROW_H, background: "#fff", borderColor: VW.line2 }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black" style={{ background: color.bg, color: color.dot }}>
                          {asesor.nombre.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black" style={{ color: VW.ink }}>{asesor.nombre}</div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold" style={{ color: VW.muted }}>
                            <span className="h-2 w-2 rounded-full" style={{ background: color.dot }} /> Asesor de servicio
                          </div>
                        </div>
                      </div>
                    </div>

                    {HORARIOS.map((slot) => {
                      const key = `${normalizeKey(asesor.nombre)}|${slot}`;
                      const citasCelda = citasPorCelda.get(key) || [];
                      const ocupado = citasCelda.length > 0;

                      return (
                        <div
                          key={`${asesor.id}-${slot}`}
                          className="group border-r p-2"
                          style={{
                            minHeight: ROW_H,
                            width: SLOT_W,
                            borderColor: VW.line2,
                            background: rowIndex % 2 === 0 ? "#FFFFFF" : "#FBFCFE",
                          }}
                        >
                          {ocupado ? (
                            <CitaCard citas={citasCelda} onOpen={(cita) => abrirEditar?.(cita)} />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setQuickSlot({ asesor: asesor.nombre, hora: slot, fecha: selectedDate })}
                              className="flex h-[112px] w-full items-center justify-center rounded-2xl border border-dashed opacity-0 transition hover:bg-white group-hover:opacity-100"
                              style={{ borderColor: VW.line }}
                              title={`Crear cita ${asesor.nombre} · ${slot}`}
                            >
                              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black" style={{ background: "#EAF1FF", color: VW.blue }}>
                                <Plus className="h-3.5 w-3.5" /> Cita
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-xs font-semibold" style={{ background: "#fff", borderColor: VW.line2, color: VW.muted }}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: VW.electric }} /> Hora actual</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-1 rounded-full" style={{ background: VW.ok }} /> Asistió / citado</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-1 rounded-full" style={{ background: VW.danger }} /> Pendiente</span>
          </div>
          <span>Scroll horizontal disponible cuando la agenda supere el ancho de pantalla.</span>
        </div>
      </section>

      <QuickCitaModal
        open={!!quickSlot}
        slot={quickSlot}
        agencia={agenciaSeleccionada}
        onClose={() => setQuickSlot(null)}
        onSave={handleQuickSave}
      />
    </div>
  );
}
