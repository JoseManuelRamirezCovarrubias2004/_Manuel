// src/pages/Inventario/InventarioIndex.jsx
import { useEffect, useMemo, useState } from "react";
import { apiInventario } from "../../lib/apiInventario";
import { useECharts } from "./useECharts";

const NAVY = "#131E5C";

// Paleta derivada del navy de marca, para no usar colores default de ECharts.
const PALETA = ["#131E5C", "#2C3E8C", "#5470C6", "#7C93E0", "#A7B6F0", "#1F2A6B", "#3D4F9E", "#647BC9"];

function Panel({ titulo, subtitulo, children, alto = 320 }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-800">{titulo}</h3>
        {subtitulo && <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>}
      </div>
      <div style={{ height: alto }}>{children}</div>
    </div>
  );
}

function ChartDiv({ option, loading }) {
  const ref = useECharts(option, { loading });
  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}

function EmptyState({ mensaje = "Sin datos para los filtros seleccionados" }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
      {mensaje}
    </div>
  );
}

export default function InventarioIndex() {
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({ agencias: [], estatus: [] });
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("");
  const [estatusSeleccionado, setEstatusSeleccionado] = useState("");

  const [porAgencia, setPorAgencia] = useState([]);
  const [porEstatus, setPorEstatus] = useState([]);
  const [porMarca, setPorMarca] = useState([]);
  const [nuevoUsado, setNuevoUsado] = useState([]);
  const [nacionalImportado, setNacionalImportado] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Catálogos para los selects (agencias / estatus de stock).
  useEffect(() => {
    apiInventario
      .getFiltros()
      .then(setFiltrosDisponibles)
      .catch(() => setFiltrosDisponibles({ agencias: [], estatus: [] }));
  }, []);

  // Recarga las 5 gráficas cada vez que cambia algún filtro global.
  useEffect(() => {
    const filtros = {
      agencia: agenciaSeleccionada || undefined,
      estatus: estatusSeleccionado || undefined,
    };

    setCargando(true);
    setError("");

    Promise.all([
      apiInventario.getPorAgencia(filtros),
      apiInventario.getPorEstatus(filtros),
      apiInventario.getPorMarca(filtros),
      apiInventario.getNuevoUsado(filtros),
      apiInventario.getNacionalImportado(filtros),
    ])
      .then(([agencia, estatus, marca, nu, ni]) => {
        setPorAgencia(agencia);
        setPorEstatus(estatus);
        setPorMarca(marca.slice(0, 10)); // top 10 familias, para no saturar la gráfica
        setNuevoUsado(nu);
        setNacionalImportado(ni);
      })
      .catch(() => setError("No se pudo cargar el inventario. Intenta de nuevo."))
      .finally(() => setCargando(false));
  }, [agenciaSeleccionada, estatusSeleccionado]);

  const totalGeneral = useMemo(
    () => porAgencia.reduce((acc, item) => acc + item.total, 0),
    [porAgencia],
  );

  // ---------- Opciones de cada gráfica ----------

  const optionPorAgencia = useMemo(() => {
    if (porAgencia.length === 0) return null;
    return {
      color: PALETA,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: porAgencia.map((d) => d.agenciaNombre),
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: { color: "#475569" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f5f9" } },
        axisLabel: { color: "#94a3b8" },
      },
      series: [
        {
          name: "Vehículos",
          type: "bar",
          data: porAgencia.map((d) => d.total),
          itemStyle: { color: NAVY, borderRadius: [6, 6, 0, 0] },
          barWidth: "50%",
          label: { show: true, position: "top", color: "#334155", fontSize: 11 },
        },
      ],
    };
  }, [porAgencia]);

  const optionPorEstatus = useMemo(() => {
    if (porEstatus.length === 0) return null;
    return {
      color: PALETA,
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: {
        bottom: 0,
        textStyle: { color: "#475569", fontSize: 11 },
      },
      series: [
        {
          name: "Estatus",
          type: "pie",
          radius: ["45%", "72%"],
          center: ["50%", "44%"],
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          label: { color: "#334155", fontSize: 11 },
          data: porEstatus.map((d) => ({ name: d.estatusNombre, value: d.total })),
        },
      ],
    };
  }, [porEstatus]);

  const optionPorMarca = useMemo(() => {
    if (porMarca.length === 0) return null;
    const datos = [...porMarca].reverse(); // para que el mayor quede arriba en barra horizontal
    return {
      color: PALETA,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f5f9" } },
        axisLabel: { color: "#94a3b8" },
      },
      yAxis: {
        type: "category",
        data: datos.map((d) => d.familia),
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: { color: "#475569", fontSize: 11 },
      },
      series: [
        {
          name: "Vehículos",
          type: "bar",
          data: datos.map((d) => d.total),
          itemStyle: { color: "#2C3E8C", borderRadius: [0, 6, 6, 0] },
          barWidth: "60%",
          label: { show: true, position: "right", color: "#334155", fontSize: 11 },
        },
      ],
    };
  }, [porMarca]);

  const optionNuevoUsado = useMemo(() => {
    if (nuevoUsado.length === 0) return null;

    const agencias = [...new Set(nuevoUsado.map((d) => d.agenciaNombre))];
    const condiciones = [...new Set(nuevoUsado.map((d) => d.condicion))];
    const colorPorCondicion = { Nuevo: NAVY, Usado: "#94A3B8" };

    const series = condiciones.map((cond) => ({
      name: cond,
      type: "bar",
      stack: "total",
      data: agencias.map((ag) => {
        const fila = nuevoUsado.find((d) => d.agenciaNombre === ag && d.condicion === cond);
        return fila ? fila.total : 0;
      }),
      itemStyle: { color: colorPorCondicion[cond] || "#CBD5E1" },
      barWidth: "45%",
    }));

    return {
      color: PALETA,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { top: 0, textStyle: { color: "#475569", fontSize: 11 } },
      grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: agencias,
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: { color: "#475569" },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f5f9" } },
        axisLabel: { color: "#94a3b8" },
      },
      series,
    };
  }, [nuevoUsado]);

  const optionNacionalImportado = useMemo(() => {
    if (nacionalImportado.length === 0) return null;
    return {
      color: ["#131E5C", "#A7B6F0"],
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { color: "#475569", fontSize: 11 } },
      series: [
        {
          name: "Origen",
          type: "pie",
          radius: "65%",
          center: ["50%", "44%"],
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          label: { color: "#334155", fontSize: 11 },
          data: nacionalImportado.map((d) => ({ name: d.tipoNombre, value: d.total })),
        },
      ],
    };
  }, [nacionalImportado]);

  return (
    <div className="p-6 space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-400 mt-1">
            Vehículos en las 5 agencias
            {!cargando && (
              <span className="text-slate-500 font-medium"> · {totalGeneral.toLocaleString("es-MX")} en total</span>
            )}
          </p>
        </div>

        {/* Filtros globales */}
        <div className="flex flex-wrap gap-2">
          <select
            value={agenciaSeleccionada}
            onChange={(e) => setAgenciaSeleccionada(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#131E5C]/30"
          >
            <option value="">Todas las agencias</option>
            {filtrosDisponibles.agencias.map((a) => (
              <option key={a.codigo} value={a.codigo}>
                {a.nombre}
              </option>
            ))}
          </select>

          <select
            value={estatusSeleccionado}
            onChange={(e) => setEstatusSeleccionado(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#131E5C]/30"
          >
            <option value="">Todos los estatus</option>
            {filtrosDisponibles.estatus.map((e) => (
              <option key={e.codigo} value={e.codigo}>
                {e.codigo} = {e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Gráfica principal: inventario total por agencia */}
      <Panel
        titulo="Inventario total por agencia"
        subtitulo="Vehículos actuales según DN_Atual"
        alto={360}
      >
        {optionPorAgencia ? (
          <ChartDiv option={optionPorAgencia} loading={cargando} />
        ) : (
          <EmptyState />
        )}
      </Panel>

      {/* Resto de gráficas en grilla */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel titulo="Distribución por estatus de stock" subtitulo="Status del Stock (StEstoque)">
          {optionPorEstatus ? <ChartDiv option={optionPorEstatus} loading={cargando} /> : <EmptyState />}
        </Panel>

        <Panel titulo="Top 10 modelos en inventario" subtitulo="Por marca y familia">
          {optionPorMarca ? <ChartDiv option={optionPorMarca} loading={cargando} /> : <EmptyState />}
        </Panel>

        <Panel titulo="Nuevo vs. Usado por agencia" subtitulo="Condición de uso (CondUso)">
          {optionNuevoUsado ? <ChartDiv option={optionNuevoUsado} loading={cargando} /> : <EmptyState />}
        </Panel>

        <Panel titulo="Nacional vs. Importado" subtitulo="Tipo de nacionalización (TpNacImp)">
          {optionNacionalImportado ? (
            <ChartDiv option={optionNacionalImportado} loading={cargando} />
          ) : (
            <EmptyState />
          )}
        </Panel>
      </div>
    </div>
  );
}