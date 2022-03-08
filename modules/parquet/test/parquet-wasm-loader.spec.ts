import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {ParquetWasmLoader, ParquetWasmWriter} from '@loaders.gl/parquet';
import {load, encode, setLoaderOptions} from '@loaders.gl/core';
import {Table, Builder, Utf8, Bool} from 'apache-arrow';
import {WASM_SUPPORTED_FILES} from './data/files';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';

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
  const url = '@loaders.gl/parquet/test/data/geoparquet/example.parquet';
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

test('ParquetWasmLoader#load', async (t) => {
  t.comment('SUPPORTED FILES');
  for (const {title, path} of WASM_SUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    const data = await load(url, ParquetWasmLoader, {});
    t.ok(data, `GOOD(${title})`);
  }

  t.end();
})

test.only('ParquetWasmWriterLoader round trip', async (t) => {
  const table = createArrowTable();
  const parquetBuffer = await encode(table, ParquetWasmWriter);
  const newTable = await load(parquetBuffer, ParquetWasmLoader);

  t.deepEqual(table.schema, newTable.schema);
})

function createArrowTable() {
  const utf8Builder = Builder.new({
    type: new Utf8(),
  });
  utf8Builder.append('a').append('b').append('c').append('d');

  const utf8Vector = utf8Builder.finish().toVector();

  const boolBuilder = Builder.new({
    type: new Bool(),
  });
  boolBuilder.append(true).append(true).append(false).append(false);

  const boolVector = boolBuilder.finish().toVector();

  const table = Table.from({
    str: utf8Vector,
    uint8: new Uint8Array([1, 2, 3, 4]),
    int32: new Int32Array([0, -2147483638, 2147483637, 1]),
    bool: boolVector,
  });
  return table;
}
