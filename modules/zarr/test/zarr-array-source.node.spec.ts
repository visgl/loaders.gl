// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {pathToFileURL} from 'node:url';
import '@loaders.gl/polyfills';
import test from 'test/utils/vitest-tape';
import {createDataSource, resolvePath} from '@loaders.gl/core';
import {
  ZarrArraySource,
  ZarrArraySourceLoader,
  type ZarrArraySourceLoaderOptions
} from '@loaders.gl/zarr';

const FIXTURE_PATH = resolvePath('@loaders.gl/zarr/test/data/spatialdata-v3.zarr');
const FIXTURE_URL = pathToFileURL(FIXTURE_PATH).href;

test('ZarrArraySource reads array metadata and integer selections', async t => {
  const options: ZarrArraySourceLoaderOptions = {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '0', dimensions: ['t', 'c', 'z', 'y', 'x']}
  };
  const source = createDataSource(FIXTURE_URL, [ZarrArraySourceLoader], options);

  t.ok(source instanceof ZarrArraySource);
  const metadata = await source.getMetadata();
  t.deepEqual(metadata.shape, [1, 3, 1, 167, 439]);
  t.deepEqual(metadata.chunks, [1, 1, 1, 167, 439]);
  t.deepEqual(metadata.dimensions, ['t', 'c', 'z', 'y', 'x']);
  t.equal(metadata.fillValue, 0);
  t.equal(metadata.attributes['long_name'], 'Example georeferenced image');

  const selected = await source.getArray({selection: [0, 1, 0, null, null]});
  t.deepEqual(selected.shape, [167, 439]);
  t.equal(selected.data.length, 167 * 439);

  const window = await source.getArray({
    selection: [0, 1, 0, {start: 2, stop: 5}, {start: 4, stop: 9, step: 2}]
  });
  t.deepEqual(window.shape, [3, 3]);
  t.equal(window.data.length, 9);

  const namedWindow = await source.getArray({
    selectionByDimension: {t: 0, c: 1, z: 0, y: {start: 2, stop: 5}, x: {start: 4, stop: 9, step: 2}}
  });
  t.deepEqual(namedWindow.shape, [3, 3]);
  t.end();
});

test('ZarrArraySource validates selection rank and dimension labels', async t => {
  const source = createDataSource(FIXTURE_URL, [ZarrArraySourceLoader], {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '0', dimensions: ['t']}
  });

  await t.rejects(source.getMetadata(), /dimensions must have length 5/);
  t.end();
});

test('ZarrArraySource rejects unknown named dimensions', async t => {
  const source = createDataSource(FIXTURE_URL, [ZarrArraySourceLoader], {
    zarr: {path: 'images/example-image'},
    zarrArray: {path: '0'}
  });

  await t.rejects(source.getArray({selectionByDimension: {unknown: 0}}), /Unknown Zarr array dimension/);
  await t.rejects(
    source.getArray({selection: [null, null, null, null, null], selectionByDimension: {t: 0}}),
    /cannot combine positional and named selections/
  );
  t.end();
});
