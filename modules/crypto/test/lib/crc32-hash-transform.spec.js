import test from 'tape-promise/tape';
import {makeTransformIterator} from '@loaders.gl/loader-utils';
import {fetchFile, parseInBatches, makeIterator} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {CRC32HashTransform} from '@loaders.gl/crypto';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
/** Externally computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
const CSV_CRC32 = 'W5bZ9Q==';

test('CRC32HashTransform#hashSync(CRC32, CSV, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = CRC32HashTransform.hashSync(data);
  t.equal(hash, CSV_CRC32, 'sync hash is correct');

  t.end();
});

test('CRC32HashTransform#iterator(CSV stream, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);

  let hash;

  let iterator = makeIterator(response);
  // @ts-ignore
  iterator = makeTransformIterator(iterator, CRC32HashTransform, {
    onEnd: result => {
      hash = result.hash;
    }
  });

  const csvIterator = await parseInBatches(iterator, CSVLoader);

  let csv;
  for await (const batch of csvIterator) {
    csv = batch;
  }
  t.ok(Array.isArray(csv.data), 'parsing from wrapped iterator works');

  t.equal(hash, CSV_CRC32, 'streaming hash is correct');

  t.end();
});
