
export type WorkerMessage = {
  workerThread?: WorkerThread,
  data: any,
  resolve: (result) => any,
  reject?: (error) => any
};

/**
 * Represents one worker thread
 */
export default class WorkerThread {
  static isSupported(): boolean;

  constructor(options: {
    source: string,
    name?: string,
    onMessage?: (WorkerMessage) => any;
  });

  destroy(): void;

  postMessage(data, transferList?: any[]): void;

  /**
   * Process binary data in a worker
   * @param data data (containing binary typed arrays) to be transferred to worker
   * @returns a Promise with data (containing typed arrays) transferred back from worker
   */
  process(data: any): Promise<any>;
}
