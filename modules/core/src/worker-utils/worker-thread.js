/* global Worker, MessageChannel */
import {getWorkerURL, getTransferList} from './worker-utils';

let count = 0;

export default class WorkerThread {
  constructor({source, name = `web-worker-${count++}`, messagePort}) {
    const url = getWorkerURL(source);
    this.worker = new Worker(url, {name});
    this.name = name;

    if (messagePort) {
      // Listen to an external message port
      this.localPort = null;
      this.worker.postMessage({port: messagePort}, [messagePort]);
    } else {
      const messageChannel = new MessageChannel();
      this.localPort = messageChannel.port1;
      this.worker.postMessage({port: messageChannel.port2}, [messageChannel.port2]);
    }
  }

  /**
   * Process binary data in a worker
   * @param data {data containing binary typed arrays} - data to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(data) {
    if (!this.localPort) {
      // This thread was created to communicate with another worker
      throw new Error('Cannot post to this worker');
    }
    return new Promise((resolve, reject) => {
      this.localPort.onmessage = e => resolve(e.data);
      this.worker.onerror = error => reject(error);
      const transferList = getTransferList(data);
      this.localPort.postMessage(data, transferList);
    });
  }

  destroy() {
    this.worker.terminate();
    this.worker = null;
  }
}
