/**
 * Worker Options
 */
export type WorkerOptions = {
  // Worker farm options
  CDN?: string;
  worker?: boolean;
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  _workerType?: string;
  [key: string]: any;
};

/**
 * A worker description object
 */
export type WorkerObject = {
  id: string;
  name: string;
  module: string;
  version: string;
  worker?: string | boolean;
  options: object;
  deprecatedOptions?: object;

  process?: (data: any, options?: object) => Promise<any>;
  processInBatches?: (
    iterator: AsyncIterator<any> | Iterator<any>,
    options: object
  ) => Promise<AsyncIterator<any>>;
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
  options?: object;
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
