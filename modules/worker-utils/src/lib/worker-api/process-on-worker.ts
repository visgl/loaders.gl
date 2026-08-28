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
import AsyncQueue from '../async-queue/async-queue';
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

  const abortJob = (): void => job.abort(getAbortReason(options.signal));
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

/**
 * Processes an input iterator on one leased worker and streams output batches back.
 *
 * The worker remains assigned to this job for the complete iterator lifetime, allowing
 * `processInBatches` implementations to retain parser or encoder state between input batches.
 * Input is demand-driven: the main thread advances the source only when that worker requests the
 * next batch.
 */
export function processOnWorkerInBatches<InputBatch = any, OutputBatch = any>(
  worker: WorkerObject,
  input: AsyncIterable<InputBatch> | Iterable<InputBatch>,
  options: ProcessOnWorkerOptions = {},
  context: WorkerContext = {},
  jobContext: WorkerJobContext = {}
): AsyncIterable<OutputBatch> {
  return processOnWorkerInBatchesIterator(worker, input, options, context, jobContext);
}

/** Implements stateful worker batch processing as an async generator. */
async function* processOnWorkerInBatchesIterator<InputBatch, OutputBatch>(
  worker: WorkerObject,
  input: AsyncIterable<InputBatch> | Iterable<InputBatch>,
  options: ProcessOnWorkerOptions,
  context: WorkerContext,
  jobContext: WorkerJobContext
): AsyncIterable<OutputBatch> {
  throwIfAborted(options.signal);
  const name = getWorkerName(worker);
  const workerFarm = WorkerFarm.getWorkerFarm(options);
  const {source} = options;
  const workerPoolProps: {name: string; source?: string; url?: string} = {name, source};
  if (!source) {
    workerPoolProps.url = getWorkerURL(worker, options);
  }
  const workerPool = workerFarm.getWorkerPool(workerPoolProps);
  const outputBatches = new AsyncQueue<OutputBatch>();
  const inputIterator = getAsyncIterator(input);
  let outputFinished = false;
  let inputFinished = false;
  let inputRequest = Promise.resolve();
  const batchJobFailed = new Error('Worker batch job failed');

  const finishOutput = (): void => {
    if (!outputFinished) {
      outputFinished = true;
      outputBatches.close();
    }
  };
  const failOutput = (_error: unknown): void => {
    if (!outputFinished) {
      outputFinished = true;
      outputBatches.enqueue(batchJobFailed);
      outputBatches.close();
    }
  };

  const job = await workerPool.startJob(
    options.jobName || worker.name,
    (activeJob, type, payload) => {
      switch (type) {
        case 'input-request':
          inputRequest = inputRequest
            .then(async () => {
              const nextBatch = await inputIterator.next();
              if (!activeJob.isRunning) {
                return;
              }
              if (nextBatch.done) {
                inputFinished = true;
                activeJob.postMessage('input-done', {});
              } else {
                activeJob.postMessage('input-batch', {input: nextBatch.value});
              }
            })
            .catch(error => activeJob.abort(error));
          break;

        case 'output-batch':
          outputBatches.push(payload.result as OutputBatch);
          break;

        case 'done':
          activeJob.done(payload);
          finishOutput();
          break;

        case 'error': {
          const error = new Error(payload.error || 'Worker batch processing failed');
          activeJob.error(error);
          failOutput(error);
          break;
        }

        case 'process':
          void onMessage(context, activeJob, type, payload);
          break;

        default: {
          const error = new Error(`Unexpected worker batch message: ${type}`);
          activeJob.error(error);
          failOutput(error);
          break;
        }
      }
    }
  );

  const abortJob = (): void => job.abort(getAbortReason(options.signal));
  options.signal?.addEventListener('abort', abortJob, {once: true});
  if (options.signal?.aborted) {
    abortJob();
  }
  void job.result.catch(failOutput);

  try {
    const {signal: _signal, ...workerOptions} = options;
    if (job.isRunning) {
      job.postMessage('process-in-batches', {
        options: getTransferListForWriter(workerOptions),
        context: getTransferListForWriter(jobContext)
      });
    }

    try {
      for await (const outputBatch of outputBatches) {
        yield outputBatch;
        if (job.isRunning) {
          job.postMessage('output-ack', {});
        }
      }
    } catch (error) {
      if (error === batchJobFailed) {
        await job.result;
      }
      throw error;
    }
    await job.result;
  } finally {
    options.signal?.removeEventListener('abort', abortJob);
    if (job.isRunning) {
      job.abort(createAbortError('Worker batch iterator was closed'));
    }
    if (!inputFinished) {
      closeInputIterator(inputIterator);
    }
  }
}

/** Throws a cross-runtime abort error when a signal is already aborted. */
function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return;
  }
  throw getAbortReason(signal);
}

/** Returns a caller-provided abort reason or a cross-runtime `AbortError`. */
function getAbortReason(signal?: AbortSignal): unknown {
  return signal?.reason ?? createAbortError('Worker job was aborted');
}

/** Creates an abort error without requiring the DOMException global. */
function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

/** Returns an asynchronous iterator for either accepted source kind. */
function getAsyncIterator<T>(input: AsyncIterable<T> | Iterable<T>): AsyncIterator<T> {
  if (Symbol.asyncIterator in input) {
    return input[Symbol.asyncIterator]();
  }
  return (async function* iterateSynchronously() {
    yield* input;
  })();
}

/** Closes an input iterator without allowing a blocked return to delay cancellation. */
function closeInputIterator<InputBatch>(inputIterator: AsyncIterator<InputBatch>): void {
  try {
    void Promise.resolve(inputIterator.return?.()).catch(() => undefined);
  } catch {
    // The worker job has already been aborted; iterator cleanup is best effort.
  }
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
