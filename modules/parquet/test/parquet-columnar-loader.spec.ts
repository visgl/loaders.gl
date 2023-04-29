/* eslint-disable max-statements */
/* eslint-disable complexity */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ParquetColumnarLoader} from '@loaders.gl/parquet';
import {getTableLength} from '@loaders.gl/schema';
import {isBrowser, load, setLoaderOptions} from '@loaders.gl/core';

import {SUPPORTED_FILES, UNSUPPORTED_FILES, ENCRYPTED_FILES, BAD_FILES} from './data/files';
import {
// ALL_TYPES_DICTIONARY_EXPECTED,
// ALL_TYPES_PLAIN_EXPECTED,
// ALL_TYPES_PLAIN_SNAPPY_EXPECTED,
// BINARY_EXPECTED,
// DECIMAL_EXPECTED,
// DICT_EXPECTED,
// LIST_COLUMNS_EXPECTED,
// NESTED_LIST_EXPECTED,
// NESTED_MAPS_EXPECTED,
// NO_NULLABLE_EXPECTED,
// NULLABLE_EXPECTED,
// NULLS_EXPECTED,
// REPEATED_NO_ANNOTATION_EXPECTED,
// LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED,
// LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED,
// LZ4_RAW_COMPRESSED_EXPECTED,
// NON_HADOOP_LZ4_COMPRESSED_EXPECTED
} from './expected';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';

setLoaderOptions({_workerType: 'test'});

test('ParquetColumnarLoader#loader objects', (t) => {
  validateLoader(t, ParquetColumnarLoader, 'ParquetColumnarLoader');
  t.end();
});

test('ParquetColumnarLoader#load alltypes_plain file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  debugger
  t.equal(getTableLength(table), 8);
  // t.deepEqual(data, ALL_TYPES_PLAIN_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load alltypes_dictionary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 2, 'length is correct');
  // console.error(JSON.stringify(data, (key, token) => token instanceof Map ? Object.fromEntries(token) : token, 2));
  // t.deepEqual(data, ALL_TYPES_DICTIONARY_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load alltypes_plain_snappy file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.snappy.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 2);
  // t.deepEqual(data, ALL_TYPES_PLAIN_SNAPPY_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load binary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 12);
  // t.deepEqual(data, BINARY_EXPECTED());
  t.end();
});

test('ParquetColumnarLoader#load binary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 12);
  // t.deepEqual(data, BINARY_EXPECTED());
  t.end();
});

test('ParquetColumnarLoader#load dict file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/dict-page-offset-zero.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 39);
  // t.deepEqual(data, DICT_EXPECTED());
  t.end();
});

test.only('ParquetColumnarLoader#load list_columns file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/list_columns.parquet';
  debugger
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});
  t.equal(getTableLength(table), 3);
  // t.deepEqual(data, LIST_COLUMNS_EXPECTED);
  t.end();
});

// TODO fix malformed dictionary before adding deep equal test
test('ParquetColumnarLoader#load nation file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nation.dict-malformed.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.ok(table);
  t.equal(getTableLength(table), 25);
  t.end();
});

test('ParquetColumnarLoader#load nested_lists file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_lists.snappy.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 3);
  // t.deepEqual(data, NESTED_LIST_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load nested_maps file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_maps.snappy.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 6);
  // t.deepEqual(data, NESTED_MAPS_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load nonnullable file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nonnullable.impala.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 1);
  // t.deepEqual(data, NO_NULLABLE_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load nullable file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nullable.impala.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 7);
  // t.deepEqual(data, NULLABLE_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load nulls file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nulls.snappy.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 8);
  // t.deepEqual(data, NULLS_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#decimal files', async (t) => {
  const urls = [
    '@loaders.gl/parquet/test/data/apache/good/byte_array_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal_legacy.parquet',
    '@loaders.gl/parquet/test/data/apache/good/int32_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/int64_decimal.parquet'
  ];
  for (const url of urls) {
    const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});
    t.ok(typeof getTableLength(table) === 'number');
    // t.deepEqual(data, DECIMAL_EXPECTED);
  }
  
  t.end();
});

test('ParquetColumnarLoader#load repeated_no_annotation file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/repeated_no_annotation.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 6);
  // t.deepEqual(data, REPEATED_NO_ANNOTATION_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load lz4_raw_compressed file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});
  

  t.equal(getTableLength(table), 4);
  // t.deepEqual(data, LZ4_RAW_COMPRESSED_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load lz4_raw_compressed_larger file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 10000);
  // Compare only first and last items in data because file is huge.
  // t.deepEqual(data[0], LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED);
  // t.deepEqual(data[9999], LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load non_hadoop_lz4_compressed file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/non_hadoop_lz4_compressed.parquet';
  const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});

  t.equal(getTableLength(table), 4);
  // t.deepEqual(data, NON_HADOOP_LZ4_COMPRESSED_EXPECTED);
  t.end();
});

test('ParquetColumnarLoader#load', async (t) => {

  // Buffer is not defined issue in worker thread of browser.
  if (!isBrowser) {
    t.comment('SUPPORTED FILES with worker');
    for (const {title, path} of SUPPORTED_FILES) {
      const url = `${PARQUET_DIR}/${path}`;
      const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: true});
      t.ok(table, `GOOD(${title})`);
    }
  }

  t.comment('UNSUPPORTED FILES');
  for (const {title, path} of UNSUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`UNSUPPORTED(${title}): ${error.message}`);
    }
  }

  t.comment('ENCRYPTED FILES');
  for (const {title, path} of ENCRYPTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`ENCRYPTED(${title}): ${error.message}`);
    }
  }

  t.comment('BAD FILES');
  for (const {title, path} of BAD_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetColumnarLoader, {parquet: {url}, worker: false});
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`BAD FILE(${title}): ${error.message}`);
    }
  }

  t.end();
});
