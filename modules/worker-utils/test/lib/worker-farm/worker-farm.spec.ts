// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {WorkerFarm} from '@loaders.gl/worker-utils';

test('WorkerFarm#getWorkerPool keys pools by worker source', t => {
  const workerFarm = WorkerFarm.getWorkerFarm({});
  const loadWorker = () => null;

  const moduleWorkerPool = workerFarm.getWorkerPool({
    name: 'test-worker',
    loadWorker,
    urlKey: 'generated-worker-url'
  });
  const sameModuleWorkerPool = workerFarm.getWorkerPool({
    name: 'test-worker',
    loadWorker,
    urlKey: 'generated-worker-url'
  });
  const customUrlWorkerPool = workerFarm.getWorkerPool({
    name: 'test-worker',
    url: 'custom-worker-url'
  });
  const alternateModuleWorkerPool = workerFarm.getWorkerPool({
    name: 'test-worker',
    loadWorker: () => null,
    urlKey: 'generated-worker-url'
  });

  t.equal(moduleWorkerPool, sameModuleWorkerPool, 'reuses pool for same loadWorker identity');
  t.notEqual(moduleWorkerPool, customUrlWorkerPool, 'separates module worker and custom URL pools');
  t.notEqual(
    moduleWorkerPool,
    alternateModuleWorkerPool,
    'separates pools for different loadWorker identities'
  );

  workerFarm.destroy();
  t.end();
});
