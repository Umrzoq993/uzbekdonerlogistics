// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const profile = process.env.DEV_PROFILE || "local"; // serverda systemd -> DEV_PROFILE=server
  const isServerDev = mode === "development" && profile === "server";

  if (isServerDev) {
    const HMR_HOST = env.HMR_HOST || "logistika.adminsite.uz";
    const HMR_CLIENT_PORT = Number(env.HMR_CLIENT_PORT || 443);
    const ALLOWED = (env.ALLOWED_HOSTS || ".adminsite.uz")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      plugins: [react()],
      optimizeDeps: {
        // ApexCharts katta bundle va tez-tez restartlarda hash o'zgarishi 504 keltirishi mumkin.
        // Exclude qilib native ESM orqali bevosita serve qilamiz.
        exclude: ["apexcharts", "react-apexcharts"],
        force: false, // force ni o'chirdik: keraksiz qayta hash almashtirishni kamaytiradi
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: { charts: ["apexcharts", "react-apexcharts"] },
          },
        },
      },
      server: {
        // 127.0.0.1 tashqi reverse proxy (nginx) dan ko'rinmay qolishi mumkin.
        // host: true -> 0.0.0.0 ni tinglaydi va nginx forward qilganda 504 chiqmasligiga yordam beradi.
        host: true,
        port: 5173,
        strictPort: true,
        hmr: { protocol: "wss", host: HMR_HOST, clientPort: HMR_CLIENT_PORT },
        allowedHosts: ALLOWED,
        origin: `https://${HMR_HOST}`,
        // Optimized dep fayllarini nginx / CDN keshlab qolib "Outdated Optimize Dep" bermasligi uchun
        // dev rejimida cache ni o'chirib qo'yamiz.
        headers: {
          "Cache-Control": "no-store",
        },
        // Ba'zi VPS / konteynerlarda fayl tizimi eventlari ishlamasligi mumkin.
        // Bunday holatda polling yoqilishi eski dep hash / partial hot reload muammolarini kamaytiradi.
        watch: {
          usePolling: process.env.VITE_POLL ? true : false,
          interval: 500,
        },
      },
    };
  }

  const LOCAL_ALLOWED = (env.ALLOWED_HOSTS || env.NGROK_HOST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    plugins: [react()],
    optimizeDeps: { include: ["apexcharts", "react-apexcharts"], force: false },
    build: {
      rollupOptions: {
        output: {
          manualChunks: { charts: ["apexcharts", "react-apexcharts"] },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      hmr: {
        protocol: env.HMR_PROTOCOL || "ws", // ngrok bo'lsa: wss
        host: env.HMR_HOST || undefined, // ngrok domeni
        clientPort: env.HMR_CLIENT_PORT
          ? Number(env.HMR_CLIENT_PORT)
          : undefined, // ngrok: 443
      },
      allowedHosts: LOCAL_ALLOWED.length ? LOCAL_ALLOWED : undefined,
    },
  };
});
