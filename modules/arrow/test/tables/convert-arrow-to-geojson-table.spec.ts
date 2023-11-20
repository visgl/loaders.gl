// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';
import {GEOARROW_TEST_CASES} from '../data/geoarrow/test-cases';

import {fetchFile, parse} from '@loaders.gl/core';
import {FeatureCollection} from '@loaders.gl/schema';
import {ArrowLoader} from '@loaders.gl/arrow';

test('ArrowLoader#geojson-table', (t) => {
  for (const testCase of GEOARROW_TEST_CASES) {
    testConversion(t, testCase[0], testCase[1]);
  }
  t.end();
});

async function testConversion(
  t: Test,
  arrowFile: string,
  expectedGeojson: FeatureCollection
): Promise<void> {
  const table = await parse(fetchFile(arrowFile), ArrowLoader, {
    worker: false,
    arrow: {
      shape: 'geojson-table'
    }
  });

  t.equal(table.shape, 'geojson-table');

  if (table.shape === 'geojson-table') {
    // check if the arrow table is loaded correctly
    t.equal(
      table.features.length,
      expectedGeojson.features.length,
      `arrow table has ${expectedGeojson.features.length} row`
    );

    // const colNames = [...Object.keys(expectedGeojson.features[0].properties || {}), 'geometry'];
    // t.equal(table.numCols, colNames.length, `arrow table has ${colNames.length} columns`);

    // // check fields exist in arrow table schema
    // table.schema.fields.map((field) =>
    //   t.equal(colNames.includes(field.name), true, `arrow table has ${field.name} column`)
    // );

    // get first geometry from arrow geometry column
    const firstFeature = table.features[0];

    // check if geometry in firstFeature is equal to the original geometry in expectedPointGeojson
    t.deepEqual(
      firstFeature?.geometry,
      expectedGeojson.features[0].geometry,
      'firstFeature.geometry is equal to expectedGeojson.features[0].geometry'
    );
  }
}
