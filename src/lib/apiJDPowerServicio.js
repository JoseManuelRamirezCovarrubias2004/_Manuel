// src/lib/apiJDPowerServicio.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

function getAuthToken() {
  try {
    const directo = localStorage.getItem("auth.access");
    if (directo) return directo;
    const raw = localStorage.getItem("auth");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.token || "";
  } catch {
    return "";
  }
}

function getAuthHeader() {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function http(path, { method = "GET", body, headers, signal } = {}) {
  const finalHeaders = {
    ...getAuthHeader(),
    ...(headers || {}),
  };

  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body,
    signal,
  });

  if (!res.ok) {
    let mensaje = "";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        mensaje = data?.detail || data?.message || JSON.stringify(data);
      } else {
        mensaje = await res.text();
      }
    } catch {
      mensaje = "";
    }
    throw new Error(mensaje || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

function esFiltroVacio(valor) {
  return (
    valor === undefined ||
    valor === null ||
    valor === "" ||
    valor === "Todos" ||
    valor === "Todas"
  );
}

function construirQuery(filtros = {}) {
  const params = new URLSearchParams();

  if (!esFiltroVacio(filtros.anio))               params.set("anio", filtros.anio);
  if (!esFiltroVacio(filtros.mes))                params.set("mes", filtros.mes);
  if (!esFiltroVacio(filtros.tipo))               params.set("tipo", filtros.tipo);
  if (!esFiltroVacio(filtros.tipo_servicio))      params.set("tipo_servicio", filtros.tipo_servicio);
  if (!esFiltroVacio(filtros.canal_envio))        params.set("canal_envio", filtros.canal_envio);
  if (!esFiltroVacio(filtros.estatus))            params.set("estatus", filtros.estatus);
  if (!esFiltroVacio(filtros.concesionaria))      params.set("concesionaria", filtros.concesionaria);
  if (!esFiltroVacio(filtros.codigo_concesionaria)) params.set("codigo_concesionaria", filtros.codigo_concesionaria);
  if (!esFiltroVacio(filtros.asesor))             params.set("asesor", filtros.asesor);
  if (!esFiltroVacio(filtros.modelo))             params.set("modelo", filtros.modelo);
  if (!esFiltroVacio(filtros.anio_vehiculo))      params.set("anio_vehiculo", filtros.anio_vehiculo);
  if (!esFiltroVacio(filtros.region))             params.set("region", filtros.region);
  if (!esFiltroVacio(filtros.zona))               params.set("zona", filtros.zona);
  if (!esFiltroVacio(filtros.estado))             params.set("estado", filtros.estado);
  if (!esFiltroVacio(filtros.search))             params.set("search", filtros.search);

  params.set("ordering", filtros.ordering || "-periodo");
  params.set("limit", String(filtros.limit || 10000));

  return params.toString();
}

export function obtenerOpcionesJDPowerServicio(options = {}) {
  return http("/jdpower/api/encuestas-servicio/opciones/", options);
}

export function obtenerEncuestasJDPowerServicio(filtros = {}, options = {}) {
  const query = construirQuery(filtros);
  return http(
    `/jdpower/api/encuestas-servicio/ligero/${query ? `?${query}` : ""}`,
    options
  );
}

export const apiJDPowerServicio = {
  list: (filtros = {}, options = {}) => {
    const query = construirQuery(filtros);
    return http(`/jdpower/api/encuestas-servicio/${query ? `?${query}` : ""}`, options);
  },
  ligero: (filtros = {}, options = {}) => {
    return obtenerEncuestasJDPowerServicio(filtros, options);
  },
  opciones: (options = {}) => {
    return obtenerOpcionesJDPowerServicio(options);
  },
  get: (id) => {
    return http(`/jdpower/api/encuestas-servicio/${encodeURIComponent(id)}/`);
  },
};