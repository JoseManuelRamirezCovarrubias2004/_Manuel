// src/lib/apiCredito.js
import { http } from "./apiClient";

const optionsProtegidas = {
  retryWithoutAuth: false,
  redirectOnUnauthorized: true,
};

export const apiCredito = {
  list: () => http("/financieros/api/solicitudes-credito/", optionsProtegidas),

  get: (id) =>
    http(
      `/financieros/api/solicitudes-credito/${encodeURIComponent(id)}/`,
      optionsProtegidas,
    ),

  create: (payload) =>
    http("/financieros/api/solicitudes-credito/", {
      ...optionsProtegidas,
      method: "POST",
      body: payload,
    }),

  update: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${encodeURIComponent(id)}/`, {
      ...optionsProtegidas,
      method: "PUT",
      body: payload,
    }),

  patch: (id, payload) =>
    http(`/financieros/api/solicitudes-credito/${encodeURIComponent(id)}/`, {
      ...optionsProtegidas,
      method: "PATCH",
      body: payload,
    }),

  remove: (id) =>
    http(`/financieros/api/solicitudes-credito/${encodeURIComponent(id)}/`, {
      ...optionsProtegidas,
      method: "DELETE",
    }),
};
