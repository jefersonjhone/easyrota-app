import path from "path"

import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'frontend/pages',
      generatedRouteTree: 'frontend/routeTree.gen.ts',
      quoteStyle: 'single',
    }),
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"),
      "@features": path.resolve(__dirname, "./frontend/features"),
      "@lib": path.resolve(__dirname, "./frontend/lib"),
      "@utils": path.resolve(__dirname, "./frontend/lib/utils"),
      "@assets": path.resolve(__dirname, "./frontend/assets"),
      "@pages": path.resolve(__dirname, "./frontend/pages"),
      "@ui": path.resolve(__dirname, "./frontend/lib/ui"),
      "@layout": path.resolve(__dirname, "./frontend/lib/layout"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
