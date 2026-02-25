// General-Service-Office/frontend/vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const API_TARGET = env.VITE_API_TARGET || "http://localhost:4000";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      // ✅ if 5173 is taken, Vite will pick the next available port
      strictPort: false,

      proxy: {
        "/api": {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
    },
  };
});