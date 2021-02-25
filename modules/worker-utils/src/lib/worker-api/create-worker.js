/* eslint-disable no-restricted-globals */
/* global self */
/** @typedef {import('../worker-protocol/protocol').WorkerMessageType} WorkerMessageType  */
/** @typedef {import('../worker-protocol/protocol').WorkerMessagePayload} WorkerMessagePayload */
// /** @typedef {import('../worker-protocol/protocol').WorkerMessageData} WorkerMessageData */
// /** @typedef {import('../worker-protocol/protocol').WorkerMessage} WorkerMessage  */

import AsyncQueue from '../async-queue/async-queue';
import WorkerBody from '../worker-farm/worker-body';

let inputBatches;
let options;

export function createWorker(process, processInBatches) {
  // Check that we are actually in a worker thread
  if (typeof self === 'undefined') {
    return;
  }

  /**
   *
   * @param {WorkerMessageType} type
   * @param {WorkerMessagePayload} payload
   */
  WorkerBody.onmessage = async (type, payload) => {
    try {
      switch (type) {
        case 'process':
          if (!process) {
            throw new Error('Worker does not support atomic processing');
          }
          const result = await process(payload.input, payload.options || {}, payload);
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
