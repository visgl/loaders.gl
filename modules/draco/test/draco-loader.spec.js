/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validatePointCloudCategoryData} from 'test/common/conformance';

import {DracoLoader, DracoWorkerLoader} from '@loaders.gl/draco';
import {setLoaderOptions, load} from '@loaders.gl/core';

const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';

setLoaderOptions({
  draco: {
    workerUrl: 'modules/draco/dist/draco-loader.worker.js'
  }
});

test('DracoLoader#loader conformance', t => {
  validateLoader(t, DracoLoader, 'DracoLoader');
  validateLoader(t, DracoWorkerLoader, 'DracoWorkerLoader');
  t.end();
});

test('DracoLoader#parse(mainthread)', async t => {
  const data = await load(BUNNY_DRC_URL, DracoLoader, {worker: false});
  validatePointCloudCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test.skip('DracoWorkerLoader#parse', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(BUNNY_DRC_URL, DracoWorkerLoader);
  validatePointCloudCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});
