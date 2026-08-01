// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoadWorker, WorkerOptions} from '../../types';
import {NodeWorker, NodeWorkerType} from '../node/worker_threads';
import {isBrowser} from '../env-utils/globals';
import {assert} from '../env-utils/assert';
import {getLoadableWorkerURL} from '../worker-utils/get-loadable-worker-url';
import {getTransferList} from '../worker-utils/get-transfer-list';

const NOOP = () => {};

/** Worker thread construction options. */
export type WorkerThreadProps = {
  /** Human-readable worker thread name. */
  name: string;
  /** Inline worker source used for source-backed browser or Node.js workers. */
  source?: string;
  /** Worker script URL used for URL-backed browser or Node.js workers. */
  url?: string;
  /** Lazily resolves a fallback worker URL if loadWorker is unavailable. */
  getUrl?: () => string;
  /** Creates a browser Worker instance without going through a URL string. */
  loadWorker?: LoadWorker;
  /** Worker options forwarded to loadWorker. */
  loadWorkerOptions?: WorkerOptions;
};

/**
 * Represents one worker thread
 */
export default class WorkerThread {
  /** Human-readable worker thread name. */
  readonly name: string;
  /** Inline worker source used for source-backed browser or Node.js workers. */
  readonly source: string | undefined;
  /** Worker script URL used for URL-backed browser or Node.js workers. */
  readonly url: string | undefined;
  /** Lazily resolves a fallback worker URL if loadWorker is unavailable. */
  readonly getUrl: (() => string) | undefined;
  /** Creates a browser Worker instance without going through a URL string. */
  readonly loadWorker: LoadWorker | undefined;
  /** Worker options forwarded to loadWorker. */
  readonly loadWorkerOptions: WorkerOptions | undefined;
  /** Whether this worker thread has been terminated. */
  terminated: boolean = false;
  /** Browser or Node.js worker instance. */
  worker: Worker | NodeWorkerType;
  /** Callback invoked when this worker posts a protocol message. */
  onMessage: (message: any) => void;
  /** Callback invoked when this worker errors. */
  onError: (error: Error) => void;

  private _loadableURL: string = '';

  /** Checks if workers are supported on this platform */
  static isSupported(): boolean {
    return (
      (typeof Worker !== 'undefined' && isBrowser) ||
      (typeof NodeWorker !== 'undefined' && !isBrowser)
    );
  }

  /**
   * @param props Worker thread properties.
   */
  constructor(props: WorkerThreadProps) {
    const {name, source, url, getUrl, loadWorker, loadWorkerOptions} = props;
    assert(source || url || getUrl || loadWorker); // A worker source must be defined
    this.name = name;
    this.source = source;
    this.url = url;
    this.getUrl = getUrl;
    this.loadWorker = loadWorker;
    this.loadWorkerOptions = loadWorkerOptions;
    this.onMessage = NOOP;
    this.onError = error => console.log(error); // eslint-disable-line

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

  /** Keeps this worker from preventing Node.js process exit while idle. */
  unref(): void {
    if (!isBrowser && typeof (this.worker as NodeWorkerType).unref === 'function') {
      (this.worker as NodeWorkerType).unref();
    }
  }

  /** Keeps this worker alive while it is actively processing a job. */
  ref(): void {
    if (!isBrowser && typeof (this.worker as NodeWorkerType).ref === 'function') {
      (this.worker as NodeWorkerType).ref();
    }
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
    message += `worker ${this.name} from ${this.url || 'loadWorker'}. `;
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
    if (this.loadWorker) {
      try {
        const worker = this.loadWorker(this.loadWorkerOptions);
        if (worker) {
          return this._initializeBrowserWorker(worker);
        }
      } catch (error) {
        if (!this.source && !this.url && !this.getUrl) {
          throw error;
        }
      }
    }

    const url = this.url || this.getUrl?.();
    this._loadableURL = getLoadableWorkerURL({source: this.source, url});
    const worker = new Worker(this._loadableURL, {name: this.name});

    return this._initializeBrowserWorker(worker);
  }

  /**
   * Attach worker protocol event handlers to a browser Worker.
   */
  _initializeBrowserWorker(worker: Worker): Worker {
    worker.onmessage = event => {
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
    worker.onmessageerror = event => console.error(event); // eslint-disable-line

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
      const type = this.url.endsWith('.ts') || this.url.endsWith('.mjs') ? 'module' : 'commonjs';
      // console.log('Starting work from', url);
      // @ts-expect-error type is not known
      worker = new NodeWorker(url, {eval: false, type});
    } else if (this.source) {
      worker = new NodeWorker(this.source, {eval: true});
    } else {
      throw new Error('no worker');
    }
    worker.on('message', data => {
      // console.error('message', data);
      this.onMessage(data);
    });
    worker.on('error', error => {
      this.onError(error as Error);
    });
    worker.on('exit', _code => {
      // console.error('exit', code);
    });
    return worker;
  }
}
