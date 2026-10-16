// SPDX-License-Identifier: MIT
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {expect, test} from 'vitest';

test('terrain browser consumers bundle without resolving the Martini npm package', async () => {
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
    metafile: true,
    plugins: [
      {
        name: 'omit-martini',
        setup(buildContext) {
          buildContext.onResolve({filter: /^@mapbox\/martini(?:\/|$)/}, () => ({
            errors: [{text: 'Martini npm package is unavailable'}]
          }));
        }
      }
    ]
  });
  expect(Object.keys(result.metafile!.inputs)).toContain(
    'modules/raster/dist/terrain/libs/martini.mjs'
  );
});

test('vendored Martini matches the pinned ISC distribution', async () => {
  const [vendored, reference] = await Promise.all([
    readFile('modules/raster/src/terrain/libs/martini.mjs', 'utf8'),
    readFile('node_modules/@mapbox/martini/index.js', 'utf8')
  ]);
  expect(vendored).toBe(reference);
});
