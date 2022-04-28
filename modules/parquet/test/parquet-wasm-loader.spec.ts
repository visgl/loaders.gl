import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {ParquetWasmLoader, ParquetWasmWriter} from '@loaders.gl/parquet';
import {load, encode, setLoaderOptions} from '@loaders.gl/core';
import {Table, Int32Vector, Utf8Vector, BoolVector, Uint8Vector} from 'apache-arrow';
import {WASM_SUPPORTED_FILES} from './data/files';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';
const WASM_URL = 'node_modules/parquet-wasm/esm2/arrow1_bg.wasm';

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
  const url = '@loaders.gl/modules/parquet/test/data/geoparquet/example.parquet';
  const table: Table = await load(url, ParquetWasmLoader, {
    parquet: {
      wasmUrl: WASM_URL
    }
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
    const data = await load(url, ParquetWasmLoader, {
      parquet: {
        wasmUrl: WASM_URL
      }
    });
    t.ok(data, `GOOD(${title})`);
  }

  t.end();
})

test('ParquetWasmWriterLoader round trip', async (t) => {
  const table = createArrowTable();

  const parquetBuffer = await encode(table, ParquetWasmWriter, {worker: false,
    parquet: {
      wasmUrl: WASM_URL
    }
  });
  const newTable = await load(parquetBuffer, ParquetWasmLoader, {worker: false,
    parquet: {
      wasmUrl: WASM_URL
    }
  });

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
