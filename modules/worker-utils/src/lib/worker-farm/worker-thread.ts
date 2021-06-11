import {assert} from '../env-utils/assert';
import {buildWorkerURL} from './build-worker-url';
import {getTransferList} from './get-transfer-list';

const NOOP = (_) => {};

export type WorkerThreadProps = {
  name: string;
  source?: string;
  url?: string;
};

/**
 * Represents one worker thread
 */
export default class WorkerThread {
  readonly name: string;
  readonly source: string | undefined;
  readonly url: string | undefined;
  terminated: boolean = false;
  worker: Worker;
  onMessage: (message: any) => void;
  onError: (error: Error) => void;

  private _loadableURL: string = '';

  static isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  constructor(props: WorkerThreadProps) {
    const {name, source, url} = props;
    assert(source || url); // Either source or url must be defined
    this.name = name;
    this.source = source;
    this.url = url;
    this.onMessage = NOOP;
    this.onError = (error) => console.log(error); // eslint-disable-line

    this.worker = this._createBrowserWorker();
  }

  /**
   * Terminate this worker thread
   * @note Can free up significant memory
   */
  destroy(): void {
    this.onMessage = NOOP;
    this.onError = NOOP;
    // @ts-ignore
    this.worker.terminate();
    this.terminated = true;
  }

  get isRunning() {
    return Boolean(this.onMessage);
  }

  /**
   * Send a message to this worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   * @param transferList If not supplied, calculated automatically by traversing data
   */
  postMessage(data: any, transferList?: any[]): void {
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
    let message = 'Failed to load ';
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

    worker.onmessage = (event) => {
      if (!event.data) {
        this.onError(new Error('No data received'));
      } else {
        this.onMessage(event.data);
      }
    };
    // This callback represents an uncaught exception in the worker thread
    worker.onerror = (error) => {
      this.onError(this._getErrorFromErrorEvent(error));
      this.terminated = true;
    };
    // TODO - not clear when this would be called, for now just log in case it happens
    worker.onmessageerror = (event) => console.error(event); // eslint-disable-line

    return worker;
  }
}
