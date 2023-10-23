// loaders.gl, MIT license

import {NodeWorker, NodeWorkerType} from '../node/worker_threads';
import {isBrowser} from '../env-utils/globals';
import {assert} from '../env-utils/assert';
import {getLoadableWorkerURL} from '../worker-utils/get-loadable-worker-url';
import {getTransferList} from '../worker-utils/get-transfer-list';

const NOOP = () => {};

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
  worker: Worker | NodeWorkerType;
  onMessage: (message: any) => void;
  onError: (error: Error) => void;

  private _loadableURL: string = '';

  /** Checks if workers are supported on this platform */
  static isSupported(): boolean {
    return (
      (typeof Worker !== 'undefined' && isBrowser) ||
      (typeof NodeWorker !== 'undefined' && !isBrowser)
    );
  }

  constructor(props: WorkerThreadProps) {
    const {name, source, url} = props;
    assert(source || url); // Either source or url must be defined
    this.name = name;
    this.source = source;
    this.url = url;
    this.onMessage = NOOP;
    this.onError = (error) => console.log(error); // eslint-disable-line

    this.worker = isBrowser ? this._createBrowserWorker() : this._createNodeWorker();
  }

  /**
   * Terminate this worker thread
   * @note Can free up significant memory
   */
  destroy(): void {
    this.onMessage = NOOP;
    this.onError = NOOP;
    this.worker.terminate(); // eslint-disable-line @typescript-eslint/no-floating-promises
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
   * @param event
   */
  _getErrorFromErrorEvent(event: ErrorEvent): Error {
    // Note Error object does not have the expected fields if loading failed completely
    // https://developer.mozilla.org/en-US/docs/Web/API/Worker#Event_handlers
    // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
    let message = 'Failed to load ';
    message += `worker ${this.name} from ${this.url}. `;
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
  _createBrowserWorker(): Worker {
    this._loadableURL = getLoadableWorkerURL({source: this.source, url: this.url});
    const worker = new Worker(this._loadableURL, {name: this.name});

    worker.onmessage = (event) => {
      if (!event.data) {
        this.onError(new Error('No data received'));
      } else {
        this.onMessage(event.data);
      }
    };
    // This callback represents an uncaught exception in the worker thread
    worker.onerror = (error: ErrorEvent): void => {
      this.onError(this._getErrorFromErrorEvent(error));
      this.terminated = true;
    };
    // TODO - not clear when this would be called, for now just log in case it happens
    worker.onmessageerror = (event) => console.error(event); // eslint-disable-line

    return worker;
  }

  /**
   * Creates a worker thread in node.js
   * @todo https://nodejs.org/api/async_hooks.html#async-resource-worker-pool
   */
  _createNodeWorker(): NodeWorkerType {
    let worker: NodeWorkerType;
    if (this.url) {
      // Make sure relative URLs start with './'
      const absolute = this.url.includes(':/') || this.url.startsWith('/');
      const url = absolute ? this.url : `./${this.url}`;
      // console.log('Starting work from', url);
      worker = new NodeWorker(url, {eval: false});
    } else if (this.source) {
      worker = new NodeWorker(this.source, {eval: true});
    } else {
      throw new Error('no worker');
    }
    worker.on('message', (data) => {
      // console.error('message', data);
      this.onMessage(data);
    });
    worker.on('error', (error) => {
      // console.error('error', error);
      this.onError(error);
    });
    worker.on('exit', (code) => {
      // console.error('exit', code);
    });
    return worker;
  }
}
