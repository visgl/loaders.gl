// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-statements */
/* eslint-disable complexity */
import test from 'test/utils/vitest-tape';
import {validateLoader} from 'test/common/conformance';

import {ParquetJSLoader, ParquetLoader} from '@loaders.gl/parquet';
import {ParquetJSLoaderWithParser} from '@loaders.gl/parquet/parquet-js-loader';
import {ParquetLoaderWithParser} from '@loaders.gl/parquet/parquet-loader';
import {isBrowser, load, preload, setLoaderOptions} from '@loaders.gl/core';

import {SUPPORTED_FILES, UNSUPPORTED_FILES, ENCRYPTED_FILES, BAD_FILES} from './data/files';
import {
  ALL_TYPES_DICTIONARY_EXPECTED,
  ALL_TYPES_PLAIN_EXPECTED,
  ALL_TYPES_PLAIN_SNAPPY_EXPECTED,
  BINARY_EXPECTED,
  DECIMAL_EXPECTED,
  DICT_EXPECTED,
  LIST_COLUMNS_EXPECTED,
  NESTED_LIST_EXPECTED,
  NESTED_MAPS_EXPECTED,
  NO_NULLABLE_EXPECTED,
  NULLABLE_EXPECTED,
  NULLS_EXPECTED,
  REPEATED_NO_ANNOTATION_EXPECTED,
  LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED,
  LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED,
  LZ4_RAW_COMPRESSED_EXPECTED,
  NON_HADOOP_LZ4_COMPRESSED_EXPECTED
} from './expected';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';

setLoaderOptions({_workerType: 'test'});

function getParquetLoaderOptions(_url: string) {
  return {
    parquet: {},
    core: {worker: false}
  };
}

test('ParquetJSLoader#loader objects', (t) => {
  validateLoader(t, ParquetJSLoader, 'ParquetJSLoader');
  t.end();
});

test('Parquet loaders preload explicit parser implementations', async (t) => {
  t.equal(
    await preload(ParquetLoader),
    ParquetLoaderWithParser,
    'primary ParquetLoader resolves the WASM parser'
  );
  t.equal(
    await preload(ParquetJSLoader),
    ParquetJSLoaderWithParser,
    'fallback ParquetJSLoader resolves the TypeScript parser'
  );
  t.equal(ParquetJSLoaderWithParser.id, ParquetJSLoader.id, 'fallback parser preserves loader id');
  t.equal(ParquetJSLoader.worker, false, 'fallback parser stays on the main thread');
  t.end();
});

test('ParquetJSLoader#load alltypes_dictionary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 2);
    t.deepEqual(table.data, ALL_TYPES_DICTIONARY_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load supports arrow-table shape', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    t.equal(table.data.numRows, 2);
  }
  t.end();
});

test('ParquetJSLoader#load arrow-table preserves schema for empty results', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table', limit: 0}
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    t.equal(table.data.numRows, 0);
    t.ok(table.schema.fields.length > 0, 'loaders.gl schema retains the file fields');
    t.deepEqual(
      table.data.schema.fields.map((field) => field.name),
      table.schema.fields.map((field) => field.name),
      'Arrow schema retains the same file fields'
    );
  }
  t.end();
});

test('ParquetJSLoader#arrow-table applies projection, offset, and limit', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
  const options = {
    core: {worker: false},
    parquet: {
      shape: 'arrow-table' as const,
      columns: ['id', 'bool_col'],
      offset: 2,
      limit: 3
    }
  };
  const arrowTable = await load(url, ParquetJSLoader, options);
  const objectRowTable = await load(url, ParquetJSLoader, {
    ...options,
    parquet: {...options.parquet, shape: 'object-row-table'}
  });

  t.equal(arrowTable.shape, 'arrow-table');
  t.equal(objectRowTable.shape, 'object-row-table');
  if (arrowTable.shape === 'arrow-table' && objectRowTable.shape === 'object-row-table') {
    t.equal(arrowTable.data.numRows, 3, 'returns the requested row range');
    t.deepEqual(
      arrowTable.schema?.fields.map(field => field.name),
      ['id', 'bool_col'],
      'returns only projected columns'
    );
    t.deepEqual(
      arrowTable.data.getChild('id')?.toArray(),
      new Int32Array(objectRowTable.data.map(row => row.id)),
      'direct Arrow values match object-row decoding'
    );
  }
  t.end();
});

