// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import type {WorkerObject} from '../../../src/types';
import {processOnWorker, preloadWorker, NullWorker, isBrowser} from '@loaders.gl/worker-utils';

const loadWorkerSource = `
  self.onmessage = function(event) {
    if (event.data.type === 'process') {
      self.postMessage({
        source: 'loaders.gl',
        type: 'done',
        payload: {result: event.data.payload.input}
      });
    }
  };
`;

test('processOnWorker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test'
  });

  t.equal(nullData, 'abc', 'NullWorker verified');
  t.end();
});

test('processOnWorker#loadWorker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  let loadWorkerCalls = 0;
  const LoadWorkerNullWorker: WorkerObject = {
    ...NullWorker,
    id: 'load-worker-null',
    name: 'load worker null',
    worker: true,
    loadWorker: () => {
      loadWorkerCalls++;
      const workerSourceUrl = URL.createObjectURL(
        new Blob([loadWorkerSource], {type: 'application/javascript'})
      );
      return new Worker(workerSourceUrl);
    },
    options: {'load-worker-null': {}}
  };

  const nullData = await processOnWorker(LoadWorkerNullWorker, 'abc', {
    reuseWorkers: false
  });

  t.equal(loadWorkerCalls, 1, 'loadWorker creates the worker');
  t.equal(nullData, 'abc', 'loadWorker worker processed data');
  t.end();
});

test('processOnWorker#worker URL options precede loadWorker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  let loadWorkerCalls = 0;
  const LoadWorkerNullWorker: WorkerObject = {
    ...NullWorker,
    loadWorker: () => {
      loadWorkerCalls++;
      return null;
    }
  };

  for (const testCase of [
    {
      name: 'explicit workerUrl',
      options: {null: {workerUrl: 'modules/worker-utils/dist/null-worker.js'}, reuseWorkers: false}
    },
    {
      name: '_workerType test',
      options: {_workerType: 'test', reuseWorkers: false}
    }
  ]) {
    loadWorkerCalls = 0;
    const nullData = await processOnWorker(LoadWorkerNullWorker, 'abc', testCase.options);

    t.equal(loadWorkerCalls, 0, `${testCase.name} skips loadWorker`);
    t.equal(nullData, 'abc', `${testCase.name} processed data`);
  }
  t.end();
});

test('preloadWorker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  let startedWorkers = 0;
  await preloadWorker(
    NullWorker,
    {
      _workerType: 'test',
      maxConcurrency: 3,
      reuseWorkers: true,
      onDebug: () => {
        startedWorkers++;
      }
    },
    {count: 3}
  );

  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test',
    maxConcurrency: 3,
    reuseWorkers: true
  });

  t.ok(startedWorkers >= 3, 'preloaded three worker jobs');
  t.equal(nullData, 'abc', 'preloaded worker pool can process later jobs');
  t.end();
});

test('preloadWorker handles count above maxConcurrency', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  await Promise.race([
    preloadWorker(
      NullWorker,
      {
        _workerType: 'test',
        maxConcurrency: 2,
        reuseWorkers: true
      },
      {count: 5}
    ),
    new Promise((_, reject) => setTimeout(() => reject(new Error('preloadWorker timed out')), 2000))
  ]);

  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test',
    maxConcurrency: 2,
    reuseWorkers: true
  });

  t.equal(nullData, 'abc', 'preloaded constrained worker pool can process later jobs');
  t.end();
});
