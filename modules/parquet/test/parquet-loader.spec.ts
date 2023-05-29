/* eslint-disable max-statements */
/* eslint-disable complexity */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ParquetLoader, ParquetWorkerLoader} from '@loaders.gl/parquet';
import {isBrowser, load, setLoaderOptions} from '@loaders.gl/core';

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

test('ParquetLoader#loader objects', (t) => {
  validateLoader(t, ParquetLoader, 'ParquetLoader');
  validateLoader(t, ParquetWorkerLoader, 'ParquetWorkerLoader');
  t.end();
});

test('ParquetLoader#load alltypes_dictionary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 2);
  t.deepEqual(table.data, ALL_TYPES_DICTIONARY_EXPECTED);
  t.end();
});

test('ParquetLoader#load alltypes_plain file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 8);
  t.deepEqual(table.data, ALL_TYPES_PLAIN_EXPECTED);
  t.end();
});

test('ParquetLoader#load alltypes_plain_snappy file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/alltypes_plain.snappy.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 2);
  t.deepEqual(table.data, ALL_TYPES_PLAIN_SNAPPY_EXPECTED);
  t.end();
});

test('ParquetLoader#load binary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 12);
  t.deepEqual(table.data, BINARY_EXPECTED());
  t.end();
});

test('ParquetLoader#load binary file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/binary.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 12);
  t.deepEqual(table.data, BINARY_EXPECTED());
  t.end();
});

test('ParquetLoader#load dict file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/dict-page-offset-zero.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 39);
  t.deepEqual(table.data, DICT_EXPECTED());
  t.end();
});

test('ParquetLoader#load list_columns file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/list_columns.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 3);
  t.deepEqual(table.data, LIST_COLUMNS_EXPECTED);
  t.end();
});

// TODO fix malformed dictionary before adding deep equal test
test('ParquetLoader#load nation file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nation.dict-malformed.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.ok(table);
  t.equal(table.data.length, 25);
  t.end();
});

test('ParquetLoader#load nested_lists file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_lists.snappy.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 3);
  t.deepEqual(table.data, NESTED_LIST_EXPECTED);
  t.end();
});

test('ParquetLoader#load nested_maps file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nested_maps.snappy.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 6);
  t.deepEqual(table.data, NESTED_MAPS_EXPECTED);
  t.end();
});

test('ParquetLoader#load nonnullable file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nonnullable.impala.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 1);
  t.deepEqual(table.data, NO_NULLABLE_EXPECTED);
  t.end();
});

test('ParquetLoader#load nullable file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nullable.impala.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 7);
  t.deepEqual(table.data, NULLABLE_EXPECTED);
  t.end();
});

test('ParquetLoader#load nulls file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/nulls.snappy.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 8);
  t.deepEqual(table.data, NULLS_EXPECTED);
  t.end();
});

test('ParquetLoader#decimal files', async (t) => {
  const urls = [
    '@loaders.gl/parquet/test/data/apache/good/byte_array_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/fixed_length_decimal_legacy.parquet',
    '@loaders.gl/parquet/test/data/apache/good/int32_decimal.parquet',
    '@loaders.gl/parquet/test/data/apache/good/int64_decimal.parquet'
  ];
  for (const url of urls) {
    const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});
    t.deepEqual(table.data, DECIMAL_EXPECTED);
  }
  
  t.end();
});

test('ParquetLoader#load repeated_no_annotation file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/repeated_no_annotation.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 6);
  t.deepEqual(table.data, REPEATED_NO_ANNOTATION_EXPECTED);
  t.end();
});

test('ParquetLoader#load lz4_raw_compressed file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});
  

  t.equal(table.data.length, 4);
  t.deepEqual(table.data, LZ4_RAW_COMPRESSED_EXPECTED);
  t.end();
});

test('ParquetLoader#load lz4_raw_compressed_larger file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/lz4_raw_compressed_larger.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 10000);
  // Compare only first and last items in data because file is huge.
  t.deepEqual(table.data[0], LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED);
  t.deepEqual(table.data[9999], LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED);
  t.end();
});

test('ParquetLoader#load non_hadoop_lz4_compressed file', async (t) => {
  const url = '@loaders.gl/parquet/test/data/apache/good/non_hadoop_lz4_compressed.parquet';
  const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});

  t.equal(table.data.length, 4);
  t.deepEqual(table.data, NON_HADOOP_LZ4_COMPRESSED_EXPECTED);
  t.end();
});

test('ParquetLoader#load', async (t) => {

  // Buffer is not defined issue in worker thread of browser.
  if (!isBrowser) {
    t.comment('SUPPORTED FILES with worker');
    for (const {title, path} of SUPPORTED_FILES) {
      const url = `${PARQUET_DIR}/${path}`;
      const table = await load(url, ParquetLoader, {parquet: {url}, worker: true});
      t.ok(table, `GOOD(${title})`);
    }
  }

  t.comment('UNSUPPORTED FILES');
  for (const {title, path} of UNSUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});
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
      const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});
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
      const table = await load(url, ParquetLoader, {parquet: {url}, worker: false});
      t.ok(table, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`BAD FILE(${title}): ${error.message}`);
    }
  }

  t.end();
});
