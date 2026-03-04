import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: backendUrl,
        changeOrigin: true,
        headers: {
          "x-forwarded-proto": "https"
        }
      },
      "/public": {
        target: backendUrl,
        changeOrigin: true,
        headers: {
          "x-forwarded-proto": "https"
        }
      }
    }
  }
});
