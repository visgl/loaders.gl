import type {
  WorkerMessageType,
  WorkerMessagePayload,
  WorkerContext,
  Process,
  ProcessInBatches
} from '../../types';
import AsyncQueue from '../async-queue/async-queue';
import WorkerBody from '../worker-farm/worker-body';
// import {validateWorkerVersion} from './validate-worker-version';

/** Counter for jobs */
let requestId = 0;
let inputBatches;
let options;

export type ProcessOnMainThread = (data: any, options?: {[key: string]: any}, context?) => any;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 */
export function createWorker(process: Process, processInBatches?: ProcessInBatches): void {
  // Check that we are actually in a worker thread
  if (typeof self === 'undefined') {
    return;
  }

  const context: WorkerContext = {
    process: processOnMainThread
  };

  // eslint-disable-next-line complexity
  WorkerBody.onmessage = async (type: WorkerMessageType, payload: WorkerMessagePayload) => {
    try {
      switch (type) {
        case 'process':
          if (!process) {
            throw new Error('Worker does not support atomic processing');
          }
          const result = await process(payload.input, payload.options || {}, context);
          WorkerBody.postMessage('done', {result});
          break;

        case 'process-in-batches':
          if (!processInBatches) {
            throw new Error('Worker does not support batched processing');
          }
          inputBatches = new AsyncQueue();
          options = payload.options || {};
          const resultIterator = processInBatches(inputBatches, options, context?.processInBatches);
          for await (const batch of resultIterator) {
            WorkerBody.postMessage('output-batch', {result: batch});
          }
          WorkerBody.postMessage('done', {});
          break;

        case 'input-batch':
          inputBatches.push(payload.input);
          break;

        case 'input-done':
          inputBatches.close();
          break;

        default:
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      WorkerBody.postMessage('error', {error: message});
    }
  };
}

function processOnMainThread(arrayBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;

    /**
     */
    const onMessage = (type, payload) => {
      if (payload.id !== id) {
        // not ours
        return;
      }

      switch (type) {
        case 'done':
          WorkerBody.removeEventListener(onMessage);
          resolve(payload.result);
          break;

        case 'error':
          WorkerBody.removeEventListener(onMessage);
          reject(payload.error);
          break;

        default:
        // ignore
      }
    };

    WorkerBody.addEventListener(onMessage);

    // Ask the main thread to decode data
    const payload = {id, input: arrayBuffer, options};
    WorkerBody.postMessage('process', payload);
  });
}
