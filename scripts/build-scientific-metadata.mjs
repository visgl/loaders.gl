// SPDX-License-Identifier: MIT

import {readdir} from 'node:fs/promises';
import {build} from 'esbuild';

const metadataFiles = (await readdir('dist')).filter(filename => filename.endsWith('-loader-types.js'));

// Preserve package-subpath preloads in CommonJS instead of inlining every scientific parser.
await build({
  entryPoints: ['dist/index.js', 'dist/netcdf/netcdf-loader.js', 'dist/zarr/zarr-loader-types.js', ...metadataFiles.map(filename => `dist/${filename}`)],
  outdir: 'dist',
  outExtension: {'.js': '.cjs'},
  bundle: true,
  packages: 'external',
  external: ['@loaders.gl/scientific/*'],
  platform: 'node',
  format: 'cjs',
  sourcemap: true
});
