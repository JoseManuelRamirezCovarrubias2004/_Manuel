//src/pages/HojaIngresos/AgendaView.jsx
import { useMemo, useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Phone,
  Plus,
  Users,
  Wrench,
  XCircle,
  ChevronRight,
} from "lucide-react";

const COLOR = {
  ink: "#07111F",
  inkSoft: "#566273",
  inkFaint: "#8793A5",
  inkInverse: "#FFFFFF",

  brand: "#001E50",
  brandDeep: "#000B24",
  brandMid: "#003B78",
  brandSoft: "#E9F0FA",
  brandLine: "#BFD0E7",

  accent: "#00B0F0",
  accentSoft: "#E7F8FE",
  accentLine: "#A7E5FA",

  page: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFD",
  line: "#DDE5EF",
  lineStrong: "#C5D1E1",

  ok: "#0B7A53",
  okSoft: "#E4F5ED",
  warn: "#9A6400",
  warnSoft: "#FBF1DC",
  danger: "#B42318",
  dangerSoft: "#FDEAE7",
  violet: "#4B3F99",
  violetSoft: "#ECEAF8",
  teal: "#087780",
  tealSoft: "#E0F4F5",
};

const FONT_DISPLAY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const ASESOR_PALETTE = [
  { bg: "#E8F0FA", line: "#BFD0E7", dot: "#001E50", text: "#001E50" },
  { bg: "#E0F4F5", line: "#B9E0E3", dot: "#087780", text: "#075D65" },
  { bg: "#FBF1DC", line: "#EDD59E", dot: "#9A6400", text: "#754D00" },
  { bg: "#ECEAF8", line: "#D2CDEF", dot: "#4B3F99", text: "#3D337D" },
  { bg: "#E4F5ED", line: "#B9E2CD", dot: "#0B7A53", text: "#075F40" },
  { bg: "#FDEAE7", line: "#F3C4BC", dot: "#B42318", text: "#912018" },
];

function colorForAsesor(nombre) {
  if (!nombre) return { bg: "#EEF2F7", line: "#DDE5EF", dot: "#8A95A6", text: "#536070" };
  let hash = 0;
  for (let i = 0; i < nombre.length; i += 1) hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  return ASESOR_PALETTE[hash % ASESOR_PALETTE.length];
}

function tipoServicioMeta(tipo) {
  const t = String(tipo || "").toLowerCase();
  if (t.includes("mtto") || t.includes("mantenimiento")) {
    return { bg: COLOR.brandSoft, line: COLOR.brandLine, text: COLOR.brand, label: "Mantenimiento" };
  }
  if (t.includes("diagn")) {
    return { bg: "#EEF2F7", line: "#DDE5EF", text: "#3E4858", label: "Diagnóstico" };
  }
  if (t.includes("campa")) {
    return { bg: COLOR.violetSoft, line: "#D2CDEF", text: COLOR.violet, label: "Campaña" };
  }
  if (t.includes("repar")) {
    return { bg: COLOR.dangerSoft, line: "#F3C4BC", text: COLOR.danger, label: "Reparación" };
  }
  if (t.includes("garant")) {
    return { bg: COLOR.tealSoft, line: "#B9E0E3", text: COLOR.teal, label: "Garantía" };
  }
  return { bg: "#EEF2F7", line: COLOR.line, text: COLOR.inkSoft, label: tipo || "Servicio" };
}

const APERTURA_DEFECTO = { hour: 8, minute: 0 };
const CIERRE_DEFECTO = { hour: 16, minute: 0 };

const ADVISOR_COL_WIDTH = 320;
const SLOT_WIDTH = 186;
const ROW_HEIGHT = 192;
const HEADER_H1 = 46;
const HEADER_H2 = 32;

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

const MEXICO_TZ = "America/Mexico_City";

