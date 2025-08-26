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
      server: {
        host: "127.0.0.1",
        port: 5173,
        strictPort: true,
        hmr: { protocol: "wss", host: HMR_HOST, clientPort: HMR_CLIENT_PORT },
        allowedHosts: ALLOWED,
        origin: `https://${HMR_HOST}`,
      },
    };
  }

  const LOCAL_ALLOWED = (env.ALLOWED_HOSTS || env.NGROK_HOST || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    plugins: [react()],
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
