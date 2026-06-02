import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/crm/",
  server: {
    allowedHosts: ["ryrcorp.vercel.app"],
    hmr: {
      overlay: false  // ← Agrega esta línea para desactivar el overlay de errores
    }
  },
});