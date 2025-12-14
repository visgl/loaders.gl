// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {encode, fetchFile, parse} from '@loaders.gl/core';
import {MVTLoader, MVTWriter} from '@loaders.gl/mvt';

const RECTANGLE_URL = '@loaders.gl/mvt/test/data/mapbox-vt-pbf-fixtures/rectangle.geojson';
const RECTANGLE_TILE = '@loaders.gl/mvt/test/data/mapbox-vt-pbf-fixtures/rectangle-1.0.0.pbf';

test('MVTWriter#import', async (t) => {
  t.ok(MVTWriter, 'MVTWriter is defined');
  t.end();
});

test('MVTWriter#encode', async (t) => {
  const geojsonResponse = await fetchFile(RECTANGLE_URL);
  const geojson = await geojsonResponse.json();

  const arrayBuffer = await encode(geojson, MVTWriter, {mvt: {tileIndex: {x: 0, y: 0, z: 1}}});

  const fixtureResponse = await fetchFile(RECTANGLE_TILE);
  const expected = await fixtureResponse.arrayBuffer();

  t.ok(arrayBuffer instanceof ArrayBuffer, 'MVTWriter encodes to ArrayBuffer');
  t.deepEqual(new Uint8Array(arrayBuffer), new Uint8Array(expected));

  t.end();
});

test('MVTWriter#roundtrip', async (t) => {
  const tileIndex = {x: 2, y: 1, z: 2};
  const response = await fetchFile('@loaders.gl/mvt/test/data/mvt/lines_2-2-1.mvt');
  const sourceTile = await response.arrayBuffer();

  const loaderOptions = {mvt: {coordinates: 'local'}};
  const geojson = await parse(sourceTile, MVTLoader, loaderOptions);

  const roundtripBuffer = await encode(geojson, MVTWriter, {mvt: {layerName: 'layer0', tileIndex}});
  const roundtripGeojson = await parse(roundtripBuffer, MVTLoader, loaderOptions);

  t.deepEqual(roundtripGeojson, geojson, 'Roundtrip preserves GeoJSON features');

  t.end();
});
