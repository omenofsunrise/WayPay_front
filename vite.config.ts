import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
      },
    }),
  ],
  build: {
    sourcemap: false,
  },
  esbuild: {
    // Игнорировать ошибки TS
    legalComments: 'none',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})