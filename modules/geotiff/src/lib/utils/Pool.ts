import type {FileDirectory} from 'geotiff';
/* global Worker */
// import Worker from 'web-worker:./decoder.worker.ts';

// https://developer.mozilla.org/en-US/docs/Web/API/NavigatorConcurrentHardware/hardwareConcurrency
// We need to give a different way of getting this for safari, so 4 is probably a safe bet
// for parallel processing in the meantime.  More can't really hurt since they'll just block
// each other and not the UI thread, which is the real benefit.
const defaultPoolSize = globalThis?.navigator?.hardwareConcurrency ?? 4;

/**
 * Pool for workers to decode chunks of the images.
 * This is a line-for-line copy of GeoTIFFs old implementation: https://github.com/geotiffjs/geotiff.js/blob/v1.0.0-beta.6/src/pool.js
 */
export default class Pool {
  workers: Worker[];
  idleWorkers: Worker[];
  waitQueue: any[];
  decoder: null;

  /**
   * @constructor
   * @param {Number} size The size of the pool. Defaults to the number of CPUs
   *                      available. When this parameter is `null` or 0, then the
   *                      decoding will be done in the main thread.
   */
  constructor(size = defaultPoolSize) {
    this.workers = [];
    this.idleWorkers = [];
    this.waitQueue = [];
    this.decoder = null;

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < size; ++i) {
      const w = new Worker('./decoder.worker');
      this.workers.push(w);
      this.idleWorkers.push(w);
    }
  }

  /**
   * Decode the given block of bytes with the set compression method.
   * @param {ArrayBuffer} buffer the array buffer of bytes to decode.
   * @returns {Promise.<ArrayBuffer>} the decoded result as a `Promise`
   */
  async decode(fileDirectory: FileDirectory, buffer: ArrayBuffer) {
    const currentWorker = await this.waitForWorker();
    return new Promise((resolve, reject) => {
      currentWorker.onmessage = (event) => {
        // this.workers.push(currentWorker);
        this.finishTask(currentWorker);
        resolve(event.data[0]);
      };
      currentWorker.onerror = (error) => {
        // this.workers.push(currentWorker);
        this.finishTask(currentWorker);
        reject(error);
      };
      currentWorker.postMessage(['decode', fileDirectory, buffer], [buffer]);
    });
  }

  async waitForWorker() {
    const idleWorker = this.idleWorkers.pop();
    if (idleWorker) {
      return idleWorker;
    }
    const waiter: any = {};
    const promise = new Promise((resolve) => {
      waiter.resolve = resolve;
    });

    this.waitQueue.push(waiter);
    return promise as Promise<Worker>;
  }

  async finishTask(currentWorker: Worker) {
    const waiter = this.waitQueue.pop();
    if (waiter) {
      waiter.resolve(currentWorker);
    } else {
      this.idleWorkers.push(currentWorker);
    }
  }

  destroy() {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.workers.length; ++i) {
      this.workers[i].terminate();
    }
  }
}
