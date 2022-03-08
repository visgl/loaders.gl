/* eslint-disable max-statements */
/* eslint-disable complexity */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {GeoParquetLoader, GeoParquetWorkerLoader} from '@loaders.gl/parquet';
import {load, setLoaderOptions} from '@loaders.gl/core';
import type {Table} from 'apache-arrow';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/geoparquet';

setLoaderOptions({
  _workerType: 'test'
});

test('ParquetLoader#loader objects', (t) => {
  validateLoader(t, GeoParquetLoader, 'ParquetLoader');
  validateLoader(t, GeoParquetWorkerLoader, 'ParquetWorkerLoader');
  t.end();
});

test('Load GeoParquet file', async (t) => {
  const url = `${PARQUET_DIR}/example.parquet`;
  const table: Table = await load(url, GeoParquetLoader, {
    geoparquet: {
      cdn: null
    },
  });

  t.equal(table.numRows, 5);
  t.deepEqual(table.schema.fields.map(f => f.name),
    [ 'pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry' ]);
  t.end();
})
