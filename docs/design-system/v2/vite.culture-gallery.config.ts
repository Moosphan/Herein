import { defineConfig, mergeConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import baseConfig from './vite.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    publicDir: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      outDir: fileURLToPath(
        new URL('../../../resources/visuals/traditional-culture/gallery', import.meta.url),
      ),
      emptyOutDir: false,
      lib: {
        entry: fileURLToPath(new URL('./culture-gallery/main.tsx', import.meta.url)),
        name: 'CultureGallery',
        formats: ['iife'],
        fileName: () => 'assets/gallery.js',
        cssFileName: 'gallery',
      },
      rollupOptions: { output: { assetFileNames: 'assets/[name][extname]' } },
    },
  }),
)
