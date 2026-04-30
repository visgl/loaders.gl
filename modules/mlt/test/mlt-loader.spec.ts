// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {MLTLoaderOptions} from '@loaders.gl/mlt';
import {MLTLoader} from '@loaders.gl/mlt/bundled';

test('MLTLoader#metadata', t => {
  t.ok(MLTLoader, 'MLTLoader defined');
  t.equal(MLTLoader.name, 'MapLibre Tile', 'name is correct');
  t.equal(MLTLoader.id, 'mlt', 'id is correct');
  t.deepEqual(MLTLoader.extensions, ['mlt'], 'extensions are correct');
  t.end();
});

test('MLTLoader#options defaults', t => {
  t.equal(MLTLoader.options.mlt.shape, 'geojson-table', 'default shape is geojson-table');
  t.equal(MLTLoader.options.mlt.coordinates, 'local', 'default coordinates are local');
  t.equal(MLTLoader.options.mlt.layerProperty, 'layerName', 'default layerProperty is layerName');
  t.end();
});

test('MLTLoader#parse empty tile', async t => {
  const emptyBuffer = new ArrayBuffer(0);
  const result = await MLTLoader.parse(emptyBuffer, {mlt: {shape: 'geojson-table'}});
  t.equal(result.shape, 'geojson-table', 'empty tile returns a GeoJSON table');
  t.equal(result.features.length, 0, 'empty tile returns empty features');
  t.end();
});

test('MLTLoader#throws on wgs84 without tileIndex', async t => {
  const emptyBuffer = new ArrayBuffer(0);
  const options: MLTLoaderOptions = {mlt: {coordinates: 'wgs84'}};
  t.throws(() => MLTLoader.parseSync(emptyBuffer, options), 'throws without tileIndex');
  t.end();
});
