import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
export default defineConfig({
  root: __dirname,
  plugins: [react(), tailwindcss()],
  optimizeDeps: { exclude: ["@chocosous/shared", "tesseract.js"] },
  worker: { format: 'es' },
  publicDir: path.resolve(__dirname, "../public"),
  resolve: { preserveSymlinks: true, alias: {
      "@": path.resolve(__dirname, "../src"),
      "@assets": path.resolve(__dirname, "../src/assets"),
      "@chocosous/shared": path.resolve(__dirname, "../../shared/src/index.ts"),
  } },
})
