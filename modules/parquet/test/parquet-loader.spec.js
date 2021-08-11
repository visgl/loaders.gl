/* eslint-disable max-statements */
/* eslint-disable complexity */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ParquetLoader, ParquetWorkerLoader} from '@loaders.gl/parquet';
import {isBrowser, load, setLoaderOptions} from '@loaders.gl/core';

import {SUPPORTED_FILES, UNSUPPORTED_FILES, ENCRYPTED_FILES, BAD_FILES} from './data/files';
import {
  ALL_TYPES_DICTIONARY_STUB,
  ALL_TYPES_PLAIN_STUB,
  ALL_TYPES_PLAIN_SNUPPY_STUB,
  BINARY_STUB,
  DICT_STUB,
  LIST_COLUMNS_STUB,
  NESTED_LIST_STUB,
  NESTED_MAPS_STUB,
  NO_NULLABLE_STUB,
  NULLABLE_STUB,
  NULLS_STUB,
  REPEATED_NO_ANNOTATION_STUB
} from './stubs';

const PARQUET_DIR = '@loaders.gl/parquet/test/data/apache';

setLoaderOptions({
  _workerType: 'test'
});

test('ParquetLoader#loader objects', (t) => {
  validateLoader(t, ParquetLoader, 'ParquetLoader');
  validateLoader(t, ParquetWorkerLoader, 'ParquetWorkerLoader');
  t.end();
});


test('ParquetLoader#load', async (t) => {
  t.comment(`SUPPORTED FILES`);

  for (const {title, path} of SUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    const data = await load(url, ParquetLoader, {parquet: {url}, worker: false});

    switch (title) {
      case 'alltypes_dictionary':
        t.equal(data.length, 2);
        t.deepEqual(data, ALL_TYPES_DICTIONARY_STUB, `${title} deep equal ok`);
        break;
      case 'alltypes_plain':
        t.equal(data.length, 8);
        t.deepEqual(data, ALL_TYPES_PLAIN_STUB, `${title} deep equal ok`);
        break;
      case 'alltypes_plain_snappy':
        t.equal(data.length, 2);
        t.deepEqual(data, ALL_TYPES_PLAIN_SNUPPY_STUB, `${title} deep equal ok`);
        break;
      case 'binary':
        t.equal(data.length, 12);
        t.deepEqual(data, BINARY_STUB(), `${title} deep equal ok`);
        break;
      case 'dict':
        t.equal(data.length, 39);
        t.deepEqual(data, DICT_STUB(), `${title} deep equal ok`);
        break;
      case 'list_columns':
        t.equal(data.length, 3);
        t.deepEqual(data, LIST_COLUMNS_STUB, `${title} deep equal ok`);
        break;
      case 'nation':
        t.equal(data.length, 25);
        // TODO fix malformed dictionary before adding deep equal test
        t.ok(data, `GOOD(${title})`);
        break;
      case 'nested_lists':
        t.equal(data.length, 3);
        t.deepEqual(data, NESTED_LIST_STUB, `${title} deep equal ok`);
        break;
      case 'nested_maps':
        t.equal(data.length, 6);
        t.deepEqual(data, NESTED_MAPS_STUB, `${title} deep equal ok`);
        break;
      case 'nonnullable':
        t.equal(data.length, 1);
        t.deepEqual(data, NO_NULLABLE_STUB, `${title} deep equal ok`);
        break;
      case 'nullable':
        t.equal(data.length, 7);
        t.deepEqual(data, NULLABLE_STUB, `${title} deep equal ok`);
        break;
      case 'nulls':
        t.equal(data.length, 8);
        t.deepEqual(data, NULLS_STUB, `${title} deep equal ok`);
        break;
      case 'repeated_no_annotation':
        t.equal(data.length, 6);
        t.deepEqual(data, REPEATED_NO_ANNOTATION_STUB, `${title} deep equal ok`);
        break;
      default:
        t.ok(data, `GOOD(${title})`);
    }
  }

  // Buffer is not defined issue in worker thread of browser.
  if (!isBrowser) {
    t.comment(`SUPPORTED FILES with worker`);
    for (const {title, path} of SUPPORTED_FILES) {
      const url = `${PARQUET_DIR}/${path}`;
      const data = await load(url, ParquetLoader, {parquet: {url}, worker: true});
      t.ok(data, `GOOD(${title})`);
    }
  }

  t.comment(`UNSUPPORTED FILES`);
  for (const { title, path } of UNSUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const data = await load(url, ParquetLoader, {parquet: {url}, worker: false});
      t.ok(data, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`UNSUPPORTED(${title}): ${error.message}`);
    }
  }

  t.comment(`ENCRYPTED FILES`);
  for (const {title, path} of ENCRYPTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const data = await load(url, ParquetLoader, {parquet: {url}, worker: false});
      t.ok(data, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`ENCRYPTED(${title}): ${error.message}`);
    }
  }

  t.comment(`BAD FILES`);
  for (const {title, path} of BAD_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const data = await load(url, ParquetLoader, {parquet: {url}, worker: false});
      t.ok(data, `GOOD(${title})`);
    } catch (error) {
      // @ts-ignore TS2571
      t.pass(`BAD FILE(${title}): ${error.message}`);
    }
  }

  t.end();
});
