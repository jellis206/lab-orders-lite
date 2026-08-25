import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Ports come from the root .env (see WEB_PORT / API_PORT there).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
    proxy: {
      "/api": `http://localhost:${process.env.API_PORT ?? 3000}`,
    },
  },
});
