import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const disableHmr =
  process.env.VITE_DISABLE_HMR === "1" || process.env.VITE_DISABLE_HMR === "true"

const devThroughNginx =
  process.env.VITE_DEV_THROUGH_NGINX === "1" ||
  process.env.VITE_DEV_THROUGH_NGINX === "true"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: disableHmr
      ? false
      : devThroughNginx
        ? {
            protocol: "ws",
            host: "localhost",
            clientPort: 80,
          }
        : undefined,
    proxy: {
      "/api/v1": {
        target: "http://backend:8000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://backend:8000",
        ws: true,
        changeOrigin: true,
      },
    },
  }
})
