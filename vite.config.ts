import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Evita CORS al geocodificar con Nominatim desde el browser
      '/api/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nominatim/, ''),
        headers: {
          'User-Agent': 'UADECarPool/1.0 (contacto: uade-carpool@local)',
          Accept: 'application/json',
        },
      },
    },
  },
})
