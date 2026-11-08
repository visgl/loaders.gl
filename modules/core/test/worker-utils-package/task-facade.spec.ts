// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as workers from '../../src/worker-utils';

test('loader workers expose loader adapters without forwarding upstream task APIs', () => {
  expect(workers).not.toHaveProperty('TaskRunner');
  expect(workers).not.toHaveProperty('initializeTaskWorker');
  expect(workers).not.toHaveProperty('preloadTasks');
  expect(workers.createWorker).toBeTypeOf('function');
  expect(workers).not.toHaveProperty('WorkerFarm');
  expect(workers).not.toHaveProperty('WorkerBody');
  expect(workers.NullWorker.module).toBe('core');
  expect(workers.getWorkerURL({...workers.NullWorker, version: '5.0.0-alpha.9'})).toBe(
    'https://unpkg.com/@loaders.gl/core@5.0.0-alpha.9/dist/worker-utils/null-worker.js'
  );
});
