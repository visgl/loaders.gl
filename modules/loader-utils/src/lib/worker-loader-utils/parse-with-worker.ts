import type {WorkerJob, WorkerMessageType, WorkerMessagePayload} from '@loaders.gl/worker-utils';
import type {Loader, LoaderOptions, LoaderContext} from '../../types';
import {canProcessOnWorker, processOnWorker} from '@loaders.gl/worker-utils';
import parseToNodeImage from '@loaders.gl/images/lib/parsers/parse-to-node-image';

/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param options
 */
export function canParseWithWorker(loader: Loader, options?: LoaderOptions) {
  if (canProcessOnWorker(loader, options)) {
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
  context?: LoaderContext
) {
  processOnWorker(loader, data, options, parseOnMainThread);
}
