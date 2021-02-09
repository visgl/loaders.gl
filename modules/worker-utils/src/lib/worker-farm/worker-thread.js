/* global Worker */
/** @typedef {import('./worker-thread').WorkerThreadProps} WorkerThreadProps */
import assert from '../env-utils/assert';
import {buildWorkerURL} from './build-worker-url';
import {getTransferList} from './get-transfer-list';

const NOOP = _ => {};
export default class WorkerThread {
  static isSupported() {
    return typeof Worker !== 'undefined';
  }

  /**
   * @param {WorkerThreadProps} props
   */
  constructor(props) {
    const {name, source, url} = props;
    assert(source || url); // Either source or url must be defined
    this.name = name;
    this.source = source;
    this.url = url;
    this.onMessage = NOOP;
    this.onError = error => console.log(error); // eslint-disable-line
    this.terminated = false;

    this.worker = this._createBrowserWorker();
  }

  destroy() {
    this.onMessage = NOOP;
    this.onError = NOOP;
    // @ts-ignore
    this.worker.terminate();
    this.terminated = true;
  }

  get isRunning() {
    return Boolean(this.onMessage);
  }

  postMessage(data, transferList) {
    transferList = transferList || getTransferList(data);
    // @ts-ignore
    this.worker.postMessage(data, transferList);
  }

  // PRIVATE

  /**
   * Generate a standard Error from an ErrorEvent
   * @param {ErrorEvent} event
   */
  _getErrorFromErrorEvent(event) {
    // Note Error object does not have the expected fields if loading failed completely
    // https://developer.mozilla.org/en-US/docs/Web/API/Worker#Event_handlers
    // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
    let message = `Failed to load `;
    message += `worker ${this.name}. `;
    if (event.message) {
      message += `${event.message} in `;
    }
    // const hasFilename = event.filename && !event.filename.startsWith('blob:');
    // message += hasFilename ? event.filename : this.source.slice(0, 100);
    if (event.lineno) {
      message += `:${event.lineno}:${event.colno}`;
    }
    return new Error(message);
  }

  /**
   * Creates a worker thread on the browser
   */
  _createBrowserWorker() {
    this._loadableURL = buildWorkerURL({source: this.source, url: this.url});
    const worker = new Worker(this._loadableURL, {name: this.name});

    worker.onmessage = event => {
      if (!event.data) {
        this.onError('No data received');
      } else {
        this.onMessage(event.data);
      }
    };
    // This callback represents an uncaught exception in the worker thread
    worker.onerror = error => {
      this.onError(this._getErrorFromErrorEvent(error));
      this.terminated = true;
    };
    // TODO - not clear when this would be called, for now just log in case it happens
    worker.onmessageerror = event => console.error(event); // eslint-disable-line

    return worker;
  }
}
