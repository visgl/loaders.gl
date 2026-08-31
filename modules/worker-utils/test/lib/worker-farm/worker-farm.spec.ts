// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {WorkerFarm} from '@loaders.gl/worker-utils';

test('WorkerFarm keys pools by worker source', () => {
  const workerFarm = WorkerFarm.getWorkerFarm({});
  const loadWorker = () => null;
  const moduleWorkerPool = workerFarm.getWorkerPool({
    name: 'pool-key-worker',
    loadWorker,
    urlKey: 'generated-worker-url'
  });
  const sameModuleWorkerPool = workerFarm.getWorkerPool({
    name: 'pool-key-worker',
    loadWorker,
    urlKey: 'generated-worker-url'
  });
  const customUrlWorkerPool = workerFarm.getWorkerPool({
    name: 'pool-key-worker',
    url: 'custom-worker-url'
  });
  const alternateModuleWorkerPool = workerFarm.getWorkerPool({
    name: 'pool-key-worker',
    loadWorker: () => null,
    urlKey: 'generated-worker-url'
  });

  expect(sameModuleWorkerPool).toBe(moduleWorkerPool);
  expect(customUrlWorkerPool).not.toBe(moduleWorkerPool);
  expect(alternateModuleWorkerPool).not.toBe(moduleWorkerPool);
  workerFarm.destroy();
});
