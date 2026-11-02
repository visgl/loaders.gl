// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Task, TaskContext} from '@math.gl/core/tasks';
import type {WorkerJobContext, WorkerProgress} from '../../types';

/** Named wire payload; TaskRunner requires plain object boundaries. */
export type WorkerTaskPayload = {
  /** Loader input or decoded output. */
  value: any;
};

/** State pinned to one initialized task handle. */
export type WorkerTaskState = {
  /** Serializable loader context. */
  context: WorkerJobContext;
  /** Optional calling-thread request channel. */
  port?: MessagePort;
};

/** Payloads shared by the loader task descriptor and its worker implementation. */
export type WorkerTaskTypes = {
  /** Atomic input. */
  input: WorkerTaskPayload;
  /** Atomic output. */
  output: WorkerTaskPayload;
  /** Parser options. */
  options: Record<string, any>;
  /** Per-handle setup. */
  initialization: WorkerTaskState;
  /** Per-handle state. */
  state: WorkerTaskState;
};

/** Public math.gl task shape used by loader adapters. */
export type WorkerTask = Task<WorkerTaskTypes>;

/** Normalizes optional task labels for loader progress consumers. */
export function normalizeTaskProgress(
  progress: Parameters<TaskContext['reportProgress']>[0]
): WorkerProgress {
  return {...progress, phase: progress.phase ?? 'process', unit: progress.unit ?? 'items'};
}

/** Detects worker execution without importing Node APIs into browser bundles. */
export async function isWorkerThread(): Promise<boolean> {
  if (
    typeof self !== 'undefined' &&
    typeof document === 'undefined' &&
    typeof self.postMessage === 'function'
  )
    return true;
  if (typeof process !== 'undefined' && process.versions?.node) {
    const {isMainThread} = await import('../node/worker_threads');
    return !isMainThread;
  }
  return false;
}

/** Uses the native ESM task runtime so CommonJS workers resolve Node parent ports correctly. */
export async function initializeTaskWorker(task: Task<any>): Promise<void> {
  const runtime = await import('@math.gl/core/tasks');
  await runtime.initializeTaskWorker(task);
}
