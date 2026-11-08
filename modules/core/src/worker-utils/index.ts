// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WorkerObject} from './types';
import {VERSION} from './lib/env-utils/version';

// TYPES
export type {
  LoadWorker,
  WorkerObject,
  WorkerOptions,
  WorkerProgress,
  WorkerContext,
  WorkerJobContext,
  Process,
  ProcessInBatches
} from './types';

// GENERAL UTILS
export {assert} from './lib/env-utils/assert';
export {isBrowser, isWorker} from './lib/env-utils/globals';

// PROCESS ON WORKER
export type {ProcessOnWorkerOptions} from './lib/worker-api/process-on-worker';
export type {PreloadWorkerOptions} from './lib/worker-api/process-on-worker';
export {
  processOnWorker,
  processOnWorkerInBatches,
  preloadWorker,
  destroyWorkerTasks,
  canProcessOnWorker,
  canProcessOnWorkerInBatches
} from './lib/worker-api/process-on-worker';
export {createWorker} from './lib/worker-api/create-worker';

// WORKER UTILS - EXPORTS
export {getWorkerURL} from './lib/worker-api/get-worker-url';
export {validateWorkerVersion} from './lib/worker-api/validate-worker-version';
export {getTransferList, getTransferListForWriter} from './lib/worker-utils/get-transfer-list';

// LIBRARY UTILS
export {
  extractLoadLibraryOptions,
  getLibraryUrl,
  loadLibrary,
  type LoadLibraryOptions
} from './lib/library-utils/library-utils';

// PROCESS UTILS
export {default as ChildProcessProxy} from './lib/process-utils/child-process-proxy';

// WORKER OBJECTS

/** A null worker to test that worker processing is functional */
export const NullWorker: WorkerObject = {
  id: 'null',
  name: 'null',
  module: 'core',
  workerFile: 'worker-utils/null-worker.js',
  workerNode: 'worker-utils/null-worker-node.js',
  version: VERSION,
  options: {
    null: {}
  }
};
