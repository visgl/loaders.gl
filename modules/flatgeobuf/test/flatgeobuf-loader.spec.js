import test from 'tape-promise/tape';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {setLoaderOptions, fetchFile, parse, parseInBatches} from '@loaders.gl/core';

const FLATGEOBUF_COUNTRIES_DATA_URL = '@loaders.gl/flatgeobuf/test/data/countries.fgb';

setLoaderOptions({
  fgb: {
    workerUrl: 'modules/flatgeobuf/dist/flatgeobuf-loader.worker.js'
  }
});

test('Load FlatGeobuf file', async t => {
  const response = await fetchFile(FLATGEOBUF_COUNTRIES_DATA_URL);
  const fgbBuffer = await response.arrayBuffer();
  const features = await parse(fgbBuffer, FlatGeobufLoader);
  t.equal(features.length, 179);
  t.end();
});

test('Load FlatGeobuf file streaming', async t => {
  const response = await fetchFile(FLATGEOBUF_COUNTRIES_DATA_URL);
  const iterator = await parseInBatches(response, FlatGeobufLoader);
  t.ok(iterator);
  const features = [];
  for await (const feature of iterator) {
    features.push(feature);
  }
  t.ok(features.length, 179);
  t.end();
});
