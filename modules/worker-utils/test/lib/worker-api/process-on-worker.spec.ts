// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {processOnWorker, preloadWorker, NullWorker, isBrowser} from '@loaders.gl/worker-utils';

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
