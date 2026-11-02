// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  TaskRunner,
  preloadTasks,
  type InitializedTask,
  type TaskRunControls
} from '@math.gl/core/tasks';
import type {WorkerObject, WorkerOptions, CallerThreadContext, WorkerJobContext} from '../../types';
import {getConfiguredWorkerURL, getCustomWorkerURL, getWorkerURL} from './get-worker-url';
import {normalizeTaskProgress, type WorkerTask, type WorkerTaskPayload} from './task-runtime';
import {getTransferList, getTransferListForWriter} from '../worker-utils/get-transfer-list';
import {isBrowser, isMobile} from '../env-utils/globals';

/** Loader processing options mapped onto public task controls. */
export type ProcessOnWorkerOptions = WorkerOptions;
/** Code preload cancellation controls; preloading does not reserve workers. */
export type PreloadWorkerOptions = Pick<TaskRunControls, 'signal'>;

let runners = new WeakMap<WorkerObject, TaskRunner>();
const activeRunners = new Set<TaskRunner>();

/** Checks worker availability and explicit loader routing without creating a worker. */
export function canProcessOnWorker(worker: WorkerObject, options: WorkerOptions = {}): boolean {
  const supported = isBrowser ? typeof Worker !== 'undefined' : Boolean(options._nodeWorkers);
  return Boolean(
    supported &&
      options.worker &&
      (worker.worker || worker.loadWorker || getConfiguredWorkerURL(worker, options))
  );
}

/** Checks the loader and selected custom worker's stateful stream capability. */
export function canProcessOnWorkerInBatches(
  worker: WorkerObject,
  options: WorkerOptions = {}
): boolean {
  if (!canProcessOnWorker(worker, options)) return false;
  if (options.workerInBatches !== undefined) return options.workerInBatches;
  return Boolean(worker.workerInBatches && !getConfiguredWorkerURL(worker, options));
}

/** Runs one loader request on an initialized math.gl task and closes its handle. */
export async function processOnWorker(
  worker: WorkerObject,
  data: any,
  options: ProcessOnWorkerOptions = {},
  context: CallerThreadContext = {},
  jobContext: WorkerJobContext = {}
): Promise<any> {
  const session = await openSession(worker, options, context, jobContext);
  try {
    const result = await session.handle.runTask(
      {value: data},
      {
        ...getControls(options),
        options: getParserOptions(options)
      }
    );
    return result.value;
  } finally {
    await session.close();
  }
}

/** Runs an entire input stream on one task handle with demand-driven backpressure. */
export async function* processOnWorkerInBatches<InputBatch = any, OutputBatch = any>(
  worker: WorkerObject,
  input: AsyncIterable<InputBatch> | Iterable<InputBatch>,
  options: ProcessOnWorkerOptions = {},
  context: CallerThreadContext = {},
  jobContext: WorkerJobContext = {}
): AsyncIterable<OutputBatch> {
  const session = await openSession(worker, options, context, jobContext);
  try {
    for await (const result of session.handle.runTaskInBatches(wrapInput(input), {
      ...getControls(options),
      options: getParserOptions(options)
    }))
      yield result.value;
  } finally {
    await session.close();
  }
}

/** Loads worker code through math.gl without retaining a parser instance or worker pool. */
export async function preloadWorker(
  worker: WorkerObject,
  options: WorkerOptions = {},
  preloadOptions: PreloadWorkerOptions = {}
): Promise<void> {
  await preloadTasks([getTask(worker, options)], {
    execution: 'worker',
    signal: preloadOptions.signal ?? options.signal
  });
}

/** Terminates loader task runners and releases their queued requests and active handles. */
export async function destroyWorkerTasks(reason?: unknown): Promise<void> {
  const previous = [...activeRunners];
  activeRunners.clear();
  runners = new WeakMap();
  await Promise.all(previous.map(runner => runner.terminate(reason)));
}

