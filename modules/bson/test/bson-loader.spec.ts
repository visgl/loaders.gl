// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/bson';
// import corruptScenarios from './data/js-bson/corrupt';

const TAGS_BSON_URL = '@loaders.gl/bson/test/data/js-bson/mongodump.airpair.tags.bson';
const MINI_BSON_URL = '@loaders.gl/bson/test/data/js-bson/test.bson';

test('BSONLoader#load(test.bson)', async t => {
  const data = await load(MINI_BSON_URL, BSONLoader);
  // t.comment(JSON.stringify(data));
  t.ok(data, 'Data received');
  t.end();
});

test('BSONLoader#load(mongodump.airpair.tags.bson)', async t => {
  await t.rejects(
    load(TAGS_BSON_URL, BSONLoader),
    /detected a concatenated BSON dump with 50 documents/
  );
  t.end();
});

test('BSONLoader#load(mongodump.airpair.tags.bson, concatenatedDocuments=first)', async t => {
  const data = await load(TAGS_BSON_URL, BSONLoader, {bson: {concatenatedDocuments: 'first'}});
  t.equal(data._id.toString(), '514825fa2a26ea0200000006');
  t.ok(String(data.desc).includes('Android'), 'loads first document contents');
  t.end();
});

// TODO - skip because of Node.js Bbuffer dependency
// test('BSON Compliance - corrupt scenarios', async (t) => {
//   for (let i = 0; i < corruptScenarios.documents.length; i++) {
//     const doc = corruptScenarios.documents[i];
//     if (!doc.skip) {
//       // Create a buffer containing the payload
//       const buffer = Buffer.from(doc.encoded, 'hex');
//       // Attempt to deserialize
//       t.throws(() => parseSync(buffer, BSONLoader), `Throws ${doc.error}`);
//     }
//   }

//   t.end();
// });
