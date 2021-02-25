/** @typedef {import('./types').WorkerObject} WorkerObject */

// GENERAL UTILS
export {default as assert} from './lib/env-utils/assert';
export {
  isBrowser,
  isWorker,
  nodeVersion,
  self,
  window,
  global,
  document
} from './lib/env-utils/globals';

// WORKER UTILS
export {processOnWorker} from './lib/worker-api/process-on-worker';
export {createWorker} from './lib/worker-api/create-worker';
export {getWorkerObjectURL, validateWorkerVersion} from './lib/worker-api/worker-object-utils';

export {default as WorkerFarm} from './lib/worker-farm/worker-farm';
export {default as WorkerPool} from './lib/worker-farm/worker-pool';
export {default as WorkerBody} from './lib/worker-farm/worker-body';

// LIBRARY UTILS
export {getLibraryUrl, loadLibrary} from './lib/library-utils/library-utils';

// PROCESS UTILS
export {default as ChildProcessProxy} from './lib/process-utils/child-process-proxy';

// PARSER UTILS
export {default as AsyncQueue} from './lib/async-queue/async-queue';

// WORKER OBJECTS

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const NullWorker = {
  id: 'null',
  name: 'null',
  module: 'worker-utils',
  version: VERSION,
  options: {
    null: {}
  }
};
