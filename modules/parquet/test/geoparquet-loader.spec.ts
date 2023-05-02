import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {ParquetColumnarLoader, _ParquetWriter as ParquetWriter} from '@loaders.gl/parquet';
import {load, encode, setLoaderOptions} from '@loaders.gl/core';
import {getTableLength} from '@loaders.gl/schema';
import {Table as ArrowTable, makeVector, vectorFromArray, Bool, Utf8} from 'apache-arrow';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/geoparquet';
const GEOPARQUET_EXAMPLE = `${PARQUET_DIR}/example.parquet`;
const GEOPARQUET_FILES = [
  'example.parquet',
  'airports.parquet',
  'geojson-big.parquet'
];

// Use local workers
setLoaderOptions({_workerType: 'test'});

test('Load GeoParquet file', async (t) => {
  const table = await load(GEOPARQUET_EXAMPLE, ParquetColumnarLoader, {worker: false});

  t.equal(getTableLength(table), 5);
  t.deepEqual(table.schema?.fields.map(f => f.name),
    [ 'pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry' ]);
  t.end();
})

test.skip('GeoParquetColumnarLoader#load', async (t) => {
  t.comment('SUPPORTED FILES');
  for (const fileName of GEOPARQUET_FILES) {
    const url = `${PARQUET_DIR}/geoparquet/${fileName}`;
    const data = await load(url, ParquetColumnarLoader, {worker: false});
    t.ok(data, `GOOD(${fileName})`);
  }

  t.end();
})

test.skip('ParquetWriterLoader round trip', async (t) => {
  const table = createArrowTable();

  const parquetBuffer = await encode(table, ParquetWriter, {worker: false});
  const newTable = await load(parquetBuffer, ParquetColumnarLoader, {worker: false});

  t.deepEqual(table.schema, newTable.schema);
  t.end();
})

function createArrowTable(): ArrowTable {  
  const utf8Vector = vectorFromArray<Utf8>(['a', 'b', 'c', 'd']);
  const boolVector = makeVector({data: [1, 1, 0, 0], type: new Bool()});
  const uint8Vector = makeVector(new Uint8Array([1, 2, 3, 4]));
  const int32Vector = makeVector(new Int32Array([0, -2147483638, 2147483637, 1]));

  const table = new ArrowTable({
    str: utf8Vector,
    uint8: uint8Vector, 
    int32: int32Vector, 
    bool: boolVector
  });
  return table;
}
