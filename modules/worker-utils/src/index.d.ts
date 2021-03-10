import {WorkerObject} from './types';

// TYPES
export {WorkerObject} from './types';
export {WorkerMessage, WorkerMessageData, WorkerMessagePayload} from './lib/worker-protocol/protocol';

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

/** A null worker to test that worker processing is functional */
export const NullWorker: WorkerObject;
