// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {setLoaderOptions, load, fetchFile} from '@loaders.gl/core';
import {convertWKBToGeometry} from '@loaders.gl/gis';
import {SHPLoader} from '@loaders.gl/shapefile';
const SHAPEFILE_POLYGON_PATH = '@loaders.gl/shapefile/test/data/shapefile-js/polygons.shp';
const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const SHAPEFILE_JS_POINT_TEST_FILES = ['points', 'multipoints'];
const SHAPEFILE_JS_POLYLINE_TEST_FILES = ['polylines'];
const SHAPEFILE_JS_POLYGON_TEST_FILES = ['polygons', 'multipolygon_with_holes'];
const POINT_Z_TEST_FILE = 'point-z';
setLoaderOptions({
  _workerType: 'test'
});
const WKB_OPTIONS = {shp: {shape: 'wkb' as const}};
test('SHPLoader#load polygons', async () => {
  const result = await load(SHAPEFILE_POLYGON_PATH, SHPLoader, WKB_OPTIONS);
  expect(result.header, 'A header received').toBeTruthy();
  expect(result.geometries.length, 'Correct number of rows received').toBe(3);
});
test('Shapefile JS Point tests', async () => {
  for (const testFileName of SHAPEFILE_JS_POINT_TEST_FILES) {
    const output = await load(
      `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`,
      SHPLoader,
      WKB_OPTIONS
    );
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();
    for (let i = 0; i < json.features.length; i++) {
      expect(
        convertWKBToGeometry(toArrayBuffer(output.geometries[i])),
        `${testFileName}: point geometry matches`
      ).toEqual(json.features[i].geometry);
    }
  }
});
test('SHPLoader#Null Shape records in typed shapefile', async () => {
  const output = await load(`${SHAPEFILE_JS_DATA_FOLDER}/null.shp`, SHPLoader, WKB_OPTIONS);
  expect(output.header.type, 'fixture is a Point shapefile').toBe(1);
  expect(output.geometries.length, 'all records are preserved').toBe(9);
  expect(output.geometries.filter(Boolean).length, 'non-null point records are parsed').toBe(5);
  expect(
    output.geometries.filter(geometry => geometry === null).length,
    'null records are parsed'
  ).toBe(4);
});
test('Shapefile JS Polyline tests', async () => {
  for (const testFileName of SHAPEFILE_JS_POLYLINE_TEST_FILES) {
    const output = await load(
      `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`,
      SHPLoader,
      WKB_OPTIONS
    );
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();
    for (let i = 0; i < json.features.length; i++) {
      expect(
        convertWKBToGeometry(toArrayBuffer(output.geometries[i])),
        `${testFileName}: line geometry matches`
      ).toEqual(json.features[i].geometry);
    }
  }
});
test('Shapefile JS Polygon tests', async () => {
  for (const testFileName of SHAPEFILE_JS_POLYGON_TEST_FILES) {
    const output = await load(
      `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`,
      SHPLoader,
      WKB_OPTIONS
    );
    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();
    for (let i = 0; i < json.features.length; i++) {
      expect(
        convertWKBToGeometry(toArrayBuffer(output.geometries[i])),
        `${testFileName}: polygon geometry matches`
      ).toEqual(json.features[i].geometry);
    }
  }
});
test('SHPLoader#_maxDimensions', async () => {
  const output2d = await load(`${SHAPEFILE_JS_DATA_FOLDER}/${POINT_Z_TEST_FILE}.shp`, SHPLoader, {
    shp: {_maxDimensions: 2, shape: 'wkb'}
  });
  const geometry2d = convertWKBToGeometry(toArrayBuffer(output2d.geometries[0]));
  expect(geometry2d.coordinates.length).toBe(2);
  const defaultOutput = await load(
    `${SHAPEFILE_JS_DATA_FOLDER}/${POINT_Z_TEST_FILE}.shp`,
    SHPLoader,
    WKB_OPTIONS
  );
  const defaultGeometry = convertWKBToGeometry(toArrayBuffer(defaultOutput.geometries[0]));
  expect(defaultGeometry.coordinates.length).toBe(4);
});
function toArrayBuffer(wkb: Uint8Array): ArrayBuffer {
  return wkb.buffer.slice(wkb.byteOffset, wkb.byteOffset + wkb.byteLength) as ArrayBuffer;
}
