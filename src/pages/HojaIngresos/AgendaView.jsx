// src/pages/HojaIngresos/AgendaView.jsx
import { useEffect, useMemo, useState } from "react";
import { Phone, Plus, TrendingUp, Users } from "lucide-react";
const COLOR = {
  ink: "#07111F",
  inkSoft: "#536070",
  inkFaint: "#8A95A6",
  brand: "#001E50",
  brandDeep: "#000B24",
  brandMid: "#003B78",
  brandSoft: "#E8F0FA",
  brandLine: "#BFD0E7",
  accent: "#00B0F0",
  surface: "#FFFFFF",
  surfaceAlt: "#F8FAFD",
  page: "#F4F7FB",
  line: "#DDE5EF",
  lineStrong: "#B9C7DA",
  ok: "#0B7A53",
  okSoft: "#E4F5ED",
  okLine: "#B9E2CD",
  warn: "#9A6400",
  warnSoft: "#FBF1DC",
  warnLine: "#F2D18A",
  danger: "#B42318",
  dangerSoft: "#FDEAE7",
  dangerLine: "#F3C4BC",
  violet: "#4B3F99",
  violetSoft: "#ECEAF8",
  violetLine: "#D2CDEF",
  teal: "#087780",
  tealSoft: "#E0F4F5",
  tealLine: "#B9E0E3",
};

const FONT_DISPLAY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const APERTURA_DEFECTO = { hour: 8, minute: 0 };
const CIERRE_DEFECTO = { hour: 16, minute: 0 };
const ADVISOR_COL_WIDTH = 220;
const SLOT_WIDTH = 220;
const ROW_HEIGHT = 160;
const HEADER_HEIGHT = 44;
const MEXICO_TZ = "America/Mexico_City";

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

const ASESOR_PALETTE = [
  { bg: "#E8F0FA", line: "#BFD0E7", dot: "#001E50", text: "#001E50" },
  { bg: "#E0F4F5", line: "#B9E0E3", dot: "#087780", text: "#075D65" },
  { bg: "#FDEAE7", line: "#F3C4BC", dot: "#B42318", text: "#912018" },
  { bg: "#ECEAF8", line: "#D2CDEF", dot: "#4B3F99", text: "#3D337D" },
  { bg: "#E4F5ED", line: "#B9E2CD", dot: "#0B7A53", text: "#075F40" },
];

function normalizar(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function agenciaCanonical(value) {
  const key = normalizar(value);
  if (key.includes("cordoba")) return "VW Cordoba";
  if (key.includes("orizaba")) return "VW Orizaba";
  return String(value ?? "").trim();
}

function colorForAsesor(nombre) {
  if (!nombre) return ASESOR_PALETTE[0];

  let hash = 0;
  for (let i = 0; i < nombre.length; i += 1) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }

  return ASESOR_PALETTE[hash % ASESOR_PALETTE.length];
}

function boolFromAny(value) {
  if (typeof value === "boolean") return value;

  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes"].includes(text);
}

function nullableBoolFromAny(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const text = String(value).trim().toLowerCase();

  if (["true", "si", "sí", "yes"].includes(text)) return true;
  if (["false", "no"].includes(text)) return false;

  return null;
}

function asistenciaFromAny(cita) {
  const value = cita?.asistido ?? cita?.asistencia;

  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

function citaCitada(cita) {
  return boolFromAny(cita?.citado);
}

function tipoServicioMeta(tipo) {
  const t = normalizar(tipo);

  if (t.includes("campa")) {
    return {
      label: "Campaña",
      bg: "#DDFCF7",
      bgSoft: "#F2FFFD",
      text: "#008A7A",
      line: "#72E2D3",
      accent: "#14B8A6",
      shadow: "rgba(20, 184, 166, 0.18)",
    };
  }

  if (t.includes("diagn")) {
    return {
      label: "Diagnóstico",
      bg: "#F1E8FF",
      bgSoft: "#FBF7FF",
      text: "#6D28D9",
      line: "#C7A9FF",
      accent: "#7C3AED",
      shadow: "rgba(124, 58, 237, 0.18)",
    };
  }

  if (t.includes("repar")) {
    return {
      label: "Reparación",
      bg: "#FFF0D9",
      bgSoft: "#FFFAF2",
      text: "#C26A00",
      line: "#FFD08A",
      accent: "#F59E0B",
      shadow: "rgba(245, 158, 11, 0.18)",
    };
  }

  return {
    label: "Servicio",
    bg: "#E8F2FF",
    bgSoft: "#F6FAFF",
    text: "#0057D9",
    line: "#9BC7FF",
    accent: "#2563EB",
    shadow: "rgba(37, 99, 235, 0.18)",
  };
}

function getTiposServicio(cita) {
  const raw = cita?.tipo_cita;

  if (Array.isArray(raw)) return raw.filter(Boolean);

  return String(raw || "Servicio")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function buildHorarios(inicio, fin) {
  const slots = [];
  let totalMin = inicio.hour * 60 + inicio.minute;
  const finMin = fin.hour * 60 + fin.minute;

  while (totalMin <= finMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;

    slots.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );

    totalMin += 30;
  }

  return slots;
}

function mexicoYMD(fecha) {
  const d = new Date(fecha);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-CA", {
    timeZone: MEXICO_TZ,
  });
}

