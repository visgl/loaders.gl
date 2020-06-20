import test from 'tape-promise/tape';
import parseShape from '@loaders.gl/shapefile/lib/parse-shp';
import {fetchFile} from '@loaders.gl/core';
import {geojsonToBinary} from '@loaders.gl/gis';

const BOSTOCK_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const BOSTOCK_POINT_TEST_FILES = ['points', 'multipoints'];
const BOSTOCK_POLYLINE_TEST_FILES = ['polylines'];
const BOSTOCK_POLYGON_TEST_FILES = ['polygons'];

test('Bostock Point tests', async t => {
  for (const testFileName of BOSTOCK_POINT_TEST_FILES) {
    let response = await fetchFile(`${BOSTOCK_DATA_FOLDER}/${testFileName}.shp`);
    const body = await response.arrayBuffer();

    response = await fetchFile(`${BOSTOCK_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();
    const output = parseShape(body);

    for (let i = 0; i < json.features.length; i++) {
      const expBinary = geojsonToBinary([json.features[i]]).points.positions;
      t.deepEqual(output.features[i].positions, expBinary);
    }
  }

  t.end();
});

test('Bostock Polyline tests', async t => {
  for (const testFileName of BOSTOCK_POLYLINE_TEST_FILES) {
    let response = await fetchFile(`${BOSTOCK_DATA_FOLDER}/${testFileName}.shp`);
    const body = await response.arrayBuffer();

    response = await fetchFile(`${BOSTOCK_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();
    const output = parseShape(body);

    for (let i = 0; i < json.features.length; i++) {
      const expBinary = geojsonToBinary([json.features[i]]).lines;
      t.deepEqual(output.features[i].positions, expBinary.positions);
      t.deepEqual(output.features[i].indices, expBinary.pathIndices);
    }
  }

  t.end();
});

test('Bostock Polygon tests', async t => {
  for (const testFileName of BOSTOCK_POLYGON_TEST_FILES) {
    let response = await fetchFile(`${BOSTOCK_DATA_FOLDER}/${testFileName}.shp`);
    const body = await response.arrayBuffer();

    response = await fetchFile(`${BOSTOCK_DATA_FOLDER}/${testFileName}.json`);
    const json = await response.json();
    const output = parseShape(body);

    for (let i = 0; i < json.features.length; i++) {
      const expBinary = geojsonToBinary([json.features[i]]).polygons;
      t.deepEqual(output.features[i].positions, expBinary.positions);
      t.deepEqual(output.features[i].indices, expBinary.primitivePolygonIndices);
    }
  }

  t.end();
});
