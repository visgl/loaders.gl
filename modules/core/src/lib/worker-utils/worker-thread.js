/* global Worker */
import {getWorkerURL, getTransferList} from './worker-utils';

let count = 0;

export default class WorkerThread {
  constructor(workerSource, name = `web-worker-${count++}`) {
    const url = getWorkerURL(workerSource);
    this.worker = new Worker(url, {name});
    this.name = name;
  }

  /**
   * Process binary data in a worker
   * @param data {data containing binary typed arrays} - data to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(data) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = e => resolve(e.data);
      this.worker.onerror = error => reject(error);
      this.worker.postMessage(data, getTransferList(data));
    });
  }

  destroy() {
    this.worker.terminate();
    this.worker = null;
  }
}
