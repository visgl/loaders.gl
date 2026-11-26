// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {defineConfig} from 'vite';

/** Vite configuration using the repository's source aliases and a local MBTA proxy. */
export default defineConfig({
  resolve: {tsconfigPaths: true},
  server: {
    proxy: {
      '/feeds/mbta/': {
        target: 'https://cdn.mbta.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/feeds\/mbta\//, '/')
      }
    }
  }
});
