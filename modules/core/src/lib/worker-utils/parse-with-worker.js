import {toArrayBuffer} from '../../javascript-utils/binary-utils';
import WorkerFarm from './worker-farm';

import {removeNontransferableValues} from './worker-utils';

let _workerFarm = null;

function getWorkerFarm(options = {}) {
  const props = {};
  props.maxConcurrency = options.maxConcurrency || 5;
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

  // Since the `options` object is "shared" (contains options for other purposes),
  // it can contain functions etc that need to be stripped
  options = removeNontransferableValues(options);

  const result = await workerFarm.process(workerSource, `loaders.gl-${workerName}`, {
    arraybuffer: toArrayBuffer(data),
    options,
    source: 'loaders.gl', // Lets worker ignore unrelated messages
    type: 'process' // For future extension
  });

  switch (result.type) {
    case 'done':
      return result.result;

    case 'error':
      throw new Error(result.message);

    default:
      // TODO - is this not an error case? Log a warning?
      return result;
  }
}
