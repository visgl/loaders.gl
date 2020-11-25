import test from 'tape-promise/tape';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {setLoaderOptions, load, loadInBatches} from '@loaders.gl/core';

const FLATGEOBUF_COUNTRIES_DATA_URL = '@loaders.gl/flatgeobuf/test/data/countries.fgb';

setLoaderOptions({
  fgb: {
    workerUrl: 'modules/flatgeobuf/dist/flatgeobuf-loader.worker.js'
  }
});

test('FlatGeobufLoader#load', async t => {
  const features = await load(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {worker: false});
  t.equal(features.length, 179);
  t.end();
});

test('FlatGeobufLoader#loadInBatches', async t => {
  const iterator = await loadInBatches(FLATGEOBUF_COUNTRIES_DATA_URL, FlatGeobufLoader, {
    worker: false
  });
  t.ok(iterator);

  const features = [];
  for await (const feature of iterator) {
    features.push(feature);
  }

  t.ok(features.length, 179);
  t.end();
});

