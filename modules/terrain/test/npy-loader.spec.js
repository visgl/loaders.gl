import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {_NPYLoader, _NPYWorkerLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load} from '@loaders.gl/core';

const NPY_UINT8_URL = '@loaders.gl/terrain/test/data/uint8.npy';

setLoaderOptions({
  npy: {
    workerUrl: 'modules/terrain/dist/npy-loader.worker.js'
  }
});

test('NPYLoader#loader objects', async t => {
  validateLoader(t, _NPYLoader, 'NPYLoader');
  validateLoader(t, _NPYWorkerLoader, 'NPYWorkerLoader');
  t.end();
});

test('NPYLoader#parse', async t => {
  const options = {};
  const {data, header} = await load(NPY_UINT8_URL, _NPYLoader, options);

  const expectedData = new Uint8Array([1, 2, 3, 4]);
  // eslint-disable-next-line camelcase
  const expectedHeader = {descr: '|u1', fortran_order: false, shape: [400]};

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
  const {data, header} = await load(NPY_UINT8_URL, _NPYWorkerLoader, options);

  const expectedData = new Uint8Array([1, 2, 3, 4]);
  // eslint-disable-next-line camelcase
  const expectedHeader = {descr: '|u1', fortran_order: false, shape: [400]};

  t.deepEqual(data, expectedData, 'data matches');
  t.deepEqual(header, expectedHeader, 'header matches');
  t.end();
});
