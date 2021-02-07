import test from 'tape-promise/tape';
import {fetchFile, loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';
import {CRC32HashTransform} from '@loaders.gl/crypto';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
/** Externally computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
const CSV_CRC32 = 'W5bZ9Q==';

test('CRC32HashTransform#run(CRC32, CSV, against external hash)', async t => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = await CRC32HashTransform.run(data);
  t.equal(hash, CSV_CRC32, 'sync hash is correct');

  t.end();
});

test('CRC32HashTransform#iterator(CSV stream, against external hash)', async t => {
  let hash;

  const csvIterator = await loadInBatches(CSV_URL, CSVLoader, {
    transforms: [CRC32HashTransform],
    crypto: {
      onEnd: result => {
        hash = result.hash;
      }
    }
  });

  let csv;
  for await (const batch of csvIterator) {
    csv = batch;
  }
  t.ok(Array.isArray(csv.data), 'parsing from wrapped iterator works');

  t.equal(hash, CSV_CRC32, 'streaming hash is correct');

  t.end();
});
