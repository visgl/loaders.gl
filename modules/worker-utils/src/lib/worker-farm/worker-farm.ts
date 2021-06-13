import WorkerPool from './worker-pool';
import WorkerThread from './worker-thread';

/**
 * @param maxConcurrency {number} - max count of workers
 */
export type WorkerFarmProps = {
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  onDebug?: () => void;
};

const DEFAULT_PROPS: WorkerFarmProps = {
  maxConcurrency: 3,
  maxMobileConcurrency: 1,
  onDebug: () => {},
  reuseWorkers: true
};

/**
 * Process multiple jobs with a "farm" of different workers in worker pools.
 */
export default class WorkerFarm {
  private props: WorkerFarmProps;
  private workerPools = new Map<string, WorkerPool>();
  // singleton
  private static _workerFarm?: WorkerFarm;

  /** Check if Workers are supported */
  static isSupported(): boolean {
    return WorkerThread.isSupported();
  }

  /** Get the singleton instance of the global worker farm */
  static getWorkerFarm(props: WorkerFarmProps = {}): WorkerFarm {
    WorkerFarm._workerFarm = WorkerFarm._workerFarm || new WorkerFarm({});
    WorkerFarm._workerFarm.setProps(props);
    return WorkerFarm._workerFarm;
  }

  /** get global instance with WorkerFarm.getWorkerFarm() */
  private constructor(props: WorkerFarmProps) {
    this.props = {...DEFAULT_PROPS};
    this.setProps(props);
    /** @type Map<string, WorkerPool>} */
    this.workerPools = new Map();
  }

  /**
   * Terminate all workers in the farm
   * @note Can free up significant memory
   */
  destroy(): void {
    for (const workerPool of this.workerPools.values()) {
      workerPool.destroy();
    }
  }

  /**
   * Set props used when initializing worker pools
   * @param props
   */
  setProps(props: WorkerFarmProps): void {
    this.props = {...this.props, ...props};
    // Update worker pool props
    for (const workerPool of this.workerPools.values()) {
      workerPool.setProps(this._getWorkerPoolProps());
    }
  }

  /**
   * Returns a worker pool for the specified worker
   * @param options - only used first time for a specific worker name
   * @param options.name - the name of the worker - used to identify worker pool
   * @param options.url -
   * @param options.source -
   * @example
   *   const job = WorkerFarm.getWorkerFarm().getWorkerPool({name, url}).startJob(...);
   */
  getWorkerPool(options: {name: string; source?: string; url?: string}): WorkerPool {
    const {name, source, url} = options;
    let workerPool = this.workerPools.get(name);
    if (!workerPool) {
      workerPool = new WorkerPool({
        name,
        source,
        url
      });
      workerPool.setProps(this._getWorkerPoolProps());
      this.workerPools.set(name, workerPool);
    }
    return workerPool;
  }

  _getWorkerPoolProps() {
    return {
      maxConcurrency: this.props.maxConcurrency,
      maxMobileConcurrency: this.props.maxMobileConcurrency,
      reuseWorkers: this.props.reuseWorkers,
      onDebug: this.props.onDebug
    };
  }
}
