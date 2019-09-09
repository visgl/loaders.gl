/* global Worker, MessageChannel */
import {getWorkerURL, getTransferList} from './worker-utils';

let count = 0;

export default class WorkerThread {
  constructor({source, name = `web-worker-${count++}`, parse}) {
    const url = getWorkerURL(source);
    this.worker = new Worker(url, {name});
    this.name = name;

    if (parse) {
      const {port1, port2} = new MessageChannel();
      port1.onmessage = ({data}) => {
        parse(data).then(result => port1.postMessage(result, getTransferList(result)));
      };
      this.worker.postMessage({messagePort: port2}, [port2]);
    }
  }

  /**
   * Process binary data in a worker
   * @param data {data containing binary typed arrays} - data to be transferred to worker
   * @returns a Promise with data containing typed arrays transferred back from work
   */
  async process(data) {
    return new Promise((resolve, reject) => {
      this.worker.onmessage = e => resolve(e.data);
      this.worker.onerror = error => reject(error);
      const transferList = getTransferList(data);
      this.worker.postMessage(data, transferList);
    });
  }

  destroy() {
    this.worker.terminate();
    this.worker = null;
  }
}
