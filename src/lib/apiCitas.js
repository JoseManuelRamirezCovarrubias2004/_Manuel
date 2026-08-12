// src/lib/apiCitas.js
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

  let next = `/citas/api/citas/${buildQuery(params)}`;

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

function jsonRequest(method, payload) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  };
}

export const apiCitas = {
  list: (params = {}) => listAll(params),

  get: (id) => http(`/citas/api/citas/${id}/`),

  create: (payload) => http("/citas/api/citas/", jsonRequest("POST", payload)),

  update: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PUT", payload)),

  patch: (id, payload) =>
    http(`/citas/api/citas/${id}/`, jsonRequest("PATCH", payload)),

  remove: (id) =>
    http(`/citas/api/citas/${id}/`, {
      method: "DELETE",
    }),
};
