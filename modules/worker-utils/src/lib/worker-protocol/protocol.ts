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
