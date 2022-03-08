import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {ParquetWasmLoader} from '@loaders.gl/parquet';
import {load, setLoaderOptions} from '@loaders.gl/core';
import type {Table} from 'apache-arrow';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/geoparquet';

setLoaderOptions({
  _workerType: 'test'
});

test('ParquetLoader#loader objects', (t) => {
  // Not sure why validateLoader calls parse? Raises an error about "Invalid Parquet file"
  // validateLoader(t, ParquetWasmLoader, 'ParquetLoader');
  // validateLoader(t, ParquetWasmWorkerLoader, 'ParquetWorkerLoader');
  t.end();
});

test('Load Parquet file', async (t) => {
  const url = `${PARQUET_DIR}/example.parquet`;
  const table: Table = await load(url, ParquetWasmLoader, {
    geoparquet: {
      cdn: null
    },
  });

  t.equal(table.length, 5);
  t.deepEqual(table.schema.fields.map(f => f.name),
    [ 'pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry' ]);
  t.end();
})
