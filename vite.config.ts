import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/events': {
        target: 'http://localhost:8765',
        changeOrigin: true,
      },
    },
  },
})
