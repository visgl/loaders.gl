import getTransferList from './get-transfer-list';

const workerCache = new Map();

/* global Worker, Blob, URL */
function getWorker(workerSource) {
  let workerURL = workerCache.get(workerSource);
  if (!workerURL) {
    const blob = new Blob([workerSource], {type: 'application/javascript'});
    workerURL = URL.createObjectURL(blob);
    workerCache.set(workerSource, workerURL);
  }
  return new Worker(workerURL);
}

export default function parseWithWorker(workerSource, data, options) {
  const worker = getWorker(workerSource);

  const parse = (arraybuffer, opts) => new Promise((resolve, reject) => {
    worker.onmessage = evt => {
      switch (evt.data.type) {
      case 'done':
        resolve(evt.data.result);
        worker.terminate();
        break;

      case 'error':
        reject(new Error(evt.data.message));
        break;

      default:
      }
    };

    const transferList = getTransferList(arraybuffer);
    worker.postMessage({arraybuffer, opts}, transferList);
  });

  return data ? parse(data, options) : parse;
}
