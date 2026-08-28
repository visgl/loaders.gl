import {defineConfig} from 'vite';

export default defineConfig({
  optimizeDeps: {include: ['@loaders.gl/services']}
});
