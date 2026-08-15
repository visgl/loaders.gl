// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  WorkerObject,
  WorkerOptions,
  WorkerContext,
  WorkerJobContext,
  WorkerMessageType,
  WorkerMessagePayload
} from '../../types';
import type WorkerJob from '../worker-farm/worker-job';
import WorkerFarm from '../worker-farm/worker-farm';
import {getWorkerURL, getWorkerName} from './get-worker-url';
import {getTransferListForWriter} from '../worker-utils/get-transfer-list';

/** Options for worker processing */
export type ProcessOnWorkerOptions = WorkerOptions & {
  /** Cancels the job by terminating its worker. */
  signal?: AbortSignal;
  /** Diagnostic name shown for the worker job. */
  jobName?: string;
  [key: string]: any;
};

/** Options for preloading workers. */
export type PreloadWorkerOptions = {
  /** Number of workers to warm in the worker pool. */
  count?: number;
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

  const workerOptions = options?.[worker.id];
  return Boolean((worker.worker || workerOptions?.workerUrl) && options?.worker);
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
  context: WorkerContext = {},
  jobContext: WorkerJobContext = {}
): Promise<any> {
  throwIfAborted(options.signal);
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

  const abortJob = (): void => job.abort();
  options.signal?.addEventListener('abort', abortJob, {once: true});
  if (options.signal?.aborted) {
    abortJob();
  }

  try {
    // AbortSignal cannot be structured-cloned. It controls the job on this thread only.
    const {signal: _signal, ...workerOptions} = options;
    const transferableOptions = getTransferListForWriter(workerOptions);
    const transferableContext = getTransferListForWriter(jobContext);
    if (job.isRunning) {
      job.postMessage('process', {
        input: data,
        options: transferableOptions,
        context: transferableContext
      });
    }

    const result = await job.result;
    return result.result;
  } finally {
    options.signal?.removeEventListener('abort', abortJob);
  }
}

/** Throws a cross-runtime abort error when a signal is already aborted. */
function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return;
  }
  const error = new Error('Worker job was aborted');
  error.name = 'AbortError';
  throw error;
}

/**
 * Warm-start one or more workers in the same pool used by processOnWorker.
 * @param worker Worker object to preload.
 * @param options Worker options used to resolve the worker pool.
 * @param preloadOptions Preload options.
 */
export async function preloadWorker(
  worker: WorkerObject,
  options: ProcessOnWorkerOptions = {},
  preloadOptions: PreloadWorkerOptions = {}
): Promise<void> {
  const name = getWorkerName(worker);
  const workerFarm = WorkerFarm.getWorkerFarm(options);
  const {source} = options;
  const workerPoolProps: {name: string; source?: string; url?: string} = {name, source};
  if (!source) {
    workerPoolProps.url = getWorkerURL(worker, options);
  }
  const workerPool = workerFarm.getWorkerPool(workerPoolProps);
  const count = preloadOptions.count ?? options.maxConcurrency ?? options.core?.maxConcurrency ?? 1;

  const preloadJobs = Array.from({length: count}, async () => {
    const job = await workerPool.startJob(`${worker.name} preload`, onPreloadMessage);
    job.postMessage('preload', {});
    return await job.result;
  });

  await Promise.all(preloadJobs);
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
        const result = await context.process(input, options, undefined, payload.context || {});
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

/**
 * Completes a preload job when the worker acknowledges the preload message.
 * @param job Worker job.
 * @param type Worker message type.
 * @param payload Worker message payload.
 */
function onPreloadMessage(job: WorkerJob, type: WorkerMessageType, payload: WorkerMessagePayload) {
  switch (type) {
    case 'done':
      job.done(payload);
      break;

    case 'error':
      job.error(new Error(payload.error));
      break;

    default:
      // eslint-disable-next-line
      console.warn(`process-on-worker: unknown preload message ${type}`);
  }
}
