/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// Base path is environment-driven: GitHub Pages serves the app from the
// /meridian-ecosystem-demo/ subpath (default), while Vercel serves it from
// the domain root — set VITE_BASE=/ in the Vercel project environment.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/meridian-ecosystem-demo/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
