// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {BATCH_WORKER_SOURCE, createBatchTestLoader} from './batch-worker-fixture';

const workerUrls: string[] = [];
afterEach(() => {
  WorkerFarm.getWorkerFarm().destroy();
  workerUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
});

/** Creates a local worker URL and registers it for cleanup. */
function createWorkerUrl(): string {
  const url = URL.createObjectURL(
    new Blob([BATCH_WORKER_SOURCE], {type: 'application/javascript'})
  );
  workerUrls.push(url);
  return url;
}

test('a non-CSV loader streams batches on one worker with backpressure and loader identity', async () => {
  const workerUrl = createWorkerUrl();
  const loadWorker = vi.fn(() => new Worker(workerUrl));
  const {loader, parseInBatches: mainParser} = createBatchTestLoader(loadWorker);
  let inputPullCount = 0;
  const input = (async function* createInput() {
    for (const text of ['first', 'second', 'third']) {
      inputPullCount++;
      yield new TextEncoder().encode(text);
    }
  })();
  const batches = await parseInBatches(input, loader, {
    core: {worker: true, maxConcurrency: 2, _workerType: 'module'}
  });
  const iterator = batches[Symbol.asyncIterator]();
  const first = await iterator.next();
  expect(first.value).toEqual({input: 'first', batchIndex: 0, worker: true, loaderId: loader.id});
  expect(inputPullCount).toBe(1);
  const remaining = [];
  while (true) {
    const next = await iterator.next();
    if (next.done) break;
    remaining.push(next.value);
  }
  expect(remaining.map(batch => batch.batchIndex)).toEqual([1, 2]);
  expect(remaining.map(batch => batch.input)).toEqual(['second', 'third']);
  expect(loadWorker).toHaveBeenCalledOnce();
  expect(mainParser).not.toHaveBeenCalled();
});

test('loaders without batch capability retain main-thread parsing', async () => {
  const loadWorker = vi.fn(() => new Worker(createWorkerUrl()));
  const {loader, parseInBatches: mainParser} = createBatchTestLoader(loadWorker);
  const batches = await parseInBatches(
    [new TextEncoder().encode('fallback')],
    {...loader, workerInBatches: false},
    {core: {worker: true, workerInBatches: true}}
  );
  const results = [];
  for await (const batch of batches) results.push(batch);
  expect(results[0].worker).toBe(false);
  expect(mainParser).toHaveBeenCalledOnce();
  expect(loadWorker).not.toHaveBeenCalled();
});

test.each([false, true])('custom workers require explicit batch support: %s', async supported => {
  const loadWorker = vi.fn(() => new Worker(createWorkerUrl()));
  const {loader, parseInBatches: mainParser} = createBatchTestLoader(loadWorker);
  const batches = await parseInBatches([new TextEncoder().encode('custom')], loader, {
    core: {worker: true, ...(supported ? {workerInBatches: true} : {})},
    [loader.id]: {workerUrl: createWorkerUrl()}
  });
  const results = [];
  for await (const batch of batches) results.push(batch);
  expect(results[0].worker).toBe(supported);
  expect(loadWorker).not.toHaveBeenCalled();
  expect(mainParser).toHaveBeenCalledTimes(supported ? 0 : 1);
});

test('loader option serialization runs before dispatch without mutating caller options', async () => {
  const source = BATCH_WORKER_SOURCE.replace(
    'loaderId = payload.options._workerLoaderId;',
    'loaderId = payload.options.contract.value;'
  );
  const workerUrl = URL.createObjectURL(new Blob([source], {type: 'application/javascript'}));
  workerUrls.push(workerUrl);
  const loadWorker = vi.fn(() => new Worker(workerUrl));
  const {loader} = createBatchTestLoader(loadWorker);
  const serializeWorkerOptions = vi.fn(options => ({...options, contract: {value: 'portable'}}));
  const options = {core: {worker: true, _workerType: 'module'}, contract: {value: 'original'}};
  const batches = await parseInBatches(
    [new TextEncoder().encode('input')],
    {...loader, serializeWorkerOptions},
    options
  );
  const results = [];
  for await (const batch of batches) results.push(batch);
  expect(results[0].loaderId).toBe('portable');
  expect(serializeWorkerOptions).toHaveBeenCalledOnce();
  expect(options.contract.value).toBe('original');
});

test('option serialization failures reject before creating a worker or transferring input', async () => {
  const loadWorker = vi.fn(() => new Worker(createWorkerUrl()));
  const {loader} = createBatchTestLoader(loadWorker);
  const input = new TextEncoder().encode('retained');
  const reason = new Error('invalid worker options');
  const batches = await parseInBatches(
    [input],
    {
      ...loader,
      serializeWorkerOptions() {
        throw reason;
      }
    },
    {core: {worker: true}}
  );
  await expect(batches[Symbol.asyncIterator]().next()).rejects.toBe(reason);
  expect(loadWorker).not.toHaveBeenCalled();
  expect(new TextDecoder().decode(input)).toBe('retained');
});
