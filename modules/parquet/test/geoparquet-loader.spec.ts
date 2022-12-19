import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {ParquetColumnarLoader, _ParquetWriter as ParquetWriter} from '@loaders.gl/parquet';
import {load, encode, setLoaderOptions} from '@loaders.gl/core';
import {Table, Int32Vector, Utf8Vector, BoolVector, Uint8Vector} from 'apache-arrow';

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
  const table: Table = await load(GEOPARQUET_EXAMPLE, ParquetColumnarLoader, {worker: false});

  t.equal(table.length, 5);
  t.deepEqual(table.schema.fields.map(f => f.name),
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

test('ParquetWriterLoader round trip', async (t) => {
  const table = createArrowTable();

  const parquetBuffer = await encode(table, ParquetWriter, {worker: false});
  const newTable = await load(parquetBuffer, ParquetColumnarLoader, {worker: false});

  t.deepEqual(table.schema, newTable.schema);
  t.end();
})

function createArrowTable() {
  const utf8Vector = Utf8Vector.from(['a', 'b', 'c', 'd']);
  const boolVector = BoolVector.from([true, true, false, false])
  const uint8Vector = Uint8Vector.from([1, 2, 3, 4])
  const int32Vector = Int32Vector.from([0, -2147483638, 2147483637, 1])

  const table = Table.new([utf8Vector, uint8Vector, int32Vector, boolVector], ['str', 'uint8', 'int32', 'bool']);
  return table;
}