function buildHorarios(inicio, fin) {
  const slots = [];
  let totalMin = inicio.hour * 60 + inicio.minute;
  const finMin = fin.hour * 60 + fin.minute;
  while (totalMin < finMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    slots.push(`${h}:${String(m).padStart(2, "0")}`);
    totalMin += 30;
  }
  return slots;
}

function mexicoYMD(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: MEXICO_TZ });
}

function mexicoHourMinute(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  const hour = parseInt(d.toLocaleString("en-US", { timeZone: MEXICO_TZ, hour: "numeric", hour12: false }), 10);
  const minute = parseInt(d.toLocaleString("en-US", { timeZone: MEXICO_TZ, minute: "numeric" }), 10);
  return { hour, minute };
}

function slotKeyFromFecha(fecha) {
  const hm = mexicoHourMinute(fecha);
  if (!hm) return null;
  const minutoSlot = hm.minute < 30 ? 0 : 30;
  return `${hm.hour}:${minutoSlot === 0 ? "00" : "30"}`;
}

function horaCorta(fecha) {
  const hm = mexicoHourMinute(fecha);
  if (!hm) return "";
  return `${hm.hour}:${String(hm.minute).padStart(2, "0")}`;
}

function nombreCliente(cita) {
  return cita?.nombre_cliente || cita?.cliente_nombre || cita?.cliente?.nombre || "Sin nombre";
}

function telefonoCliente(cita) {
  return cita?.telefono || cita?.cliente?.telefono || cita?.cliente_telefono || "";
}

function citaCitada(cita) {
  return cita?.citado === true || cita?.citado === "true" || cita?.citado === 1;
}

function citaAsistio(cita) {
  return cita?.asistido ?? cita?.asistencia;
}

function MetricTile({ icon: Icon, label, value, tone = "brand" }) {
  const tones = {
    brand: { bg: COLOR.brandSoft, text: COLOR.brand },
    ok: { bg: COLOR.okSoft, text: COLOR.ok },
    danger: { bg: COLOR.dangerSoft, text: COLOR.danger },
    accent: { bg: COLOR.accentSoft, text: COLOR.brandMid },
  };
  const selected = tones[tone] || tones.brand;

  return (
    <div
      className="min-w-[160px] flex-1 rounded-[24px] border px-4 py-3"
      style={{ background: COLOR.surface, borderColor: COLOR.line, boxShadow: "0 16px 36px rgba(0, 30, 80, 0.06)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: COLOR.inkFaint }}>
          {label}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: selected.bg }}>
          <Icon className="h-4 w-4" style={{ color: selected.text }} />
        </div>
      </div>
      <div className="mt-3 text-[28px] font-semibold leading-none tabular-nums" style={{ color: COLOR.ink, fontFamily: FONT_DISPLAY }}>
        {value}
      </div>
    </div>
  );
}

function CargaTurno({ citasDeLaFecha, horasPrincipales, totalAsesores }) {
  const counts = useMemo(() => {
    const map = {};
    horasPrincipales.forEach((h) => (map[h] = 0));
    citasDeLaFecha.forEach((c) => {
      const fecha = c.fecha_ingreso || c.fecha_cita;
      const hm = mexicoHourMinute(fecha);
      if (!hm) return;
      const key = `${hm.hour}:00`;
      if (map[key] !== undefined) map[key] += 1;
    });
    return map;
  }, [citasDeLaFecha, horasPrincipales]);

  const capacidad = Math.max(totalAsesores * 2, 1);

  return (
    <div className="flex items-end gap-[4px]" style={{ height: 34 }} aria-hidden="true">
      {horasPrincipales.map((h) => {
        const n = counts[h] || 0;
        const ratio = Math.min(n / capacidad, 1);
        const height = 6 + ratio * 28;
        const bg = ratio === 0 ? COLOR.line : ratio < 0.65 ? COLOR.accent : COLOR.brand;
        return <div key={h} title={`${h} · ${n} cita(s)`} style={{ width: 10, height, background: bg, borderRadius: 999 }} />;
      })}
    </div>
  );
}

