/** @typedef {import('./worker-farm').WorkerFarmProps} WorkerFarmProps */
import WorkerPool from './worker-pool';
import WorkerThread from './worker-thread';

/** @type {WorkerFarmProps} */
const DEFAULT_PROPS = {
  maxConcurrency: 3,
  maxMobileConcurrency: 1,
  reuseWorkers: true,
  onDebug: () => {}
};

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

  constructor(props) {
    /** @type Map<string, WorkerPool>} */
    this.workerPools = new Map();
    this.props = {...DEFAULT_PROPS};
    this.setProps(props);
  }

  destroy() {
    this.workerPools.forEach((workerPool) => workerPool.destroy());
  }

  setProps(props) {
    this.props = {...this.props, ...props};
    // Update worker pool props
    for (const workerPool of this.workerPools.values()) {
      workerPool.setProps(this._getWorkerPoolProps());
    }
  }

  getWorkerPool({name, source, url}) {
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
