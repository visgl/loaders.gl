import WorkerPool from './worker-pool';
import WorkerThread from './worker-thread';

const DEFAULT_MAX_CONCURRENCY = 5;

let _workerFarm = null;

export default class WorkerFarm {
  static isSupported() {
    return WorkerThread.isSupported();
  }

  static getWorkerFarm(props = {}) {
    _workerFarm = _workerFarm || new WorkerFarm({});
    _workerFarm.setProps(props);
    return _workerFarm;
  }

  constructor({maxConcurrency = DEFAULT_MAX_CONCURRENCY, onDebug = () => {}, reuseWorkers = true}) {
    this.maxConcurrency = maxConcurrency;
    this.onDebug = onDebug;
    /** @type Map<string, WorkerPool>} */
    this.workerPools = new Map();
    this.reuseWorkers = reuseWorkers;
  }

  destroy() {
    this.workerPools.forEach(workerPool => workerPool.destroy());
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

  getWorkerPool({name, source, url}) {
    let workerPool = this.workerPools.get(name);
    if (!workerPool) {
      workerPool = new WorkerPool({
        name,
        source,
        url,
        maxConcurrency: this.maxConcurrency,
        onDebug: this.onDebug,
        reuseWorkers: this.reuseWorkers
      });
      this.workerPools.set(name, workerPool);
    }
    return workerPool;
  }
}