test('ParquetJSLoader#arrow-table preserves rows for an empty projection', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {
      shape: 'arrow-table',
      columns: ['missing_column'],
      offset: 2,
      limit: 3
    }
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    t.equal(table.data.numRows, 3, 'preserves the selected row count');
    t.equal(table.data.numCols, 0, 'returns no projected columns');
    t.deepEqual(table.data.toArray(), [{}, {}, {}], 'retains empty records for selected rows');
  }
  t.end();
});

test('ParquetJSLoader#arrow-table materializes required INT64 logical values', async (t) => {
  const url = '@loaders.gl/parquet/test/data/fruits.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table', columns: ['date'], limit: 1}
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    t.equal(table.data.numRows, 1);
    t.equal(
      table.data.getChild('date')?.get(0),
      1625040045218n,
      'converts the timestamp value for the Arrow Int64 vector'
    );
  }
  t.end();
});

test('ParquetJSLoader#arrow-table preserves ranged optional DELTA_BYTE_ARRAY Utf8 values', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/delta_byte_array.parquet';
  const columns = ['c_customer_id', 'c_email_address'];
  const parquetOptions = {shape: 'arrow-table' as const, columns, offset: 3, limit: 5, batchSize: 2};
  const arrowTable = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: parquetOptions
  });
  const objectRowTable = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {...parquetOptions, shape: 'object-row-table'}
  });

  t.equal(arrowTable.shape, 'arrow-table');
  t.equal(objectRowTable.shape, 'object-row-table');
  if (arrowTable.shape === 'arrow-table' && objectRowTable.shape === 'object-row-table') {
    t.deepEqual(
      arrowTable.data.batches.map(batch => batch.numRows),
      [2, 2, 1],
      'retains requested Arrow batches'
    );
    for (const columnName of columns) {
      const vector = arrowTable.data.getChild(columnName);
      t.ok(vector, `${columnName} Arrow vector is present`);
      t.deepEqual(
        vector?.toArray(),
        objectRowTable.data.map(row => row[columnName] ?? null),
        `${columnName} values and nulls match object-row decoding`
      );
    }
  }
  t.end();
});

test('ParquetJSLoader#load alltypes_plain file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 8);
    t.deepEqual(table.data, ALL_TYPES_PLAIN_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load alltypes_plain_snappy file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.snappy.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 2);
    t.deepEqual(table.data, ALL_TYPES_PLAIN_SNAPPY_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load binary file as an Arrow table', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table', offset: 2, limit: 4, batchSize: 2}
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    t.equal(table.data.numRows, 4);
    t.deepEqual(
      table.data.getChild('foo')?.toArray(),
      BINARY_EXPECTED()
        .slice(2, 6)
        .map(row => row.foo)
    );
    t.deepEqual(
      table.data.batches.map(batch => batch.numRows),
      [2, 2],
      'retains requested Arrow batches'
    );
  }
  t.end();
});

test('ParquetJSLoader#load binary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 12);
    t.deepEqual(table.data, BINARY_EXPECTED());
  }
  t.end();
});

test('ParquetJSLoader#load dict file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/dict-page-offset-zero.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 39);
    t.deepEqual(table.data, DICT_EXPECTED());
  }
  t.end();
});

test('ParquetJSLoader#load list_columns file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/list_columns.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 3);
    t.deepEqual(table.data, LIST_COLUMNS_EXPECTED);
  }
  t.end();
});

// TODO fix malformed dictionary before adding deep equal test
test('ParquetJSLoader#load nation file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nation.dict-malformed.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.ok(table);
  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 25);
  }
  t.end();
});

