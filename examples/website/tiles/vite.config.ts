import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

// Resolve built workspace package exports so Vite honors each package's browser replacements.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        viewer: fileURLToPath(new URL('./index.html', import.meta.url)),
        authoring: fileURLToPath(new URL('./authoring.html', import.meta.url))
      }
    }
  },
  server: {open: true}
});
