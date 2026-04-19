import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// This part defines the path helpers for your computer
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This maps the "@" symbol to your "src" folder
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  }
})