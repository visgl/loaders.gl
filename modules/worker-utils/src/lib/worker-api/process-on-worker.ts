import type {WorkerObject} from '../../types';
import WorkerFarm from '../worker-farm/worker-farm';
import {
  getWorkerObjectURL,
  getWorkerObjectName,
  removeNontransferableOptions
} from './worker-object-utils';
/**
 * This function expects that the worker thread sends certain messages,
 * Creating such a worker can be automated if the worker is wrapper by a call to
 * createWorker in @loaders.gl/worker-utils.
 */
export async function processOnWorker(
  worker: WorkerObject,
  data: any,
  options: object = {}
): Promise<any> {
  const name = getWorkerObjectName(worker);
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
