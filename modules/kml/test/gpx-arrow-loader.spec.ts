// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, load} from '@loaders.gl/core';
import {getGeoMetadata} from '@loaders.gl/schema';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/arrow-geometry/geojson-table';
import {GPXLoader} from '@loaders.gl/kml';
import * as kml from '@loaders.gl/kml';
import * as bundledKml from '@loaders.gl/kml/bundled';
import * as unbundledKml from '@loaders.gl/kml/unbundled';
const GPX_URL = '@loaders.gl/kml/test/data/gpx/trek';
test('GPXLoader#loader conformance', () => {
  validateLoader(GPXLoader, 'GPXLoader');
});
test('GPXLoader#removed Arrow loader exports', () => {
  expect('GPXArrowLoader' in kml, 'root does not export GPXArrowLoader').toBeFalsy();
  expect('GPXArrowLoader' in bundledKml, 'bundled does not export GPXArrowLoader').toBeFalsy();
  expect('GPXArrowLoader' in unbundledKml, 'unbundled does not export GPXArrowLoader').toBeFalsy();
});
test('GPXLoader#parse with shape: arrow-table', async () => {
  const arrowTable = await load(`${GPX_URL}.gpx`, GPXLoader, {gpx: {shape: 'arrow-table'}});
  const geoMetadata = getGeoMetadata(arrowTable.schema?.metadata || {});
  const roundTripped = convertGeoArrowTableToGeoJSON(arrowTable.data, arrowTable.schema!);
  const response = await fetchFile(`${GPX_URL}.geojson`);
  const expected = await response.json();
  expect(arrowTable.shape, 'shape is arrow-table').toBe('arrow-table');
  expect(geoMetadata?.primary_column, 'geo metadata primary column is set').toBe('geometry');
  expect(geoMetadata?.columns.geometry.encoding, 'geo metadata uses WKB encoding').toBe('wkb');
  expect(
    geoMetadata?.columns.geometry.geometry_types,
    'geo metadata geometry type matches GPX fixture'
  ).toEqual(['LineString Z']);
  expect(roundTripped.features, 'Arrow output matches expected GeoJSON').toEqual(expected.features);
});
