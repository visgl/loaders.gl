// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {expect, test} from 'vitest';

test('heightmap subpath declares an emitted ESM entry point and public types', async () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const entryUrl = new URL(`../${manifest.exports['./heightmap'].import}`, import.meta.url);
  const esm = await import(/* @vite-ignore */ entryUrl.href);
  expect(Object.keys(esm).sort()).toEqual([
    'TERRARIUM_ELEVATION_DECODER',
    'decodeTerrainHeightmap'
  ]);
  expect(existsSync(new URL(`../${manifest.exports['./heightmap'].types}`, import.meta.url))).toBe(
    true
  );
  // One sample verifies the package entry, not a duplicate algorithm conformance corpus.
  expect(
    esm.decodeTerrainHeightmap(
      {data: new Uint8Array([128, 0, 0, 255]), width: 1, height: 1},
      esm.TERRARIUM_ELEVATION_DECODER
    ).heights[0]
  ).toBe(0);
});
