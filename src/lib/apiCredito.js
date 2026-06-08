// src/lib/apiCredito.js
import { http } from "./apiClient";

export const apiCredito = {
  list: () => http("/financieros/api/solicitudes-credito/"),

  get: (id) => http(`/financieros/api/solicitudes-credito/${id}/`),

  create: (payload) =>
    http("/financieros/api/solicitudes-credito/", {
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${id}/`, {
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${id}/`, {
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/financieros/api/solicitudes-credito/${id}/`, {
      method: "DELETE",
    }),
};
