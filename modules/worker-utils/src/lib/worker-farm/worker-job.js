import {assert} from '../env-utils/assert';

export default class WorkerJob {
  constructor(jobName, workerThread) {
    this.name = jobName;
    this.workerThread = workerThread;
    this.isRunning = true;
    this.result = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  postMessage(type, payload) {
    this.workerThread.postMessage({
      source: 'loaders.gl', // Lets worker ignore unrelated messages
      type,
      payload
    });
  }

  done(value) {
    assert(this.isRunning);
    this.isRunning = false;
    this._resolve(value);
  }

  error(error) {
    assert(this.isRunning);
    this.isRunning = false;
    this._reject(error);
  }
}