function mexicoHourMinute(fecha) {
  const d = new Date(fecha);

  if (Number.isNaN(d.getTime())) return null;

  return {
    hour: Number(
      d.toLocaleString("en-US", {
        timeZone: MEXICO_TZ,
        hour: "numeric",
        hour12: false,
      }),
    ),
    minute: Number(
      d.toLocaleString("en-US", {
        timeZone: MEXICO_TZ,
        minute: "numeric",
      }),
    ),
  };
}

function slotKeyFromFecha(fecha) {
  const hm = mexicoHourMinute(fecha);

  if (!hm) return null;

  const minutoSlot = hm.minute < 30 ? "00" : "30";

  return `${String(hm.hour).padStart(2, "0")}:${minutoSlot}`;
}

function horaCorta(fecha) {
  const hm = mexicoHourMinute(fecha);

  if (!hm) return "--:--";

  return `${String(hm.hour).padStart(2, "0")}:${String(hm.minute).padStart(2, "0")}`;
}

function nombreCliente(cita) {
  return (
    cita?.cliente_nombre ||
    cita?.cliente?.nombre ||
    cita?.nombre_cliente ||
    "Sin nombre"
  );
}

function telefonoCliente(cita) {
  return (
    cita?.telefono ||
    cita?.cliente_telefono ||
    cita?.cliente?.telefono ||
    ""
  );
}

function clienteKey(cita) {
  return telefonoCliente(cita) || normalizar(nombreCliente(cita));
}

function percentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function AdvisorAvatar({ nombre, color }) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
      style={{
        background: color.bg,
        border: `1px solid ${color.line}`,
        color: color.text,
      }}
    >
      {iniciales}
    </div>
  );
}