function AdvisorAvatar({ nombre, color }) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-[12px] font-bold"
      style={{ background: color.bg, color: color.text, border: `1px solid ${color.line}` }}
    >
      {iniciales}
    </div>
  );
}

function AdvisorStats({ asesor, color, citasAsesor }) {
  const total = citasAsesor.length;
  const citados = citasAsesor.filter((c) => citaCitada(c)).length;
  const asistidos = citasAsesor.filter((c) => citaAsistio(c) === true).length;
  const ocupacion = Math.min(Math.round((total / 8) * 100), 100);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <AdvisorAvatar nombre={asesor.nombre} color={color} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-tight" style={{ color: COLOR.ink }}>
          {asesor.nombre}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-[10.5px] font-semibold tabular-nums">
          <span style={{ color: COLOR.inkFaint }}>
            <span style={{ color: COLOR.ink }}>{total}</span> citas
          </span>
          <span style={{ color: COLOR.brand }}>{citados} citadas</span>
          <span style={{ color: COLOR.ok }}>{asistidos} asist.</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: COLOR.line }}>
          <div className="h-full rounded-full" style={{ width: `${ocupacion}%`, background: color.dot }} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ asistio, citado }) {
  if (asistio === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-bold" style={{ background: COLOR.okSoft, color: COLOR.ok }}>
        <CheckCircle2 className="h-3 w-3" /> Asistió
      </span>
    );
  }

  if (asistio === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-bold" style={{ background: COLOR.dangerSoft, color: COLOR.danger }}>
        <XCircle className="h-3 w-3" /> No show
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-bold"
      style={citado ? { background: COLOR.brandSoft, color: COLOR.brand } : { background: COLOR.warnSoft, color: COLOR.warn }}
    >
      {citado ? "Citado" : "Pendiente"}
    </span>
  );
}

