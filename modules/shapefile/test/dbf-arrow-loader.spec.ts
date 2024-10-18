// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {setLoaderOptions, fetchFile, parse} from '@loaders.gl/core';
import {DBFArrowLoader} from '@loaders.gl/shapefile';

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

test.only('Shapefile Arrow DBF tests', async (t) => {
  for (const testFileName of SHAPEFILE_JS_TEST_FILES) {
    const encoding = testFileName === 'latin1-property' ? 'latin1' : 'utf8';
    const options = {worker: false, dbf: {encoding}};

    let response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const {features} = await response.json();

    response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.dbf`);
    const body = await response.arrayBuffer();

    const table = await parse(body, DBFArrowLoader, options);

    debugger
    for (let i = 0; i < features.length; i++) {
      const row = table.data.get(i)!.toJSON();
      t.deepEqual(row, features[i].properties, testFileName);
    }
  }

  t.end();
});
