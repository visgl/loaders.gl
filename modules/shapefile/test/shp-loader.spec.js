import test from 'tape-promise/tape';
import {load, fetchFile} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';
import {SHPLoader} from '@loaders.gl/shapefile';

// import {parseSHP} from '@loaders.gl/shapefile/lib/parsers/parse-shp';
// // import parseSHP from '@loaders.gl/shapefile/lib/parsers/deprecated/parse-shp-atomic';
// import {fetchFile} from '@loaders.gl/core';

const SHAPEFILE_POLYGON_PATH = '@loaders.gl/shapefile/test/data/shapefile-js/polygons.shp';
const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const SHAPEFILE_JS_POINT_TEST_FILES = ['points', 'multipoints'];
const SHAPEFILE_JS_POLYLINE_TEST_FILES = ['polylines'];
const SHAPEFILE_JS_POLYGON_TEST_FILES = ['polygons'];

test('SHPLoader#load polygons', async t => {
  const result = await load(SHAPEFILE_POLYGON_PATH, SHPLoader);

  t.ok(result.header, 'A header received');
  t.equal(result.geometries.length, 3, 'Correct number of rows received');
  t.end();
});

test('Shapefile JS Point tests', async t => {
  for (const testFileName of SHAPEFILE_JS_POINT_TEST_FILES) {
    const output = await load(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`, SHPLoader);

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();

    for (let i = 0; i < json.features.length; i++) {
      const binary = geojsonToBinary([json.features[i]]);
      const expBinary = binary.points && binary.points.positions;
      // @ts-ignore
      t.deepEqual(output.geometries[i].positions, expBinary);
    }
  }

  t.end();
});

test('Shapefile JS Polyline tests', async t => {
  for (const testFileName of SHAPEFILE_JS_POLYLINE_TEST_FILES) {
    const output = await load(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`, SHPLoader);

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();

    for (let i = 0; i < json.features.length; i++) {
      const expBinary = geojsonToBinary([json.features[i]]).lines;
      // @ts-ignore
      t.deepEqual(output.geometries[i].positions, expBinary.positions);
      // @ts-ignore
      t.deepEqual(output.geometries[i].pathIndices, expBinary.pathIndices);
    }
  }

  t.end();
});

test('Shapefile JS Polygon tests', async t => {
  for (const testFileName of SHAPEFILE_JS_POLYGON_TEST_FILES) {
    const output = await load(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.shp`, SHPLoader);

    const response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();

    for (let i = 0; i < json.features.length; i++) {
      const expBinary = geojsonToBinary([json.features[i]]).polygons;
      // @ts-ignore
      t.deepEqual(output.geometries[i].positions, expBinary.positions);
      // @ts-ignore
      t.deepEqual(output.geometries[i].primitivePolygonIndices, expBinary.primitivePolygonIndices);
    }
  }

  t.end();
});
