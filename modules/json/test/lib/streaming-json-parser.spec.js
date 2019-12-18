/*
import test from 'tape-promise/tape';
import {fetchFile, getStreamIterator} from '@loaders.gl/core';
import {StreamingJSONParser} from '@loaders.gl/json';

const GEOJSON_PATH = `@loaders.gl/json/test/data/geojson-big.json`;

test('StreamingJSONParser#geojson', async t => {
  const parser = new StreamingJSONParser();

  const response = await fetchFile(GEOJSON_PATH, {encoding: 'utf8', highWaterMark: 16384});
  for await (const chunk of getStreamIterator(response.body)) {
    parser.write(chunk);
  }

  t.pass('should be able to parse geojson in chunks from a stream');
  t.end();
});
*/
