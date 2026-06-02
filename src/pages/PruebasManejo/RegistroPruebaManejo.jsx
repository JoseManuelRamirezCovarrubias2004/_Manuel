// src/pages/PruebasManejo/RegistroPruebaManejo.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays, ArrowUpDown,
    ChevronDown, ChevronUp, Trash2, Loader2, Phone, Mail, UserStar,
    FileText, Hash, Building2, MessageSquareText, Camera, Eye,
    UploadCloud, Copy, LayoutList, CalendarRange, BarChart3,
    ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiPruebaManejo, apiEvidenciasPruebaManejo } from "../../lib/apiPruebaManejo";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";
const API_BASE = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

// ─── Paleta de colores para gráficas ───────────────────────────────────────
const CHART_COLORS = [
    "#131E5C", "#2563EB", "#0EA5E9", "#06B6D4", "#10B981",
    "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

function normalizeStr(v) { return String(v ?? "").trim(); }

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl">
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0">
                            <div className="truncate text-base font-extrabold text-white">{title}</div>
                        </div>
                        <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15" aria-label="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>
                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

// ─── Fechas ────────────────────────────────────────────────────────────────
function toDTLocal(isoOrNull) {
    if (!isoOrNull) return "";
    const s = String(isoOrNull);
    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
    return "";
}

function fromDTLocalToISO(dtLocalOrEmpty) {
    const v = String(dtLocalOrEmpty || "").trim();
    return v ? v : null;
}

function toYMDLocal(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}

// ─── Context Menu ──────────────────────────────────────────────────────────
function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;
    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                </button>
                <button className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </div>,
        document.body
    );
}

