/* global Worker, MessageChannel */
import {getWorkerURL, getTransferList} from './worker-utils';
import {isLoaderObject} from '../lib/loader-utils/normalize-loader';
import assert from '../utils/assert';

let count = 0;

export default class WorkerThread {
  constructor({source, name = `web-worker-${count++}`, messagePort}) {
    const url = getWorkerURL(source);
    this.worker = new Worker(url, {name});
    this.name = name;
    this.loaders = {};

    if (messagePort) {
      // Listen to an external message port
      this.worker.postMessage({__port: messagePort}, [messagePort]);
    }
  }

  /**
   * Process binary data in a worker
   * @param data {data containing binary typed arrays} - data to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(data) {
    data.options = this._processOptions(data.options);

    return new Promise((resolve, reject) => {
      this.worker.onmessage = e => resolve(e.data);
      this.worker.onerror = error => reject(error);
      const transferList = getTransferList(data);
      this.worker.postMessage(data, transferList);
    });
  }

  destroy() {
    for (const key in this.loaders) {
      this.loaders[key].worker.destroy();
    }
    this.worker.terminate();
    this.worker = null;
  }

  _processOptions(options = {}) {
    const result = {};
    for (const key in options) {
      let value = options[key];
      if (isLoaderObject(value)) {
        if (!this.loaders[key]) {
          this._registerLoader(value);
        }
        value = `loader#${value.name}`;
      }
      result[key] = value;
    }
    return result;
  }

  _registerLoader(loader) {
    assert(loader.worker, 'loader dependency is not worker enabled');

    const messageChannel = new MessageChannel();
    const workerLoader = {
      name: loader.name,
      extensions: loader.extensions,
      port: messageChannel.port1
    };

    // register port with the current worker
    this.worker.postMessage(
      {
        __loader: workerLoader
      },
      [messageChannel.port1]
    );

    // create child process
    workerLoader.worker = new WorkerThread({
      source: loader.worker,
      name: `${this.name}-${loader.name}`,
      messagePort: messageChannel.port2
    });

    this.loaders[loader.name] = workerLoader;
    return workerLoader;
  }
}
