import {onMessageFunc} from './worker-thread';

/**
 * Process multiple data messages with a "farm" of different workers (in worker pools)
 */
export default class WorkerFarm {
  static isSupported(): boolean;

  readonly maxConcurrency: number;
  readonly onMessage: onMessageFunc;
  readonly onDebug: () => void;

  /**
   * @param processor {function | string} - worker function
   * @param maxConcurrency {number} - max count of workers
   */
  constructor(options: {
    maxConcurrency?: number,
    onMessage?: onMessageFunc,
    onDebug?: () => void
  });

  setProps(props: object);

  destroy(): void;

  /**
   * Process binary data in a worker
   * @param data data (containing binary typed arrays) to be transferred to worker
   * @param jobName name of the job
   * @returns a Promise with data (containing typed arrays) transferred back from worker
   */
  process(workerSource: string | Function, workerName: string, data: any): Promise<any>;
}
