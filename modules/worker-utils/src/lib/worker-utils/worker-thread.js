/* global Worker */
import {getWorkerURL} from './get-worker-url';
import {getTransferList} from './get-transfer-list';

let count = 0;

// By default resolves to the first message the worker sends back
const DEFAULT_ON_MESSAGE = ({data, resolve}) => resolve(data);

export default class WorkerThread {
  static isSupported() {
    return typeof Worker !== 'undefined';
  }

  constructor({source, name = `web-worker-${count++}`, onMessage}) {
    this.name = name;
    this.source = source;
    this.url = source;
    this.onMessage = onMessage || DEFAULT_ON_MESSAGE;
    this.resolve = _ => {};
    this.reject = _ => {};

    this.worker = this._createBrowserWorker(source, name);
  }

  destroy() {
    // @ts-ignore
    this.worker.terminate();
    // @ts-ignore
    this.worker = null;
  }

  /**
   * Process binary data in a worker
   */
  async process(data) {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.postMessage(data);
    });
  }

  postMessage(data, transferList) {
    transferList = transferList || getTransferList(data);
    // @ts-ignore
    this.worker.postMessage(data, transferList);
  }

  // PRIVATE

  _onMessage(data) {
    this.onMessage({workerThread: this, data, resolve: this.resolve, reject: this.reject});
  }

  _onError(error) {
    // Note Error object does not have the expected fields if loading failed completely
    // https://developer.mozilla.org/en-US/docs/Web/API/Worker#Event_handlers
    // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
    let message = `${this.name}: WorkerThread.process() failed`;
    if (error.message) {
      message += ` ${error.message} ${error.filename}:${error.lineno}:${error.colno}`;
    } else {
      message += ` ${this.url.slice(0, 100)}`;
    }
    const betterError = new Error(message);
    console.error(error); // eslint-disable-line
    this.reject(betterError);
  }

  _createBrowserWorker(source, name) {
    this.url = getWorkerURL(source);
    const worker = new Worker(this.url, {name});

    worker.onmessage = event => this._onMessage(event.data);
    worker.onerror = error => this._onError(error);

    return worker;
  }
}
