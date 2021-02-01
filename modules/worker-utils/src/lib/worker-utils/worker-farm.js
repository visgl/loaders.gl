import WorkerPool from './worker-pool';

const DEFAULT_MAX_CONCURRENCY = 5;

/**
 * Process multiple data messages with a "farm" of different workers (in worker pools)
 */
export default class WorkerFarm {
  static isSupported() {
    return typeof Worker !== 'undefined';
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
        onMessage: onWorkerMessage.bind(null, this.onMessage),
        maxConcurrency: this.maxConcurrency,
        onDebug: this.onDebug,
        reuseWorkers: this.reuseWorkers
      });
      this.workerPools.set(workerName, workerPool);
    }
    return workerPool;
  }
}

function onWorkerMessage(onMessage, {worker, data, resolve, reject}) {
  if (onMessage) {
    onMessage({worker, data, resolve, reject});
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
