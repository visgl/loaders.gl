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
   */
  async process(data) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = event => {
        this.onMessage({worker: this.worker, data: event.data, resolve, reject});
      };
      this.worker.onerror = error => {
        // Note Error object does not have the expected fields if loading failed completely
        // https://developer.mozilla.org/en-US/docs/Web/API/Worker#Event_handlers
        // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
        let message = `${this.name}: WorkerThread.process() failed`;
        if (error.message) {
          message += ` ${error.message} ${error.filename}:${error.lineno}:${error.colno}`;
        }
        const betterError = new Error(message);
        console.error(error); // eslint-disable-line
        reject(betterError);
      };
      const transferList = getTransferList(data);
      this.worker.postMessage(data, transferList);
    });
  }

  destroy() {
    this.worker.terminate();
    // @ts-ignore
    this.worker = null;
  }
}
