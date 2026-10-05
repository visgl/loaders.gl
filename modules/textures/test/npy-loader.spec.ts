// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
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

test('NPY loading forwards cancellation to transport', async () => {
  const controller = new AbortController();
  let transportAborted = false;
  let markTransportStarted!: () => void;
  const transportStarted = new Promise<void>(resolve => {
    markTransportStarted = resolve;
  });
  const transport = vi.spyOn(globalThis, 'fetch').mockImplementation(
    async (_url, options) =>
      new Promise((_resolve, reject) => {
        markTransportStarted();
        const signal = options?.signal;
        const abort = () => {
          transportAborted = true;
          reject(signal?.reason);
        };
        if (signal?.aborted) abort();
        else signal?.addEventListener('abort', abort, {once: true});
      })
  );
  try {
    const pending = load('local-fixture.npy', NPYLoader, {
      core: {worker: false, fetch: {signal: controller.signal}}
    });
    await transportStarted;
    controller.abort(new DOMException('Obsolete NPY read', 'AbortError'));
    await expect(pending).rejects.toMatchObject({name: 'AbortError'});
    expect(transportAborted).toBe(true);
  } finally {
    transport.mockRestore();
  }
});
