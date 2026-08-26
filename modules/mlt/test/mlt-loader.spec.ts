// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {MLTLoaderOptions} from '@loaders.gl/mlt';
import {MLTLoader} from '@loaders.gl/mlt/bundled';

test('MLTLoader#metadata', () => {
  expect(MLTLoader).toBeTruthy();
  expect(MLTLoader.name).toBe('MapLibre Tile');
  expect(MLTLoader.id).toBe('mlt');
  expect(MLTLoader.extensions).toEqual(['mlt']);
});

test('MLTLoader#options defaults', () => {
  expect(MLTLoader.options.mlt.shape).toBe('geojson-table');
  expect(MLTLoader.options.mlt.coordinates).toBe('local');
  expect(MLTLoader.options.mlt.layerProperty).toBe('layerName');
});

test('MLTLoader#parse empty tile', async () => {
  const emptyBuffer = new ArrayBuffer(0);
  const result = await MLTLoader.parse(emptyBuffer, {mlt: {shape: 'geojson-table'}});
  expect(result.shape).toBe('geojson-table');
  expect(result.features).toHaveLength(0);
});

test('MLTLoader#throws on wgs84 without tileIndex', async () => {
  const emptyBuffer = new ArrayBuffer(0);
  const options: MLTLoaderOptions = {mlt: {coordinates: 'wgs84'}};
  expect(() => MLTLoader.parseSync(emptyBuffer, options)).toThrow();
});
