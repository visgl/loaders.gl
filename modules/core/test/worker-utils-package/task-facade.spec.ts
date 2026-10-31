// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as tasks from '@math.gl/core/tasks';
import {
  WorkerFarm,
  createWorker,
  processOnWorker,
  processOnWorkerInBatches,
  NullWorker,
  getWorkerURL
} from '../../src/worker-utils';

test('worker facade shares the math.gl runtime and retains loaders.gl assets', () => {
  expect(WorkerFarm).toBe(tasks.WorkerFarm);
  expect(createWorker).toBe(tasks.createWorker);
  expect(processOnWorker).toBe(tasks.processOnWorker);
  expect(processOnWorkerInBatches).toBe(tasks.processOnWorkerInBatches);
  expect(NullWorker.module).toBe('core');
  expect(getWorkerURL({...NullWorker, version: '5.0.0-alpha.9'})).toBe(
    'https://unpkg.com/@loaders.gl/core@5.0.0-alpha.9/dist/worker-utils/null-worker.js'
  );
});
