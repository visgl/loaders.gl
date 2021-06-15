import type {WorkerMessageType, WorkerMessagePayload} from '../worker-protocol/protocol';
import AsyncQueue from '../async-queue/async-queue';
import WorkerBody from '../worker-farm/worker-body';

let inputBatches;
let options;

export type ProcessFunction = (data: any, options: {[key: string]: any}) => Promise<any>;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 */
export function createWorker(process: ProcessFunction, processInBatches?: Function): void {
  // Check that we are actually in a worker thread
  if (typeof self === 'undefined') {
    return;
  }

  WorkerBody.onmessage = async (type: WorkerMessageType, payload: WorkerMessagePayload) => {
    try {
      switch (type) {
        case 'process':
          if (!process) {
            throw new Error('Worker does not support atomic processing');
          }
          const result = await process(payload.input, payload.options || {});
          WorkerBody.postMessage('done', {result});
          break;

        case 'process-in-batches':
          if (!processInBatches) {
            throw new Error('Worker does not support batched processing');
          }
          inputBatches = new AsyncQueue();
          options = payload.options || {};
          const resultIterator = processInBatches(inputBatches, options);
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
      WorkerBody.postMessage('error', {error: error.message});
    }
  };
}
