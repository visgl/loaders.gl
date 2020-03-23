/* global Worker */


export type onMessageFunc = (options: {
  worker: Worker,
  data: any,
  resolve: (result) => any,
  reject: (error) => any
}) => any;

export default class WorkerThread {
  constructor(options: {
    source: string,
    name?: string,
    onMessage?: onMessageFunc
  });

  /**
   * Process binary data in a worker
   * @param data data (containing binary typed arrays) to be transferred to worker
   * @returns a Promise with data (containing typed arrays) transferred back from worker
   */
  process(data: any): Promise<any>;

  destroy(): void;
}
