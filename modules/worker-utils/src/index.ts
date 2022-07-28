import type {WorkerObject} from './types';
import {VERSION} from './lib/env-utils/version';

// TYPES
export type {
  WorkerObject,
  WorkerOptions,
  // Protocol
  WorkerMessage,
  WorkerMessageType,
  WorkerMessageData,
  WorkerMessagePayload
} from './types';

// GENERAL UTILS
export {assert} from './lib/env-utils/assert';
export {isBrowser, isWorker} from './lib/env-utils/globals';

// WORKER UTILS - TYPES
export {default as WorkerJob} from './lib/worker-farm/worker-job';
export {default as WorkerThread} from './lib/worker-farm/worker-thread';

// WORKER FARMS
export {default as WorkerFarm} from './lib/worker-farm/worker-farm';
export {default as WorkerPool} from './lib/worker-farm/worker-pool';
export {default as WorkerBody} from './lib/worker-farm/worker-body';

export {processOnWorker, canProcessOnWorker} from './lib/worker-api/process-on-worker';
export {createWorker} from './lib/worker-api/create-worker';

// WORKER UTILS - EXPORTS
export {getWorkerURL} from './lib/worker-api/get-worker-url';
export {validateWorkerVersion} from './lib/worker-api/validate-worker-version';
export {getTransferList, getTransferListForWriter} from './lib/worker-utils/get-transfer-list';

// LIBRARY UTILS
export {getLibraryUrl, loadLibrary} from './lib/library-utils/library-utils';

// PARSER UTILS
export {default as AsyncQueue} from './lib/async-queue/async-queue';

// PROCESS UTILS
export {default as ChildProcessProxy} from './lib/process-utils/child-process-proxy';

// WORKER OBJECTS

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
