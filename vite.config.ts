import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig ({
  base: '',
  root: resolve(__dirname, 'src'),
  plugins: [
    basicSsl()
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        demonstration: resolve(__dirname, 'src/demonstration/index.html'),
      },
    },
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000
  },
})