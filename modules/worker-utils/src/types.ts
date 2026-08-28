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
  worker?: string | boolean;
  /** Optional Node.js-specific worker filename (for example a `.cjs` asset). */
  workerNode?: string;
  options: {[key: string]: any};
  deprecatedOptions?: object;

  process?: Process;
  processInBatches?: ProcessInBatches;
};

/*
  PROTOCOL

  Main thread                                     worker
               => process-in-batches

               <= input-request
               => input-batch
               <= output-batch
               => output-ack
                  ... // repeat

              => input-done
              <= done

                 // or

              <= error
 */
export type WorkerMessageType =
  | 'preload'
  | 'process'
  | 'done'
  | 'error'
  | 'process-in-batches'
  | 'input-request'
  | 'input-batch'
  | 'input-done'
  | 'output-batch'
  | 'output-ack';

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
