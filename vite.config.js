// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Flag’lar (env orqali moslashuvchan):
  const PROFILE = process.env.DEV_PROFILE || env.DEV_PROFILE || "local"; // local | server
  const IS_DEV = mode === "development";
  const IS_SERVER = PROFILE === "server";
  const HMR_HOST =
    env.HMR_HOST || (IS_SERVER ? "logistika.adminsite.uz" : undefined);
  const HMR_PROTOCOL = env.HMR_PROTOCOL || (IS_SERVER ? "wss" : "ws");
  const HMR_CLIENT_PORT = env.HMR_CLIENT_PORT
    ? Number(env.HMR_CLIENT_PORT)
    : IS_SERVER && HMR_PROTOCOL === "wss"
    ? 443
    : undefined;

  // Apex optimize strategiyasi: server dev muammolarini kamaytirish uchun default exclude.
  const APEX_OPTIMIZE = env.VITE_APEX_OPTIMIZE === "true"; // ixtiyoriy ravishda yoqish
  const apexInclude = ["apexcharts", "react-apexcharts"];

  const allowedHosts = (
    env.ALLOWED_HOSTS ||
    env.NGROK_HOST ||
    (IS_SERVER ? ".adminsite.uz" : "")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    plugins: [react()],
    optimizeDeps: APEX_OPTIMIZE
      ? { include: apexInclude, force: false }
      : { exclude: apexInclude, force: false },
    build: {
      rollupOptions: {
        output: {
          manualChunks: { charts: apexInclude },
        },
      },
    },
    server: {
      host: true, // 0.0.0.0 lokal ham server ham
      port: Number(env.VITE_PORT || 5173),
      strictPort: true,
      hmr: {
        protocol: HMR_PROTOCOL,
        host: HMR_HOST,
        clientPort: HMR_CLIENT_PORT,
      },
      allowedHosts: allowedHosts.length ? allowedHosts : undefined,
      origin: HMR_HOST
        ? `${HMR_PROTOCOL === "wss" ? "https" : "http"}://${HMR_HOST}`
        : undefined,
      headers: IS_DEV
        ? {
            "Cache-Control": "no-store",
          }
        : undefined,
      watch: {
        usePolling: Boolean(process.env.VITE_POLL),
        interval: 500,
      },
    },
  };
});
