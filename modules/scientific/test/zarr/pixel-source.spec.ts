// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {loadZarr} from '@loaders.gl/scientific/zarr';
import {HTTPStore} from 'zarr';
const CONTENT_BASE = new URL('/modules/scientific/test/zarr/data', window.location.href).href;
const OME_FIXTURE = `${CONTENT_BASE}/ome.zarr`;
const FIXTURE = `${CONTENT_BASE}/multiscale.zarr`;
const LABELS = ['foo', 'bar', 'baz', 'y', 'x'];
test('Creates correct ZarrPixelSource.', async () => {
  const {data} = await loadZarr(new HTTPStore(FIXTURE), {labels: LABELS});
  expect(data.length, 'Image should have two levels.').toBe(2);
  const [base] = data;
  expect(base.labels).toEqual(['foo', 'bar', 'baz', 'y', 'x']);
  expect(base.shape, 'shape should match dimensions.').toEqual([1, 3, 1, 167, 439]);
});
test('Creates correct OME ZarrPixelSource.', async () => {
  const {data} = await loadZarr(new HTTPStore(OME_FIXTURE));
  expect(data.length, 'Image should have two levels.').toBe(2);
  const [base] = data;
  expect(base.labels, 'should have DimensionOrder "XYZCT".').toEqual(['t', 'c', 'z', 'y', 'x']);
  expect(base.shape, 'shape should match dimensions.').toEqual([1, 3, 1, 167, 439]);
});
test('Get raster data.', async () => {
  const {data} = await loadZarr(new HTTPStore(FIXTURE), {labels: LABELS});
  const [base] = data;
  for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
    const selection = {bar: channelIndex, foo: 0, baz: 0};
    const pixelData = await base.getRaster({selection});
    expect(pixelData.width).toBe(439);
    expect(pixelData.height).toBe(167);
    expect(pixelData.data.length).toBe(439 * 167);
    expect(pixelData.data.constructor.name).toBe('Int8Array');
  }
  await expect(
    base.getRaster({selection: {bar: 3, foo: 0, baz: 0}}),
    'index should be out of bounds.'
  ).rejects.toThrow(/bounds/i);
});
test('Invalid labels.', async () => {
  const store = new HTTPStore(FIXTURE);
  await expect(
    loadZarr(store, {labels: ['a', 'b', 'y', 'x']}),
    'labels should correspond to array shape.'
  ).rejects.toThrow(/Labels do not match/);
  await expect(
    loadZarr(store, {labels: ['a', 'b', 'c', 'y', 'w']}),
    'labels should end with y and x.'
  ).rejects.toThrow(/Invalid labels/);
  await expect(
    loadZarr(store, {labels: ['a', 'b', 'c', 'x', '_c']}),
    'interleaved labels should end with y, x, and _c.'
  ).rejects.toThrow(/Invalid labels/);
});
