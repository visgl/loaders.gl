/* global Worker */
import {getWorkerURL} from './get-worker-url';
import {getTransferList} from './get-transfer-list';

let count = 0;

// By default resolves to the first message the worker sends back
function defaultOnMessage({data, resolve}) {
  resolve(data);
}

export default class WorkerThread {
  constructor({source, name = `web-worker-${count++}`, onMessage}) {
    const url = getWorkerURL(source, name);
    this.worker = new Worker(url, {name});
    this.name = name;
    this.onMessage = onMessage || defaultOnMessage;
  }

  /**
   * Process binary data in a worker
   * @param data {data containing binary typed arrays} - data to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(data) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = event =>
        this.onMessage({worker: this.worker, data: event.data, resolve, reject});
      this.worker.onerror = error => {
        // Error object does not seem to have the expected fields:
        // https://developer.mozilla.org/en-US/docs/Web/API/Worker#Event_handlers
        // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
        const betterError = new Error(`${this.name}: WorkerThread.process() failed`);
        console.error(betterError, error); // eslint-disable-line
        reject(betterError);
      };
      const transferList = getTransferList(data);
      this.worker.postMessage(data, transferList);
    });
  }

  destroy() {
    this.worker.terminate();
    this.worker = null;
  }
}
