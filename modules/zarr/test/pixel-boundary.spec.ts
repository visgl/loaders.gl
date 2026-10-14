// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BoundsCheckError, type ZarrArray} from 'zarr';
import ZarrPixelSource from '../src/lib/zarr-pixel-source';
import {guessLabels, guessTileSize, getImageSize, joinUrlParts, validLabels} from '../src/lib/utils';
import {getZarrSelectionKey} from '../src/lib/zarr-data-cache';

/** Creates a minimal array double to verify pixel-source indexing and tile selection. */
function createArray(chunks = [2, 2], shape = [2, 2]): ZarrArray {
  return {
    shape, chunks, dtype: '|u1',
    getRaw: async () => ({data: new Uint8Array([1, 2, 3, 4]), shape: [2, 2]}),
    getRawChunk: async () => ({data: new Uint8Array([1, 2, 3, 4]), shape: [2, 2]})
  } as unknown as ZarrArray;
}

test('legacy pixel source reads aligned chunks and sliced tiles, and handles bounds errors', async () => {
  for (const chunks of [[2, 2], [4, 4]]) {
    const source = new ZarrPixelSource(createArray(chunks), ['y', 'x'], 2);
    expect(source.dtype).toBe('Uint8');
    expect(await source.getTile({x: 0, y: 0, selection: {}})).toMatchObject({width: 2, height: 2});
    if (chunks[0] === 4) await expect(source.getTile({x: 1, y: 0, selection: {}})).rejects.toThrow(/zero-sized/);
    expect(() => source.onTileError(new BoundsCheckError('edge'))).not.toThrow();
    expect(() => source.onTileError(new Error('network'))).toThrow('network');
  }
  const array = createArray();
  Object.assign(array, {dtype: '|b1'});
  expect(() => new ZarrPixelSource(array, ['y', 'x'], 2).dtype).toThrow(/not supported/);
  const interleaved = new ZarrPixelSource(createArray([2, 2, 3], [2, 2, 3]), ['y', 'x', '_c'], 2);
  expect(getImageSize(interleaved)).toEqual({height: 2, width: 2});
  expect(await interleaved.getRaster({selection: [0, 0, 0]})).toMatchObject({width: 2, height: 2});
});

test('Zarr helpers preserve URL schemes, infer labels, and normalize slice keys', () => {
  expect(joinUrlParts(' https://example.com/ ', '/data/', '', ' /0 ')).toBe('https://example.com/data/0');
  expect(guessLabels({ome: {omero: {}}} as never)).toEqual(['t', 'c', 'z', 'y', 'x']);
  expect(() => guessLabels({})).toThrow(/Could not infer/);
  expect(guessTileSize({shape: [32, 32, 3], chunks: [16, 16, 3]})).toBe(16);
  expect(guessTileSize({shape: [32, 32], chunks: [16, 8]}, ['y', 'x'])).toBe(8);
  expect(validLabels(['y', 'x', '_c'], [2, 2, 3])).toBe(true);
  expect(getZarrSelectionKey([{start: undefined, stop: undefined, step: undefined}])).toBe('[{"start":null,"stop":null,"step":null}]');
});

test('legacy multiscales accepts nested OME metadata and rejects missing pyramids', async () => {
  const {loadMultiscales, normalizeStore} = await import('../src/lib/utils');
  const {HTTPStore} = await import('zarr');
  expect(normalizeStore('https://example.com/image.zarr')).toBeInstanceOf(HTTPStore);
  for (const attributes of [{ome: {multiscales: [{datasets: []}]}}, {}, {ome: {}}]) {
    const store = {
      getItem: async (key: string) => {
        if (key.endsWith('.zgroup')) return JSON.stringify({zarr_format: 2});
        if (key.endsWith('.zattrs')) return JSON.stringify(attributes);
        return undefined;
      },
      containsItem: async (key: string) => key.endsWith('.zgroup') || key.endsWith('.zattrs')
    };
    if ('ome' in attributes && 'multiscales' in attributes.ome!) {
      await expect(loadMultiscales(store as never)).resolves.toMatchObject({data: []});
    } else {
      await expect(loadMultiscales(store as never)).rejects.toThrow(/Cannot find Zarr multiscales/);
    }
  }
});
