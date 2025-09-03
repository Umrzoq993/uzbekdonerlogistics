/* eslint-env node */
// vite.config.js
const process = globalThis.process || { cwd: () => "." };
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Flag’lar (env orqali moslashuvchan):
  const PROFILE = env.DEV_PROFILE || "local"; // local | server
  const IS_DEV = mode === "development";
  const IS_SERVER = PROFILE === "server";
  // Remote/ngrok HMR o'chirildi – oddiy lokal HMR (default) kifoya.

  // Apex optimize strategiyasi: server dev muammolarini kamaytirish uchun default exclude.
  const APEX_OPTIMIZE = env.VITE_APEX_OPTIMIZE === "true"; // ixtiyoriy ravishda yoqish
  const apexInclude = ["apexcharts", "react-apexcharts"];
  const DISABLE_HMR = env.DISABLE_HMR === "true";

  // allowedHosts kerak bo'lsa .env da ALLOWED_HOSTS=domain1,domain2 tarzida yozish mumkin
  const allowedHosts = (env.ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // NOTE: To'g'ridan-to'g'ri disabled: true qilganimizda react-apexcharts UMD/CJS wrapper
  // "exports is not defined" xatosi berdi (pre-bundle bo'lmagani uchun). Shuning uchun
  // minimal pre-bundlingni yoqib qo'yamiz. Istasangiz VITE_APEX_OPTIMIZE=true qilib
  // to'liq include qilasiz. Aks holda Vite default scanning qiladi.
  let optimizeConfig;
  if (APEX_OPTIMIZE) {
    optimizeConfig = { include: apexInclude, force: false };
  } else {
    optimizeConfig = {}; // default (hech narsa majburlamaymiz, lekin disabled ham emas)
  }

  return {
    plugins: [react({ fastRefresh: !DISABLE_HMR })],
    optimizeDeps: optimizeConfig,
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
      // HMR: DISABLE_HMR=true bo'lsa o'chadi. Aks holda Vite default.
      hmr: DISABLE_HMR ? false : undefined,
      allowedHosts: allowedHosts.length ? allowedHosts : undefined,
      // remote HMR olib tashlangani uchun origin kerak emas
      origin: undefined,
      headers: IS_DEV
        ? {
            "Cache-Control": "no-store",
          }
        : undefined,
      watch: {
        usePolling: Boolean(env.VITE_POLL),
        interval: 500,
      },
    },
  };
});
