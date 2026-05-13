// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('SHPLoader#load polygons', async t => {
  const result = await load(SHAPEFILE_POLYGON_PATH, SHPLoader, WKB_OPTIONS);

  t.ok(result.header, 'A header received');
  t.equal(result.geometries.length, 3, 'Correct number of rows received');
  t.end();
});

test('Shapefile JS Point tests', async t => {
  for (const testFileName of SHAPEFILE_JS_POINT_TEST_FILES) {
    const output = await load(
      `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`,
      SHPLoader,
      WKB_OPTIONS
    );

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();

    for (let i = 0; i < json.features.length; i++) {
      t.deepEqual(
        convertWKBToGeometry(toArrayBuffer(output.geometries[i])),
        json.features[i].geometry,
        `${testFileName}: point geometry matches`
      );
    }
  }

  t.end();
});

test('SHPLoader#Null Shape records in typed shapefile', async t => {
  const output = await load(`${SHAPEFILE_JS_DATA_FOLDER}/null.shp`, SHPLoader, WKB_OPTIONS);

  t.equal(output.header.type, 1, 'fixture is a Point shapefile');
  t.equal(output.geometries.length, 9, 'all records are preserved');
  t.equal(output.geometries.filter(Boolean).length, 5, 'non-null point records are parsed');
  t.equal(
    output.geometries.filter(geometry => geometry === null).length,
    4,
    'null records are parsed'
  );
  t.end();
});

test('Shapefile JS Polyline tests', async t => {
  for (const testFileName of SHAPEFILE_JS_POLYLINE_TEST_FILES) {
    const output = await load(
      `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`,
      SHPLoader,
      WKB_OPTIONS
    );

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();

    for (let i = 0; i < json.features.length; i++) {
      t.deepEqual(
        convertWKBToGeometry(toArrayBuffer(output.geometries[i])),
        json.features[i].geometry,
        `${testFileName}: line geometry matches`
      );
    }
  }

  t.end();
});

test('Shapefile JS Polygon tests', async t => {
  for (const testFileName of SHAPEFILE_JS_POLYGON_TEST_FILES) {
    const output = await load(
      `${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`,
      SHPLoader,
      WKB_OPTIONS
    );

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();

    for (let i = 0; i < json.features.length; i++) {
      t.deepEqual(
        convertWKBToGeometry(toArrayBuffer(output.geometries[i])),
        json.features[i].geometry,
        `${testFileName}: polygon geometry matches`
      );
    }
  }

  t.end();
});

test('SHPLoader#_maxDimensions', async t => {
  const output2d = await load(`${SHAPEFILE_JS_DATA_FOLDER}/${POINT_Z_TEST_FILE}.shp`, SHPLoader, {
    shp: {_maxDimensions: 2, shape: 'wkb'}
  });
  const geometry2d = convertWKBToGeometry(toArrayBuffer(output2d.geometries[0]));
  t.equal(geometry2d.coordinates.length, 2);

  const defaultOutput = await load(
    `${SHAPEFILE_JS_DATA_FOLDER}/${POINT_Z_TEST_FILE}.shp`,
    SHPLoader,
    WKB_OPTIONS
  );
  const defaultGeometry = convertWKBToGeometry(toArrayBuffer(defaultOutput.geometries[0]));
  t.equal(defaultGeometry.coordinates.length, 4);

  t.end();
});

function toArrayBuffer(wkb: Uint8Array): ArrayBuffer {
  return wkb.buffer.slice(wkb.byteOffset, wkb.byteOffset + wkb.byteLength) as ArrayBuffer;
}
