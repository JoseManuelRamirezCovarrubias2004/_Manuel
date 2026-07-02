// src/lib/apiRetencion.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        mensaje ||
          "No tienes permisos para consultar Retención. Verifica que tu sesión esté activa."
      );
    }

    throw new Error(mensaje || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return res.json();
  }
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

  if (!esFiltroVacio(filtros.anio)) params.set("anio", filtros.anio);
  if (!esFiltroVacio(filtros.mes)) params.set("mes", filtros.mes);
  if (!esFiltroVacio(filtros.estado)) params.set("estado", filtros.estado);
  if (!esFiltroVacio(filtros.segmento)) params.set("segmento", filtros.segmento);
  if (!esFiltroVacio(filtros.marca)) params.set("marca", filtros.marca);
  if (!esFiltroVacio(filtros.modelo)) params.set("modelo", filtros.modelo);
  if (!esFiltroVacio(filtros.agencia)) params.set("agencia", filtros.agencia);
  if (!esFiltroVacio(filtros.condicion)) params.set("condicion", filtros.condicion);
  if (!esFiltroVacio(filtros.search)) params.set("search", filtros.search);

  params.set("ordering", filtros.ordering || "-fecha_ultima_os");
  params.set("limit", String(filtros.limit || 10000));

  return params.toString();
}

export function obtenerOpcionesRetencion(options = {}) {
  return http("/retencion/api/ordenes-ventas/opciones/", options);
}

export function obtenerOrdenesRetencion(filtros = {}, options = {}) {
  const query = construirQuery(filtros);
  return http(
    `/retencion/api/ordenes-ventas/ligero/${query ? `?${query}` : ""}`,
    options
  );
}

export function obtenerHistorialRetencion(vin, options = {}) {
  return http(
    `/retencion/api/ordenes-ventas/${encodeURIComponent(vin)}/historial/`,
    options
  );
}

export const apiRetencion = {
  list: (filtros = {}, options = {}) => {
    const query = construirQuery(filtros);
    return http(
      `/retencion/api/ordenes-ventas/${query ? `?${query}` : ""}`,
      options
    );
  },

  ligero: (filtros = {}, options = {}) => obtenerOrdenesRetencion(filtros, options),

  opciones: (options = {}) => obtenerOpcionesRetencion(options),

  get: (vin, options = {}) =>
    http(`/retencion/api/ordenes-ventas/${encodeURIComponent(vin)}/`, options),

  historial: (vin, options = {}) => obtenerHistorialRetencion(vin, options),
};