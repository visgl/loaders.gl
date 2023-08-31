import test from 'tape-promise/tape';
import {compareArrayBuffers, getBinaryData} from '../test-utils/test-utils';
import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {fetchFile, loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {CryptoHash} from '@loaders.gl/crypto';
import * as CryptoJS from 'crypto-js';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
/** Externally computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
const CSV_MD5 = 'zmLuuVSkigYR9r5FcsKkCw==';

test('CryptoHash#hash(CSV, against external hash)', async (t) => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = await new CryptoHash({modules: {CryptoJS}, crypto: {algorithm: 'MD5'}}).hash(data);
  t.equal(hash, CSV_MD5, 'repeated data MD5 hash is correct');

  t.end();
});

test('CryptoHash#iterator(CSV stream, against external hash)', async (t) => {
  let hash;

  const cryptoHash = new CryptoHash({
    modules: {CryptoJS},
    crypto: {
      algorithm: 'MD5',
      onEnd: (result) => {
        hash = result.hash;
      }
    }
  });

  const csvIterator = await loadInBatches(CSV_URL, CSVLoader, {
    transforms: [cryptoHash.hashBatches]
  });

  let csv;
  for await (const batch of csvIterator) {
    csv = batch;
  }
  t.ok(Array.isArray(csv?.data), 'parsing from wrapped iterator works');

  t.equal(hash, CSV_MD5, 'streaming MD5 hash is correct');

  t.end();
});

test('CryptoHash#hash(MD5 = default)', async (t) => {
  const {binaryData, repeatedData} = getBinaryData();

  const cryptoHash = new CryptoHash({
    modules: {CryptoJS},
    crypto: {algorithm: 'MD5'}
  });

  let hash = await cryptoHash.hash(binaryData);

  t.equal(hash, 'YnxTb+lyen1CsNkpmLv+qA==', 'binary data MD5 hash is correct');

  hash = await cryptoHash.hash(repeatedData);
  t.equal(
    hash,
    // '2d4uZUoLXXO/XWJGnrVl5Q==',
    'uZ5c9e72WDu/VNYYdsg/gg==',
    'repeated data MD5 hash is correct'
  );

  t.end();
});

test('CryptoHash#hashBatches(small chunks)', async (t) => {
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
      onEnd: (result) => {
        hash = result.hash;
      }
    }
  });

  // @ts-ignore
  const hashIterator = crypto.hashBatches(inputChunks);

  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = await concatenateArrayBuffersAsync(hashIterator);

  t.equal(hash, 'hZbBr1WxS3syARKUT8uFNg==', 'CryptoHash generated correct hash');
  t.ok(compareArrayBuffers(inputData, transformedData), 'CryptoHash passed through data');

  t.end();
});

test('CryptoHash#batches(100K)', async (t) => {
  const {binaryData} = getBinaryData();

  const inputChunks = [binaryData];

  let hash;

  const cryptoHash = new CryptoHash({
    modules: {CryptoJS},
    crypto: {
      algorithm: 'MD5',
      onEnd: (result) => {
        hash = result.hash;
      }
    }
  });

  // @ts-ignore
  const hashIterator = cryptoHash.hashBatches(inputChunks);
  const inputData = concatenateArrayBuffers(...inputChunks);
  const transformedData = await concatenateArrayBuffersAsync(hashIterator);

  t.equal(hash, 'YnxTb+lyen1CsNkpmLv+qA==', 'CryptoHash generated correct hash');
  t.ok(compareArrayBuffers(inputData, transformedData), 'CryptoHash passed through data');

  t.end();
});
