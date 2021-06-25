import type {
  WorkerObject,
  WorkerOptions,
  WorkerMessageType,
  WorkerMessagePayload
} from '../../types';
import type WorkerJob from '../worker-farm/worker-job';
import WorkerFarm from '../worker-farm/worker-farm';
import {removeNontransferableOptions} from '../worker-utils/remove-nontransferable-options';
import {getWorkerURL, getWorkerName} from './get-worker-url';

/**
 * Determines if we can parse with worker
 * @param loader
 * @param data
 * @param options
 */
export function canProcessWithWorker(worker: WorkerObject, options?: WorkerOptions) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }

  return worker.worker && options?.worker;
}

/**
 * This function expects that the worker thread sends certain messages,
 * Creating such a worker can be automated if the worker is wrapper by a call to
 * createWorker in @loaders.gl/worker-utils.
 */
export async function processOnWorker(
  worker: WorkerObject,
  data: any,
  options: WorkerOptions = {},
  processOnMainThread?: Function
): Promise<any> {
  const name = getWorkerName(worker);
  const url = getWorkerURL(worker, options);

  const workerFarm = WorkerFarm.getWorkerFarm(options);
  const workerPool = workerFarm.getWorkerPool({name, url});

  const job = await workerPool.startJob(worker.name, onMessage.bind(null, processOnMainThread));

  // Kick off the processing in the worker
  const transferableOptions = removeNontransferableOptions(options);
  job.postMessage('process', {input: data, options: transferableOptions});

  const result = await job.result;
  return result.result;
}

/**
 * Job completes when we receive the result
 * @param job
 * @param message
 */
async function onMessage(
  processOnMainThread,
  job: WorkerJob,
  type: WorkerMessageType,
  payload: WorkerMessagePayload
) {
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
