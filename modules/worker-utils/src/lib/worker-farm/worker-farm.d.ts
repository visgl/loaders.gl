import {WorkerPool} from '../..';

/**
 * @param maxConcurrency {number} - max count of workers
 */
export type WorkerFarmProps = {
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  onDebug?: () => void;
}

/**
 * Process multiple jobs with a "farm" of different workers in worker pools.
 */
export default class WorkerFarm {
  /** Check if Workers are supported */
  static isSupported(): boolean;
  /** Get the singleton instance of the global worker farm */
  static getWorkerFarm(props: WorkerFarmProps): WorkerFarm;

  readonly maxConcurrency: number;
  readonly onDebug: () => void;

  constructor(props: WorkerFarmProps);

  /**
   * Terminate all workers in the farm
   * @note Can free up significant memory
   */
  destroy(): void;

  /**
   * Set props used when initializing worker pools
   * @param props
   */
  setProps(props: WorkerFarmProps);

  /**
   * Returns a worker pool for the specified worker
   * @param options - only used first time for a specific worker name
   * @param options.name - the name of the worker - used to identify worker pool
   * @param options.url -
   * @param options.source -
   * @example
   *   const job = WorkerFarm.getWorkerFarm().getWorkerPool({name, url}).startJob(...);
   */
  getWorkerPool(options: {name: string, source?: string, url?: string}): WorkerPool;
}
