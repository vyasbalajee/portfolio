import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // The lazy-loaded 3D world chunk (three.js) is large by nature; the main bundle stays small.
  build: { chunkSizeWarningLimit: 1100 },
})
