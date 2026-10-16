// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {
  ZarrArraySource,
  ZarrArraySourceLoader,
  type ZarrArraySourceLoaderOptions
} from '@loaders.gl/scientific/zarr';
const FIXTURE_URL = '/modules/scientific/test/zarr/data/spatialdata-v3.zarr';
test('ZarrArraySource reads array metadata and integer selections', async () => {
  const options: ZarrArraySourceLoaderOptions = {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '0', dimensions: ['t', 'c', 'z', 'y', 'x']}
  };
  const source = createDataSource(FIXTURE_URL, [ZarrArraySourceLoader], options);
  expect(source instanceof ZarrArraySource).toBeTruthy();
  const metadata = await source.getMetadata();
  expect(metadata.shape).toEqual([1, 3, 1, 167, 439]);
  expect(metadata.chunks).toEqual([1, 1, 1, 167, 439]);
  expect(metadata.dimensions).toEqual(['t', 'c', 'z', 'y', 'x']);
  expect(metadata.fillValue).toBe(0);
  expect(metadata.attributes['long_name']).toBe('Example georeferenced image');
  const selected = await source.getArray({selection: [0, 1, 0, null, null]});
  expect(selected.shape).toEqual([167, 439]);
  expect(selected.data.length).toBe(167 * 439);
  const window = await source.getArray({
    selection: [0, 1, 0, {start: 2, stop: 5}, {start: 4, stop: 9, step: 2}]
  });
  expect(window.shape).toEqual([3, 3]);
  expect(window.data.length).toBe(9);
  const namedWindow = await source.getArray({
    selectionByDimension: {
      t: 0,
      c: 1,
      z: 0,
      y: {start: 2, stop: 5},
      x: {start: 4, stop: 9, step: 2}
    }
  });
  expect(namedWindow.shape).toEqual([3, 3]);
});
test('ZarrArraySource validates selection rank and dimension labels', async () => {
  const source = createDataSource(FIXTURE_URL, [ZarrArraySourceLoader], {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '0', dimensions: ['t']}
  });
  await expect(source.getMetadata()).rejects.toThrow(/dimensions must have length 5/);
});
test('ZarrArraySource rejects unknown named dimensions', async () => {
  const source = createDataSource(FIXTURE_URL, [ZarrArraySourceLoader], {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '0'}
  });
  await expect(source.getArray({selectionByDimension: {unknown: 0}})).rejects.toThrow(
    /Unknown Zarr array dimension/
  );
  await expect(
    source.getArray({selection: [null, null, null, null, null], selectionByDimension: {t: 0}})
  ).rejects.toThrow(/cannot combine positional and named selections/);
});

test('ZarrArraySource defaults selectors and isolates cached data', async () => {
  const source = new ZarrArraySource(FIXTURE_URL, {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '1'}
  });
  const first = await source.getArray();
  const original = first.data[0];
  first.data[0] = 99;
  expect((await source.getArray()).data[0]).toBe(original);
  expect((await source.getMetadata()).dimensions).toEqual([
    'dim_0',
    'dim_1',
    'dim_2',
    'dim_3',
    'dim_4'
  ]);
  await expect(source.getArray({selection: [null]})).rejects.toThrow(/must have 5 dimensions/);
  const sliced = await source.getArray({selection: [0, 0, 0, {}, {stop: 2}]});
  expect(sliced.shape[1]).toBe(2);
  await expect(source.getArray({selection: [0, 0, 0, 0, 0]})).rejects.toThrow(/Failed to read/);
  expect(ZarrArraySourceLoader.testURL('file.zarr?x=1')).toBe(true);
  expect(ZarrArraySourceLoader.testURL('file.json')).toBe(false);
});
