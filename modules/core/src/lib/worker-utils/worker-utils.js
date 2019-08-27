/* global URL, Blob */
// import webworkify from 'webworkify';

export function getTransferList(object, recursive = true, transfers = []) {
  if (!object) {
    // ignore
  } else if (object instanceof ArrayBuffer) {
    transfers.push(object);
  } else if (object.buffer && object.buffer instanceof ArrayBuffer) {
    // Typed array
    transfers.push(object.buffer);
  } else if (recursive && typeof object === 'object') {
    for (const key in object) {
      // Avoid perf hit - only go one level deep
      getTransferList(object[key], false, transfers);
    }
  }
  return transfers;
}

const workerURLCache = new Map();

// Creates a URL from worker source that can be used to create `Worker` instances
// Packages (and then caches) the result of `webworkify` as an "Object URL"
export function getWorkerURL(workerSource) {
  let workerURL = workerURLCache.get(workerSource);

  if (!workerURL) {
    const blob = new Blob([workerSource], {type: 'application/javascript'});
    // const blob = webworkify(workerSource, {bare: true});
    workerURL = URL.createObjectURL(blob);
    workerURLCache.set(workerSource, workerURL);
  }

  return workerURL;
}

export function removeNontransferableOptions(options) {
  options = Object.assign({}, options);
  // log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  if (options.log !== null) {
    delete options.log;
  }
  return options;
}
