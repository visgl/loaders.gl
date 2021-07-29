import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {ParquetLoader, ParquetWorkerLoader} from '@loaders.gl/parquet';
import {isBrowser, load, setLoaderOptions} from '@loaders.gl/core';

import {SUPPORTED_FILES, UNSUPPORTED_FILES, BAD_FILES} from './data/files';

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
    t.ok(data, `GOOD - ${title}`);
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
  for (const {title, path} of UNSUPPORTED_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const data = await load(url, ParquetLoader, {parquet: {url}, worker: false});
      t.ok(data, `GOOD - ${title}`);
    } catch (error) {
      // @ts-ignore TS2571
      t.comment(`UNSUPPORTED ${error.message} - ${title}`);
    }
  }

  t.comment(`BAD FILES`);
  for (const {title, path} of BAD_FILES) {
    const url = `${PARQUET_DIR}/${path}`;
    try {
      const data = await load(url, ParquetLoader, {parquet: {url}, worker: false});
      t.ok(data, `GOOD - ${title}`);
    } catch (error) {
      // @ts-ignore TS2571
      t.comment(`BAD FILE ${error.message} - ${title} `);
    }
  }
  t.end();
});
