import test from 'tape-promise/tape';
// import {validateLoader} from 'test/common/conformance';

import {ParquetWasmLoader, ParquetWasmWriter} from '@loaders.gl/parquet';
import {load, encode, setLoaderOptions} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {WASM_SUPPORTED_FILES} from './data/files';

const PARQUET_DIR = '@loaders.gl/parquet/test/data';
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
  const url = `${PARQUET_DIR}/geoparquet/example.parquet`;
  const table = await load(url, ParquetWasmLoader, {
    parquet: {
      wasmUrl: WASM_URL
    }
  });
  const arrowTable = table.data;
  t.equal(arrowTable.numRows, 5);
  t.deepEqual(table.schema?.fields.map(f => f.name),
    [ 'pop_est', 'continent', 'name', 'iso_a3', 'gdp_md_est', 'geometry' ]);
  t.end();
})

test('ParquetWasmLoader#load', async (t) => {
  t.comment('SUPPORTED FILES');
  for (const {title, path} of WASM_SUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/apache/${path}`;
    const table = await load(url, ParquetWasmLoader, {
      parquet: {
        wasmUrl: WASM_URL
      }
    });
    const arrowTable = table.data;
    t.ok(arrowTable, `GOOD(${title})`);
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
  const utf8Vector = arrow.vectorFromArray(['a', 'b', 'c', 'd'], new arrow.Utf8);
  const boolVector = arrow.vectorFromArray([true, true, false, false], new arrow.Bool)
  const uint8Vector = arrow.vectorFromArray([1, 2, 3, 4], new arrow.Uint8)
  const int32Vector = arrow.vectorFromArray([0, -2147483638, 2147483637, 1], new arrow.Uint32)

  const table = new arrow.Table({utf8Vector, uint8Vector, int32Vector, boolVector});
  return table;
}
