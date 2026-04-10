import {canProcessOnWorker, isBrowser, processOnWorker} from '@loaders.gl/worker-utils';
import type {Loader, LoaderOptions, LoaderContext} from '../../loader-types';

type ParseOnMainThread = (
  arrayBuffer: ArrayBuffer,
  loaders?: Loader | Loader[] | LoaderOptions,
  options?: LoaderOptions,
  context?: LoaderContext
) => Promise<unknown>;

/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param options
 */
export function canParseWithWorker(loader: Loader, options?: LoaderOptions) {
  const workerOptions = getWorkerOptions(options);
  const nodeWorkers = workerOptions._nodeWorkers;
  if (!isBrowser && !nodeWorkers) {
    return false;
  }

  return Boolean(canProcessOnWorker(loader, workerOptions));
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createLoaderWorker in @loaders.gl/loader-utils.
 */
export async function parseWithWorker(
  loader: Loader,
  data: any,
  options?: LoaderOptions,
  context?: LoaderContext,
  parseOnMainThread?: ParseOnMainThread
) {
  return await processOnWorker(
    loader,
    data,
    getWorkerOptions(options),
    {
      process: async (input, processOptions, _workerContext, parseContext) => {
        if (!parseOnMainThread) {
          throw new Error('Worker not set up to parse on main thread');
        }
        const mainThreadContext = context
          ? ({...context, ...(parseContext || {})} as LoaderContext)
          : undefined;
        return await parseOnMainThread(input, undefined, processOptions, mainThreadContext);
      }
    },
    getSerializableLoaderContext(context)
  );
}

/**
 * Create worker options with deprecated top-level worker fields available to worker-utils.
 * @param options
 */
function getWorkerOptions(options: LoaderOptions = {}) {
  const serializedOptions = JSON.parse(JSON.stringify(options));
  return {
    ...serializedOptions.core,
    ...serializedOptions
  };
}

/**
 * Create a serializable loader context for worker jobs.
 * @param context
 */
function getSerializableLoaderContext(context?: LoaderContext) {
  if (!context) {
    return {};
  }
  const {fetch, loaders, _parse, _parseSync, _parseInBatches, ...serializableContext} = context;
  return JSON.parse(JSON.stringify(serializableContext));
}
