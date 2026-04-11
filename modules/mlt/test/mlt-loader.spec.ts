// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {MLTLoader, MLTLoaderOptions} from '@loaders.gl/mlt';

test('MLTLoader#metadata', t => {
  t.ok(MLTLoader, 'MLTLoader defined');
  t.equal(MLTLoader.name, 'MapLibre Tile', 'name is correct');
  t.equal(MLTLoader.id, 'mlt', 'id is correct');
  t.deepEqual(MLTLoader.extensions, ['mlt'], 'extensions are correct');
  t.end();
});

test('MLTLoader#options defaults', t => {
  t.equal(MLTLoader.options.mlt.shape, 'geojson', 'default shape is geojson');
  t.equal(MLTLoader.options.mlt.coordinates, 'local', 'default coordinates are local');
  t.equal(MLTLoader.options.mlt.layerProperty, 'layerName', 'default layerProperty is layerName');
  t.end();
});

test('MLTLoader#parse empty tile', async t => {
  const emptyBuffer = new ArrayBuffer(0);
  const result = await MLTLoader.parse(emptyBuffer, {mlt: {shape: 'geojson'}});
  t.ok(Array.isArray(result), 'empty tile returns an array');
  t.equal((result as any[]).length, 0, 'empty tile returns empty array');
  t.end();
});

test('MLTLoader#throws on wgs84 without tileIndex', async t => {
  const emptyBuffer = new ArrayBuffer(0);
  const options: MLTLoaderOptions = {mlt: {coordinates: 'wgs84'}};
  t.throws(() => MLTLoader.parseSync(emptyBuffer, options), 'throws without tileIndex');
  t.end();
});
