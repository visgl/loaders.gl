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

export type Process = (data: any, options?: {[key: string]: any}, context?: WorkerContext) => any;

export type ProcessInBatches = (
  iterator: AsyncIterable<any> | Iterable<any>,
  options?: {[key: string]: any},
  context?: WorkerContext
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
  context?: {[key: string]: any};
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
