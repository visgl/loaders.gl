// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test('installed raster ESM and CommonJS subpaths encode with the existing Node image polyfill', () => {
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
    import '@loaders.gl/core/polyfills';
    import {createRequire} from 'node:module';
    import {encodeRasterPMTiles} from '@loaders.gl/pmtiles/raster';
    import {PMTiles} from 'pmtiles';
    const commonjs = createRequire(import.meta.url)('@loaders.gl/pmtiles/raster');
    const source = {
      getMetadata: async () => ({width: 1, height: 1, bandCount: 1, dtype: 'uint8', crs: 'EPSG:3857'}),
      getRasterForRegion: async () => ({width: 1, height: 1, bandCount: 1, dtype: 'uint8', crs: 'EPSG:3857', data: new Uint8Array([10]), transform: [1, 0, 0, 0, 1, 0], pixelRegistration: 'point'})
    };
    for (const encode of [encodeRasterPMTiles, commonjs.encodeRasterPMTiles]) {
      const bytes = await encode(source, {tiles: [{z: 0, x: 0, y: 0}], tileSize: 1});
      const archive = new PMTiles({getKey: () => 'raster-node', getBytes: async (offset, length) => ({data: bytes.slice(offset, offset + length)})});
      const tile = await archive.getZxy(0, 0, 0);
      if ((await archive.getHeader()).tileType !== 2 || new Uint8Array(tile.data)[0] !== 137) throw new Error('Invalid PNG archive');
    }
    process.stdout.write('ok');
  `
    ],
    {cwd: process.cwd(), encoding: 'utf8'}
  );
  expect(output).toBe('ok');
});
