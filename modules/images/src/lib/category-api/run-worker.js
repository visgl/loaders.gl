import {WorkerFarm} from '@loaders.gl/worker-utils';

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/loader-utils.
 */
export default async function runWorker(workerSource, workerName, data, options = {}) {
  const workerFarm = getWorkerFarm(options);

  // removes functions which cannot be transferred
  options = JSON.parse(JSON.stringify(options));

  return await workerFarm.process(workerSource, `${workerName}-worker`, data);
}

let _workerFarm = null;

// Create a single instance of a worker farm
function getWorkerFarm(props = {}) {
  if (!_workerFarm) {
    _workerFarm = new WorkerFarm({maxConcurrency: 8, ...props});
  } else {
    _workerFarm.setProps(props);
  }
  return _workerFarm;
}
