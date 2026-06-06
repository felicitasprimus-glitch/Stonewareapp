import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Während der Entwicklung leiten wir /api an das FastAPI-Backend (Port 8000) weiter.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
