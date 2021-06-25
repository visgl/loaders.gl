import type {WorkerJob, WorkerMessageType, WorkerMessagePayload} from '@loaders.gl/worker-utils';
import type {Loader, LoaderOptions, LoaderContext} from '../../types';
import {WorkerFarm, getWorkerURL} from '@loaders.gl/worker-utils';

/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param options
 */
export function canParseWithWorker(loader: Loader, options?: LoaderOptions) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }

  return loader.worker && options?.worker;
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createLoaderWorker in @loaders.gl/loader-utils.
 */
export async function parseWithWorker(
  loader: Loader,
  data,
  options?: LoaderOptions,
  context?: LoaderContext,
  parseOnMainThread?: Function
) {
  const name = loader.id; // TODO
  const url = getWorkerURL(loader, options);

  const workerFarm = WorkerFarm.getWorkerFarm(options);
  const workerPool = workerFarm.getWorkerPool({name, url});

  // options.log object contains functions which cannot be transferred
  // TODO - decide how to handle logging on workers
  options = JSON.parse(JSON.stringify(options));

  const job = await workerPool.startJob(
    'process-on-worker',
    onMessage.bind(null, parseOnMainThread)
  );

  job.postMessage('process', {
    // @ts-ignore
    input: data,
    options
  });

  const result = await job.result;
  return await result.result;
}

/**
 * Handle worker's responses to the main thread
 * @param job
 * @param type
 * @param payload
 */
async function onMessage(
  parseOnMainThread,
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

    case 'process':
      // Worker is asking for main thread to parseO
      const {id, input, options} = payload;
      try {
        const result = await parseOnMainThread(input, options);
        job.postMessage('done', {id, result});
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        job.postMessage('error', {id, error: message});
      }
      break;

    default:
      // eslint-disable-next-line
      console.warn(`parse-with-worker unknown message ${type}`);
  }
}
