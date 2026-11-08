// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TaskContext} from '@math.gl/tasks';
import type {Process, ProcessInBatches, WorkerContext} from '../../types';
import {
  initializeTaskWorker,
  isWorkerThread,
  normalizeTaskProgress,
  type WorkerTask,
  type WorkerTaskState
} from './task-runtime';
import {getTransferList} from '../worker-utils/get-transfer-list';

/** Installs a loader processor using math.gl's public task worker protocol. */
export async function createWorker(
  process: Process,
  processInBatches?: ProcessInBatches
): Promise<void> {
  if (!(await isWorkerThread())) return;
  await initializeTaskWorker(createWorkerTask(process, processInBatches));
}

/** @internal Builds the loader adapter independently of worker installation. */
export function createWorkerTask(
  process: Process,
  processInBatches?: ProcessInBatches
): WorkerTask {
  return {
    id: 'loaders.gl',
    initialize: state => state,
    destroy: state => state.port?.close(),
    process: async ({value}, options, context) => {
      if (!process) throw new Error('Worker does not support atomic processing');
      return {value: await process(value, options, createContext(context), context.state.context)};
    },
    ...(processInBatches
      ? ({
          processInBatches: async function* (inputs, options, context) {
            /** Unwraps task records while preserving upstream demand and backpressure. */
            async function* values() {
              for await (const input of inputs) yield input.value;
            }
            for await (const value of processInBatches(
              values(),
              options,
              createContext(context),
              context.state.context
            )) {
              yield {value};
            }
          }
        } satisfies Partial<WorkerTask>)
      : {})
  };
}

/** Adds loader labels and optional calling-thread requests to the task context. */
function createContext(context: TaskContext<WorkerTaskState>): WorkerContext {
  let requestIdentifier = 0;
  const port = context.state.port;
  return {
    signal: context.signal,
    throwIfAborted: () => context.throwIfAborted(),
    reportProgress: progress => context.reportProgress(normalizeTaskProgress(progress)),
    process: port
      ? (input, options = {}, jobContext = {}) => {
          context.throwIfAborted();
          const identifier = ++requestIdentifier;
          return new Promise((resolve, reject) => {
            /** Settles only the matching response on this handle's private channel. */
            const onMessage = (event: MessageEvent) => {
              if (event.data.identifier !== identifier) return;
              cleanup();
              if (event.data.error) {
                const error = new Error(event.data.error.message);
                error.name = event.data.error.name;
                reject(error);
              } else resolve(event.data.value);
            };
            /** Stops waiting if this task is cancelled. */
            const onAbort = () => {
              cleanup();
              reject(context.signal.reason);
            };
            /** Removes per-request listeners on completion or cancellation. */
            const cleanup = () => {
              port.removeEventListener('message', onMessage);
              context.signal.removeEventListener('abort', onAbort);
            };
            port.addEventListener('message', onMessage);
            context.signal.addEventListener('abort', onAbort, {once: true});
            port.start();
            try {
              const request = {identifier, input, options, context: jobContext};
              port.postMessage(request, getTransferList(request));
            } catch (error) {
              cleanup();
              reject(error);
            }
          });
        }
      : undefined
  };
}
