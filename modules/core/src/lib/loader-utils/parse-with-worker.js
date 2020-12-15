import {_WorkerFarm as WorkerFarm, toArrayBuffer, getTransferList} from '@loaders.gl/loader-utils';
import {parse} from '../api/parse';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export function canParseWithWorker(loader, data, options, context) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }
  const loaderOptions = options && options[loader.id];
  if (
    (options.worker === 'local' && loaderOptions && loaderOptions.localWorkerUrl) ||
    (options.worker && loaderOptions && loaderOptions.workerUrl)
  ) {
    return loader.useWorker ? loader.useWorker(options) : true;
  }
  return false;
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default function parseWithWorker(loader, data, options, context) {
  const {worker} = options || {};
  const loaderOptions = (options && options[loader.id]) || {};
  const workerUrl = worker === 'local' ? loaderOptions.localWorkerUrl : loaderOptions.workerUrl;

  // Mark as URL
  const workerSource = `url(${workerUrl})`;
  const workerName = loader.name;

  const workerFarm = getWorkerFarm(options);

  // options.log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  options = JSON.parse(JSON.stringify(options));

  const warning = loader.version !== VERSION ? `(core version ${VERSION})` : '';

  return workerFarm.process(workerSource, `${workerName}-worker@${loader.version}${warning}`, {
    arraybuffer: toArrayBuffer(data),
    options,
    source: `loaders.gl@${VERSION}`, // Lets worker ignore unrelated messages
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

  if ('reuseWorkers' in options) {
    // @ts-ignore
    props.reuseWorkers = options.reuseWorkers;
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
