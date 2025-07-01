import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001,
    host: true,
    open: true // Abre automaticamente no browser
  },
  preview: {
    port: 3001,
    host: true,
    open: true
  }
})