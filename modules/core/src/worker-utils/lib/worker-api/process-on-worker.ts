// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TaskRunner, preloadTasks, type InitializedTask, type TaskRunControls} from '@math.gl/tasks';
import type {WorkerObject, WorkerOptions, CallerThreadContext, WorkerJobContext} from '../../types';
import {getConfiguredWorkerURL, getCustomWorkerURL, getWorkerURL} from './get-worker-url';
import {normalizeTaskProgress, type WorkerTask, type WorkerTaskPayload} from './task-runtime';
import {getTransferList, getTransferListForWriter} from '../worker-utils/get-transfer-list';
import {isBrowser, isMobile} from '../env-utils/globals';

/** Loader processing options mapped onto public task controls. */
export type ProcessOnWorkerOptions = WorkerOptions;
/** Code preload cancellation controls; preloading does not reserve workers. */
export type PreloadWorkerOptions = Pick<TaskRunControls, 'signal'>;

/** Capacity retained weakly by a descriptor, with active-request accounting for shutdown. */
type RunnerState = {
  /** Public runtime owning execution capacity. */
  runner: TaskRunner;
  /** Queued and active loader requests. */
  requests: number;
};

let runners = new WeakMap<WorkerObject, RunnerState>();
const activeRunners = new Set<RunnerState>();
/** Fallback shims only for nullable legacy factories; URL tasks are owned by math.gl. */
const moduleWorkerUrls = new Map<string, string>();

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
  const taskInput = wrapInput(input);
  let session: Awaited<ReturnType<typeof openSession>> | undefined;
  try {
    session = await openSession(worker, options, context, jobContext);
    for await (const result of session.handle.runTaskInBatches(taskInput, {
      ...getControls(options),
      options: getParserOptions(options)
    }))
      yield result.value;
  } finally {
    // Own the input before acquiring a worker, but never let slow cleanup hide the original failure.
    const closingInput = taskInput.return?.();
    void closingInput?.catch(() => {});
    await session?.close();
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
  const previousUrls = [...moduleWorkerUrls.values()];
  moduleWorkerUrls.clear();
  try {
    await Promise.all(previous.map(state => state.runner.terminate(reason)));
  } finally {
    for (const workerUrl of previousUrls) URL.revokeObjectURL(workerUrl);
  }
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
    worker: {
      ...(create ? {create: () => create() ?? createModuleWorker(url)} : {url}),
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
  const task = getTask(worker, options);
  let state = runners.get(worker);
  if (!state) {
    state = {
      runner: new TaskRunner({
        maxConcurrency: isMobile
          ? (options.maxMobileConcurrency ?? 1)
          : (options.maxConcurrency ?? 3)
      }),
      requests: 0
    };
    runners.set(worker, state);
  }
  const runnerState = state;
  const channel = context.process ? new MessageChannel() : undefined;
  const callbackController = new AbortController();
  let channelClosed = false;
  /** Cancels caller-thread work when the owning request is aborted. */
  const abortCallbacks = () => callbackController.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', abortCallbacks, {once: true});
  /** Prevents late callback replies after the task releases its channel. */
  const closeChannel = () => {
    channelClosed = true;
    options.signal?.removeEventListener('abort', abortCallbacks);
    callbackController.abort();
    channel?.port1.close();
    channel?.port2.close();
  };
  if (channel) {
    channel.port1.onmessage = async ({data}) => {
      try {
        const value = await context.process!(
          data.input,
          data.options,
          {
            signal: callbackController.signal,
            throwIfAborted: () => callbackController.signal.throwIfAborted()
          },
          data.context
        );
        if (!channelClosed && !callbackController.signal.aborted)
          channel.port1.postMessage({identifier: data.identifier, value}, getTransferList(value));
      } catch (error) {
        if (channelClosed || callbackController.signal.aborted) return;
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
  runnerState.requests++;
  activeRunners.add(runnerState);
  let released = false;
  /** Releases strong shutdown ownership after the last queued or active request. */
  const releaseRunner = () => {
    if (released) return;
    released = true;
    runnerState.requests--;
    if (!runnerState.requests) activeRunners.delete(runnerState);
  };
  let handle: InitializedTask<WorkerTask>;
  try {
    handle = await runnerState.runner.initializeTask(
      task,
      {
        context: structuredClone(jobContext),
        ...(channel ? {port: channel.port2} : {})
      },
      // The callback port is setup state, independent of the caller's payload ownership.
      {...getControls(options), inputOwnership: 'transfer'}
    );
  } catch (error) {
    releaseRunner();
    closeChannel();
    throw error;
  }
  return {
    handle,
    /** Releases the worker and callback channel on success, failure, and early stream return. */
    async close() {
      try {
        await handle.close();
      } finally {
        closeChannel();
        releaseRunner();
      }
    }
  };
}

/** Maps iterator values without hiding return() behind an async generator's blocked next(). */
function wrapInput<Input>(
  input: Iterable<Input> | AsyncIterable<Input>
): AsyncIterableIterator<WorkerTaskPayload> {
  const iterator =
    Symbol.asyncIterator in input ? input[Symbol.asyncIterator]() : input[Symbol.iterator]();
  let inputClosed = false;
  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (inputClosed) return {done: true as const, value: undefined};
      const next = await iterator.next();
      if (next.done || inputClosed) {
        inputClosed = true;
        return {done: true as const, value: undefined};
      }
      return {done: false as const, value: {value: next.value}};
    },
    async return() {
      if (!inputClosed) {
        inputClosed = true;
        await iterator.return?.();
      }
      return {done: true as const, value: undefined};
    }
  };
}

/** Imports cross-origin entrypoints through a same-origin module shim without evaluating fetched source. */
function createModuleWorker(url: string): Worker {
  const resolved = new URL(url, globalThis.document?.baseURI ?? globalThis.location.href);
  let workerUrl = resolved.href;
  if (/^https?:$/.test(resolved.protocol) && resolved.origin !== globalThis.location.origin) {
    let shimUrl = moduleWorkerUrls.get(resolved.href);
    if (!shimUrl) {
      shimUrl = URL.createObjectURL(
        new Blob([`import ${JSON.stringify(resolved.href)};`], {type: 'application/javascript'})
      );
      moduleWorkerUrls.set(resolved.href, shimUrl);
    }
    workerUrl = shimUrl;
  }
  return new Worker(workerUrl, {type: 'module'});
}
