// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Worker Options
 */
export type WorkerOptions = {
  // Worker farm options
  CDN?: string | null;
  worker?: boolean;
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  _workerType?: string;
  workerUrl?: string;
  [key: string]: any; // TODO
};

/**
 * Creates a fresh built-in Worker instance for a worker object.
 * @param options Worker options from the active worker job.
 * @returns A new Worker, or `null` to fall back to URL-based worker loading.
 * Returning `null` lets worker-utils fall back to the generated worker URL.
 */
export type LoadWorker = (options?: WorkerOptions) => Worker | null;

export type WorkerContext = {
  process?: Process;
  processInBatches?: ProcessInBatches;
};

/** Serializable context sent with a single worker job. */
export type WorkerJobContext = {
  [key: string]: any;
};

export type Process = (
  data: any,
  options?: {[key: string]: any},
  context?: WorkerContext,
  jobContext?: WorkerJobContext
) => any;

export type ProcessInBatches = (
  iterator: AsyncIterable<any> | Iterable<any>,
  options?: {[key: string]: any},
  context?: WorkerContext,
  jobContext?: WorkerJobContext
) => AsyncIterable<any>;

/**
 * A worker description object
 */
export type WorkerObject = {
  id: string;
  name: string;
  module: string;
  version: string;
  /** Whether this worker can run in a separate thread, or a legacy worker URL string. */
  worker?: string | boolean;
  /** Loads a built-in Worker instance, typically a bundler-resolved module worker. */
  loadWorker?: LoadWorker;
  options: {[key: string]: any};
  deprecatedOptions?: object;

  process?: Process;
  processInBatches?: ProcessInBatches;
};

/*
  PROTOCOL

  Main thread                                     worker
               => process-batches-start

               => process-batches-input-batch
               <= process-batches-output-batch
                  ... // repeat

              => process-batches-input-done
              <= process-batches-result

                 // or

              <= process-batches-error
 */
export type WorkerMessageType =
  | 'preload'
  | 'process'
  | 'done'
  | 'error'
  | 'process-in-batches'
  | 'input-batch'
  | 'input-done'
  | 'output-batch';

export type WorkerMessagePayload = {
  id?: number;
  options?: {[key: string]: any};
  context?: WorkerJobContext;
  input?: any; // Transferable;
  result?: any; // Transferable
  error?: string;
};

export type WorkerMessageData = {
  source: 'loaders.gl';
  type: WorkerMessageType;
  payload: WorkerMessagePayload;
};

export type WorkerMessage = {
  type: string;
  data: WorkerMessageData;
};
