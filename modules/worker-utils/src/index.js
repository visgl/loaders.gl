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
export {processOnWorker} from './lib/worker-utils/process-on-worker';
export {createWorker} from './lib/worker-utils/create-worker';
export {getTransferList} from './lib/worker-utils/get-transfer-list';
export {validateWorkerVersion} from './lib/worker-utils/validate-worker-version';
export {default as WorkerFarm} from './lib/worker-utils/worker-farm';
export {default as WorkerPool} from './lib/worker-utils/worker-pool';
export {default as WorkerThread} from './lib/worker-utils/worker-thread';

// LIBRARY UTILS
export {getLibraryUrl, loadLibrary} from './lib/library-utils/library-utils';

// PROCESS UTILS
export {default as ChildProcessProxy} from './lib/process-utils/child-process-proxy';

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
