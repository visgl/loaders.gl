import test from 'tape-promise/tape';
import {fetchFile, makeIterator} from '@loaders.gl/core';
import StreamingJSONParser from '@loaders.gl/json/lib/parser/streaming-json-parser';

const GEOJSON_PATH = `@loaders.gl/json/test/data/geojson-big.json`;

test('StreamingJSONParser#geojson', async t => {
  const parser = new StreamingJSONParser();

  // Can return text stream by setting `{encoding: 'utf8'}`, but only works on Node
  const response = await fetchFile(GEOJSON_PATH, {highWaterMark: 16384});
  // TODO - https requests under Node return a Promise
  for await (const chunk of makeIterator(response)) {
    const string = new TextDecoder().decode(chunk);
    parser.write(string);
  }

  t.pass('should be able to parse geojson in chunks from a stream');
  t.end();
});
