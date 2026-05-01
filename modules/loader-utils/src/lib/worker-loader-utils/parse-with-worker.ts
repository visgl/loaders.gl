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

  // Some Arrow table outputs need main-thread class instances; structured clone
  // preserves data but strips methods like `table.getChild()` from Arrow tables.
  if (
    (loader.id === 'excel' &&
      (options as {excel?: {shape?: string}} | undefined)?.excel?.shape === 'arrow-table') ||
    (loader.id === 'ply' &&
      (options as {ply?: {shape?: string}} | undefined)?.ply?.shape === 'arrow-table')
  ) {
    return false;
  }

  if (loader.id === 'csv' && !shouldParseCSVWithWorker(options)) {
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
  const result = await processOnWorker(
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
  return isLoaderWithWorkerResultDeserializer(loader)
    ? loader.deserializeWorkerResult(result, options, context)
    : result;
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
  const {fetch, loaders, coreApi, _parse, _parseSync, _parseInBatches, ...serializableContext} =
    context;
  return JSON.parse(JSON.stringify(serializableContext));
}

/**
 * Checks whether CSV options request Arrow output that can be transported from a worker.
 * @param options Loader options.
 * @returns True when CSV should parse on a worker.
 */
function shouldParseCSVWithWorker(options?: LoaderOptions): boolean {
  const csvOptions = options as {csv?: {shape?: string}; core?: {shape?: string}} | undefined;
  return (csvOptions?.csv?.shape ?? csvOptions?.core?.shape) === 'arrow-table';
}

/**
 * Tests whether a loader can deserialize worker results.
 * @param loader Loader object.
 * @returns True when the loader exposes a worker result deserializer.
 */
function isLoaderWithWorkerResultDeserializer(
  loader: Loader
): loader is Loader & Required<Pick<Loader, 'deserializeWorkerResult'>> {
  return (
    typeof (loader as Loader & {deserializeWorkerResult?: unknown}).deserializeWorkerResult ===
    'function'
  );
}
