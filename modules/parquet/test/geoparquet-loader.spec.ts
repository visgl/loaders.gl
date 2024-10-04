import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {
  ParquetJSONColumnarLoader,
  ParquetJSONLoader,
  _ParquetJSONWriter as ParquetJSONWriter
} from '@loaders.gl/parquet';
import {load, encode, setLoaderOptions} from '@loaders.gl/core';
import {getTableLength} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/geoparquet';
const GEOPARQUET_EXAMPLE = `${PARQUET_DIR}/example.parquet`;
const GEOPARQUET_FILES = ['example.parquet', 'airports.parquet', 'geojson-big.parquet'];

// Use local workers
setLoaderOptions({_workerType: 'test'});

test.skip('Load GeoParquet#airports.parquet', async (t) => {
  const table = await load(`${PARQUET_DIR}/airports.parquet`, ParquetJSONLoader, {
    worker: false,
    parquet: {
      shape: 'geojson-table',
      preserveBinary: true
    }
  });

  t.equal(table.shape, 'geojson-table');
  t.equal(getTableLength(table), 1000);
  t.deepEqual(
    table.schema?.fields.map((f) => f.name),
    ['cartodb_id', 'gps_code', 'name', 'geom']
  );
  t.end();
});

test('Load GeoParquet file', async (t) => {
  const table = await load(GEOPARQUET_EXAMPLE, ParquetJSONColumnarLoader, {worker: false});

  t.equal(getTableLength(table), 5);
  t.deepEqual(
    table.schema?.fields.map((f) => f.name),
    ['pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry']
  );
  t.end();
});

test.skip('GeoParquetJSONColumnarLoader#load', async (t) => {
  // t.comment('SUPPORTED FILES');
  for (const fileName of GEOPARQUET_FILES) {
    const url = `${PARQUET_DIR}/geoparquet/${fileName}`;
    const data = await load(url, ParquetJSONColumnarLoader, {worker: false});
    t.ok(data, `GOOD(${fileName})`);
  }

  t.end();
});

test.skip('ParquetJSONWriterLoader round trip', async (t) => {
  const table = createArrowTable();

  const parquetBuffer = await encode(table, ParquetJSONWriter, {worker: false});
  const newTable = await load(parquetBuffer, ParquetJSONColumnarLoader, {worker: false});

  t.deepEqual(table.schema, newTable.schema);
  t.end();
});

function createArrowTable(): arrow.Table {
  const utf8Vector = arrow.vectorFromArray<arrow.Utf8>(['a', 'b', 'c', 'd']);
  const boolVector = arrow.makeVector({data: [1, 1, 0, 0], type: new arrow.Bool()});
  const uint8Vector = arrow.makeVector(new Uint8Array([1, 2, 3, 4]));
  const int32Vector = arrow.makeVector(new Int32Array([0, -2147483638, 2147483637, 1]));

  const table = new arrow.Table({
    str: utf8Vector,
    uint8: uint8Vector,
    int32: int32Vector,
    bool: boolVector
  });
  return table;
}
