import {toArrayBuffer} from '../javascript-utils/binary-utils';
import WorkerFarm from '../worker-utils/worker-farm';
import {parse} from './parse';

import {removeNontransferableValues, getTransferList} from '../worker-utils/worker-utils';

let _workerFarm = null;

function getWorkerFarm(options = {}) {
  const props = {};
  if (options.maxConcurrency) {
    props.maxConcurrency = options.maxConcurrency;
  }
  if (options.onDebug) {
    props.onDebug = options.onDebug;
  }

  _workerFarm =
    _workerFarm ||
    new WorkerFarm({
      onMessage: onWorkerMessage
    });
  _workerFarm.setProps(props);

  return _workerFarm;
}

function onWorkerMessage({worker, data, resolve, reject}) {
  switch (data.type) {
    case 'done':
      return resolve(data.result);

    case 'process':
      return parse(data.arraybuffer, data.options, data.url)
        .then(result =>
          worker.postMessage({type: 'process-done', id: data.id, result}, getTransferList(result))
        )
        .catch(error =>
          worker.postMessage({type: 'process-error', id: data.id, message: error.message})
        );

    case 'error':
      return reject(data.message);

    default:
      // TODO - is this not an error case? Log a warning?
      return resolve(data);
  }
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default function parseWithWorker(workerSource, workerName, data, options) {
  const workerFarm = getWorkerFarm(options);

  // Note that options are documented for each loader, we are just passing them through to the worker
  // `options` can contain functions etc that can not be serialized/deserialized, they need to be stripped
  // TODO - Since the `options` object can contain options not intended for the loader, we currently cannot
  // treat this as an error case, but we just silently remove such values.
  options = removeNontransferableValues(options);

  return workerFarm.process(workerSource, `loaders.gl-${workerName}`, {
    arraybuffer: toArrayBuffer(data),
    options,
    source: 'loaders.gl', // Lets worker ignore unrelated messages
    type: 'process' // For future extension
  });
}
