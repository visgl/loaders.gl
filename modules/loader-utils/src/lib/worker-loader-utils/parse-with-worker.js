/** @typedef {import('@loaders.gl/worker-utils').WorkerJob} WorkerJob */
/** @typedef {import('@loaders.gl/worker-utils/lib/worker-protocol/protocol').WorkerMessageType} WorkerMessageType */
/** @typedef {import('@loaders.gl/worker-utils/').WorkerMessagePayload} WorkerMessagePayload */
import {WorkerFarm, getWorkerObjectURL} from '@loaders.gl/worker-utils';

export function canParseWithWorker(loader, data, options, context) {
  if (!WorkerFarm.isSupported()) {
    return false;
  }

  if (loader.worker && options.worker) {
    return loader.useWorker ? loader.useWorker(options) : true;
  }
  return false;
}

/**
 * This function expects that the worker function sends certain messages,
 * That can be automated if the worker is wrapped by a call to `createLoaderWorker`
 */
export async function parseWithWorker(loader, data, options, context, parseOnMainThread) {
  const name = loader.id; // TODO
  const url = getWorkerObjectURL(loader, options);

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
 * @param {WorkerJob} job
 * @param {WorkerMessageType} type
 * @param {WorkerMessagePayload} payload
 */
async function onMessage(parseOnMainThread, job, type, payload) {
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
        job.postMessage('error', {id, error: error.message});
      }
      break;

    default:
      // eslint-disable-next-line
      console.warn(`parse-with-worker unknown message ${type}`);
  }
}
