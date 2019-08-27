import {toArrayBuffer} from '../../javascript-utils/binary-utils';
import WorkerFarm from './worker-farm';

import {removeNontransferableOptions} from './worker-utils';

let _workerFarm = null;

function getWorkerFarm(options = {}) {
  const props = {};
  if (options.maxConcurrency) {
    props.maxConcurrency = options.maxConcurrency;
  }
  if (options.onDebug) {
    props.onDebug = options.onDebug;
  }

  _workerFarm = _workerFarm || new WorkerFarm({});
  _workerFarm.setProps(props);

  return _workerFarm;
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default async function parseWithWorker(workerSource, workerName, data, options) {
  const workerFarm = getWorkerFarm(options);

  options = removeNontransferableOptions(options);

  const result = await workerFarm.process(workerSource, workerName, {
    arraybuffer: toArrayBuffer(data),
    opts: options
  });

  switch (result.type) {
    case 'done':
      return result.result;

    case 'error':
      throw new Error(result.message);

    default:
      return result;
  }
}
