import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {NPYLoader, NPYWorkerLoader} from '@loaders.gl/textures';
import {setLoaderOptions, load} from '@loaders.gl/core';

const NPY_UINT8_URL = '@loaders.gl/textures/test/data/uint8.npy';

setLoaderOptions({
  _workerType: 'test'
});

test('NPYLoader#loader objects', async t => {
  validateLoader(t, NPYLoader, 'NPYLoader');
  validateLoader(t, NPYWorkerLoader, 'NPYWorkerLoader');
  t.end();
});

test('NPYLoader#parse', async t => {
  const options = {};
  const {data, header} = await load(NPY_UINT8_URL, NPYLoader, options);

  const expectedData = new Uint8Array([1, 2, 3, 4]);
  // eslint-disable-next-line camelcase
  const expectedHeader = {descr: '|u1', fortran_order: false, shape: [4]};

  t.deepEqual(data, expectedData, 'data matches');
  t.deepEqual(header, expectedHeader, 'header matches');
  t.end();
});

test('NPYWorkerLoader#parse', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const options = {};
  const {data, header} = await load(NPY_UINT8_URL, NPYWorkerLoader, options);

  const expectedData = new Uint8Array([1, 2, 3, 4]);
  // eslint-disable-next-line camelcase
  const expectedHeader = {descr: '|u1', fortran_order: false, shape: [4]};

  t.deepEqual(data, expectedData, 'data matches');
  t.deepEqual(header, expectedHeader, 'header matches');
  t.end();
});
