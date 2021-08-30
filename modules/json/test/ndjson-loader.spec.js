import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {NDJSONLoader} from '@loaders.gl/json';

const NDJSON_PATH = `@loaders.gl/json/test/data/ndjson.ndjson`;

test('JSONLoader#load(ndjson.ndjson)', async (t) => {
  const data = await load(NDJSON_PATH, NDJSONLoader);
  t.equal(data.length, 11, 'Correct number of rows received');
  t.end();
});
