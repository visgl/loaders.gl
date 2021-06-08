import test from 'tape-promise/tape';
import {setLoaderOptions, fetchFile, parse} from '@loaders.gl/core';
import {DBFLoader} from '@loaders.gl/shapefile';

setLoaderOptions({
  _workerType: 'test'
});

const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const SHAPEFILE_JS_TEST_FILES = [
  'boolean-property',
  'date-property',
  // 'latin1-property', // fails on 'México'
  'mixed-properties',
  'multipoints',
  'null',
  'number-null-property',
  'number-property',
  'points',
  'polygons',
  'polylines',
  'string-property',
  'utf8-property'
];

test('Shapefile JS DBF tests', async (t) => {
  for (const testFileName of SHAPEFILE_JS_TEST_FILES) {
    let response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.dbf`);
    const body = await response.arrayBuffer();
    const options = {worker: false, dbf: {encoding: 'utf8'}};

    if (testFileName === 'latin1-property') {
      options.dbf.encoding = 'latin1';
    }
    const output = await parse(body, DBFLoader, options);

    response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const {features} = await response.json();

    for (let i = 0; i < features.length; i++) {
      t.deepEqual(output[i], features[i].properties, testFileName);
    }
  }

  t.end();
});