function AdvisorStats({ asesor, color, citasAsesor }) {
  const total = citasAsesor.length;
  const asistencias = citasAsesor.filter(
    (cita) => asistenciaFromAny(cita) === true,
  ).length;
  const ocupacion = Math.min(Math.round((total / 8) * 100), 100);

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <AdvisorAvatar nombre={asesor.nombre} color={color} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div
            className="truncate text-[13px] font-bold"
            style={{ color: COLOR.brand }}
          >
            {asesor.nombre}
          </div>

          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color.dot }}
          />
        </div>

        <div
          className="mt-1 text-[10.5px] font-semibold"
          style={{ color: COLOR.inkFaint }}
        >
          <span style={{ color: COLOR.brand }}>{total}</span> citas ·{" "}
          <span style={{ color: COLOR.ok }}>{asistencias}</span> asistencias
        </div>

        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full"
          style={{ background: COLOR.line }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${ocupacion}%`, background: color.dot }}
          />
        </div>
      </div>
    </div>
  );
}

function EstadoPill({ cita }) {
  const asistio = asistenciaFromAny(cita);
  const citado = citaCitada(cita);

  let meta = {
    label: "Pendiente",
    bg: "#FFF4E5",
    text: "#C26A00",
    line: "#FFD08A",
  };

  if (asistio === true) {
    meta = {
      label: "Asistió",
      bg: "#E7F8EF",
      text: "#138A55",
      line: "#9BE0BF",
    };
  } else if (asistio === false) {
    meta = {
      label: "No asistió",
      bg: "#FEECEC",
      text: "#D92D20",
      line: "#FFB4AB",
    };
  } else if (citado) {
    meta = {
      label: "Confirmado",
      bg: "#E8F2FF",
      text: "#0057D9",
      line: "#9BC7FF",
    };
  }

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-black"
      style={{
        background: meta.bg,
        borderColor: meta.line,
        color: meta.text,
      }}
    >
      {meta.label}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const meta = tipoServicioMeta(tipo);

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-black"
      style={{
        background: meta.bg,
        borderColor: meta.line,
        color: meta.text,
      }}
    >
      {meta.label}
    </span>
  );
}

function AttendanceSwitch({ value, disabled, onToggle }) {
  const meta =
    value === true
      ? {
        label: "Asistió",
        bg: "#D8F3E5",
        border: "#9BE0BF",
        text: "#138A55",
        dot: "#138A55",
      }
      : value === false
        ? {
          label: "No asistió",
          bg: "#FFE1DE",
          border: "#FFB4AB",
          text: "#D92D20",
          dot: "#D92D20",
        }
        : {
          label: "Pendiente",
          bg: "#FFF4E5",
          border: "#FFD08A",
          text: "#C26A00",
          dot: "#C26A00",
        };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.();
      }}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-black transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        background: meta.bg,
        borderColor: meta.border,
        color: meta.text,
        boxShadow: `0 6px 14px ${meta.border}55`,
      }}
      title="Cambiar estado de asistencia"
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: meta.dot }}
      />
      {meta.label}
    </button>
  );
}

function CitaCard({
  cita,
  compact = false,
  abrirEditar,
  onSetAsistencia,
  updatingInline = {},
}) {
  const cliente = nombreCliente(cita);
  const telefono = telefonoCliente(cita);
  const tipos = getTiposServicio(cita);
  const asistio = asistenciaFromAny(cita);
  const modelo = cita.modelo || "Modelo sin capturar";
  const telefonoCorto = telefono
    ? telefono.replace(/(\d{3})(\d{3})(\d{4})$/, "$1 $2 $3")
    : "Sin teléfono";

  const loadingAsistencia = !!updatingInline[`${cita.id}-asistencia`];
  const metaPrincipal = tipoServicioMeta(tipos[0]);

  function abrirConTeclado(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirEditar?.(cita);
    }
  }

  function toggleAsistencia(event) {
    event?.stopPropagation?.();
    const siguienteValor = asistio === true ? false : true;
    onSetAsistencia?.(cita, siguienteValor);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => abrirEditar?.(cita)}
      onKeyDown={abrirConTeclado}
      title={`${cliente} · clic para editar`}
      className="group relative h-30 min-w-[174px] overflow-hidden rounded-[14px] border p-2.5 text-left transition duration-200 hover:-translate-y-[2px] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#9BC7FF]"
      style={{
        background: `linear-gradient(180deg, #FFFFFF 0%, ${metaPrincipal.bgSoft} 100%)`,
        borderColor: metaPrincipal.line,
        boxShadow: `0 10px 24px ${metaPrincipal.shadow}`,
      }}
    >
      <span
        className="absolute bottom-0 left-0 top-0 w-[4px]"
        style={{ background: metaPrincipal.accent }}
      />

      <div
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border"
        style={{ background: "#FFFFFF", borderColor: "#DDE5EF", color: COLOR.inkFaint, }}
      >
        <Phone className="h-3.5 w-3.5" />
      </div>

      <div className="pl-2 pr-7">
        <div className="flex items-start justify-between gap-2">
          <div
            className="text-[10px] font-black tabular-nums"
            style={{ color: metaPrincipal.text }}
          >
            {horaCorta(cita.fecha_ingreso || cita.fecha_cita)}
          </div>

          <AttendanceSwitch
            value={asistio}
            disabled={loadingAsistencia}
            onToggle={toggleAsistencia}
          />
        </div>

        <div
          className="mt-2 truncate text-[11px] font-black uppercase tracking-wide"
          style={{ color: COLOR.brand }}
        >
          {cliente}
        </div>

        <div
          className="mt-1 space-y-0.5 text-[10px] font-semibold leading-4"
          style={{ color: COLOR.inkSoft }}
        >
          <div className="truncate">{modelo}</div>
          {tipos.map((tipo) => (
            <TipoBadge key={tipo} tipo={tipo} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptySlot({ slot, onClick }) {
  return (
    <div
      className="group relative h-full w-full rounded-[10px] transition hover:bg-white"
      style={{ background: "rgba(248,250,253,0.72)" }}
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onClick}
          className="flex h-9 w-9 items-center justify-center rounded-full shadow-lg"
          style={{ background: COLOR.brand, color: "#FFFFFF" }}
          title={`Crear cita a las ${slot}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function InsightShell({ title, subtitle, badge, children, accentClass = "bg-[#E8F0FA]", className = "" }) {
  return (
    <section className={`relative h-full overflow-hidden p-4 sm:p-5 ${className}`}>
      <div className={`pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-70 blur-3xl ${accentClass}`} />
      <div className="relative mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-black text-[#001E50]">{title}</h2>
          {subtitle ? <p className="mt-1 text-[12px] font-semibold text-[#8A95A6]">{subtitle}</p> : null}
        </div>
        {badge ? <div className="inline-flex shrink-0 items-center rounded-full border border-[#DDE5EF] bg-[#F8FAFD] px-3 py-1.5 text-[11px] font-black text-[#001E50]">{badge}</div> : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

function GaugeRing({ value = 0, centerTop, centerBottom, footer }) {
  const safe = Math.max(0, Math.min(Number(value) || 0, 100));
  const size = 154;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (safe / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-[154px] w-[154px]">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-label={`Tasa de asistencia ${safe}%`} role="img">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-[#EAF0F7]" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} className="stroke-[#0B7A53] transition-all duration-500" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[36px] font-black leading-none text-[#0B7A53]">{safe}%</div>
          {centerTop ? <div className="mt-1 text-[11px] font-black uppercase tracking-wide text-[#536070]">{centerTop}</div> : null}
          {centerBottom ? <div className="mt-1 max-w-[110px] text-[11px] font-semibold text-[#8A95A6]">{centerBottom}</div> : null}
        </div>
      </div>
      {footer ? <div className="mt-3 text-center text-[11px] font-semibold text-[#536070]">{footer}</div> : null}
    </div>
  );
}

function JourneyRibbon({ total, clientes, ingresosTotales, asistencias, noCitados, segments = [] }) {
  const citasPorCliente = clientes ? (total / clientes).toFixed(1) : "0.0";

  return (
    <div className="rounded-[22px] border border-[#DDE5EF] bg-[#F8FAFD] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-black uppercase tracking-wide text-[#001E50]">Recorrido del día</div>
          <div className="mt-1 text-[11px] font-semibold text-[#8A95A6]">Citas, clientes únicos e ingresos operativos.</div>
        </div>
        <div className="grid min-w-[260px] flex-1 grid-cols-3 gap-2 sm:max-w-[520px]">
          <div className="rounded-[16px] border border-[#DDE5EF] bg-white px-3 py-2">
            <div className="text-[9px] font-black uppercase tracking-wide text-[#8A95A6]">Citas</div>
            <div className="mt-0.5 text-[20px] font-black leading-none text-[#001E50]">{total}</div>
          </div>
          <div className="rounded-[16px] border border-[#BFD0E7] bg-[#E8F0FA] px-3 py-2">
            <div className="text-[9px] font-black uppercase tracking-wide text-[#003B78]">Clientes</div>
            <div className="mt-0.5 text-[20px] font-black leading-none text-[#001E50]">{clientes}</div>
            <div className="mt-1 text-[9px] font-bold text-[#536070]">{citasPorCliente} citas/cliente</div>
          </div>
          <div className="rounded-[16px] border border-[#B9E2CD] bg-[#E4F5ED] px-3 py-2">
            <div className="text-[9px] font-black uppercase tracking-wide text-[#0B7A53]">Ingresos</div>
            <div className="mt-0.5 text-[20px] font-black leading-none text-[#0B7A53]">{ingresosTotales}</div>
            <div className="mt-1 text-[9px] font-bold text-[#0B7A53]">{asistencias} + {noCitados}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex h-5 overflow-hidden rounded-full bg-[#EDF3FA]">
        {segments.map((segment) => (
          <div key={segment.label} title={`${segment.label}: ${segment.value}`} className={`${segment.barClass} transition-all duration-500`} style={{ width: total ? `${(segment.value / total) * 100}%` : "0%", minWidth: segment.value > 0 ? 10 : 0 }} />
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {segments.map((segment) => (
          <div key={segment.label} className={`rounded-[18px] border px-3 py-2 ${segment.cardClass}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${segment.barClass}`} />
                <span className={`truncate text-[11px] font-black uppercase tracking-wide ${segment.textClass}`}>{segment.label}</span>
              </div>
              <span className={`text-[18px] font-black leading-none ${segment.textClass}`}>{segment.value}</span>
            </div>
            <div className={`mt-1 text-[11px] font-semibold ${segment.textClass}`}>{segment.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function WeeklyAndSourceSummary({ serieSemana, medios = [] }) {
  const totalCitadosSemana = serieSemana.citados.reduce((acc, value) => acc + value, 0);
  const totalAsistenciasSemana = serieSemana.asistencias.reduce((acc, value) => acc + value, 0);
  const totalNoShowSemana = serieSemana.noShow.reduce((acc, value) => acc + value, 0);
  const totalPendientesSemana = serieSemana.pendientes.reduce((acc, value) => acc + value, 0);
  const tasaAsistenciaSemanal = percentage(totalAsistenciasSemana, totalCitadosSemana);
  const maxMedio = Math.max(...medios.map((medio) => medio.total), 1);
  const mediosVisibles = medios.slice(0, 6);
  const otros = medios.slice(6).reduce((acc, medio) => acc + medio.total, 0);

  return (
    <div className="mb-5 grid gap-3 xl:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
      <div className="rounded-[20px] border border-[#B9E2CD] bg-[#F3FBF7] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0B7A53]">Asistencia total semanal</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[34px] font-black leading-none text-[#0B7A53]">{totalAsistenciasSemana}</span>
              <span className="pb-0.5 text-[12px] font-bold text-[#536070]">de {totalCitadosSemana} citados</span>
            </div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[6px] border-[#B9E2CD] bg-white text-[14px] font-black text-[#0B7A53]">{tasaAsistenciaSemanal}%</div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#DDE5EF]">
          <div className="h-full rounded-full bg-[#0B7A53] transition-all duration-500" style={{ width: `${tasaAsistenciaSemanal}%` }} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-[#B9E2CD] bg-white px-2.5 py-2 text-center">
            <div className="text-[9px] font-black uppercase text-[#8A95A6]">Asistió</div>
            <div className="mt-0.5 text-[17px] font-black text-[#0B7A53]">{totalAsistenciasSemana}</div>
          </div>
          <div className="rounded-xl border border-[#F3C4BC] bg-white px-2.5 py-2 text-center">
            <div className="text-[9px] font-black uppercase text-[#8A95A6]">No Show</div>
            <div className="mt-0.5 text-[17px] font-black text-[#B42318]">{totalNoShowSemana}</div>
          </div>
          <div className="rounded-xl border border-[#F2D18A] bg-white px-2.5 py-2 text-center">
            <div className="text-[9px] font-black uppercase text-[#8A95A6]">Pendiente</div>
            <div className="mt-0.5 text-[17px] font-black text-[#9A6400]">{totalPendientesSemana}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#DDE5EF] bg-[#F8FAFD] p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#001E50]">Conteo por medio de concertación</div>
            <div className="mt-1 text-[11px] font-semibold text-[#8A95A6]">Distribución de las citas del día seleccionado.</div>
          </div>
          <div className="rounded-full border border-[#BFD0E7] bg-[#E8F0FA] px-2.5 py-1 text-[10px] font-black text-[#001E50]">{medios.reduce((acc, medio) => acc + medio.total, 0)} citas</div>
        </div>

        {mediosVisibles.length ? (
          <div className="mt-4 space-y-2.5">
            {mediosVisibles.map((medio, index) => (
              <div key={medio.nombre} className="grid grid-cols-[minmax(90px,150px)_minmax(0,1fr)_34px] items-center gap-2">
                <div className="truncate text-[10.5px] font-bold text-[#536070]" title={medio.nombre}>{medio.nombre}</div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#E5EBF3]">
                  <div
                    className={`${index === 0 ? "bg-[#001E50]" : index === 1 ? "bg-[#003B78]" : index === 2 ? "bg-[#087780]" : index === 3 ? "bg-[#4B3F99]" : index === 4 ? "bg-[#0B7A53]" : "bg-[#8A95A6]"} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max((medio.total / maxMedio) * 100, medio.total > 0 ? 5 : 0)}%` }}
                  />
                </div>
                <div className="text-right text-[12px] font-black text-[#001E50]">{medio.total}</div>
              </div>
            ))}

            {otros > 0 ? (
              <div className="grid grid-cols-[minmax(90px,150px)_minmax(0,1fr)_34px] items-center gap-2">
                <div className="truncate text-[10.5px] font-bold text-[#536070]">Otros medios</div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#E5EBF3]">
                  <div className="h-full rounded-full bg-[#B9C7DA]" style={{ width: `${Math.max((otros / maxMedio) * 100, 5)}%` }} />
                </div>
                <div className="text-right text-[12px] font-black text-[#001E50]">{otros}</div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-[16px] border border-dashed border-[#B9C7DA] bg-white px-4 py-6 text-center text-[11px] font-semibold text-[#8A95A6]">
            No hay medios de concertación capturados para este día.
          </div>
        )}
      </div>
    </div>
  );
}

function ExecutiveOverview({ agenciaSeleccionada, estadisticas, serieSemana, medios }) {
  const ribbonSegments = [
    { label: "Asistió", value: estadisticas.asistencias, barClass: "bg-[#0B7A53]", cardClass: "border-[#B9E2CD] bg-[#E4F5ED]", textClass: "text-[#0B7A53]", hint: `${percentage(estadisticas.asistencias, estadisticas.total)}% del total del día` },
    { label: "No Show", value: estadisticas.noShow, barClass: "bg-[#B42318]", cardClass: "border-[#F3C4BC] bg-[#FDEAE7]", textClass: "text-[#B42318]", hint: `${percentage(estadisticas.noShow, estadisticas.total)}% del total del día` },
    { label: "Pendiente", value: estadisticas.pendientesAsistencia, barClass: "bg-[#E0A21B]", cardClass: "border-[#F2D18A] bg-[#FBF1DC]", textClass: "text-[#9A6400]", hint: `${percentage(estadisticas.pendientesAsistencia, estadisticas.total)}% del total del día` },
    { label: "No citado", value: estadisticas.noCitados, barClass: "bg-[#4B3F99]", cardClass: "border-[#D2CDEF] bg-[#ECEAF8]", textClass: "text-[#4B3F99]", hint: `${percentage(estadisticas.noCitados, estadisticas.total)}% del total del día` },
  ];

  return (
    <InsightShell title="Radar comercial del día" badge={agenciaSeleccionada} accentClass="bg-[#E8F0FA]">
      <WeeklyAndSourceSummary serieSemana={serieSemana} medios={medios} />
      <div className="grid items-center gap-5 xl:grid-cols-[190px_minmax(0,1fr)]">
        <div className="flex justify-center xl:justify-start">
          <GaugeRing value={estadisticas.tasaAsistencia} centerTop="Asistencia" centerBottom={`${estadisticas.asistencias} de ${estadisticas.citados} citados`} footer={`${estadisticas.coberturaAsistencia}% con seguimiento capturado`} />
        </div>
        <JourneyRibbon total={estadisticas.total} clientes={estadisticas.clientes} ingresosTotales={estadisticas.ingresosTotales} asistencias={estadisticas.asistencias} noCitados={estadisticas.noCitados} segments={ribbonSegments} />
      </div>
    </InsightShell>
  );
}


export default function AgendaView({
  citas = [],
  abrirEditar,
  onSlotClick,
  onSetAsistencia,
  updatingInline = {},
  selectedDate = new Date().toISOString().split("T")[0],
  agenciaSeleccionada = "VW Cordoba",
}) {
  const [reloj, setReloj] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setReloj(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const agenciaActual = agenciaCanonical(agenciaSeleccionada);

  const asesores = useMemo(
    () => ASESORES_POR_AGENCIA[agenciaActual] || [],
    [agenciaActual],
  );

  const citasDeLaFecha = useMemo(() => {
    if (!Array.isArray(citas)) return [];

    return citas.filter((cita) => {
      const fecha = cita.fecha_ingreso || cita.fecha_cita;

      if (!fecha) return false;

      const mismaFecha = mexicoYMD(fecha) === selectedDate;
      const mismaAgencia =
        !cita.agencia ||
        agenciaCanonical(cita.agencia) === agenciaActual;

      return mismaFecha && mismaAgencia;
    });
  }, [citas, selectedDate, agenciaActual]);

  const rangoHorario = useMemo(() => {
    let cierreMin =
      CIERRE_DEFECTO.hour * 60 +
      CIERRE_DEFECTO.minute;

    citasDeLaFecha.forEach((cita) => {
      const hm = mexicoHourMinute(
        cita.fecha_ingreso || cita.fecha_cita,
      );

      if (!hm) return;

      const finCitaMin =
        hm.hour * 60 +
        (hm.minute < 30 ? 30 : 60);

      cierreMin = Math.max(cierreMin, finCitaMin);
    });

    return {
      inicio: APERTURA_DEFECTO,
      fin: {
        hour: Math.floor(cierreMin / 60),
        minute: cierreMin % 60,
      },
    };
  }, [citasDeLaFecha]);

  const horarios = useMemo(
    () => buildHorarios(rangoHorario.inicio, rangoHorario.fin),
    [rangoHorario],
  );

  const citasPorCelda = useMemo(() => {
    const map = new Map();

    citasDeLaFecha.forEach((cita) => {
      const asesor = cita.asesor || cita.nombre_asesor;
      const slot = slotKeyFromFecha(
        cita.fecha_ingreso || cita.fecha_cita,
      );

      if (!asesor || !slot) return;

      const key = `${asesor}__${slot}`;
      const current = map.get(key) || [];

      current.push(cita);

      current.sort(
        (a, b) =>
          new Date(a.fecha_ingreso || a.fecha_cita) -
          new Date(b.fecha_ingreso || b.fecha_cita),
      );

      map.set(key, current);
    });

    return map;
  }, [citasDeLaFecha]);

  const estadisticas = useMemo(() => {
    const total = citasDeLaFecha.length;
    const citados = citasDeLaFecha.filter(citaCitada).length;
    const noCitados = total - citados;
    const citasCitadas = citasDeLaFecha.filter(citaCitada);

    const asistencias = citasCitadas.filter(
      (cita) => asistenciaFromAny(cita) === true,
    ).length;

    const noShow = citasCitadas.filter(
      (cita) => asistenciaFromAny(cita) === false,
    ).length;

    const registrosConAsistencia = asistencias + noShow;
    const pendientesAsistencia = Math.max(
      citados - registrosConAsistencia,
      0,
    );

    const clientes = new Set(
      citasDeLaFecha.map(clienteKey).filter(Boolean),
    ).size;

    const longDriveSi = citasCitadas.filter(
      (cita) => nullableBoolFromAny(cita.long_drive) === true,
    ).length;

    const longDriveNo = citasCitadas.filter(
      (cita) => nullableBoolFromAny(cita.long_drive) === false,
    ).length;

    const longDrivePendiente = Math.max(
      citados - (longDriveSi + longDriveNo),
      0,
    );

    return {
      total,
      citados,
      noCitados,
      ingresosTotales: asistencias + noCitados,
      asistencias,
      noShow,
      pendientesAsistencia,
      registrosConAsistencia,
      clientes,
      longDriveSi,
      longDriveNo,
      longDrivePendiente,
      tasaAsistencia: percentage(asistencias, citados),
      tasaCitacion: percentage(citados, total),
      coberturaAsistencia: percentage(
        registrosConAsistencia,
        citados,
      ),
      coberturaLongDrive: percentage(
        longDriveSi + longDriveNo,
        citados,
      ),
      tasaLongDrive: percentage(longDriveSi, citados),
      aprovechamientoLongDrive: percentage(
        longDriveSi,
        asistencias,
      ),
    };
  }, [citasDeLaFecha]);

  const metricasPorMedio = useMemo(() => {
    const agrupados = new Map();

    citasDeLaFecha.forEach((cita) => {
      const nombre = String(cita?.medio_concertacion || "").trim() || "Sin medio de concertación";

      if (!agrupados.has(nombre)) {
        agrupados.set(nombre, {
          nombre,
          total: 0,
          citados: 0,
          noCitados: 0,
          asistencias: 0,
          noShow: 0,
          pendientes: 0,
          longDrive: 0,
          clientes: new Set(),
        });
      }

      const item = agrupados.get(nombre);
      const citado = citaCitada(cita);
      const asistencia = asistenciaFromAny(cita);
      const claveCliente = clienteKey(cita);

      item.total += 1;
      if (claveCliente) item.clientes.add(claveCliente);

      if (citado) {
        item.citados += 1;
        if (asistencia === true) item.asistencias += 1;
        else if (asistencia === false) item.noShow += 1;
        else item.pendientes += 1;

        if (nullableBoolFromAny(cita.long_drive) === true) item.longDrive += 1;
      } else {
        item.noCitados += 1;
      }
    });

    return Array.from(agrupados.values())
      .map((item) => {
        const { clientes, ...datos } = item;
        const ingresosTotales = item.asistencias + item.noCitados;
        const registrosAsistencia = item.asistencias + item.noShow;

        return {
          ...datos,
          clientes: clientes.size,
          ingresosTotales,
          tasaAsistencia: percentage(item.asistencias, item.citados),
          tasaNoShow: percentage(item.noShow, item.citados),
          tasaIngreso: percentage(ingresosTotales, item.total),
          tasaLongDrive: percentage(item.longDrive, item.citados),
          coberturaAsistencia: percentage(registrosAsistencia, item.citados),
        };
      })
      .sort((a, b) => b.total - a.total || b.ingresosTotales - a.ingresosTotales || a.nombre.localeCompare(b.nombre, "es"));
  }, [citasDeLaFecha]);

  const serieSemana = useMemo(() => {
    const [year, month, day] = selectedDate.split("-").map(Number);
    const base = new Date(year, month - 1, day);
    const dayIndex = base.getDay() === 0 ? 6 : base.getDay() - 1;
    const monday = new Date(base);
    monday.setDate(base.getDate() - dayIndex);

    const ymdLocal = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    const etiquetas = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dias = Array.from({ length: 6 }, (_, index) => {
      const fecha = new Date(monday);
      fecha.setDate(monday.getDate() + index);
      return { ymd: ymdLocal(fecha), label: etiquetas[index] };
    });

    const fechasSemana = new Set(dias.map((dia) => dia.ymd));
    const citasSemana = citas.filter((cita) => {
      const ymd = mexicoYMD(cita.fecha_ingreso || cita.fecha_cita);
      return fechasSemana.has(ymd) && (!cita.agencia || agenciaCanonical(cita.agencia) === agenciaActual);
    });

    const porDia = new Map(dias.map((dia) => [dia.ymd, []]));
    citasSemana.forEach((cita) => {
      const ymd = mexicoYMD(cita.fecha_ingreso || cita.fecha_cita);
      porDia.get(ymd)?.push(cita);
    });

    const resumenDias = dias.map(({ ymd }) => {
      const citasDia = porDia.get(ymd) || [];
      const citadas = citasDia.filter(citaCitada);
      const asistenciasDia = citadas.filter((cita) => asistenciaFromAny(cita) === true).length;
      const noShowDia = citadas.filter((cita) => asistenciaFromAny(cita) === false).length;
      const pendientesDia = Math.max(citadas.length - asistenciasDia - noShowDia, 0);
      const noCitadosDia = citasDia.length - citadas.length;

      return {
        citados: citadas.length,
        asistencias: asistenciasDia,
        noShow: noShowDia,
        pendientes: pendientesDia,
        longDrive: citadas.filter((cita) => nullableBoolFromAny(cita.long_drive) === true).length,
        ingresosTotales: asistenciasDia + noCitadosDia,
      };
    });

    return {
      labels: dias.map((dia) => dia.label),
      citados: resumenDias.map((dia) => dia.citados),
      asistencias: resumenDias.map((dia) => dia.asistencias),
      noShow: resumenDias.map((dia) => dia.noShow),
      pendientes: resumenDias.map((dia) => dia.pendientes),
      longDrive: resumenDias.map((dia) => dia.longDrive),
      ingresosTotales: resumenDias.reduce((acc, dia) => acc + dia.ingresosTotales, 0),
      clientesUnicos: new Set(citasSemana.map(clienteKey).filter(Boolean)).size,
    };
  }, [citas, selectedDate, agenciaActual]);

  const posicionAhora = useMemo(() => {
    if (selectedDate !== mexicoYMD(reloj)) return null;

    const hm = mexicoHourMinute(reloj);

    if (!hm) return null;

    const minutosActuales =
      hm.hour * 60 +
      (hm.minute < 30 ? 0 : 30);

    const inicio =
      rangoHorario.inicio.hour * 60 +
      rangoHorario.inicio.minute;

    const fin =
      rangoHorario.fin.hour * 60 +
      rangoHorario.fin.minute;

    if (minutosActuales < inicio || minutosActuales > fin) {
      return null;
    }

    return (
      ADVISOR_COL_WIDTH +
      ((minutosActuales - inicio) / 30) *
      SLOT_WIDTH
    );
  }, [reloj, selectedDate, rangoHorario]);

  const totalColumnas = horarios.length;
  const gridTemplateColumns = `${ADVISOR_COL_WIDTH}px repeat(${totalColumnas}, ${SLOT_WIDTH}px)`;
  const gridTemplateRows = `${HEADER_HEIGHT}px repeat(${Math.max(
    asesores.length,
    1,
  )}, ${ROW_HEIGHT}px)`;
  const gridWidth =
    ADVISOR_COL_WIDTH +
    totalColumnas * SLOT_WIDTH;

  if (asesores.length === 0) {
    return (
      <div
        className="rounded-[22px] border bg-white px-4 py-16 text-center"
        style={{ borderColor: COLOR.line }}
      >
        <Users
          className="mx-auto mb-3 h-8 w-8"
          style={{ color: COLOR.inkFaint }}
        />

        <p
          className="text-[14px] font-bold"
          style={{ color: COLOR.inkSoft }}
        >
          No hay asesores configurados para {agenciaSeleccionada}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ExecutiveOverview
        agenciaSeleccionada={agenciaSeleccionada}
        estadisticas={estadisticas}
        serieSemana={serieSemana}
        medios={metricasPorMedio}
      />

      <div
        className="relative overflow-auto rounded-[18px] border bg-white"
        style={{
          borderColor: COLOR.line,
          maxHeight: 900,
          boxShadow: "0 18px 44px rgba(0, 30, 80, 0.08)",
        }}
      >
        <div
          className="relative"
          style={{
            display: "grid",
            gridTemplateColumns,
            gridTemplateRows,
            width: gridWidth,
          }}
        >
          <div
            className="sticky left-0 top-0 z-30 flex items-center px-5 text-[11px] font-black uppercase tracking-wide"
            style={{
              gridColumn: "1 / 2",
              gridRow: "1 / 2",
              background: COLOR.surface,
              color: COLOR.brand,
              borderRight: `1px solid ${COLOR.line}`,
              borderBottom: `1px solid ${COLOR.line}`,
            }}
          >
            Asesor
          </div>

          {horarios.map((slot, index) => {
            const esMediaHora = slot.endsWith(":30");

            return (
              <div
                key={slot}
                className="sticky top-0 z-20 flex items-center justify-center text-[11px] font-bold tabular-nums"
                style={{
                  gridColumn: `${2 + index} / span 1`,
                  gridRow: "1 / 2",
                  background: COLOR.surface,
                  color: slot.endsWith(":00")
                    ? COLOR.brand
                    : COLOR.inkSoft,
                  borderLeft: `1px ${esMediaHora ? "dashed" : "solid"
                    } ${esMediaHora
                      ? COLOR.lineStrong
                      : COLOR.line
                    }`,
                  borderBottom: `1px solid ${COLOR.line}`,
                }}
              >
                {slot}
              </div>
            );
          })}

          {asesores.map((asesor, rowIdx) => {
            const color = colorForAsesor(asesor.nombre);

            const citasAsesor = citasDeLaFecha.filter(
              (cita) =>
                (cita.asesor || cita.nombre_asesor) ===
                asesor.nombre,
            );

            return (
              <div key={asesor.id} style={{ display: "contents" }}>
                <div
                  className="sticky left-0 z-10 flex items-center px-4"
                  style={{
                    gridColumn: "1 / 2",
                    gridRow: `${2 + rowIdx} / span 1`,
                    background:
                      rowIdx % 2
                        ? COLOR.surfaceAlt
                        : COLOR.surface,
                    borderRight: `1px solid ${COLOR.line}`,
                    borderBottom: `1px solid ${COLOR.line}`,
                  }}
                >
                  <AdvisorStats
                    asesor={asesor}
                    color={color}
                    citasAsesor={citasAsesor}
                  />
                </div>

                {horarios.map((slot, colIdx) => {
                  const citasCelda =
                    citasPorCelda.get(
                      `${asesor.nombre}__${slot}`,
                    ) || [];

                  const esMediaHora = slot.endsWith(":30");

                  return (
                    <div
                      key={`${asesor.id}-${slot}`}
                      className="p-2"
                      style={{
                        gridColumn: `${2 + colIdx} / span 1`,
                        gridRow: `${2 + rowIdx} / span 1`,
                        background:
                          rowIdx % 2
                            ? COLOR.surfaceAlt
                            : COLOR.surface,
                        borderLeft: `1px ${esMediaHora ? "dashed" : "solid"
                          } ${esMediaHora
                            ? COLOR.lineStrong
                            : COLOR.line
                          }`,
                        borderBottom: `1px solid ${COLOR.line}`,
                      }}
                    >
                      {citasCelda.length > 0 ? (
                        <div className="flex h-full gap-2 overflow-x-auto pb-0.5">
                          {citasCelda.map((cita) => (
                            <CitaCard
                              key={
                                cita.id ||
                                `${asesor.nombre}-${slot}-${nombreCliente(
                                  cita,
                                )}`
                              }
                              cita={cita}
                              compact={citasCelda.length > 1}
                              abrirEditar={abrirEditar}
                              onSetAsistencia={onSetAsistencia}
                              updatingInline={updatingInline}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptySlot
                          slot={slot}
                          onClick={
                            onSlotClick
                              ? () =>
                                onSlotClick(
                                  asesor.nombre,
                                  slot,
                                )
                              : undefined
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {posicionAhora !== null ? (
            <div
              className="pointer-events-none absolute z-20"
              style={{
                left: posicionAhora,
                top: HEADER_HEIGHT,
                bottom: 0,
                width: 2,
                background: COLOR.danger,
              }}
            >
              <div
                className="absolute -left-[5px] -top-2 h-3 w-3 rounded-full"
                style={{
                  background: COLOR.danger,
                  boxShadow:
                    "0 0 0 4px rgba(180,35,24,0.12)",
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-4 text-[11px] font-bold"
        style={{ color: COLOR.inkFaint }}
      >
        <TipoBadge tipo="Servicio" />
        <TipoBadge tipo="Reparación" />
        <TipoBadge tipo="Diagnóstico" />
        <TipoBadge tipo="Campaña" />
      </div>
    </div>
  );
}