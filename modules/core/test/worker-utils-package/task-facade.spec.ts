// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as tasks from '@math.gl/tasks';
import * as workers from '../../src/worker-utils';

test('loader tasks expose the public math.gl lifecycle without transport internals', () => {
  expect(workers.TaskRunner).toBe(tasks.TaskRunner);
  expect(workers.initializeTaskWorker).toBeTypeOf('function');
  expect(workers.preloadTasks).toBe(tasks.preloadTasks);
  expect(workers).not.toHaveProperty('WorkerFarm');
  expect(workers).not.toHaveProperty('WorkerBody');
  expect(workers.NullWorker.module).toBe('core');
  expect(workers.getWorkerURL({...workers.NullWorker, version: '5.0.0-alpha.9'})).toBe(
    'https://unpkg.com/@loaders.gl/core@5.0.0-alpha.9/dist/worker-utils/null-worker.js'
  );
});
