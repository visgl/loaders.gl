import {defineConfig} from 'vite';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
// Installed npm packages (resolved from the example's node_modules)
const NM = path.resolve(__dirname, 'node_modules');

export default defineConfig({
  resolve: {
    alias: [
      // Local MLT module source
      {find: '@loaders.gl/mlt', replacement: `${ROOT}/modules/mlt/src`},
      // Deps imported by the local mlt source — point to installed packages
      {find: '@loaders.gl/gis', replacement: `${NM}/@loaders.gl/gis`},
      {find: '@loaders.gl/loader-utils', replacement: `${NM}/@loaders.gl/loader-utils`},
      {find: '@loaders.gl/schema', replacement: `${NM}/@loaders.gl/schema`},
      {find: '@loaders.gl/core', replacement: `${NM}/@loaders.gl/core`}
    ]
  },
  server: {open: true}
});
