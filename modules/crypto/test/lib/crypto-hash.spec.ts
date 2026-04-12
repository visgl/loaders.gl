// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** eslint-disable @typescript-eslint/unbound-method */

import {expect, test} from 'vitest';
import {compareArrayBuffers, getBinaryData} from '../test-utils/test-utils';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {fetchFile, loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {CryptoHash} from '@loaders.gl/crypto';
import CryptoJS from 'crypto-js';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
/** Externally computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
const CSV_MD5 = 'zmLuuVSkigYR9r5FcsKkCw==';

test('CryptoHash#hash(CSV, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = await new CryptoHash({modules: {CryptoJS}, crypto: {algorithm: 'MD5'}}).hash(
    data,
    'base64'
  );
  expect(hash, 'repeated data MD5 hash is correct').toBe(CSV_MD5);
});

test('CryptoHash#iterator(CSV stream, against external hash)', async t => {
  let hash;

  const cryptoHash = new CryptoHash({
    modules: {CryptoJS},
    crypto: {
      algorithm: 'MD5',
      onEnd: result => {
        hash = result.hash;
      }
    }
  });

  const csvIterator = await loadInBatches(CSV_URL, CSVLoader, {
    transforms: [cryptoHash.hashBatches.bind(cryptoHash)]
  });

  let csv;
  for await (const batch of csvIterator) {
    csv = batch;
  }
  expect(Array.isArray(csv?.data), 'parsing from wrapped iterator works').toBeTruthy();

  expect(hash, 'streaming MD5 hash is correct').toBe(CSV_MD5);
});

test('CryptoHash#hash(MD5 = default)', async () => {
  const {binaryData, repeatedData} = getBinaryData();

  const cryptoHash = new CryptoHash({
    modules: {CryptoJS},
    crypto: {algorithm: 'MD5'}
  });

  let hash = await cryptoHash.hash(binaryData, 'base64');

  expect(hash, 'binary data MD5 hash is correct').toBe('YnxTb+lyen1CsNkpmLv+qA==');

  hash = await cryptoHash.hash(repeatedData, 'base64');
  expect(hash, 'repeated data MD5 hash is correct').toBe('2d4uZUoLXXO/XWJGnrVl5Q==');
});

test('CryptoHash#hashBatches(small chunks)', async () => {
  const inputChunks = [
    new Uint8Array([1, 2, 3]).buffer,
    new Uint8Array([4, 5, 6]).buffer,
    new Uint8Array([7, 8, 9]).buffer
  ];

  let hash;

  const crypto = new CryptoHash({
    modules: {CryptoJS},
    crypto: {
      algorithm: 'MD5',
      onEnd: result => {
        hash = result.hash;
      }
    }
  });

  // @ts-ignore
  const hashIterator = crypto.hashBatches(inputChunks);

  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = await concatenateArrayBuffersAsync(hashIterator);

  expect(hash, 'CryptoHash generated correct hash').toBe('hZbBr1WxS3syARKUT8uFNg==');
  expect(compareArrayBuffers(inputData, transformedData), 'CryptoHash passed through data').toBeTruthy();
});

test('CryptoHash#batches(100K)', async () => {
  const {binaryData} = getBinaryData();

  const inputChunks = [binaryData];

  let hash;

  const cryptoHash = new CryptoHash({
    modules: {CryptoJS},
    crypto: {
      algorithm: 'MD5',
      onEnd: result => {
        hash = result.hash;
      }
    }
  });

  // @ts-ignore
  const hashIterator = cryptoHash.hashBatches(inputChunks);
  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = await concatenateArrayBuffersAsync(hashIterator);

  expect(hash, 'CryptoHash generated correct hash').toBe('YnxTb+lyen1CsNkpmLv+qA==');
  expect(compareArrayBuffers(inputData, transformedData), 'CryptoHash passed through data').toBeTruthy();
});
