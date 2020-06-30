import test from 'tape-promise/tape';
import parseDbf from '@loaders.gl/shapefile/lib/parse-dbf';
import {fetchFile} from '@loaders.gl/core';

const SHAPEFILE_JS_DATA_FOLDER = '@loaders.gl/shapefile/test/data/shapefile-js';
const SHAPEFILE_JS_TEST_FILES = [
  'points',
  'multipoints',
  'polygons',
  'polylines',
  'mixed-properties',
  'boolean-property'
  // 'date-property' need to coerce json from str to date
];

test('Shapefile JS DBF tests', async t => {
  for (const testFileName of SHAPEFILE_JS_TEST_FILES) {
    let response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.dbf`);
    const body = await response.arrayBuffer();
    const output = parseDbf(body, {encoding: 'utf8'});

    response = await fetchFile(`${SHAPEFILE_JS_DATA_FOLDER}/${testFileName}.json`);
    const {features} = await response.json();

    for (let i = 0; i < features.length; i++) {
      t.deepEqual(output[i], features[i].properties);
    }
  }

  t.end();
});
