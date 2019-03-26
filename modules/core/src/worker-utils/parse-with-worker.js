import {toArrayBuffer} from '../javascript-utils/binary-utils';

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

  options = removeNontransferableOptions(options);

  const parse = (rawData, opts) =>
    new Promise((resolve, reject) => {
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

      const arraybuffer = toArrayBuffer(rawData);
      worker.postMessage({arraybuffer, opts}, [arraybuffer]);
    });

  return data ? parse(data, options) : parse;
}

function removeNontransferableOptions(options) {
  options = Object.assign({}, options);
  // log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  if (options.log !== null) {
    delete options.log;
  }
  return options;
}
