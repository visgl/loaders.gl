import assert from '../env-utils/assert';
import WorkerFarm from './worker-farm';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createLoaderWorker in @loaders.gl/loader-utils.
 */
export function processOnWorker(worker, data, options = {}) {
  const workerOptions = {...worker.options[worker.id], ...options[worker.id]};
  const workerUrl =
    options.worker === 'local' ? workerOptions.localWorkerUrl : workerOptions.workerUrl;
  assert(workerUrl, 'processOnWorker: Empty worker URL');

  // Mark as URL
  const workerSource = `url(${workerUrl})`;
  const workerName = worker.name;

  const workerFarm = getWorkerFarm(options);

  // options.log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  options = JSON.parse(JSON.stringify(options));

  const warning = worker.version !== VERSION ? `(core version ${VERSION})` : '';

  return workerFarm.process(workerSource, `${workerName}-worker@${worker.version}${warning}`, {
    data,
    options,
    source: `loaders.gl@${VERSION}`, // Lets worker ignore unrelated messages
    type: 'parse' // TODO - For future extension
  });
}

let _workerFarm = null;

// Create a single instance of a worker farm
export function getWorkerFarm(options = {}) {
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
    _workerFarm = new WorkerFarm({});
  }
  _workerFarm.setProps(props);

  return _workerFarm;
}
