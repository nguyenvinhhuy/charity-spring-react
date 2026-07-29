import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Backend target: "backend:8080" inside docker-compose, localhost otherwise.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://localhost:8080"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "19" }]],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    // Force a single React instance so libraries (e.g. sonner) can't pull a
    // duplicate copy, which would break hooks ("Invalid hook call").
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Poll the filesystem so HMR works over a bind mount (Windows + Docker).
    watch: { usePolling: true },
    proxy: {
      "/api": { target: proxyTarget, changeOrigin: true },
      // OAuth2 social login: proxy the whole handshake so it stays same-origin.
      // xfwd forwards X-Forwarded-* so the backend builds redirect URIs on :5173.
      "/oauth2": { target: proxyTarget, changeOrigin: true, xfwd: true },
      "/login/oauth2": { target: proxyTarget, changeOrigin: true, xfwd: true },
    },
  },
})
