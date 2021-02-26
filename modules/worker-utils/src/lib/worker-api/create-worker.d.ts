type ProcessFunction = (data: any, options: {[key: string]: any}) => Promise<any>;

/**
 * Set up a WebWorkerGlobalScope to talk with the main thread
 */
export function createWorker(
  process: ProcessFunction,
  processInBatches?: Function,
): void;
