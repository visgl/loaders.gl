// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {fetchFile, load} from '@loaders.gl/core';
import {KMLLoader} from '@loaders.gl/kml';
const KML_URL = '@loaders.gl/kml/test/data/kml/KML_Samples.kml';
const KML_LINESTRING_URL = '@loaders.gl/kml/test/data/kml/linestring';
const INVALID_KML = `\
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.someotherstandard.net">
  <Document>
  </Document>
</kml>
`;
test('KMLLoader#loader conformance', () => {
  validateLoader(KMLLoader, 'KMLLoader');
});
test('KMLLoader#testText', async () => {
  const response = await fetchFile(KML_URL);
  const KML = await response.text();
  const KMLTest = KMLLoader.tests && KMLLoader.tests[0];
  if (typeof KMLTest === 'string') {
    let isKML = KML.startsWith(KMLTest);
    expect(isKML, 'Correctly accepted valid KML').toBe(true);
    isKML = INVALID_KML.startsWith(KMLTest);
    expect(isKML, 'Correctly rejected invalid KML').toBe(false);
  }
});
test('KMLLoader#parse', async () => {
  const data = await load(KML_URL, KMLLoader);
  expect(data).toBeTruthy();
});
test('KMLLoader#parse(text)', async () => {
  const table = await load(KML_URL, KMLLoader, {kml: {shape: 'object-row-table'}});
  expect(table.shape, 'shape is object-row-table').toBe('object-row-table');
  if (table.shape === 'object-row-table') {
    expect(table.data.length, 'Features were found').toBe(20);
    const feature = table.data[0];
    expect(Number.isFinite(feature.geometry.coordinates[0])).toBeTruthy();
    expect(Number.isFinite(feature.geometry.coordinates[1])).toBeTruthy();
    expect(Number.isFinite(feature.geometry.coordinates[2])).toBeTruthy();
  }
});
test('KMLLoader#parse(geojson-table)', async () => {
  const table = await load(`${KML_LINESTRING_URL}.kml`, KMLLoader, {
    gis: {format: 'geojson-table'}
  });
  const resp = await fetchFile(`${KML_LINESTRING_URL}.geojson`);
  const geojson = await resp.json();
  geojson.shape = 'geojson-table';
  if (table.shape === 'geojson-table') {
    expect(table.features, 'Data matches GeoJSON').toEqual(geojson.features);
  }
});
