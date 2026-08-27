import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/bson';
// import corruptScenarios from './data/js-bson/corrupt';
const TAGS_BSON_URL = '@loaders.gl/bson/test/data/js-bson/mongodump.airpair.tags.bson';
const MINI_BSON_URL = '@loaders.gl/bson/test/data/js-bson/test.bson';
test('BSONLoader#load(test.bson)', async () => {
  const data = await load(MINI_BSON_URL, BSONLoader);
  // t.comment(JSON.stringify(data));
  expect(data, 'Data received').toBeTruthy();
});
test('BSONLoader#load(mongodump.airpair.tags.bson)', async () => {
  await expect(load(TAGS_BSON_URL, BSONLoader)).rejects.toThrow(
    /detected a concatenated BSON dump with 50 documents/
  );
});
test('BSONLoader#load(mongodump.airpair.tags.bson, concatenatedDocuments=first)', async () => {
  const data = await load(TAGS_BSON_URL, BSONLoader, {bson: {concatenatedDocuments: 'first'}});
  expect(data._id.toString()).toBe('514825fa2a26ea0200000006');
  expect(String(data.desc).includes('Android'), 'loads first document contents').toBeTruthy();
});
