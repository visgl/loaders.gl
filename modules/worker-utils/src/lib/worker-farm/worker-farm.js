/** @typedef {import('./worker-farm').WorkerFarmProps} WorkerFarmProps */
import {isMobile} from '../env-utils/globals';
import WorkerPool from './worker-pool';
import WorkerThread from './worker-thread';

/** @type {WorkerFarmProps} */
const DEFAULT_PROPS = {
  maxConcurrency: 3,
  maxMobileConcurrency: 1,
  onDebug: () => {},
  reuseWorkers: true
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
    this.props = {...DEFAULT_PROPS};
    this.setProps(props);
    /** @type Map<string, WorkerPool>} */
    this.workerPools = new Map();
  }

  destroy() {
    this.workerPools.forEach(workerPool => workerPool.destroy());
  }

  setProps(props) {
    this.props = {...this.props, ...props};
  }

  getWorkerPool({name, source, url}) {
    let workerPool = this.workerPools.get(name);
    if (!workerPool) {
      workerPool = new WorkerPool({
        name,
        source,
        url,
        maxConcurrency: isMobile ? this.props.maxMobileConcurrency : this.props.maxConcurrency,
        onDebug: this.props.onDebug,
        reuseWorkers: this.props.reuseWorkers
      });
      this.workerPools.set(name, workerPool);
    }
    return workerPool;
  }
}