test('ParquetJSLoader#load nested_lists file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_lists.snappy.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 3);
    t.deepEqual(table.data, NESTED_LIST_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load nested_lists file as an Arrow table', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_lists.snappy.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    const firstRow = JSON.parse(JSON.stringify(table.data.get(0)?.toJSON())) as {
      a: {list: Array<{element: {list: unknown[]}}>};
    };
    t.equal(table.data.numRows, 3);
    t.ok(JSON.stringify(table.schema).includes('"type":"list"'), 'schema contains Arrow lists');
    t.equal(firstRow.a.list.length, 2, 'outer repeated group is preserved');
    t.equal(firstRow.a.list[0].element.list.length, 2, 'nested repeated group is preserved');
  }
  t.end();
});

test('ParquetJSLoader#load nested_maps file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_maps.snappy.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 6);
    t.deepEqual(table.data, NESTED_MAPS_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load nonnullable file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nonnullable.impala.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 1);
    t.deepEqual(table.data, NO_NULLABLE_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load nullable file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nullable.impala.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 7);
    t.deepEqual(table.data, NULLABLE_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load nulls file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nulls.snappy.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 8);
    t.deepEqual(table.data, NULLS_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#decimal files', async (t) => {
  const urls = [
    '@loaders.gl/parquet/test/data/apache/good/byte_array_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal_legacy.parquet',
    '@loaders.gl/parquet/test/data/apache/good/int32_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/int64_decimal.parquet'
  ];
  for (const url of urls) {
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    t.equal(table.shape, 'object-row-table');
    if (table.shape === 'object-row-table') {
      t.deepEqual(table.data, DECIMAL_EXPECTED);
    }
  }

  t.end();
});

test('ParquetJSLoader#load repeated_no_annotation file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/repeated_no_annotation.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 6);
    t.deepEqual(table.data, REPEATED_NO_ANNOTATION_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load repeated_no_annotation file as an Arrow table', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/repeated_no_annotation.parquet';
  const table = await load(url, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table');
  if (table.shape === 'arrow-table') {
    const lastRow = JSON.parse(JSON.stringify(table.data.get(5)?.toJSON())) as {
      phoneNumbers: {phone: Array<{number: number; kind: string | null}>};
    };
    t.equal(table.data.numRows, 6);
    t.ok(JSON.stringify(table.schema).includes('"type":"list"'), 'schema contains Arrow lists');
    t.equal(lastRow.phoneNumbers.phone.length, 3, 'all repeated structs are retained');
    t.equal(lastRow.phoneNumbers.phone[2].kind, 'mobile', 'repeated struct values are retained');
  }
  t.end();
});

test('ParquetJSLoader#load lz4_raw_compressed file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 4);
    t.deepEqual(table.data, LZ4_RAW_COMPRESSED_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load lz4_raw_compressed_larger file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 10000);
    // Compare only first and last items in data because file is huge.
    t.deepEqual(table.data[0], LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED);
    t.deepEqual(table.data[9999], LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load non_hadoop_lz4_compressed file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/non_hadoop_lz4_compressed.parquet';
  const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 4);
    t.deepEqual(table.data, NON_HADOOP_LZ4_COMPRESSED_EXPECTED);
  }
  t.end();
});

test('ParquetJSLoader#load', async (t) => {
  // t.comment('SUPPORTED FILES');
  for (const {title, path} of SUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
    t.ok(table, `GOOD(${title})`);
  }

  // t.comment('UNSUPPORTED FILES');
  for (const {title, path} of UNSUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`UNSUPPORTED(${title}): ${error.message}`);
    }
  }

  // t.comment('ENCRYPTED FILES');
  for (const {title, path} of ENCRYPTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`ENCRYPTED(${title}): ${error.message}`);
    }
  }

  // t.comment('BAD FILES');
  for (const {title, path} of BAD_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetJSLoader, getParquetLoaderOptions(url));
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`BAD FILE(${title}): ${error.message}`);
    }
  }

  t.end();
});

test('ParquetJSLoader#loads through the explicit TypeScript implementation', async (t) => {
  const url = '@loaders.gl/parquet/test/data/geoparquet/example.parquet';
  const table = await load(url, ParquetJSLoader, {
    parquet: {
      limit: 2
    },
    core: {worker: false}
  });

  t.equal(table.shape, 'object-row-table');
  if (table.shape === 'object-row-table') {
    t.equal(table.data.length, 2);
    t.equal(typeof table.data[0].name, 'string');
  }
  t.end();
});
