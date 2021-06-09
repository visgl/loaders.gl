import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {MD5HashTransform} from '@loaders.gl/crypto';

const CSV_URL = '@loaders.gl/csv/test/data/sample-very-long.csv';
/** Externally computed hash: `openssl md5 -binary sample-very-long.json | openssl base64` */
const CSV_MD5 = 'zmLuuVSkigYR9r5FcsKkCw==';

test('MD5HashTransform#run(CSV, against external hash)', async (t) => {
  const response = await fetchFile(CSV_URL);
  const data = await response.arrayBuffer();

  const hash = await MD5HashTransform.run(data);
  t.equal(hash, CSV_MD5, 'repeated data MD5 hash is correct');

  t.end();
});
