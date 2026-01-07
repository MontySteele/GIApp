import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { pwaConfig } from './pwa.config'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA(pwaConfig)
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: '[name]-[hash].js',
      },
    },
  },
  // Vite server configuration for Tauri
  server: {
    port: 5173,
    strictPort: true,
    host: true, // Listen on all addresses, including LAN and localhost
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**']
    }
  },
  // Clear screen only in dev mode
  clearScreen: false
}))
