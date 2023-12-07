// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  WorkerObject,
  WorkerOptions,
  WorkerContext,
  WorkerMessageType,
  WorkerMessagePayload
} from '../../types';
import type WorkerJob from '../worker-farm/worker-job';
import WorkerFarm from '../worker-farm/worker-farm';
import {getWorkerURL, getWorkerName} from './get-worker-url';
import {getTransferListForWriter} from '../worker-utils/get-transfer-list';

/** Options for worker processing */
export type ProcessOnWorkerOptions = WorkerOptions & {
  jobName?: string;
  [key: string]: any;
};

/**
 * Determines if we can parse with worker
 * @param loader
 * @param data
 * @param options
 */
export function canProcessOnWorker(worker: WorkerObject, options?: WorkerOptions) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }

  return worker.worker && options?.worker;
}

/**
 * This function expects that the worker thread sends certain messages,
 * Creating such a worker can be automated if the worker is wrapper by a call to
 * createWorker in @loaders.gl/worker-utils.
 */
export async function processOnWorker(
  worker: WorkerObject,
  data: any,
  options: ProcessOnWorkerOptions = {},
  context: WorkerContext = {}
): Promise<any> {
  const name = getWorkerName(worker);

  const workerFarm = WorkerFarm.getWorkerFarm(options);
  const {source} = options;
  const workerPoolProps: {name: string; source?: string; url?: string} = {name, source};
  if (!source) {
    workerPoolProps.url = getWorkerURL(worker, options);
  }
  const workerPool = workerFarm.getWorkerPool(workerPoolProps);

  const jobName = options.jobName || worker.name;
  const job = await workerPool.startJob(
    jobName,
    // eslint-disable-next-line
    onMessage.bind(null, context)
  );

  // Kick off the processing in the worker
  const transferableOptions = getTransferListForWriter(options);
  job.postMessage('process', {input: data, options: transferableOptions});

  const result = await job.result;
  return result.result;
}

/**
 * Job completes when we receive the result
 * @param job
 * @param message
 */
async function onMessage(
  context: WorkerContext,
  job: WorkerJob,
  type: WorkerMessageType,
  payload: WorkerMessagePayload
) {
  switch (type) {
    case 'done':
      // Worker is done
      job.done(payload);
      break;

    case 'error':
      // Worker encountered an error
      job.error(new Error(payload.error));
      break;

    case 'process':
      // Worker is asking for us (main thread) to process something
      const {id, input, options} = payload;
      try {
        if (!context.process) {
          job.postMessage('error', {id, error: 'Worker not set up to process on main thread'});
          return;
        }
        const result = await context.process(input, options);
        job.postMessage('done', {id, result});
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        job.postMessage('error', {id, error: message});
      }
      break;

    default:
      // eslint-disable-next-line
      console.warn(`process-on-worker: unknown message ${type}`);
  }
}
