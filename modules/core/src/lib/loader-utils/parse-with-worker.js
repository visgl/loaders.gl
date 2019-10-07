import {toArrayBuffer} from '../../javascript-utils/binary-utils';
import WorkerFarm from '../../worker-utils/worker-farm';
import {getTransferList} from '../../worker-utils/get-transfer-list';
import {parse} from '../parse';

export function canParseWithWorker(loader, data, options, context) {
  const loaderOptions = options && options[loader.id];
  if (options.worker && loaderOptions && loaderOptions.workerUrl) {
    return loader.useWorker ? loader.useWorker(options) : true;
  }
  return false;
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default function parseWithWorker(loader, data, options, context) {
  const loaderOptions = options && options[loader.id];
  const {workerUrl} = loaderOptions || {};

  // Mark as URL
  const workerSource = `url(${workerUrl})`;
  const workerName = loader.name;

  const workerFarm = getWorkerFarm(options);

  // options.log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  options = JSON.parse(JSON.stringify(options));

  return workerFarm.process(workerSource, `loaders.gl-${workerName}`, {
    arraybuffer: toArrayBuffer(data),
    options, // __VERSION__ is injected by babel-plugin-version-inline
    /* global __VERSION__ */ source: `loaders.gl@${__VERSION__}`, // Lets worker ignore unrelated messages
    type: 'parse' // For future extension
  });
}

let _workerFarm = null;

// Create a single instance of a worker farm
function getWorkerFarm(options = {}) {
  const props = {};
  if (options.maxConcurrency) {
    props.maxConcurrency = options.maxConcurrency;
  }
  if (options.onDebug) {
    props.onDebug = options.onDebug;
  }

  if (!_workerFarm) {
    _workerFarm = new WorkerFarm({onMessage: onWorkerMessage});
  }
  _workerFarm.setProps(props);

  return _workerFarm;
}

async function onWorkerMessage({worker, data, resolve, reject}) {
  switch (data.type) {
    case 'done':
      resolve(data.result);
      break;

    case 'parse':
      try {
        const result = await parse(data.arraybuffer, data.options, data.url);
        worker.postMessage({type: 'parse-done', id: data.id, result}, getTransferList(result));
      } catch (error) {
        worker.postMessage({type: 'parse-error', id: data.id, message: error.message});
      }
      break;

    case 'error':
      reject(data.message);
      break;

    default:
    // TODO - is this not an error case? Log a warning?
  }
}
