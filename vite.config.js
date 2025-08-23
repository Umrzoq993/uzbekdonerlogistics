// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

<<<<<<< Updated upstream
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  return {
    plugins: [react()],
    server: isDev
      ? {
          host: true,
          port: 5173,
          hmr: { protocol: "wss", clientPort: 443 },
          allowedHosts: ["9226c7ba17a9.ngrok-free.app"],
        }
      : undefined,
  };
=======
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev server faqat server ichidan eshitsin (xavfsizroq)
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,

    // HMR ni domen orqali HTTPS (wss) bilan ishlatamiz
    hmr: {
      protocol: "wss",
      host: "logistika.adminsite.uz"
    },

    // (ixtiyoriy) ruxsat etilgan hostlar roʻyxati
    allowedHosts: ["logistika.adminsite.uz"],
  },
>>>>>>> Stashed changes
});

