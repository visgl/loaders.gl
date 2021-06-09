// TYPES
export type WorkerObject = import('./types').WorkerObject;
export type WorkerMessage = import('./lib/worker-protocol/protocol').WorkerMessage;
export type WorkerMessageData = import('./lib/worker-protocol/protocol').WorkerMessageData;
export type WorkerMessagePayload = import('./lib/worker-protocol/protocol').WorkerMessagePayload;

// GENERAL UTILS
export {assert} from './lib/env-utils/assert';
export {isBrowser, isWorker} from './lib/env-utils/globals';

// WORKER UTILS - TYPES
export {default as WorkerJob} from './lib/worker-farm/worker-job';
export {default as WorkerThread} from './lib/worker-farm/worker-thread';

// WORKER UTILS - EXPORTS
export {processOnWorker} from './lib/worker-api/process-on-worker';
export {createWorker} from './lib/worker-api/create-worker';
export {getWorkerObjectURL, validateWorkerVersion} from './lib/worker-api/worker-object-utils';

export {default as WorkerFarm} from './lib/worker-farm/worker-farm';
export {default as WorkerPool} from './lib/worker-farm/worker-pool';
export {default as WorkerBody} from './lib/worker-farm/worker-body';

// LIBRARY UTILS
export {getLibraryUrl, loadLibrary} from './lib/library-utils/library-utils';

// PARSER UTILS
export {default as AsyncQueue} from './lib/async-queue/async-queue';

// PROCESS UTILS
export {default as ChildProcessProxy} from './lib/process-utils/child-process-proxy';

// WORKER OBJECTS

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** A null worker to test that worker processing is functional */
export const NullWorker: WorkerObject = {
  id: 'null',
  name: 'null',
  module: 'worker-utils',
  version: VERSION,
  options: {
    null: {}
  }
};