/** Creates a task descriptor using public factories or the loaders.gl artifact URL. */
function getTask(worker: WorkerObject, options: WorkerOptions): WorkerTask {
  if (options.source || options.core?.source)
    throw new Error(
      'Inline legacy worker source is unsupported; use a TaskRunner worker URL or factory'
    );
  const create = !getCustomWorkerURL(worker, options) && isBrowser ? worker.loadWorker : undefined;
  const url = getWorkerURL(worker, options);
  return {
    id: `${worker.module}:${worker.id}`,
    initialize: state => state,
    // Named processor hooks provide payload inference; worker execution never invokes them here.
    process: async input => input,
    processInBatches: async function* (input) {
      yield* input;
    },
    worker: {
      ...(create ? {create: () => create() ?? new Worker(url, {type: 'module'})} : {url}),
      capabilities: {atomic: true, streaming: true}
    }
  };
}

/** Maps only supported lifecycle controls; parser options stay separate. */
function getControls(options: WorkerOptions): TaskRunControls {
  return {
    execution: 'worker',
    signal: options.signal,
    inputOwnership: options.inputOwnership ?? 'transfer',
    outputOwnership: options.outputOwnership ?? 'transfer',
    onProgress: options.onProgress
      ? progress => options.onProgress?.(normalizeTaskProgress(progress))
      : undefined
  };
}

/** Removes caller-only callbacks before options cross the task boundary. */
function getParserOptions(options: WorkerOptions): Record<string, any> {
  const {signal, onProgress, ...parserOptions} = options;
  return getTransferListForWriter(parserOptions);
}

/** Opens one task-owned callback channel and guarantees cleanup if initialization fails. */
async function openSession(
  worker: WorkerObject,
  options: WorkerOptions,
  context: CallerThreadContext,
  jobContext: WorkerJobContext
) {
  options.signal?.throwIfAborted();
  let runner = runners.get(worker);
  if (!runner) {
    runner = new TaskRunner({
      maxConcurrency: isMobile ? (options.maxMobileConcurrency ?? 1) : (options.maxConcurrency ?? 3)
    });
    runners.set(worker, runner);
    activeRunners.add(runner);
  }
  const channel = context.process ? new MessageChannel() : undefined;
  if (channel) {
    channel.port1.onmessage = async ({data}) => {
      try {
        const value = await context.process!(data.input, data.options, {}, data.context);
        channel.port1.postMessage({identifier: data.identifier, value}, getTransferList(value));
      } catch (error) {
        channel.port1.postMessage({
          identifier: data.identifier,
          error: {
            name: error instanceof Error ? error.name : 'Error',
            message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    };
    channel.port1.start();
  }
  let handle: InitializedTask<WorkerTask>;
  try {
    handle = await runner.initializeTask(
      getTask(worker, options),
      {
        context: jobContext,
        ...(channel ? {port: channel.port2} : {})
      },
      getControls(options)
    );
  } catch (error) {
    channel?.port1.close();
    channel?.port2.close();
    throw error;
  }
  return {
    handle,
    /** Releases the worker and callback channel on success, failure, and early stream return. */
    async close() {
      try {
        await handle.close();
      } finally {
        channel?.port1.close();
        channel?.port2.close();
      }
    }
  };
}

/** Maps iterator values without hiding return() behind an async generator's blocked next(). */
function wrapInput<Input>(
  input: Iterable<Input> | AsyncIterable<Input>
): AsyncIterable<WorkerTaskPayload> {
  const iterator =
    Symbol.asyncIterator in input ? input[Symbol.asyncIterator]() : input[Symbol.iterator]();
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          const next = await iterator.next();
          return next.done
            ? {done: true as const, value: undefined}
            : {done: false as const, value: {value: next.value}};
        },
        async return() {
          await iterator.return?.();
          return {done: true as const, value: undefined};
        }
      };
    }
  };
}
