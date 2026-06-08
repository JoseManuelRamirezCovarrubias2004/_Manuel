// src/lib/apiEncuestas.js
import { http } from "./apiClient";

export const apiEncuestas = {
  list: () => http("/api/encuestas/satisfaccion/"),
  get: (id) => http(`/api/encuestas/satisfaccion/${id}/`),

  crearSatisfaccion: (data) =>
    http("/api/public/encuestas/satisfaccion/", {
      method: "POST",
      body: data,
      auth: false,
      redirectOnUnauthorized: false,
    }),

  crearServicio: (data) =>
    http("/api/public/encuestas/servicio/", {
      method: "POST",
      body: data,
      auth: false,
      redirectOnUnauthorized: false,
    }),
};
