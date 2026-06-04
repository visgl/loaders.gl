// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import WorkerPool from './worker-pool';
import type {WorkerPoolTarget} from './worker-pool';
import WorkerThread from './worker-thread';
import type {LoadWorker} from '../../types';

/**
 * @param maxConcurrency - max count of workers
 * @param maxMobileConcurrency - max count of workers on mobile
 * @param maxConcurrency - max count of workers
 * @param reuseWorkers - if false, destroys workers when task is completed
 * @param onDebug - callback intended to allow application to log worker pool activity
 */
export type WorkerFarmProps = {
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  reuseWorkers?: boolean;
  onDebug?: () => void;
};

const DEFAULT_PROPS: Required<WorkerFarmProps> = {
  maxConcurrency: 3,
  maxMobileConcurrency: 1,
  reuseWorkers: true,
  onDebug: () => {}
};

/** Stable identity map used to include loadWorker callbacks in worker pool keys. */
const loadWorkerIds = new WeakMap<LoadWorker, number>();
/** Monotonically increasing id assigned to each distinct loadWorker callback. */
let nextLoadWorkerId = 1;

/**
 * Process multiple jobs with a "farm" of different workers in worker pools.
 */
export default class WorkerFarm {
  private props: WorkerFarmProps;
  private workerPools = new Map<string, WorkerPool>();
  // singleton
  private static _workerFarm?: WorkerFarm;

  /** Checks if workers are supported on this platform */
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
    this.workerPools = new Map<string, WorkerPool>();
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
   * @param options Worker pool target used to identify and initialize the pool.
   * @param options.name Name of the worker, used as the base pool identity.
   * @param options.url Worker script URL.
   * @param options.source Inline worker source.
   * @param options.urlKey Stable URL key for lazily resolved fallback URLs.
   * @param options.loadWorker Built-in worker factory callback.
   * @example
   *   const job = WorkerFarm.getWorkerFarm().getWorkerPool({name, url}).startJob(...);
   */
  getWorkerPool(options: WorkerPoolTarget): WorkerPool {
    const {name, source, url, getUrl, loadWorker, loadWorkerOptions} = options;
    const workerPoolKey = getWorkerPoolKey(options);
    let workerPool = this.workerPools.get(workerPoolKey);
    if (!workerPool) {
      workerPool = new WorkerPool({
        name,
        source,
        url,
        getUrl,
        loadWorker,
        loadWorkerOptions
      });
      workerPool.setProps(this._getWorkerPoolProps());
      this.workerPools.set(workerPoolKey, workerPool);
    }
    return workerPool;
  }

  /** Returns worker-pool configuration inherited from the farm. */
  _getWorkerPoolProps() {
    return {
      maxConcurrency: this.props.maxConcurrency,
      maxMobileConcurrency: this.props.maxMobileConcurrency,
      reuseWorkers: this.props.reuseWorkers,
      onDebug: this.props.onDebug
    };
  }
}

/**
 * Builds the cache key for a worker pool target.
 * @param options Worker pool options.
 */
function getWorkerPoolKey(options: WorkerPoolTarget): string {
  const {name, source, url, urlKey, loadWorker} = options;
  const sourceKey = source ? `source:${source}` : '';
  const urlKeyPart = url || urlKey ? `url:${url || urlKey}` : '';
  const loadWorkerKey = loadWorker ? `loadWorker:${getLoadWorkerId(loadWorker)}` : '';
  return [name, sourceKey, urlKeyPart, loadWorkerKey].filter(Boolean).join('|');
}

/**
 * Returns a stable numeric id for a loadWorker callback identity.
 * @param loadWorker Worker factory callback.
 */
function getLoadWorkerId(loadWorker: LoadWorker): number {
  let loadWorkerId = loadWorkerIds.get(loadWorker);
  if (!loadWorkerId) {
    loadWorkerId = nextLoadWorkerId++;
    loadWorkerIds.set(loadWorker, loadWorkerId);
  }
  return loadWorkerId;
}
