// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, test} from 'vitest';
import esbuild from 'esbuild';

const PACKAGE_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('GeoJSON-only MVT entry excludes Arrow and GIS converter modules', async () => {
  const result = await esbuild.build({
    entryPoints: [resolve(PACKAGE_DIRECTORY, 'src/mvt-geojson-loader.ts')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    metafile: true,
    write: false
  });
  const bundledInputs = Object.keys(result.metafile!.inputs);

  expect(bundledInputs.some(input => /(?:^|\/)modules\/arrow\//.test(input))).toBe(false);
  expect(bundledInputs.some(input => /(?:^|\/)modules\/gis\//.test(input))).toBe(false);
  expect(bundledInputs.some(input => /apache-arrow/.test(input))).toBe(false);
  expect(result.outputFiles[0].contents.byteLength).toBeLessThan(100 * 1024);
});
