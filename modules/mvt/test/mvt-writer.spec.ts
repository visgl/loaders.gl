// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
// import {encode, fetchFile} from '@loaders.gl/core';
import {MVTWriter} from '@loaders.gl/mvt';

// const RECTANGLE_URL = '@loaders.gl/mvt/test/data/mapbox-vt-pbf-fixtures/rectangle.geojson';

test('MVTWriter', async (t) => {
  t.ok(MVTWriter, 'MVTWriter is defined');

  // const response = await fetchFile(RECTANGLE_URL);
  // const geojson = await response.json();

  // const arrayBuffer = encode(geojson, MVTWriter);
  // t.ok(arrayBuffer instanceof ArrayBuffer, 'MVTWriter encodes to ArrayBuffer');

  t.end();
});
