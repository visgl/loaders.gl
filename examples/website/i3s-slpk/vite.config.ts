import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

// Resolve built workspace package exports, including their browser replacements.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        viewer: fileURLToPath(new URL('./index.html', import.meta.url)),
        conversion: fileURLToPath(new URL('./conversion.html', import.meta.url))
      }
    }
  },
  worker: {format: 'es'},
  server: {open: true}
});
