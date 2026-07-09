import path from "path"
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Same-origin API in dev — avoids CORS between localhost:5173 and cloud-haven-api.test
      '/api': {
        target: 'http://cloud-haven-api.test',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