function formatBytes(bytes = 0) {
    if (!bytes) return "—";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0; let v = bytes;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function resolveMediaUrl(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${API_BASE}${u}`;
    if (u.startsWith("media/")) return `${API_BASE}/${u}`;
    return `${API_BASE}/media/${u}`;
}

function isImageMime(mime = "") { return String(mime || "").toLowerCase().startsWith("image/"); }
function guessIsImageFromName(name = "") {
    const n = String(name || "").toLowerCase();
    return [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) => n.endsWith(ext));
}

// ─── Evidencias Uploader ───────────────────────────────────────────────────
function EvidenciasUploader({ evidencias = [], onSubir, onEliminar, disabled }) {
    const inputPickRef = useRef(null);
    const inputCamRef = useRef(null);
    const [preview, setPreview] = useState({ open: false, url: "", title: "", mime: "" });

    const openPreview = (ev) => {
        const url = resolveMediaUrl(ev?.archivo);
        if (!url) return;
        setPreview({ open: true, url, title: ev?.nombre_original || "Evidencia", mime: ev?.tipo_mime || "" });
    };
    const closePreview = () => setPreview({ open: false, url: "", title: "", mime: "" });

    const copyLink = async (ev) => {
        const url = resolveMediaUrl(ev?.archivo);
        if (!url) return;
        try { await navigator.clipboard.writeText(url); alert("Link copiado ✅"); }
        catch { alert("No se pudo copiar."); }
    };

    return (
        <div className="space-y-3">
            <input ref={inputPickRef} type="file" multiple accept="image/*,video/*,.pdf" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; if (!f.length) return; onSubir?.(f); }} />
            <input ref={inputCamRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files || []); e.target.value = ""; if (!f.length) return; onSubir?.(f); }} />

            <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => inputCamRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white shadow-lg px-4 py-3 text-sm font-semibold text-[#131E5C] hover:bg-neutral-50 disabled:opacity-60">
                    <Camera className="h-4 w-4" /> Tomar foto
                </button>
                <button type="button" onClick={() => inputPickRef.current?.click()} disabled={disabled}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white shadow-lg px-4 py-3 text-sm font-semibold text-[#131E5C] hover:bg-neutral-50 disabled:opacity-60">
                    <UploadCloud className="h-4 w-4" /> Adjuntar archivos
                </button>
            </div>

            {(!evidencias || evidencias.length === 0) ? (
                <div className="rounded-lg border border-black/10 bg-neutral-100 p-4 text-sm text-slate-500">Sin evidencias.</div>
            ) : (
                <>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {evidencias.map((ev) => {
                            const url = resolveMediaUrl(ev?.archivo);
                            const isImg = isImageMime(ev?.tipo_mime) || guessIsImageFromName(ev?.nombre_original);
                            return (
                                <div key={ev.id} className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg">
                                    <div className="relative aspect-[16/10] bg-neutral-100">
                                        {isImg && url ? (
                                            <img src={url} alt={ev?.nombre_original || "evidencia"} className="h-full w-full object-cover" loading="lazy"
                                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-500"><FileText className="h-7 w-7" /></div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2">
                                            <div className="truncate text-xs font-extrabold text-white">{ev?.nombre_original || "archivo"}</div>
                                            <div className="text-[11px] text-white/80">{formatBytes(ev?.tamano_bytes || 0)} • {ev?.tipo_mime || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-2">
                                        <div className="flex items-center gap-2">
                                            {url ? <button type="button" onClick={() => openPreview(ev)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#131E5C] hover:bg-neutral-50"><Eye className="h-4 w-4" />Ver</button> : null}
                                            {url ? <button type="button" onClick={() => copyLink(ev)} className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#131E5C] hover:bg-neutral-50"><Copy className="h-4 w-4" />Link</button> : null}
                                        </div>
                                        <button type="button" disabled={disabled} onClick={() => onEliminar?.(ev)} className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-xs font-extrabold text-white hover:bg-red-600 disabled:opacity-60">
                                            <Trash2 className="h-4 w-4" />Quitar
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Modal open={preview.open} title={preview.title || "Evidencia"} onClose={closePreview}
                        footer={
                            <>
                                <button onClick={closePreview} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600"><X className="h-4 w-4" />Cerrar</button>
                                {preview.url ? <button onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white"><Eye className="h-4 w-4" />Abrir en pestaña</button> : null}
                            </>
                        }>
                        <div className="space-y-3">
                            {preview.url ? (
                                <div className="rounded-xl border border-black/10 bg-white p-3">
                                    {(preview.mime || "").toLowerCase().startsWith("image/") ? (
                                        <img src={preview.url} alt={preview.title} className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain" />
                                    ) : (
                                        <div className="text-sm text-slate-600">Este archivo no es imagen. Usa "Abrir en pestaña".</div>
                                    )}
                                </div>
                            ) : null}
                            {preview.url ? <div className="break-all text-xs text-slate-500">{preview.url}</div> : null}
                        </div>
                    </Modal>
                </>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── VISTA AGENDA ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getRegistrosPorFecha(registros) {
    const mapa = {};
    for (const r of registros) {
        if (!r.fecha_hora_cita) continue;
        const ymd = toYMDLocal(r.fecha_hora_cita);
        if (!ymd) continue;
        if (!mapa[ymd]) mapa[ymd] = [];
        mapa[ymd].push(r);
    }
    return mapa;
}

function AgendaView({ registros, onEditRow }) {
    const hoy = new Date();
    const [calYear, setCalYear] = useState(hoy.getFullYear());
    const [calMonth, setCalMonth] = useState(hoy.getMonth());
    const [selectedDay, setSelectedDay] = useState(toYMDLocal(hoy));

    const registrosPorFecha = useMemo(() => getRegistrosPorFecha(registros), [registros]);

    // ─── Calcular días del calendario ───
    const calDays = useMemo(() => {
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            const pad = (n) => String(n).padStart(2, "0");
            days.push(`${calYear}-${pad(calMonth + 1)}-${pad(d)}`);
        }
        return days;
    }, [calYear, calMonth]);

    const prevMonth = () => {
        if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
        else setCalMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
        else setCalMonth(m => m + 1);
    };

    const todayYMD = toYMDLocal(hoy);
    const citasDelDia = useMemo(() => {
        if (!selectedDay) return [];
        return (registrosPorFecha[selectedDay] || []).sort((a, b) => {
            const ta = a.fecha_hora_cita ? new Date(a.fecha_hora_cita).getTime() : 0;
            const tb = b.fecha_hora_cita ? new Date(b.fecha_hora_cita).getTime() : 0;
            return ta - tb;
        });
    }, [selectedDay, registrosPorFecha]);

    // Próximas 7 días
    const proximasCitas = useMemo(() => {
        const result = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(hoy);
            d.setDate(d.getDate() + i);
            const ymd = toYMDLocal(d);
            const citas = registrosPorFecha[ymd] || [];
            if (citas.length > 0) result.push({ ymd, citas, d });
        }
        return result;
    }, [registrosPorFecha]);

    return (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            {/* ─── Calendario ─── */}
            <div className="rounded-xl border border-black/10 bg-white shadow-sm overflow-hidden">
                {/* Header mes */}
                <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: BRAND_BLUE }}>
                    <button onClick={prevMonth} className="rounded-lg p-1.5 text-white hover:bg-white/15">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-extrabold text-white">
                        {MESES[calMonth]} {calYear}
                    </span>
                    <button onClick={nextMonth} className="rounded-lg p-1.5 text-white hover:bg-white/15">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Días semana */}
                <div className="grid grid-cols-7 border-b border-black/10">
                    {DIAS_SEMANA.map(d => (
                        <div key={d} className="py-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">{d}</div>
                    ))}
                </div>

                {/* Celdas */}
                <div className="grid grid-cols-7">
                    {calDays.map((ymd, idx) => {
                        if (!ymd) return <div key={`empty-${idx}`} className="aspect-square" />;
                        const count = (registrosPorFecha[ymd] || []).length;
                        const isToday = ymd === todayYMD;
                        const isSelected = ymd === selectedDay;
                        const day = parseInt(ymd.split("-")[2], 10);
                        return (
                            <button key={ymd} onClick={() => setSelectedDay(ymd)}
                                className={[
                                    "relative flex flex-col items-center justify-center aspect-square text-xs font-bold transition-colors",
                                    isSelected ? "bg-[#131E5C] text-white rounded-lg" :
                                        isToday ? "text-blue-600" : "text-slate-700 hover:bg-slate-50",
                                ].join(" ")}>
                                <span>{day}</span>
                                {count > 0 && (
                                    <span className={[
                                        "absolute bottom-1 left-1/2 -translate-x-1/2 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-extrabold",
                                        isSelected ? "bg-white text-[#131E5C]" : "bg-[#131E5C] text-white",
                                    ].join(" ")}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Resumen semana */}
                <div className="border-t border-black/10 p-3">
                    <div className="text-xs font-extrabold text-slate-500 mb-2 uppercase tracking-wide">Próximos 7 días</div>
                    {proximasCitas.length === 0 ? (
                        <div className="text-xs text-slate-400">Sin citas próximas.</div>
                    ) : (
                        <div className="space-y-1">
                            {proximasCitas.map(({ ymd, citas, d }) => (
                                <button key={ymd} onClick={() => setSelectedDay(ymd)}
                                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                                    <span className="text-xs font-semibold text-slate-600">
                                        {DIAS_SEMANA[d.getDay()]} {d.getDate()} {MESES[d.getMonth()].slice(0, 3)}
                                    </span>
                                    <span className="rounded-full bg-[#131E5C] px-2 py-0.5 text-[10px] font-extrabold text-white">
                                        {citas.length} cita{citas.length > 1 ? "s" : ""}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Lista del día seleccionado ─── */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                    <CalendarRange className="h-4 w-4 text-[#131E5C]" />
                    <span className="text-sm font-extrabold text-[#131E5C]">
                        {selectedDay ? (() => {
                            const [y, m, d] = selectedDay.split("-").map(Number);
                            const fecha = new Date(y, m - 1, d);
                            return `${DIAS_SEMANA[fecha.getDay()]}, ${d} de ${MESES[m - 1]} ${y}`;
                        })() : "Selecciona un día"}
                    </span>
                    <span className="ml-auto rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                        {citasDelDia.length} prueba{citasDelDia.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {citasDelDia.length === 0 ? (
                    <div className="rounded-xl border border-black/10 bg-white p-10 text-center">
                        <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                        <div className="text-sm font-semibold text-slate-500">Sin pruebas programadas para este día.</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {citasDelDia.map((row) => {
                            const hora = row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).split("T")[1] || "—" : "—";
                            const clienteNombre = row?.cliente?.nombre || "—";
                            const clienteTel = row?.cliente?.telefono || "—";
                            return (
                                <button key={row.id} onClick={() => onEditRow(row)}
                                    className="w-full text-left rounded-xl border border-black/10 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#131E5C]/30 transition-all">
                                    <div className="flex items-start gap-3">
                                        {/* Hora */}
                                        <div className="flex-shrink-0 rounded-lg bg-[#131E5C] px-3 py-2 text-center">
                                            <div className="flex items-center gap-1 text-white">
                                                <Clock className="h-3 w-3" />
                                                <span className="text-xs font-extrabold">{hora}</span>
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate text-sm font-extrabold text-[#131E5C]">{clienteNombre}</span>
                                                {row.asistencia
                                                    ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                                                    : <Circle className="h-4 w-4 flex-shrink-0 text-slate-300" />
                                                }
                                            </div>
                                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                                <span>{row.agencia || "—"}</span>
                                                <span>{clienteTel}</span>
                                                <span>{row.auto_interes || "—"}</span>
                                            </div>
                                            {row.asesor_piso && (
                                                <div className="mt-1 text-xs text-slate-400">Asesor: {row.asesor_piso}</div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 text-xs font-semibold text-[#131E5C] opacity-60">Editar →</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── VISTA GRÁFICAS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-xl">
            <div className="text-xs font-extrabold text-[#131E5C] mb-1">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="text-xs text-slate-600">
                    <span className="font-bold" style={{ color: p.color }}>{p.value}</span> prueba{p.value !== 1 ? "s" : ""}
                </div>
            ))}
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-xl">
            <div className="text-xs font-extrabold text-[#131E5C]">{payload[0].name}</div>
            <div className="text-xs text-slate-600"><span className="font-bold text-[#131E5C]">{payload[0].value}</span> prueba{payload[0].value !== 1 ? "s" : ""}</div>
        </div>
    );
};

function StatCard({ label, value, icon: Icon, color = BRAND_BLUE }) {
    return (
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: `${color}15` }}>
                <Icon className="h-6 w-6" style={{ color }} />
            </div>
            <div>
                <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
                <div className="text-xs font-semibold text-slate-500">{label}</div>
            </div>
        </div>
    );
}

function GraficasView({ registros }) {
    // ─── Datos por dealer ───
    const porDealer = useMemo(() => {
        const mapa = {};
        for (const r of registros) {
            const k = r.agencia || "Sin dealer";
            mapa[k] = (mapa[k] || 0) + 1;
        }
        return Object.entries(mapa)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [registros]);

    // ─── Datos por modelo ───
    const porModelo = useMemo(() => {
        const mapa = {};
        for (const r of registros) {
            const k = r.auto_interes || "Sin modelo";
            mapa[k] = (mapa[k] || 0) + 1;
        }
        return Object.entries(mapa)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [registros]);

    // ─── Datos por asesor (top 10) ───
    const porAsesor = useMemo(() => {
        const mapa = {};
        for (const r of registros) {
            const k = r.asesor_piso || "Sin asesor";
            mapa[k] = (mapa[k] || 0) + 1;
        }
        return Object.entries(mapa)
            .map(([name, value]) => ({ name: name.split(" ").slice(0, 2).join(" "), fullName: name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [registros]);

    // ─── Asistencia ───
    const asistenciaData = useMemo(() => {
        let asistieron = 0, noAsistieron = 0;
        for (const r of registros) {
            if (r.asistencia) asistieron++; else noAsistieron++;
        }
        return [
            { name: "Asistieron", value: asistieron },
            { name: "No asistieron", value: noAsistieron },
        ];
    }, [registros]);

    // ─── Pruebas últimos 14 días ───
    const porDia = useMemo(() => {
        const dias = [];
        const mapa = {};
        for (const r of registros) {
            if (!r.fecha_hora_cita) continue;
            const ymd = toYMDLocal(r.fecha_hora_cita);
            if (ymd) mapa[ymd] = (mapa[ymd] || 0) + 1;
        }
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ymd = toYMDLocal(d);
            const label = `${d.getDate()}/${d.getMonth() + 1}`;
            dias.push({ name: label, value: mapa[ymd] || 0, ymd });
        }
        return dias;
    }, [registros]);

    const totalAsistieron = asistenciaData[0].value;
    const pctAsistencia = registros.length > 0 ? Math.round((totalAsistieron / registros.length) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* ─── Stats rápidos ─── */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total pruebas" value={registros.length} icon={CarFront} color="#131E5C" />
                <StatCard label="Asistencias" value={totalAsistieron} icon={CheckCircle2} color="#10B981" />
                <StatCard label="% Asistencia" value={`${pctAsistencia}%`} icon={BarChart3} color="#2563EB" />
                <StatCard label="Dealers activos" value={new Set(registros.map(r => r.agencia).filter(Boolean)).size} icon={Building2} color="#F59E0B" />
            </div>

            {/* ─── Pruebas últimos 14 días ─── */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por día (últimos 14 días)</div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={porDia} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill={BRAND_BLUE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* ─── Por dealer ─── */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por Dealer</div>
                    {porDealer.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={porDealer} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} width={100} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {porDealer.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ─── Asistencia Pie ─── */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Tasa de Asistencia</div>
                    {registros.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={asistenciaData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                    dataKey="value" paddingAngle={3}>
                                    <Cell fill="#10B981" />
                                    <Cell fill="#E5E7EB" />
                                </Pie>
                                <Tooltip content={<CustomPieTooltip />} />
                                <Legend formatter={(val) => <span className="text-xs font-semibold text-slate-600">{val}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ─── Por modelo ─── */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por Modelo (Top 10)</div>
                    {porModelo.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={porModelo} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} angle={-35} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {porModelo.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ─── Por asesor ─── */}
                <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
                    <div className="mb-4 text-sm font-extrabold text-[#131E5C]">Pruebas por Asesor (Top 10)</div>
                    {porAsesor.length === 0 ? (
                        <div className="py-8 text-center text-sm text-slate-400">Sin datos.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={porAsesor} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} width={110} />
                                <Tooltip content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null;
                                    const item = porAsesor.find(a => a.name === payload[0]?.payload?.name);
                                    return (
                                        <div className="rounded-xl border border-black/10 bg-white px-4 py-3 shadow-xl max-w-[200px]">
                                            <div className="text-xs font-extrabold text-[#131E5C] mb-1 break-words">{item?.fullName || payload[0]?.payload?.name}</div>
                                            <div className="text-xs text-slate-600"><span className="font-bold text-[#131E5C]">{payload[0].value}</span> prueba{payload[0].value !== 1 ? "s" : ""}</div>
                                        </div>
                                    );
                                }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {porAsesor.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function RegistroPruebaManejo() {
    const { user } = useAuth();

    const isAdmin = useMemo(() => {
        const permisos = user?.permisos || [];
        const rol = String(user?.rol || "").trim().toLowerCase();
        return rol === "administrador" || permisos.includes("CRM_DIGITALES") || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const userAgencia = String(user?.agencia || "").trim();

    const [registros, setRegistros] = useState([]);

    // ─── VISTA ACTIVA: "lista" | "agenda" | "graficas" ───
    const [vistaActiva, setVistaActiva] = useState("lista");

    const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Chirey", "JAECOO R&R"];
    const ASESORES = [
        "AURA MARLIZETH FERNANDEZ LOPEZ", "Bianca Isabel Chavez Alarcon", "ERENDIRA SANTOS COYOTZI",
        "IRENE DEL CARMEN GUIZA LOPEZ", "MARCOS RAUL DIAZ RAMOS", "MARIO ALBERTO LOPEZ RAMOS",
        "MARISOL LAGUNES GONZALEZ", "NALLELY HERNANDEZ GARCIA", "OCTAVIO BRUNO GONZALEZ",
        "ROGELIO VAZQUEZ SANCHEZ", "RUBEN ALBERTO TOSQUY ADRIANO", "Saja Azzam Mohammad Jamous",
        "SANDRA LUZ PRIETO PEREZ", "YAMIL MISAEL RODRIGUEZ AGUILAR", "LUIS ALFONSO CORIA MARROQUIN",
        "CANDY DENISSE MARQUEZ CORTES", "DELMAR JAVIER ILLESCAS DOMINGUEZ", "EDGAR JESUS GOMEZ PEREZ",
        "Valeria Zilli Durante", "IDALMY JIMENEZ SANCHEZ", "IVAN JUAREZ ORTEGA", "JESSICA OLIVARES CAMPOS",
        "JESUS XITLAMA GOMEZ", "LIZBETH CANO CLARA", "LUIS MANUEL PALOMARES OLAYO",
        "MARIA DEL CARMEN ZAVALA VELAZQUEZ", "OMAR VILLIERS MONDRAGON", "RUBEN ROMERO VALDES",
        "VERONICA CASTILLO FUENTES", "Hector Rodriguez", "GEOVANI NAVA DIAZ", "ZEILA NAVARRO CONTRERAS",
        "JOSE ALFREDO BARRANCA REYES", "ADRIAN GALVEZ ROLDAN", "MARIA DE GUADALUPE VANVOLLENHOVEN DIAZ",
        "Marelly Tenorio Salinas", "ELIA INES ARANO REYES", "JORGE LUIS ALAMILLO RODRIGUEZ",
        "Cesar Ivan Salazar Reyes", "Cristian Fernando Rivera Godinez", "DULCE ABIGAIL GARCIA OLIVARES",
        "Felix Emmanuel Solis Angeles", "GERMAN JARITH SALAZAR MIRANDA", "Iris Yazmín Gómez Velázquez",
        "Israel Garcia Juarez", "JORGE ANTONIO RODRIGUEZ MARTINEZ", "JOSE DE JESUS GARCIA ROMAN",
        "JUAN MANUEL SOBREVILLA VICENCIO", "Miguel Capitanachi Paredes", "OLIMPIA VAZQUEZ MENDEZ",
        "Roberto Ramses Luna Fajardo", "Carlos Arturo Garces Vengas", "Edgar Omar Noguera Solis",
        "Javier Perez Meraz", "Luis Armando Almora Perez", "Mara Erubey Soto Villegas",
        "Sergio Ivan Quintana Martinez", "Sergio Rene Delgado Sarmiento", "Yoseth Ruiz Castellanos",
    ];

    const VEHICULOS = [
        "Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun",
        "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo",
    ];

    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort] = useState({ key: "fecha_hora_cita", dir: "desc" });

    function toggleSort(key) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    }

    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);
    const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);

    const REQUIRED = useMemo(() => ({ telefono: "Teléfono", fecha_hora_cita: "Fecha y hora" }), []);
    const [touchedSave, setTouchedSave] = useState(false);

    const missing = useMemo(() => {
        if (!draft) return [];
        const m = [];
        for (const key of Object.keys(REQUIRED)) {
            const v = draft[key];
            const isEmpty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
            if (isEmpty) m.push(key);
        }
        return m;
    }, [draft, REQUIRED]);

    const isInvalid = (key) => touchedSave && missing.includes(key);

    const telDigits = useMemo(() => String(draft?.telefono || "").replace(/\D/g, ""), [draft?.telefono]);
    const telIs10 = useMemo(() => /^\d{10}$/.test(telDigits), [telDigits]);
    const telIs52Plus10 = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);
    const telIsOk = telIs10 || telIs52Plus10;
    const telIsNormalized = telIs52Plus10;

    const telError = useMemo(() => {
        if (!openModal || !draft || !telDigits) return "";
        if (telIs10 || telIs52Plus10) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (formato inválido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: para 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [openModal, draft, telDigits, telIs10, telIs52Plus10]);

    const telInvalid = !!telError;
    const inputBase = "w-full rounded-lg border shadow-lg px-3 py-2 text-sm text-[#131E5C] font-semibold outline-none";
    const inputOk = "border-black/10 bg-neutral-100";
    const inputBad = "border-red-500 bg-red-50";

    useEffect(() => {
        const onGlobal = () => setCtxMenu((p) => ({ ...p, open: false, row: null }));
        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);
        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    const onRowContextMenu = (e, row) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row }); };

    const refreshList = async () => {
        setLoadingList(true);
        try {
            const data = await apiPruebaManejo.list();
            setRegistros(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e); setRegistros([]);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => { refreshList(); }, []);

    // Auto-refresh cada 60s cuando está en gráficas o agenda
    useEffect(() => {
        if (vistaActiva === "lista") return;
        const interval = setInterval(() => { refreshList(); }, 60_000);
        return () => clearInterval(interval);
    }, [vistaActiva]);

    const dealers = useMemo(() => {
        const set = new Set((registros || []).map((r) => normalizeStr(r.agencia)).filter(Boolean));
        if (!isAdmin && userAgencia) return ["Todos", userAgencia];
        return ["Todos", ...Array.from(set)];
    }, [registros, isAdmin, userAgencia]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const desdeInt = ymdToInt(filters.rangoDesde);
        const hastaInt = ymdToInt(filters.rangoHasta);

        return (registros || []).filter((r) => {
            if (!isAdmin && userAgencia && normalizeStr(r.agencia) !== normalizeStr(userAgencia)) return false;
            const clienteNombre = normalizeStr(r?.cliente?.nombre);
            const clienteTel = normalizeStr(r?.cliente?.telefono);
            const clienteCorreo = normalizeStr(r?.cliente?.correo);
            const matchQ = !q || normalizeStr(r.agencia).toLowerCase().includes(q) || clienteNombre.toLowerCase().includes(q) || clienteTel.toLowerCase().includes(q) || clienteCorreo.toLowerCase().includes(q) || normalizeStr(r.auto_interes).toLowerCase().includes(q) || normalizeStr(r.asesor_piso).toLowerCase().includes(q) || normalizeStr(r.num_serie).toLowerCase().includes(q) || normalizeStr(r.folio_salida).toLowerCase().includes(q) || normalizeStr(r.comentarios_cliente).toLowerCase().includes(q);
            const matchAgencia = filters.agencia === "Todos" || normalizeStr(r.agencia) === normalizeStr(filters.agencia);
            let matchRango = true;
            if (desdeInt !== null || hastaInt !== null) {
                const ymd = r.fecha_hora_cita ? toYMDLocal(r.fecha_hora_cita) : "";
                const ymdInt = ymdToInt(ymd);
                if (!ymdInt) return false;
                if (desdeInt !== null && ymdInt < desdeInt) matchRango = false;
                if (hastaInt !== null && ymdInt > hastaInt) matchRango = false;
            }
            return matchQ && matchAgencia && matchRango;
        });
    }, [registros, filters, isAdmin, userAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort || {};
        if (!key) return data;
        const mult = dir === "asc" ? 1 : -1;
        return data.sort((a, b) => {
            if (key === "fecha_hora_cita") {
                const ta = a.fecha_hora_cita ? new Date(a.fecha_hora_cita).getTime() : 0;
                const tb = b.fecha_hora_cita ? new Date(b.fecha_hora_cita).getTime() : 0;
                return (ta - tb) * mult;
            }
            const va = normalizeStr(a?.[key]).toLowerCase();
            const vb = normalizeStr(b?.[key]).toLowerCase();
            if (va < vb) return -1 * mult; if (va > vb) return 1 * mult; return 0;
        });
    }, [filtered, sort]);

    const openCreate = () => {
        setTouchedSave(false); setMode("create");
        setDraft({
            id: null, agencia: isAdmin ? "" : userAgencia,
            nombre: "", telefono: "", correo: "",
            auto_interes: "", fecha_hora_cita: "", asistencia: false,
            num_serie: "", asesor_piso: "", folio_salida: "", comentarios_cliente: "",
            evidencias: [],
        });
        setOpenModal(true);
    };

    const openEdit = async (row) => {
        if (!row?.id) return;
        try {
            setTouchedSave(false); setMode("edit"); setLoadingDetail(true); setOpenModal(true);
            const c = await apiPruebaManejo.get(row.id);
            if (!isAdmin && userAgencia && normalizeStr(c.agencia) !== normalizeStr(userAgencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false); return;
            }
            setDraft({
                id: c.id, agencia: c.agencia || (isAdmin ? "" : userAgencia),
                nombre: c?.cliente?.nombre || "", telefono: c?.cliente?.telefono || "", correo: c?.cliente?.correo || "",
                auto_interes: c.auto_interes || "", fecha_hora_cita: toDTLocal(c.fecha_hora_cita), asistencia: !!c.asistencia,
                num_serie: c.num_serie || "", asesor_piso: c.asesor_piso || "", folio_salida: c.folio_salida || "",
                comentarios_cliente: c.comentarios_cliente || "", evidencias: Array.isArray(c.evidencias) ? c.evidencias : [],
            });
        } catch (e) {
            console.error(e); alert("No se pudo abrir el registro."); setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeModal = () => { if (saving || subiendoEvidencia) return; setOpenModal(false); setDraft(null); };

    const eliminarRegistro = async (row) => {
        if (!row?.id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia."); return;
        }
        const clienteNombre = row?.cliente?.nombre || row?.cliente?.telefono || "esta prueba";
        if (!confirm(`¿Eliminar la prueba de manejo de ${clienteNombre}? Esta acción no se puede deshacer.`)) return;
        try {
            await apiPruebaManejo.remove(row.id);
            setRegistros((prev) => prev.filter((x) => x.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) { console.error(e); alert("No se pudo eliminar."); }
    };

    const save = async () => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telIsOk || telInvalid) return;
        setSaving(true);
        try {
            const agenciaFinal = isAdmin ? normalizeStr(draft.agencia || "") : userAgencia;
            const payload = {
                agencia: agenciaFinal, nombre: draft.nombre || "",
                telefono: normalizeStr(draft.telefono), correo: draft.correo || "",
                auto_interes: draft.auto_interes || "", fecha_hora_cita: fromDTLocalToISO(draft.fecha_hora_cita),
                asistencia: !!draft.asistencia, num_serie: draft.num_serie || "",
                asesor_piso: draft.asesor_piso || "", folio_salida: draft.folio_salida || "",
                comentarios_cliente: draft.comentarios_cliente || "",
            };
            let saved;
            if (mode === "create") saved = await apiPruebaManejo.create(payload);
            else saved = await apiPruebaManejo.update(draft.id, payload);
            await refreshList();
            if (mode === "create" && saved?.id) {
                const detalle = await apiPruebaManejo.get(saved.id);
                setDraft((p) => ({ ...p, id: detalle.id, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
                setMode("edit"); return;
            }
            closeModal();
        } catch (e) { console.error(e); alert("Error guardando."); } finally { setSaving(false); }
    };

    const [updatingInline, setUpdatingInline] = useState({});
    const toggleAsistenciaInline = async (row) => {
        const id = row?.id; if (!id) return;
        if (!isAdmin && userAgencia && normalizeStr(row.agencia) !== normalizeStr(userAgencia)) { alert("Sin permisos."); return; }
        const prev = !!row.asistencia;
        setRegistros((p) => p.map((c) => (c.id === id ? { ...c, asistencia: !prev } : c)));
        setUpdatingInline((p) => ({ ...p, [id]: true }));
        try { await apiPruebaManejo.patch(id, { asistencia: !prev }); }
        catch (e) { console.error(e); setRegistros((p) => p.map((c) => (c.id === id ? { ...c, asistencia: prev } : c))); alert("No se pudo actualizar."); }
        finally { setUpdatingInline((p) => { const n = { ...p }; delete n[id]; return n; }); }
    };

    const subirEvidencias = async (files) => {
        if (!draft?.id) { alert("Primero guarda la prueba para adjuntar evidencias."); return; }
        setSubiendoEvidencia(true);
        try {
            for (const f of files) await apiEvidenciasPruebaManejo.create({ id_prueba_manejo: draft.id, archivo: f });
            const detalle = await apiPruebaManejo.get(draft.id);
            setDraft((p) => ({ ...p, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
        } catch (e) { console.error(e); alert("No se pudieron subir evidencias."); } finally { setSubiendoEvidencia(false); }
    };

    const eliminarEvidencia = async (ev) => {
        if (!confirm(`¿Eliminar evidencia "${ev?.nombre_original || "archivo"}"?`)) return;
        setSubiendoEvidencia(true);
        try {
            await apiEvidenciasPruebaManejo.remove(ev.id);
            const detalle = await apiPruebaManejo.get(draft.id);
            setDraft((p) => ({ ...p, evidencias: Array.isArray(detalle.evidencias) ? detalle.evidencias : [] }));
        } catch (e) { console.error(e); alert("No se pudo eliminar evidencia."); } finally { setSubiendoEvidencia(false); }
    };

    const resetFilters = () => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const setHoy = () => { const hoy = toYMDLocal(new Date()); setFilters((p) => ({ ...p, rangoDesde: hoy, rangoHasta: hoy })); };

    // ─── Botones de vista ───
    const VISTAS = [
        { key: "tabla", label: "Tabla", icon: LayoutList },
        { key: "agenda", label: "Agenda", icon: CalendarRange },
        { key: "graficas", label: "Gráficas", icon: BarChart3 },
    ];

    return (
        <div className="w-full">
            {/* ─── Header ─── */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Pruebas de Manejo</h2>
                    <p className="text-sm text-slate-400">
                        {vistaActiva === "lista" && "Doble clic para editar la información."}
                        {vistaActiva === "agenda" && "Visualiza las pruebas en el calendario."}
                        {vistaActiva === "graficas" && "Estadísticas en tiempo real · Se actualiza cada 60 s."}
                    </p>
                    {!isAdmin && userAgencia ? (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Agencia asignada: <span className="text-[#131E5C]">{userAgencia}</span>
                        </p>
                    ) : null}
                </div>

                {/* Botones de vista + Nueva Prueba */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Toggle vistas */}
                    <div className="flex items-center rounded-lg border border-[#131E5C]/20 bg-white overflow-hidden shadow-sm">
                        {VISTAS.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setVistaActiva(key)}
                                className={[
                                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors",
                                    vistaActiva === key
                                        ? "bg-[#131E5C] text-white"
                                        : "text-[#131E5C] hover:bg-[#131E5C]/5",
                                ].join(" ")}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm bg-[#131E5C] hover:bg-[#131E5C]/80 text-white shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Prueba
                    </button>
                </div>
            </div>

            {/* ─── Filtros (solo en vista lista) ─── */}
            {vistaActiva === "lista" && (
                <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="grid gap-3 md:grid-cols-12">
                        <div className="md:col-span-6">
                            <FilterBlock label="Búsqueda">
                                <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                    <Search className="h-4 w-4 text-[#131E5C]" />
                                    <input value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Buscar por dealer, cliente, teléfono, serie, folio, asesor…" className="w-full text-sm text-[#131E5C] outline-none placeholder:text-[#131E5C]" />
                                    {filters.q ? <button onClick={() => setFilters((p) => ({ ...p, q: "" }))} className="rounded-lg p-1 bg-white text-[#131E5C] hover:bg-white/80 hover:text-red-500" aria-label="Limpiar búsqueda"><X className="h-4 w-4" /></button> : null}
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-3">
                            <FilterBlock label="Dealer">
                                <select value={filters.agencia} onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                    {dealers.map((d) => (<option key={d} value={d} className="bg-neutral-100 text-[#131E5C]">{d}</option>))}
                                </select>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-3">
                            <FilterBlock label="Acciones">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={setHoy} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"><CalendarDays className="h-4 w-4" />Hoy</button>
                                    <button onClick={resetFilters} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] px-3 py-2 text-sm font-semibold bg-white text-[#131E5C] hover:text-white hover:bg-[#131E5C]"><X className="h-4 w-4" />Limpiar</button>
                                </div>
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Desde">
                                <input type="date" value={filters.rangoDesde} onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" />
                            </FilterBlock>
                        </div>
                        <div className="md:col-span-6">
                            <FilterBlock label="Hasta">
                                <input type="date" value={filters.rangoHasta} onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none" />
                            </FilterBlock>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ VISTA LISTA ═══ */}
            {vistaActiva === "lista" && (
                <>
                    {/* Desktop */}
                    <div className="hidden overflow-hidden rounded-lg shadow-lg bg-white/[0.03] lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="font-vw-header text-xs bg-[#131E5C] text-white border border-black">
                                    <tr>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("fecha_hora_cita")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Fecha y Hora <span className="opacity-60">{sort.key === "fecha_hora_cita" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}</span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSort("agencia")} className="inline-flex items-center gap-1 text-xs font-bold">
                                                Dealer <span className="opacity-60">{sort.key === "agencia" ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}</span>
                                            </button>
                                        </th>
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3">Auto interés</th>
                                        <th className="px-4 py-3">Asesor piso</th>
                                        <th className="px-4 py-3">No. Serie</th>
                                        <th className="px-4 py-3">Folio Pase Salida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? (
                                        <>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</>
                                    ) : (
                                        <>
                                            {sorted.map((row) => {
                                                const clienteNombre = row?.cliente?.nombre || "—";
                                                return (
                                                    <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} className="cursor-pointer hover:bg-white/[0.04]" title="Doble clic para editar">
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</td>
                                                        <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]"><div className="font-bold">{clienteNombre}</div></td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.auto_interes || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.asesor_piso || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.num_serie || "—"}</td>
                                                        <td className="px-4 py-3 text-[#131E5C]">{row.folio_salida || "—"}</td>
                                                    </tr>
                                                );
                                            })}
                                            {sorted.length === 0 ? (
                                                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</td></tr>
                                            ) : null}
                                        </>
                                    )}
                                </tbody>
                            </table>
                            <ContextMenu ctxMenu={ctxMenu} onDelete={async (row) => { await eliminarRegistro(row); setCtxMenu({ open: false, x: 0, y: 0, row: null }); }} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />
                        </div>
                    </div>

                    {/* Mobile */}
                    <div className="grid gap-3 lg:hidden">
                        {loadingList ? (
                            <>{Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                                    <Skeleton className="h-4 w-48" /><Skeleton className="mt-2 h-3 w-36" /><Skeleton className="mt-3 h-3 w-full" /><Skeleton className="mt-2 h-3 w-3/4" />
                                </div>
                            ))}</>
                        ) : (
                            <>
                                {sorted.map((row) => {
                                    const clienteNombre = row?.cliente?.nombre || "—";
                                    const clienteTel = row?.cliente?.telefono || "—";
                                    return (
                                        <button key={row.id} onClick={() => openEdit(row)} className="text-left rounded-3xl border border-black/10 bg-white p-4 shadow-sm hover:bg-slate-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">{clienteNombre}</div>
                                                    <div className="mt-1 text-xs text-slate-600">{row.agencia || "—"} • {clienteTel}</div>
                                                    <div className="mt-1 text-xs text-slate-600">{row.fecha_hora_cita ? toDTLocal(row.fecha_hora_cita).replace("T", " ") : "—"}</div>
                                                    <div className="mt-1 text-xs text-slate-600">Serie: {row.num_serie || "—"} • Folio: {row.folio_salida || "—"}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3 text-sm text-slate-700 line-clamp-3">{row.comentarios_cliente || "—"}</div>
                                            <div className="mt-3 text-xs text-slate-500">Toca para editar</div>
                                        </button>
                                    );
                                })}
                                {sorted.length === 0 ? <div className="rounded-3xl border border-black/10 bg-white p-10 text-center text-slate-600">No hay resultados.</div> : null}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* ═══ VISTA AGENDA ═══ */}
            {vistaActiva === "agenda" && (
                <div>
                    {loadingList ? (
                        <div className="flex items-center justify-center py-20 text-[#131E5C]">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <AgendaView registros={registros} onEditRow={openEdit} />
                    )}
                </div>
            )}

            {/* ═══ VISTA GRÁFICAS ═══ */}
            {vistaActiva === "graficas" && (
                <div>
                    {loadingList ? (
                        <div className="flex items-center justify-center py-20 text-[#131E5C]">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <GraficasView registros={registros} />
                    )}
                </div>
            )}

            {/* ─── MODAL ─── */}
            <Modal open={openModal} title={mode === "create" ? "Nueva Prueba de Manejo" : `Editar • ${draft?.id}`} onClose={closeModal}
                footer={
                    <>
                        <button onClick={closeModal} disabled={saving || subiendoEvidencia} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-red-400 px-4 py-2 text-sm font-semibold text-white/90 hover:text-white hover:bg-red-600 disabled:opacity-60"><X className="h-4 w-4" />Cancelar</button>
                        <button onClick={save} disabled={saving || loadingDetail || subiendoEvidencia || telInvalid || (draft?.telefono ? !telIsOk : false)} className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 bg-[#131E5C]/85 py-2 text-sm font-bold text-white/90 hover:bg-[#131E5C] hover:text-white disabled:opacity-60">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {saving ? "Guardando..." : (mode === "create" ? "Guardar y continuar" : "Guardar cambios")}
                        </button>
                    </>
                }>
                {loadingDetail ? <ModalSkeleton /> : !draft ? null : (
                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select value={draft.agencia || ""} onChange={(e) => setDraft((p) => ({ ...p, agencia: e.target.value }))} disabled={!isAdmin} className={[inputBase, inputOk, !isAdmin ? "opacity-75 cursor-not-allowed" : ""].join(" ")}>
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : (userAgencia ? [userAgencia] : DEALERS)).map((d) => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </Field>
                        <Field label="Prospecto" icon={User}>
                            <input value={draft.nombre} onChange={(e) => setDraft((p) => ({ ...p, nombre: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Nombre completo" />
                        </Field>
                        <Field label="Teléfono" icon={Phone}>
                            <input maxLength={12} value={draft.telefono || ""} onChange={(e) => setDraft((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 12) }))} disabled={telIsNormalized} className={[inputBase, (isInvalid("telefono") || telInvalid) ? inputBad : inputOk, telIsNormalized ? "opacity-75 cursor-not-allowed" : ""].join(" ")} />
                            {isInvalid("telefono") ? <div className="mt-2 text-xs font-bold text-red-600">Teléfono es requerido.</div> : null}
                            {!isInvalid("telefono") && telError ? <div className="mt-2 text-xs font-bold text-red-600">{telError}</div> : null}
                        </Field>
                        <Field label="Correo" icon={Mail}>
                            <input value={draft.correo} onChange={(e) => setDraft((p) => ({ ...p, correo: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Correo" />
                        </Field>
                        <Field label="VW de sus sueños" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={(e) => setDraft((p) => ({ ...p, auto_interes: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un modelo...</option>
                                {VEHICULOS.map((d) => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </Field>
                        <Field label="Fecha y Hora" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_hora_cita} onChange={(e) => setDraft((p) => ({ ...p, fecha_hora_cita: e.target.value }))} className={[inputBase, isInvalid("fecha_hora_cita") ? inputBad : inputOk].join(" ")} />
                            {isInvalid("fecha_hora_cita") ? <div className="mt-2 text-xs font-bold text-red-600">Fecha y hora es requerido.</div> : null}
                        </Field>
                        <Field label="Asesor Piso" icon={UserStar}>
                            <select value={draft.asesor_piso || ""} onChange={(e) => setDraft((p) => ({ ...p, asesor_piso: e.target.value }))} className={[inputBase, inputOk].join(" ")}>
                                <option value="" disabled>Selecciona un asesor...</option>
                                {ASESORES.map((d) => (<option key={d} value={d}>{d}</option>))}
                            </select>
                        </Field>
                        <Field label="No. Serie" icon={Hash}>
                            <input value={draft.num_serie} onChange={(e) => setDraft((p) => ({ ...p, num_serie: e.target.value }))} className={[inputBase, inputOk].join(" ")} placeholder="Ej. 3VWSA..." />
                        </Field>
                        <Field label="Folio Pase de Salida" icon={FileText}>
                            <input value={draft.folio_salida} onChange={(e) => setDraft((p) => ({ ...p, folio_salida: e.target.value }))} className={[inputBase, inputOk].join(" ")} />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Comentarios del cliente" icon={MessageSquareText}>
                                <textarea value={draft.comentarios_cliente} onChange={(e) => setDraft((p) => ({ ...p, comentarios_cliente: e.target.value }))} className={[inputBase, inputOk, "min-h-[80px]"].join(" ")} placeholder="Notas / comentarios del cliente..." />
                            </Field>
                        </div>
                        <div className="md:col-span-3">
                            <Field label="Evidencias" icon={Camera}>
                                <EvidenciasUploader evidencias={draft.evidencias || []} disabled={saving || subiendoEvidencia} onSubir={subirEvidencias} onEliminar={eliminarEvidencia} />
                                {!draft.id ? <div className="mt-2 text-xs font-semibold text-slate-600">* Guarda primero la prueba para adjuntar evidencias.</div> : null}
                            </Field>
                        </div>
                        {subiendoEvidencia ? (
                            <div className="md:col-span-3 rounded-lg border border-black/10 bg-white p-3">
                                <div className="flex items-center gap-2 text-[#131E5C] font-bold"><Loader2 className="h-5 w-5 animate-spin" />Procesando evidencias...</div>
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}