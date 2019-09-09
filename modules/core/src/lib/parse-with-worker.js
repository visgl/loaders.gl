import {toArrayBuffer} from '../javascript-utils/binary-utils';
import WorkerFarm from '../worker-utils/worker-farm';
import {parse} from './parse';

import {removeNontransferableValues} from '../worker-utils/worker-utils';

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
      parse: parseWorkerRequest
    });
  _workerFarm.setProps(props);

  return _workerFarm;
}

function parseWorkerRequest({arraybuffer, options = {}, url}) {
  return parse(arraybuffer, options, url);
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default async function parseWithWorker(workerSource, workerName, data, options) {
  const workerFarm = getWorkerFarm(options);

  // Note that options are documented for each loader, we are just passing them through to the worker
  // `options` can contain functions etc that can not be serialized/deserialized, they need to be stripped
  // TODO - Since the `options` object can contain options not intended for the loader, we currently cannot
  // treat this as an error case, but we just silently remove such values.
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
