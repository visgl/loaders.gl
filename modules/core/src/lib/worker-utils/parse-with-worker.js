import {toArrayBuffer} from '../../javascript-utils/binary-utils';
import WorkerFarm from './worker-farm';

let _workerFarm = null;

function getWorkerFarm(options = {}) {
  let props = null;
  if (options.maxConcurrency) {
    props = {};
    props.maxConcurrency = options.maxConcurrency;
  }
  if (options.onDebug) {
    props = props || {};
    props.onDebug = options.onDebug;
  }

  if (_workerFarm) {
    _workerFarm.setProps(props);
  } else {
    _workerFarm = new WorkerFarm(props || {});
  }

  return _workerFarm;
}

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

function removeNontransferableOptions(options) {
  options = Object.assign({}, options);
  // log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  if (options.log !== null) {
    delete options.log;
  }
  return options;
}
