/** @typedef {import('./process-on-worker')} types */
/** @typedef {import('../worker-protocol/protocol').WorkerMessageData} WorkerMessageData */
/** @typedef {import('../worker-farm/worker-job').default} WorkerJob */
import WorkerFarm from '../worker-farm/worker-farm';
import {
  getWorkerObjectURL,
  getWorkerObjectName,
  removeNontransferableOptions
} from './worker-object-utils';

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createWorker in @loaders.gl/worker-utils.
 * @type {types['processOnWorker']}
 */
export async function processOnWorker(worker, data, options = {}) {
  const name = getWorkerObjectName(worker, options);
  const url = getWorkerObjectURL(worker, options);

  const workerFarm = WorkerFarm.getWorkerFarm(options);
  const workerPool = workerFarm.getWorkerPool({name, url});

  const job = await workerPool.startJob(
    worker.name,
    /**
     * Job completes when we receive the result
     * @param {WorkerJob} job_
     * @param {WorkerMessageData} message
     */
    (job_, type, payload) => {
      switch (type) {
        case 'done':
          job.done(payload);
          break;
        case 'error':
          job.error(payload.error);
          break;
        default:
          job.error(type);
          break;
      }
    }
  );

  // Kick off the processing in the worker
  const transferableOptions = removeNontransferableOptions(options);
  job.postMessage('process', {input: data, options: transferableOptions});

  const result = await job.result;
  return result.result;
}
