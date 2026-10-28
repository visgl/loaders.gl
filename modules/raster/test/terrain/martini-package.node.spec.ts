// SPDX-License-Identifier: MIT
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('terrain browser consumers bundle only the vendored Martini implementation', async () => {
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
  // math.gl resolves its own Martini dependency, but tree shaking must omit that copy.
  const bundledInputs = Object.values(result.metafile!.outputs).flatMap(output =>
    Object.keys(output.inputs)
  );
  expect(bundledInputs).toContain('modules/raster/dist/terrain/libs/martini.mjs');
  expect(bundledInputs.some(input => input.includes('node_modules/@mapbox/martini/'))).toBe(false);
  expect(
    bundledInputs.some(input => input.includes('@math.gl/geospatial/dist/terrain/martini.js'))
  ).toBe(false);
});

test('vendored Martini matches the pinned ISC distribution', async () => {
  const [vendored, reference] = await Promise.all([
    readFile('modules/raster/src/terrain/libs/martini.mjs', 'utf8'),
    readFile('node_modules/@mapbox/martini/index.js', 'utf8')
  ]);
  expect(vendored).toBe(reference);
});
