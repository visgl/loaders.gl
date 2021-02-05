/** @typedef {import('../../types').WorkerObject} WorkerObject */
import WorkerFarm from './worker-farm';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/worker-utils.
 */
export function processOnWorker(worker, data, options = {}) {
  const workerUrl = buildWorkerURL(worker, options);

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

/**
 * Generate a worker URL:
 * - a published worker on unpkg CDN
 * - a local test worker
 * - overridden by user
 * @param {WorkerObject} worker
 * @param {object} options
 */
function buildWorkerURL(worker, options) {
  const workerOptions = (options && options[worker.id]) || {};

  const workerFile = `${worker.id}-worker.js`;

  // If url not provided, load from CDN
  if (!workerOptions.workerUrl) {
    // GENERATE
    return `https://unpkg.com/@loaders.gl/${worker.module}@${worker.version}/dist/${workerFile}`;
  }

  // If URL is test, generate local loaders.gl url
  if (workerOptions.workerUrl === 'test') {
    return `modules/${worker.module}/dist/${workerFile}`;
  }

  // Allow user to override location
  return workerOptions.workerUrl;
}
