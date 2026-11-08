// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TaskProgress, TaskRunControls} from '@math.gl/tasks';

/** Progress from a loader task, with explicit loader phase and unit names. */
export type WorkerProgress = TaskProgress & {
  /** Loader operation being measured. */
  phase: string;
  /** Measurement unit such as bytes, rows, or tasks. */
  unit: string;
};

/** Creates a fresh browser worker; null selects the descriptor's URL. */
export type LoadWorker = () => Worker | null;

/** Loader task routing, cancellation, ownership, and parser options. */
export type WorkerOptions = Omit<TaskRunControls, 'onProgress'> & {
  /** Receives normalized loader progress. */
  onProgress?: (progress: WorkerProgress) => void;
  /** Enables worker execution. */
  worker?: boolean;
  /** Explicit batch capability for a custom worker. */
  workerInBatches?: boolean;
  /** Maximum concurrent task handles per descriptor. */
  maxConcurrency?: number;
  /** Maximum concurrency on mobile browsers. */
  maxMobileConcurrency?: number;
  /** Enables experimental Node workers for loader APIs. */
  _nodeWorkers?: boolean;
  /** Selects repository-local workers when set to test. */
  _workerType?: string;
  /** Additional loader-specific parser options. */
  [key: string]: any;
};

/** Serializable information associated with a loader task. */
export type WorkerJobContext = Record<string, any>;

/** Services supplied to a loader's worker implementation. */
export type WorkerContext = {
  /** Signal for the current task. */
  signal?: AbortSignal;
  /** Throws when the current task has been cancelled. */
  throwIfAborted?: () => void;
  /** Reports normalized phase progress. */
  reportProgress?: (progress: WorkerProgress) => void;
  /** Requests work on the calling thread through a task-owned MessagePort. */
  process?: (input: any, options?: Record<string, any>, jobContext?: WorkerJobContext) => any;
};

/** Processes one loader payload. */
export type Process<Input = any, Output = any, Options extends object = Record<string, any>> = (
  input: Input,
  options?: Options,
  context?: WorkerContext,
  jobContext?: WorkerJobContext
) => Output | Promise<Output>;

/** Processes one stateful stream of loader fragments. */
export type ProcessInBatches<
  Input = any,
  Output = any,
  Options extends object = Record<string, any>
> = (
  input: AsyncIterable<Input> | Iterable<Input>,
  options?: Options,
  context?: WorkerContext,
  jobContext?: WorkerJobContext
) => AsyncIterable<Output>;

/** Metadata describing a loader or writer task's worker artifact. */
export type WorkerObject<
  Input = any,
  Output = any,
  Options extends object = Record<string, any>
> = {
  /** Stable format identifier. */
  id: string;
  /** Human-readable format name. */
  name: string;
  /** Published loaders.gl package containing the worker. */
  module: string;
  /** Version used to resolve CDN artifacts. */
  version: string;
  /** Built-in capability or explicit worker URL. */
  worker?: string | boolean;
  /** Whether the parser supports stateful streaming. */
  workerInBatches?: boolean;
  /** Browser artifact name. */
  workerFile?: string;
  /** Fresh browser worker factory. */
  loadWorker?: LoadWorker;
  /** Node artifact name. */
  workerNode?: string;
  /** Repository-local Node source used by tests. */
  workerSourceNode?: string;
  /** Default parser options. */
  options: Record<string, any>;
  /** Deprecated parser option mappings. */
  deprecatedOptions?: object;
  /** Optional caller-thread atomic implementation. */
  process?: Process<Input, Output, Options>;
  /** Optional caller-thread streaming implementation. */
  processInBatches?: ProcessInBatches<Input, Output, Options>;
};

/** Services implemented by the calling thread for requests from a worker. */
export type CallerThreadContext = {
  /** Processes a worker request, including its separate serialized loader context. */
  process?: Process;
};
