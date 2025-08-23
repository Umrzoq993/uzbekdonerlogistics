// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
});
