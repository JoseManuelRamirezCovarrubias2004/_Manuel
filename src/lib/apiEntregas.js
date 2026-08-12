// src/lib/apiEntregas.js
import { http } from "./apiClient";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const text = query.toString();

  return text ? `?${text}` : "";
}

async function listAll(params = {}) {
  let results = [];

  let next = `/citas/api/entregas/${buildQuery(params)}`;

  while (next) {
    const data = await http(next);

    if (Array.isArray(data)) {
      return data;
    }

    results = results.concat(data?.results || []);

    next = data?.next
      ? String(data.next).replace(/^https?:\/\/[^/]+/, "")
      : null;
  }

  return results;
}

export const apiEntregas = {
  list: (params = {}) => listAll(params),

  get: (id) => http(`/citas/api/entregas/${id}/`),

  create: (payload) =>
    http("/citas/api/entregas/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/citas/api/entregas/${id}/`, {
      method: "DELETE",
    }),
};
