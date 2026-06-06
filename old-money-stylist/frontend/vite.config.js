import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Baut die komplette App in EINE einzelne, eigenständige index.html.
// Diese läuft ohne Server – einfach öffnen oder kostenlos auf GitHub Pages legen.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: { port: 5173 },
})
