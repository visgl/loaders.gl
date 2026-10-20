// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  WorkerMessageType,
  WorkerMessagePayload,
  WorkerContext,
  WorkerJobContext,
  Process,
  ProcessInBatches
} from '../../types';
import AsyncQueue from '../async-queue/async-queue';
import WorkerBody from '../worker-farm/worker-body';
// import {validateWorkerVersion} from './validate-worker-version';

/** Counter for jobs */
let requestId = 0;
let activeInputBatches: AsyncQueue<any> | null = null;
let activeOutputAcknowledgements: AsyncQueue<void> | null = null;

export type ProcessOnMainThread = (
  data: any,
  options?: {[key: string]: any},
  jobContext?: WorkerJobContext
) => any;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 */
export async function createWorker(
  process: Process,
  processInBatches?: ProcessInBatches
): Promise<void> {
  if (!(await WorkerBody.inWorkerThread())) {
    return;
  }

  const context: WorkerContext = {
    process: processOnMainThread
  };

  // eslint-disable-next-line complexity
  WorkerBody.onmessage = async (type: WorkerMessageType, payload: WorkerMessagePayload) => {
    try {
      switch (type) {
        case 'preload':
          WorkerBody.postMessage('done', {});
          break;

        case 'process':
          if (!process) {
            throw new Error('Worker does not support atomic processing');
          }
          const result = await process(
            payload.input,
            payload.options || {},
            context,
            payload.context || {}
          );
          WorkerBody.postMessage('done', {result});
          break;

        case 'process-in-batches':
          if (!processInBatches) {
            throw new Error('Worker does not support batched processing');
          }
          const inputBatches = new AsyncQueue<any>();
          const outputAcknowledgements = new AsyncQueue<void>();
          activeInputBatches = inputBatches;
          activeOutputAcknowledgements = outputAcknowledgements;
          try {
            const resultIterator = processInBatches(
              createDemandDrivenIterator(inputBatches),
              payload.options || {},
              context,
              payload.context || {}
            );
            for await (const batch of resultIterator) {
              await WorkerBody.postMessage('output-batch', {result: batch});
              await outputAcknowledgements.next();
            }
            await WorkerBody.postMessage('done', {});
          } finally {
            activeInputBatches = null;
            activeOutputAcknowledgements = null;
          }
          break;

        case 'input-batch':
          if (!activeInputBatches) {
            throw new Error('Worker has no active batched processing session');
          }
          activeInputBatches.push(payload.input);
          break;

        case 'input-done':
          if (!activeInputBatches) {
            throw new Error('Worker has no active batched processing session');
          }
          activeInputBatches.close();
          break;

        case 'output-ack':
          if (!activeOutputAcknowledgements) {
            throw new Error('Worker has no active batched processing session');
          }
          activeOutputAcknowledgements.push(undefined);
          break;

        default:
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      WorkerBody.postMessage('error', {error: message});
    }
  };
}

/** Requests exactly one input batch whenever the worker-side processor advances its iterator. */
async function* createDemandDrivenIterator(inputBatches: AsyncQueue<any>): AsyncIterable<any> {
  while (true) {
    await WorkerBody.postMessage('input-request', {});
    const nextBatch = await inputBatches.next();
    if (nextBatch.done) {
      return;
    }
    yield nextBatch.value;
  }
}

function processOnMainThread(arrayBuffer: ArrayBuffer, options = {}, jobContext = {}) {
  return new Promise((resolve, reject) => {
    const id = requestId++;

    /**
     */
    const onMessage = (type: string, payload: WorkerMessagePayload) => {
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
    const payload = {id, input: arrayBuffer, options, context: jobContext};
    WorkerBody.postMessage('process', payload);
  });
}
