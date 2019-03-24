/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {loadFile} from '@loaders.gl/core';
import {DracoLoader, DracoWorkerLoader} from '@loaders.gl/draco';
import {validateLoadedData} from 'test/common/conformance';

const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';

test('DracoLoader#parse and encode', async t => {
  const data = await loadFile(BUNNY_DRC_URL, DracoLoader);
  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});

test('DracoWorkerLoader#parse', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await loadFile(BUNNY_DRC_URL, DracoWorkerLoader);
  validateLoadedData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});