function CitaCard({ cita, onClick, compact = false }) {
  const cliente = nombreCliente(cita);
  const telefono = telefonoCliente(cita);
  const servicio = tipoServicioMeta(cita.tipo_cita);
  const asistio = citaAsistio(cita);
  const citado = citaCitada(cita);
  const modelo = cita.modelo || "Modelo sin capturar";
  const medio = cita.medio_concertacion || "Medio sin capturar";
  const agencia = cita.agencia || "Sin dealer";

  const tone = asistio === true
    ? "entregada"
    : asistio === false
      ? "noShow"
      : citado
        ? "citada"
        : "pendiente";

  const toneClass = {
    entregada: "border-emerald-300 bg-emerald-50/95",
    citada: "border-sky-200 bg-sky-50/95",
    pendiente: "border-amber-300 bg-amber-50/95",
    noShow: "border-red-300 bg-red-50/95",
  }[tone];

  const stripeClass = {
    entregada: "bg-emerald-500",
    citada: "bg-[#131E5C]",
    pendiente: "bg-amber-500",
    noShow: "bg-red-500",
  }[tone];

  return (
    <button
      type="button"
      onClick={() => onClick(cita)}
      title={`${cliente} · clic para editar`}
      className={[
        "relative h-full shrink-0 overflow-hidden rounded-md border text-left shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
        compact ? "w-[154px] p-3" : "w-full p-2.5",
        toneClass,
      ].join(" ")}
    >
      {tone !== "citada" ? (
        <span className={["absolute bottom-0 left-0 top-0 flex w-3 items-center justify-center rounded-l-md", stripeClass].join(" ")}>
          {asistio === true ? <CheckCircle2 className="h-3 w-3 text-white" /> : null}
          {asistio === false ? <XCircle className="h-3 w-3 text-white" /> : null}
          {tone === "pendiente" ? <Clock3 className="h-3 w-3 text-white" /> : null}
        </span>
      ) : null}

      <div className={tone !== "citada" ? "pl-3" : ""}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#131E5C]">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{horaCorta(cita.fecha_ingreso || cita.fecha_cita)}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate">{agencia}</span>
            </div>

            <div className="mt-1 truncate text-xs font-black uppercase tracking-wide text-[#131E5C]">
              {cliente}
            </div>
          </div>

          <StatusPill asistio={asistio} citado={citado} />
        </div>

        <div className="mt-2 grid gap-1 text-[10px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">{cita.tipo_cita || servicio.label || "Servicio sin capturar"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
            <span className="truncate">{modelo}</span>
          </div>

          {!compact ? (
            <>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                <span className="truncate">{telefono || "Teléfono sin capturar"}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-[#131E5C]" />
                <span className="truncate">{medio}</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function EmptySlot({ onClick, slot }) {
  return (
    <div
      className="group relative h-full w-full overflow-hidden rounded-[22px] border border-dashed transition-all duration-150"
      style={{ borderColor: COLOR.line, background: "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(248,250,253,0.86))" }}
    >
      <div className="absolute inset-0 transition-opacity duration-150 group-hover:opacity-0">
        <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2" style={{ background: COLOR.line }} />
        <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2" style={{ background: COLOR.line }} />
        <div className="flex h-full items-center justify-center">
          <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold tabular-nums" style={{ borderColor: COLOR.line, color: COLOR.inkFaint, background: COLOR.surface }}>
            {slot}
          </span>
        </div>
      </div>

      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          title={`Agendar a las ${slot}`}
          className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 scale-90 items-center justify-center rounded-full opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
          style={{ background: COLOR.brand, color: COLOR.inkInverse }}
        >
          <Plus className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}

export default function AgendaView({
  citas = [],
  abrirEditar,
  onSlotClick,
  selectedDate = new Date().toISOString().split("T")[0],
  agenciaSeleccionada = "VW Cordoba",
}) {
  const [reloj, setReloj] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setReloj(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const asesores = useMemo(() => ASESORES_POR_AGENCIA[agenciaSeleccionada] || [], [agenciaSeleccionada]);

  const citasDeLaFecha = useMemo(() => {
    if (!Array.isArray(citas)) return [];
    return citas.filter((c) => {
      const fecha = c.fecha_ingreso || c.fecha_cita;
      if (!fecha) return false;
      const mismaFecha = mexicoYMD(fecha) === selectedDate;
      const mismaAgencia = !c.agencia || c.agencia === agenciaSeleccionada;
      return mismaFecha && mismaAgencia;
    });
  }, [citas, selectedDate, agenciaSeleccionada]);

  const rangoHorario = useMemo(() => {
    let cierreMin = CIERRE_DEFECTO.hour * 60 + CIERRE_DEFECTO.minute;
    citasDeLaFecha.forEach((c) => {
      const fecha = c.fecha_ingreso || c.fecha_cita;
      const hm = mexicoHourMinute(fecha);
      if (!hm) return;
      const minutoRedondeado = hm.minute < 30 ? 30 : 60;
      const finCitaMin = hm.hour * 60 + minutoRedondeado;
      if (finCitaMin > cierreMin) cierreMin = finCitaMin;
    });
    return { inicio: APERTURA_DEFECTO, fin: { hour: Math.floor(cierreMin / 60), minute: cierreMin % 60 } };
  }, [citasDeLaFecha]);

  const horarios = useMemo(() => buildHorarios(rangoHorario.inicio, rangoHorario.fin), [rangoHorario]);
  const horasPrincipales = useMemo(() => horarios.filter((h) => h.endsWith(":00")), [horarios]);

  const citasPorCelda = useMemo(() => {
    const map = new Map();
    citasDeLaFecha.forEach((c) => {
      const asesor = c.asesor || c.nombre_asesor;
      const fecha = c.fecha_ingreso || c.fecha_cita;
      const slot = slotKeyFromFecha(fecha);
      if (!asesor || !slot) return;
      const key = `${asesor}__${slot}`;
      const current = map.get(key) || [];
      current.push(c);
      current.sort((a, b) => new Date(a.fecha_ingreso || a.fecha_cita).getTime() - new Date(b.fecha_ingreso || b.fecha_cita).getTime());
      map.set(key, current);
    });
    return map;
  }, [citasDeLaFecha]);

  const estadisticas = useMemo(() => {
    const hoy = mexicoYMD(new Date());
    const esFuturo = selectedDate > hoy;
    const citados = citasDeLaFecha.filter((c) => citaCitada(c)).length;
    const asistidos = citasDeLaFecha.filter((c) => citaAsistio(c) === true).length;
    const noShow = esFuturo
      ? 0
      : citasDeLaFecha.filter((c) => citaCitada(c) && (citaAsistio(c) === false || citaAsistio(c) == null)).length;
    return { citados, asistidos, noShow, total: citasDeLaFecha.length };
  }, [citasDeLaFecha, selectedDate]);

  const posicionAhora = useMemo(() => {
    const hoyMexico = mexicoYMD(reloj);
    if (selectedDate !== hoyMexico) return null;

    const hm = mexicoHourMinute(reloj);
    if (!hm) return null;
    const minutoSlot = hm.minute < 30 ? 0 : 30;
    const minutosActuales = hm.hour * 60 + minutoSlot;
    const inicio = rangoHorario.inicio.hour * 60 + rangoHorario.inicio.minute;
    const fin = rangoHorario.fin.hour * 60 + rangoHorario.fin.minute;
    if (minutosActuales < inicio || minutosActuales > fin) return null;

    return ADVISOR_COL_WIDTH + ((minutosActuales - inicio) / 30) * SLOT_WIDTH;
  }, [reloj, selectedDate, rangoHorario]);

  const fechaLegible = useMemo(() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    if (!y) return "";
    const date = new Date(y, m - 1, d);
    const texto = date.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }, [selectedDate]);

  const totalColumnas = horarios.length;
  const gridTemplateColumns = `${ADVISOR_COL_WIDTH}px repeat(${totalColumnas}, ${SLOT_WIDTH}px)`;
  const gridTemplateRows = `${HEADER_H1}px ${HEADER_H2}px repeat(${Math.max(asesores.length, 1)}, ${ROW_HEIGHT}px)`;

  return (
    <div className="w-full space-y-4" style={{ fontFamily: FONT_DISPLAY }}>

      {asesores.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-[28px] border px-4 py-16 text-center"
          style={{ background: COLOR.surface, borderColor: COLOR.line }}
        >
          <Users className="mb-3 h-7 w-7" style={{ color: COLOR.inkFaint }} />
          <p className="text-[14px] font-semibold" style={{ color: COLOR.inkSoft }}>
            No hay asesores configurados para {agenciaSeleccionada}
          </p>
        </div>
      ) : (
        <div
          className="relative overflow-auto rounded-[28px] border"
          style={{ background: COLOR.surface, borderColor: COLOR.line, maxHeight: 760, boxShadow: "0 18px 44px rgba(0, 30, 80, 0.08)" }}
        >
          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns,
              gridTemplateRows,
              width: ADVISOR_COL_WIDTH + totalColumnas * SLOT_WIDTH,
            }}
          >
            <div
              className="sticky left-0 top-0 z-30 flex items-end px-5 pb-3"
              style={{
                gridColumn: "1 / 2",
                gridRow: "1 / 3",
                background: COLOR.brand,
                borderRight: "1px solid rgba(255,255,255,0.14)",
                borderBottom: `1px solid ${COLOR.line}`,
              }}
            >
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/85">Asesor</span>
            </div>

            {horasPrincipales.map((hora, i) => (
              <div
                key={hora}
                className="sticky top-0 z-20 flex items-center justify-center text-[13px] font-semibold tabular-nums text-white"
                style={{
                  gridColumn: `${2 + i * 2} / span 2`,
                  gridRow: "1 / 2",
                  background: COLOR.brand,
                  borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                {hora}
              </div>
            ))}

            {horarios.map((slot, i) => {
              const esMediaHora = slot.endsWith(":30");
              return (
                <div
                  key={slot}
                  className="sticky z-20 flex items-center justify-center text-[10px] font-semibold tabular-nums"
                  style={{
                    gridColumn: `${2 + i} / span 1`,
                    gridRow: "2 / 3",
                    top: HEADER_H1,
                    background: COLOR.surfaceAlt,
                    color: COLOR.inkFaint,
                    borderLeft: !esMediaHora ? `1px solid ${COLOR.line}` : "none",
                    borderBottom: `1px solid ${COLOR.line}`,
                  }}
                >
                  {esMediaHora ? <span className="h-1.5 w-1.5 rounded-full" style={{ background: COLOR.lineStrong }} /> : slot}
                </div>
              );
            })}

            {asesores.map((asesor, rowIdx) => {
              const color = colorForAsesor(asesor.nombre);
              const citasAsesor = citasDeLaFecha.filter((c) => (c.asesor || c.nombre_asesor) === asesor.nombre);

              return (
                <div key={asesor.id} style={{ display: "contents" }}>
                  <div
                    className="sticky left-0 z-10 flex items-center px-5"
                    style={{
                      gridColumn: "1 / 2",
                      gridRow: `${3 + rowIdx} / span 1`,
                      background: rowIdx % 2 === 1 ? COLOR.surfaceAlt : COLOR.surface,
                      borderRight: `1px solid ${COLOR.line}`,
                      borderBottom: `1px solid ${COLOR.line}`,
                    }}
                  >
                    <AdvisorStats asesor={asesor} color={color} citasAsesor={citasAsesor} />
                  </div>

                  {horarios.map((slot, colIdx) => {
                    const citasCelda = citasPorCelda.get(`${asesor.nombre}__${slot}`) || [];
                    const esInicioDeHora = slot.endsWith(":00");
                    return (
                      <div
                        key={`${asesor.id}-${slot}`}
                        className="p-2"
                        style={{
                          gridColumn: `${2 + colIdx} / span 1`,
                          gridRow: `${3 + rowIdx} / span 1`,
                          borderRight: `1px solid ${esInicioDeHora ? COLOR.line : COLOR.surfaceAlt}`,
                          borderBottom: `1px solid ${COLOR.line}`,
                          background: rowIdx % 2 === 1 ? COLOR.surfaceAlt : COLOR.surface,
                        }}
                      >
                        {citasCelda.length ? (
                          <div className="flex h-full max-w-full gap-2 overflow-x-auto pb-0.5 pr-1">
                            {citasCelda.map((cita) => (
                              <CitaCard
                                key={cita.id || `${asesor.nombre}-${slot}-${nombreCliente(cita)}`}
                                cita={cita}
                                compact={citasCelda.length > 1}
                                onClick={(c) => abrirEditar && abrirEditar(c)}
                              />
                            ))}
                          </div>
                        ) : (
                          <EmptySlot slot={slot} onClick={onSlotClick ? () => onSlotClick(asesor.nombre, slot) : null} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {posicionAhora !== null && (
              <div
                className="pointer-events-none absolute z-[12]"
                style={{
                  left: posicionAhora,
                  top: HEADER_H1 + HEADER_H2,
                  bottom: 0,
                  width: 2,
                  background: COLOR.danger,
                }}
              >
                <div className="absolute -left-[5px] -top-2 h-3 w-3 rounded-full" style={{ background: COLOR.danger, boxShadow: "0 0 0 4px rgba(180,35,24,0.12)" }} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-4 text-[11px] font-semibold" style={{ color: COLOR.inkFaint }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: COLOR.danger }} /> Hora actual
        </span>
        <span className="flex items-center gap-1.5">
          <Wrench className="h-3.5 w-3.5" /> Tarjeta azul = cliente citado
        </span>
        <span className="flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Clic en espacio libre para agendar
        </span>
      </div>
    </div>
  );
}
