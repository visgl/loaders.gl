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
import type {WorkerPoolTarget} from '../worker-farm/worker-pool';
import {
  getCustomWorkerURL,
  getConfiguredWorkerURL,
  getDefaultWorkerURL,
  getWorkerURL,
  getWorkerName
} from './get-worker-url';
import {getTransferListForWriter} from '../worker-utils/get-transfer-list';
import {isBrowser} from '../env-utils/globals';

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
  return Boolean(
    (worker.worker || worker.loadWorker || workerOptions?.workerUrl) && options?.worker
  );
}

/**
 * Checks whether a worker supports stateful batch processing.
 * @param worker Worker descriptor declaring built-in batch support.
 * @param options Worker options, including an explicit capability for custom URLs or source.
 */
export function canProcessOnWorkerInBatches(
  worker: WorkerObject,
  options: WorkerOptions = {}
): boolean {
  if (!canProcessOnWorker(worker, options)) return false;
  if (options.workerInBatches !== undefined) return options.workerInBatches;
  return Boolean(
    worker.workerInBatches && !options.source && !getConfiguredWorkerURL(worker, options)
  );
}

/**
 * This function expects that the worker thread sends certain messages,
 * Creating such a worker can be automated if the worker is wrapper by a call to
 * createWorker in @loaders.gl/core/worker-utils.
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
  const workerPool = workerFarm.getWorkerPool(getWorkerPoolTarget(worker, options, name));

  const jobName = options.jobName || worker.name;
  const job = await workerPool.startJob(
    jobName,
    // eslint-disable-next-line
    onMessage.bind(null, context, options),
    undefined,
    options.signal
  );

  try {
    if (options.signal?.aborted) job.abort(getAbortReason(options.signal));
    // AbortSignal cannot be structured-cloned. It controls the job on this thread only.
    const {signal: _signal, onProgress: _onProgress, ...workerOptions} = options;
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
  } catch (error) {
    job.abort(error);
    throw error;
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
  const workerPool = workerFarm.getWorkerPool(getWorkerPoolTarget(worker, options, name));
  const outputBatches = new AsyncQueue<OutputBatch>();
  const inputIterator = getAsyncIterator(input);
  let outputFinished = false;
  let inputFinished = false;
  let inputCleanupRequested = false;
  let inputRequest = Promise.resolve();
  const batchJobFailed = new Error('Worker batch job failed');

  /** Requests cleanup even when the output consumer is paused after yielding a batch. */
  const closeJobInput = (): void => {
    if (!inputFinished && !inputCleanupRequested) {
      inputCleanupRequested = true;
      closeInputIterator(inputIterator);
    }
  };

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

  const job = await workerPool
    .startJob(
      options.jobName || worker.name,
      (activeJob, type, payload) => {
        switch (type) {
          case 'progress':
            reportProgress(activeJob, options, payload);
            break;

          case 'input-request':
            inputRequest = inputRequest
              .then(async () => {
                if (!activeJob.isRunning) return;
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
            void onMessage(context, options, activeJob, type, payload);
            break;

          default: {
            const error = new Error(`Unexpected worker batch message: ${type}`);
            activeJob.error(error);
            failOutput(error);
            break;
          }
        }
      },
      undefined,
      options.signal
    )
    .catch(error => {
      closeJobInput();
      throw error;
    });

  void job.result.catch(error => {
    failOutput(error);
    closeJobInput();
  });

  try {
    const {signal: _signal, onProgress: _onProgress, ...workerOptions} = options;
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
    if (job.isRunning) {
      job.abort(createAbortError('Worker batch iterator was closed'));
    }
    closeJobInput();
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
  return signal ? signal.reason : createAbortError('Worker job was aborted');
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
  const workerPool = workerFarm.getWorkerPool(getWorkerPoolTarget(worker, options, name));
  const count = preloadOptions.count ?? options.maxConcurrency ?? options.core?.maxConcurrency ?? 1;

  const preloadJobs = Array.from({length: count}, async () => {
    const job = await workerPool.startJob(`${worker.name} preload`, onPreloadMessage);
    job.postMessage('preload', {});
    return await job.result;
  });

  await Promise.all(preloadJobs);
}

/**
 * Resolves the worker source while preserving URL overrides and classic-worker fallbacks.
 * @param worker Worker descriptor to resolve.
 * @param options Options for the active worker operation.
 * @param name Versioned worker name.
 * @returns A target suitable for worker-pool lookup.
 */
function getWorkerPoolTarget(
  worker: WorkerObject,
  options: ProcessOnWorkerOptions,
  name: string
): WorkerPoolTarget {
  if (options.source) {
    return {name, source: options.source};
  }

  const customWorkerUrl = getCustomWorkerURL(worker, options);
  if (customWorkerUrl) {
    return {name, url: customWorkerUrl};
  }

  if (isBrowser && worker.loadWorker) {
    return {
      name,
      loadWorker: worker.loadWorker,
      getUrl: () => getWorkerURL(worker, options),
      urlKey: getDefaultWorkerURL(worker)
    };
  }

  return {name, url: getWorkerURL(worker, options)};
}

/**
 * Job completes when we receive the result
 * @param job
 * @param message
 */
async function onMessage(
  context: WorkerContext,
  options: ProcessOnWorkerOptions,
  job: WorkerJob,
  type: WorkerMessageType,
  payload: WorkerMessagePayload
) {
  switch (type) {
    case 'progress':
      reportProgress(job, options, payload);
      break;

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
      const {id, input, options: processOptions} = payload;
      try {
        if (!context.process) {
          job.postMessage('error', {id, error: 'Worker not set up to process on main thread'});
          return;
        }
        const result = await context.process(
          input,
          {...processOptions, signal: options.signal, onProgress: options.onProgress},
          undefined,
          payload.context || {}
        );
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

/** Delivers progress; callback failures terminate the job and settle its caller. */
function reportProgress(
  job: WorkerJob,
  options: ProcessOnWorkerOptions,
  payload: WorkerMessagePayload
): void {
  if (!job.isRunning || !payload.progress) return;
  try {
    options.onProgress?.(payload.progress);
  } catch (error) {
    job.abort(error);
  }
}
