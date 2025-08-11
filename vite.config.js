import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // tashqi IP’lar uchun ochish
    allowedHosts: ["9226c7ba17a9.ngrok-free.app"], // ngrok domeningiz
    port: 5173,
    hmr: {
      clientPort: 443, // ngrok https orqali HMR ishlashi uchun
      protocol: "wss",
    },
  },
});
