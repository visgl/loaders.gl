// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {expect, test, vi} from 'vitest';

const WORKER_SOURCE = `
  self.onmessage = event => {
    const {type, payload} = event.data;
    if (type === 'process') {
      self.postMessage({
        source: 'loaders.gl',
        type: 'done',
        payload: {result: {execution: 'worker', byteLength: payload.input.byteLength}}
      });
    }
  };
`;

function createTestLoader(
  getWorkerEstimate?: LoaderWithParser['getWorkerEstimate']
): LoaderWithParser {
  return {
    id: 'worker-estimate-test',
    name: 'Worker estimate test',
    module: 'core',
    version: 'latest',
    extensions: ['estimate'],
    mimeTypes: ['application/x-worker-estimate'],
    worker: true,
    options: {},
    parse: async (arrayBuffer: ArrayBuffer) => ({
      execution: 'main',
      byteLength: arrayBuffer.byteLength
    }),
    parseBlob: async blob => ({execution: 'main', byteLength: blob.size}),
    getWorkerEstimate
  } as LoaderWithParser;
}

function createOptions(worker: boolean | 'auto', workerThreshold = 0.1) {
  return {
    core: {worker, workerThreshold, reuseWorkers: false},
    source: WORKER_SOURCE
  };
}

test('parse worker auto mode keeps a small ArrayBuffer on the main thread', async () => {
  const getWorkerEstimate = vi.fn(data => (data instanceof ArrayBuffer ? 0.01 : undefined));
  const loader = createTestLoader(getWorkerEstimate);
  const input = new ArrayBuffer(1);

  const result = await parse(input, loader, createOptions('auto'));

  expect(result).toEqual({execution: 'main', byteLength: 1});
  expect(getWorkerEstimate).toHaveBeenCalledWith(input, expect.any(Object), expect.any(Object));
  const [, normalizedOptions, context] = getWorkerEstimate.mock.calls[0];
  expect(normalizedOptions.core.worker).toBe('auto');
  expect(normalizedOptions.core.workerThreshold).toBe(0.1);
  expect(context.fetch).toBeDefined();
});

test('parse worker auto mode uses a worker for a large ArrayBuffer', async () => {
  const getWorkerEstimate = vi.fn(data => (data instanceof ArrayBuffer ? 1 : undefined));
  const loader = createTestLoader(getWorkerEstimate);

  await expect(parse(new ArrayBuffer(1024), loader, createOptions('auto'))).resolves.toEqual({
    execution: 'worker',
    byteLength: 1024
  });
  expect(getWorkerEstimate).toHaveBeenCalledOnce();
});

test('parse worker auto mode preserves an estimator on a metadata loader after preload', async () => {
  const getWorkerEstimate = vi.fn(() => 0.01);
  const parserLoader = createTestLoader();
  const metadataLoader = {
    ...parserLoader,
    parse: undefined,
    getWorkerEstimate,
    preload: async () => parserLoader
  } as LoaderWithParser;

  await expect(parse(new ArrayBuffer(32), metadataLoader, createOptions('auto'))).resolves.toEqual({
    execution: 'main',
    byteLength: 32
  });
  expect(getWorkerEstimate).toHaveBeenCalledOnce();
});

test.each([
  ['true', true, undefined],
  ['without an estimator', 'auto', undefined],
  ['with an undefined estimate', 'auto', () => undefined],
  ['with an invalid estimate', 'auto', () => Number.NaN],
  [
    'when estimation throws',
    'auto',
    () => {
      throw new Error('estimate failed');
    }
  ]
])('parse falls back to worker %s', async (_label, worker, estimate) => {
  const loader = createTestLoader(estimate as LoaderWithParser['getWorkerEstimate']);
  const result = await parse(
    new ArrayBuffer(32),
    loader,
    createOptions(worker as boolean | 'auto')
  );

  expect(result).toEqual({execution: 'worker', byteLength: 32});
});

test('parse worker false bypasses the estimator and worker', async () => {
  const getWorkerEstimate = vi.fn(() => 1);
  const loader = createTestLoader(getWorkerEstimate);

  await expect(parse(new ArrayBuffer(32), loader, createOptions(false))).resolves.toEqual({
    execution: 'main',
    byteLength: 32
  });
  expect(getWorkerEstimate).not.toHaveBeenCalled();
});

test('parse worker auto mode estimates Blob input before materialization', async () => {
  const getWorkerEstimate = vi.fn(data => (data instanceof Blob ? 0.01 : undefined));
  const loader = createTestLoader(getWorkerEstimate);
  const input = new Blob(['small']);

  await expect(parse(input, loader, createOptions('auto'))).resolves.toEqual({
    execution: 'main',
    byteLength: input.size
  });
  expect(getWorkerEstimate).toHaveBeenCalledWith(input, expect.any(Object), expect.any(Object));
});

test('parse worker auto mode does not consume an unknown stream while estimating', async () => {
  let nextCalls = 0;
  let callsAtEstimate = -1;
  const input = {
    async *[Symbol.asyncIterator]() {
      nextCalls++;
      yield new Uint8Array([1, 2, 3]);
    }
  };
  const getWorkerEstimate = vi.fn(() => {
    callsAtEstimate = nextCalls;
    return undefined;
  });
  const loader = createTestLoader(getWorkerEstimate);

  await expect(parse(input, loader, createOptions('auto'))).resolves.toEqual({
    execution: 'worker',
    byteLength: 3
  });
  expect(callsAtEstimate).toBe(0);
  expect(nextCalls).toBeGreaterThan(0);
});

test('parse worker threshold is validated', async () => {
  const loader = createTestLoader(() => 0.5);

  await expect(parse(new ArrayBuffer(1), loader, createOptions('auto', 1.1))).rejects.toThrow(
    'core.workerThreshold must be a finite number between 0 and 1'
  );
});
