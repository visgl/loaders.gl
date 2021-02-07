import WorkerPool from './worker-pool';
import WorkerThread from './worker-thread';

const DEFAULT_MAX_CONCURRENCY = 5;

let _workerFarm = null;

/**
 * Process multiple data messages with a "farm" of different workers (in worker pools)
 */
export default class WorkerFarm {
  static isSupported() {
    return WorkerThread.isSupported();
  }

  // Create a single instance of a worker farm
  static getWorkerFarm(props = {}) {
    if (!_workerFarm) {
      _workerFarm = new WorkerFarm({});
    }
    _workerFarm.setProps(props);

    return _workerFarm;
  }

  constructor({
    maxConcurrency = DEFAULT_MAX_CONCURRENCY,
    onMessage = null,
    onDebug = () => {},
    reuseWorkers = true
  }) {
    this.maxConcurrency = maxConcurrency;
    this.onMessage = onMessage;
    this.onDebug = onDebug;
    this.workerPools = new Map();
    this.reuseWorkers = reuseWorkers;
  }

  setProps(props) {
    if ('maxConcurrency' in props) {
      this.maxConcurrency = props.maxConcurrency;
    }

    if ('onDebug' in props) {
      this.onDebug = props.onDebug;
    }

    if ('reuseWorkers' in props) {
      this.reuseWorkers = props.reuseWorkers;
    }
  }

  destroy() {
    this.workerPools.forEach(workerPool => workerPool.destroy());
  }

  /**
   * Process binary data in a worker
   * @param {any} data - data (containing binary typed arrays) to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(workerSource, workerName, data) {
    const workerPool = this._getWorkerPool(workerSource, workerName);
    return workerPool.process(data);
  }

  // PRIVATE

  _getWorkerPool(workerSource, workerName) {
    let workerPool = this.workerPools.get(workerName);
    if (!workerPool) {
      workerPool = new WorkerPool({
        source: workerSource,
        name: workerName,
        onMessage: this._onWorkerMessage.bind(this),
        maxConcurrency: this.maxConcurrency,
        onDebug: this.onDebug,
        reuseWorkers: this.reuseWorkers
      });
      this.workerPools.set(workerName, workerPool);
    }
    return workerPool;
  }

  _onWorkerMessage({workerThread, data, resolve, reject}) {
    if (this.onMessage) {
      this.onMessage({workerThread, data, resolve, reject});
      return;
    }

    switch (data.type) {
      case 'done':
        resolve(data.result);
        break;

      case 'error':
        reject(data.message);
        break;

      default:
    }
  }
}
