// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);

test('PMTiles writer is available through built ESM and CommonJS package entrypoints', async () => {
  const esm = await import('../dist/index.js');
  const commonjs = require('../dist/index.cjs');
  const options = {tileType: 'png' as const};
  const tiles = [{z: 0, x: 0, y: 0, data: new Uint8Array([1, 2])}];
  const expected = await esm.encodePMTiles(tiles, options);
  expect(await commonjs.encodePMTiles(tiles, options)).toEqual(expected);
  expect(await commonjs.PMTilesWriter.encode(tiles, {pmtiles: options})).toEqual(expected);
});
