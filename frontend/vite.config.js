import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    allowedHosts: [
      "chartable-lino-naval.ngrok-free.dev",
    ],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5176',   // ✅ match Flask port
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
