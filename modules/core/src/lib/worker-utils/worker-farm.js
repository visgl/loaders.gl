import WorkerPool from './worker-pool';

/**
 * Process multiple data messages with a "farm" of different workers (in worker pools)
 */
export default class WorkerFarm {
  /**
   * @param processor {function | string} - worker function
   * @param maxConcurrency {number} - max count of workers
   */
  constructor({maxConcurrency = 1, onDebug = () => {}}) {
    this.maxConcurrency = maxConcurrency;
    this.onDebug = onDebug;
    this.workerPools = new Map();
  }

  destroy() {
    this.workerPools.forEach(workerPool => workerPool.destroy());
  }

  /**
   * Process binary data in a worker
   * @param data {data containing binary typed arrays} - data to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(workerSource, workerName, data) {
    const workerPool = this._getWorkerPool(workerSource, workerName);
    return workerPool.process(data);
  }

  // PRIVATE

  _getWorkerPool(workerSource, workerName) {
    let workerPool = this.workerPools.get(workerSource);
    if (!workerPool) {
      workerPool = new WorkerPool({
        source: workerSource,
        name: workerName,
        maxConcurrency: this.maxConcurrency,
        onDebug: this.onDebug
      });
      this.workerPools.set(workerPool);
    }
    return workerPool;
  }
}
