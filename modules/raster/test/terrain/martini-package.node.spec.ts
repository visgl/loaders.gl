// SPDX-License-Identifier: MIT
import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('terrain browser consumers use the upstream meshing backends', async () => {
  const result = await build({
    stdin: {
      contents:
        "import {TerrainLoader} from '@loaders.gl/raster/terrain/index'; export const loader = await TerrainLoader.preload();",
      resolveDir: process.cwd()
    },
    tsconfigRaw: {compilerOptions: {}},
    bundle: true,
    platform: 'browser',
    format: 'esm',
    write: false,
    metafile: true
  });
  // Keep one owner for terrain algorithms in browser bundles.
  const bundledInputs = Object.values(result.metafile!.outputs).flatMap(output =>
    Object.keys(output.inputs)
  );
  expect(bundledInputs.some(input => input.includes('raster/dist/terrain/libs/martini'))).toBe(
    false
  );
  expect(bundledInputs.some(input => input.includes('node_modules/@mapbox/martini/'))).toBe(true);
  expect(
    bundledInputs.some(input => input.includes('@math.gl/geospatial/dist/terrain/martini.js'))
  ).toBe(true);
});
