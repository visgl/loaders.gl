// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('built WMS exports bundle without resolving the optional GeoTIFF decoder', async () => {
  const result = await build({
    stdin: {
      contents: "export * from '@loaders.gl/ogc/wms';",
      resolveDir: process.cwd()
    },
    bundle: true,
    // Exercise package exports rather than the repository's source aliases.
    tsconfigRaw: {},
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true,
    logLevel: 'silent',
    plugins: [
      {
        name: 'missing-optional-geotiff',
        /** Rejects optional GeoTIFF imports even when the workspace has the decoder installed. */
        setup(builder) {
          builder.onResolve({filter: /^[^./]/}, arguments_ => {
            if (arguments_.path === 'geotiff' || arguments_.path.startsWith('geotiff/')) {
              return {errors: [{text: 'WMS must not resolve the optional GeoTIFF decoder'}]};
            }
            // Traverse published loaders.gl entry points, including dynamic imports.
            // Other packages are external so this checks our boundary independently of codecs.
            if (!arguments_.path.startsWith('@loaders.gl/')) {
              return {path: arguments_.path, external: true};
            }
            return undefined;
          });
        }
      }
    ]
  });
  const inputs = Object.keys(result.metafile.inputs);
  expect(inputs.some(filename => filename.includes('/raster/dist/lerc/lerc-loader'))).toBe(true);
  expect(inputs.filter(filename => filename.includes('/raster/dist/geotiff/'))).toEqual([]);
});
