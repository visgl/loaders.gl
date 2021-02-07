import {WorkerMessage} from './worker-thread';

export type WorkerFarmProps = {
  maxConcurrency?: number;
  reuseWorkers?: boolean;
  onMessage?: (WorkerMessage) => any;
  onDebug?: () => void;
}

/**
 * Process multiple data messages with a "farm" of different workers (in worker pools)
 */
export default class WorkerFarm {
  /** Check if Workers are supported */
  static isSupported(): boolean;
  /** Get a single instance of a worker farm */
  static getWorkerFarm(props: WorkerFarmProps): WorkerFarm;

  readonly maxConcurrency: number;
  readonly onMessage: (WorkerMessage) => any;
  readonly onDebug: () => void;

  /**
   * @param maxConcurrency {number} - max count of workers
   */
  constructor(props: WorkerFarmProps);

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
