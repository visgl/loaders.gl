// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {load, parseSync} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/bson';
import corruptScenarios from './data/js-bson/corrupt';

const TAGS_BSON_URL = '@loaders.gl/bson/test/data/js-bson/mongodump.airpair.tags.bson';
const MINI_BSON_URL = '@loaders.gl/bson/test/data/js-bson/test.bson';

test('BSONLoader#load(test.bson)', async (t) => {
  const data = await load(MINI_BSON_URL, BSONLoader);
  t.comment(JSON.stringify(data));
  t.ok(data, 'Data received');
  t.end();
});

// This seems to be a corrupt test file?
test.skip('BSONLoader#load(mongodump.airpair.tags.bson)', async (t) => {
  const data = await load(TAGS_BSON_URL, BSONLoader);
  t.ok(data, 'data received');
  t.end();
});

test('BSON Compliance - corrupt scenarios', async (t) => {
  for (let i = 0; i < corruptScenarios.documents.length; i++) {
    const doc = corruptScenarios.documents[i];
    if (!doc.skip) {
      // Create a buffer containing the payload
      const buffer = Buffer.from(doc.encoded, 'hex');
      // Attempt to deserialize
      t.throws(() => parseSync(buffer, BSONLoader), `Throws ${doc.error}`);
    }
  }

  t.end();
});
