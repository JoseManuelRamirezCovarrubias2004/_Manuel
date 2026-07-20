//src/lib/apiColaboradores.js
const API_URL = "http://localhost:8000/api/rrhh/colaboradores/";

async function manejarRespuesta(response) {
  if (!response.ok) {
    let detalle;
    try {
      detalle = await response.json();
    } catch {
      detalle = { detail: response.statusText };
    }
    const error = new Error("Error en la petición a colaboradores");
    error.detalle = detalle;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null; // DELETE sin contenido
  return response.json();
}

/**
 * Lista colaboradores. Soporta filtros del backend:
 * agencia (exacto) y buscar (nombre, puesto, curp, nss).
 */
export async function obtenerColaboradores({ agencia, buscar } = {}) {
  const params = new URLSearchParams();
  if (agencia) params.append("agencia", agencia);
  if (buscar) params.append("buscar", buscar);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_URL}${query}`);
  return manejarRespuesta(response);
}

/**
 * Obtiene un colaborador por su id_colaborador.
 */
export async function obtenerColaborador(idColaborador) {
  const response = await fetch(`${API_URL}${idColaborador}/`);
  return manejarRespuesta(response);
}

/**
 * Crea un colaborador.
 * Campos esperados por el backend: agencia, nombre, puesto, fecha_alta,
 * fecha_baja, nss, curp, fecha_nacimiento.
 */
export async function crearColaborador(datos) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(response);
}

/**
 * Actualiza parcialmente un colaborador existente.
 */
export async function actualizarColaborador(idColaborador, datos) {
  const response = await fetch(`${API_URL}${idColaborador}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(response);
}

/**
 * Elimina un colaborador.
 */
export async function eliminarColaborador(idColaborador) {
  const response = await fetch(`${API_URL}${idColaborador}/`, {
    method: "DELETE",
  });
  return manejarRespuesta(response);
}
