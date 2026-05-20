//src/lib/apiPedidosPiezas.js
const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// "http://127.0.0.1:8000/";

function getStoredToken() {
  try {
    const access = localStorage.getItem("auth.access");
    if (access && access !== "undefined" && access !== "null") {
      return access;
    }

    const rawAuth = localStorage.getItem("auth");
    if (!rawAuth) return null;

    const parsed = JSON.parse(rawAuth);
    const token = parsed?.token;

    if (token && token !== "undefined" && token !== "null") {
      return token;
    }

    return null;
  } catch {
    return null;
  }
}

function getAuthHeader() {
  const token = getStoredToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function buildApiError(res) {
  const contentType = res.headers.get("content-type") || "";
  let data = null;
  let message = `HTTP ${res.status}`;

  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
      message =
        data?.detail ||
        data?.message ||
        (typeof data === "string" ? data : `HTTP ${res.status}`);
    } else {
      const text = await res.text();
      message = text || `HTTP ${res.status}`;
    }
  } catch {
    message = `HTTP ${res.status}`;
  }

  const error = new Error(message);
  error.status = res.status;
  error.data = data;
  throw error;
}

async function http(path, { method = "GET", data, headers } = {}) {
  const finalHeaders = {
    ...getAuthHeader(),
    ...(headers || {}),
  };

  if (data !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers: finalHeaders,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    await buildApiError(res);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  return res.text();
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "Todos"
    ) {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const apiPedidosPiezas = {
  listPedidos: (params = {}) =>
    http(`/api/pedidos-piezas/pedidos/${buildQuery(params)}`),

  getPedido: (id) => http(`/api/pedidos-piezas/pedidos/${id}/`),

  createPedido: (payload) =>
    http("/api/pedidos-piezas/pedidos/", {
      method: "POST",
      data: payload,
    }),

  updatePedido: (id, payload) =>
    http(`/api/pedidos-piezas/pedidos/${id}/`, {
      method: "PUT",
      data: payload,
    }),

  patchPedido: (id, payload) =>
    http(`/api/pedidos-piezas/pedidos/${id}/`, {
      method: "PATCH",
      data: payload,
    }),

  deletePedido: (id) =>
    http(`/api/pedidos-piezas/pedidos/${id}/`, {
      method: "DELETE",
    }),

  listPiezas: (q = "") =>
    http(`/api/pedidos-piezas/piezas/${buildQuery({ q })}`),

  createPieza: (payload) =>
    http("/api/pedidos-piezas/piezas/", {
      method: "POST",
      data: payload,
    }),

  updatePieza: (id, payload) =>
    http(`/api/pedidos-piezas/piezas/${id}/`, {
      method: "PUT",
      data: payload,
    }),

  deletePieza: (id) =>
    http(`/api/pedidos-piezas/piezas/${id}/`, {
      method: "DELETE",
    }),
};
