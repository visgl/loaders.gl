// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as zarrita from 'zarrita';
import ZarritaPixelSource from '../../src/zarr/lib/zarrita-pixel-source';

/** Opens a tiny uncompressed v3 array using an in-memory store. */
async function createPixelSource(interleaved = false) {
  const shape = interleaved ? [2, 2, 3] : [2, 2];
  const values = Uint8Array.from({length: interleaved ? 12 : 4}, (_, index) => index + 1);
  const metadata = {
    zarr_format: 3,
    node_type: 'array',
    shape,
    data_type: 'uint8',
    chunk_grid: {name: 'regular', configuration: {chunk_shape: shape}},
    chunk_key_encoding: {name: 'default', configuration: {separator: '/'}},
    fill_value: 0,
    codecs: [{name: 'bytes'}],
    attributes: {}
  };
  const store = new Map([
    ['/zarr.json', new TextEncoder().encode(JSON.stringify(metadata))],
    [interleaved ? '/c/0/0/0' : '/c/0/0', values]
  ]);
  const array = await zarrita.open(zarrita.root(store), {kind: 'array'});
  return new ZarritaPixelSource(array, interleaved ? ['y', 'x', '_c'] : ['y', 'x'], 2);
}

test('Zarrita pixels read tiles and clone cached results', async () => {
  const source = await createPixelSource();
  expect(source.shape).toEqual([2, 2]);
  expect(source.chunks).toEqual([2, 2]);
  expect(source.dtype).toBe('uint8');
  expect(source.tileWidth).toBe(2);
  const tile = await source.getTile({x: 0, y: 0, selection: {}});
  expect(tile).toMatchObject({width: 2, height: 2});
  expect(Array.from(tile.data)).toEqual([1, 2, 3, 4]);
  tile.data[0] = 99;
  expect((await source.getTile({x: 0, y: 0, selection: {}})).data[0]).toBe(1);
  await expect(source.getTile({x: 1, y: 0, selection: {}})).rejects.toThrow(/zero-sized/);
  await expect(source.getTile({x: 0, y: 1, selection: {}})).rejects.toThrow(/zero-sized/);
});

test('Zarrita pixels preserve interleaved raster channels', async () => {
  const source = await createPixelSource(true);
  const raster = await source.getRaster({selection: {}});
  expect(raster).toMatchObject({width: 2, height: 2});
  expect(Array.from(raster.data)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});
