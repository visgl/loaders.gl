// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {NPYLoader, NPYWorkerLoader} from '@loaders.gl/textures';
import {setLoaderOptions, load} from '@loaders.gl/core';
const NPY_UINT8_URL = '@loaders.gl/textures/test/data/uint8.npy';
setLoaderOptions({
  _workerType: 'test'
});
test('NPYLoader#loader objects', async () => {
  validateLoader(NPYLoader, 'NPYLoader');
  validateLoader(NPYWorkerLoader, 'NPYWorkerLoader');
});
test('NPYLoader#parse', async () => {
  const {data, header} = await load(NPY_UINT8_URL, NPYLoader);
  const expectedData = new Uint8Array([1, 2, 3, 4]);
  // eslint-disable-next-line camelcase
  const expectedHeader = {descr: '|u1', fortran_order: false, shape: [4]};
  expect(data, 'data matches').toEqual(expectedData);
  expect(header, 'header matches').toEqual(expectedHeader);
});
test('NPYWorkerLoader#parse', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const {data, header} = await load(NPY_UINT8_URL, NPYWorkerLoader);
  const expectedData = new Uint8Array([1, 2, 3, 4]);
  // eslint-disable-next-line camelcase
  const expectedHeader = {descr: '|u1', fortran_order: false, shape: [4]};
  expect(data, 'data matches').toEqual(expectedData);
  expect(header, 'header matches').toEqual(expectedHeader);
});
