// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  canProcessOnWorker,
  isBrowser,
  processOnWorker,
  processOnWorkerInBatches
} from '@loaders.gl/worker-utils';
import type {DataType} from '../../types';
import type {
  Loader,
  LoaderWithParser,
  StrictLoaderOptions,
  LoaderContext
} from '../../loader-types';

type ParseOnMainThread = (
  arrayBuffer: ArrayBuffer,
  loaders?: Loader | Loader[] | StrictLoaderOptions,
  options?: StrictLoaderOptions,
  context?: LoaderContext
) => Promise<unknown>;

/**
 * Determines if a loader can parse with worker
 * @param loader
 * @param options
 */
export function canParseWithWorker(loader: Loader, options?: StrictLoaderOptions) {
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
 * Determines whether an atomic parse should use a worker, including optional loader work estimates.
 * @param loader Loader metadata or parser-bearing loader.
 * @param data Original parse input, before materialization.
 * @param options Loader and worker options.
 * @param context Loader context.
 * @param estimateLoader Optional metadata loader that owns the estimate hook.
 */
export function shouldParseWithWorker(
  loader: Loader,
  data: DataType,
  options?: StrictLoaderOptions,
  context?: LoaderContext,
  estimateLoader: Loader = loader
): boolean {
  if (!canParseWithWorker(loader, options)) {
    return false;
  }

  if (options?.core?.worker !== 'auto' || !estimateLoader.getWorkerEstimate) {
    return true;
  }

  try {
    const estimate = estimateLoader.getWorkerEstimate(data, options, context);
    if (estimate === undefined || !Number.isFinite(estimate) || estimate < 0 || estimate > 1) {
      return true;
    }
    return estimate >= (options.core?.workerThreshold ?? 0.1);
  } catch {
    // Estimation must never make a previously worker-capable parse fail.
    return true;
  }
}

/**
 * this function expects that the worker function sends certain messages,
 * this can be automated if the worker is wrapper by a call to createLoaderWorker in @loaders.gl/loader-utils.
 * @param loader Loader metadata used to select the worker pool.
 * @param data Input transferred to the worker.
 * @param options Loader and worker options.
 * @param context Serializable loader context.
 * @param parseOnMainThread Callback for worker requests that must run on the calling thread.
 * @param signal Optional cancellation signal for this worker job.
 */
export async function parseWithWorker(
  loader: Loader,
  data: any,
  options?: StrictLoaderOptions,
  context?: LoaderContext,
  parseOnMainThread?: ParseOnMainThread,
  signal?: AbortSignal
) {
  const workerSignal = signal || getWorkerAbortSignal(options);
  const result = await processOnWorker(
    loader,
    data,
    {...getWorkerOptions(options), signal: workerSignal},
    {
      process: async (input, processOptions, _workerContext, parseContext) => {
        if (!parseOnMainThread) {
          throw new Error('Worker not set up to parse on main thread');
        }
        const mainThreadContext = context
          ? ({...context, ...(parseContext || {})} as LoaderContext)
          : undefined;
        return await callParseOnMainThread(
          parseOnMainThread,
          input,
          processOptions,
          mainThreadContext
        );
      }
    },
    getSerializableLoaderContext(context)
  );
  return isLoaderWithWorkerResultDeserializer(loader)
    ? loader.deserializeWorkerResult(result, options, context)
    : result;
}

/**
 * Parses an input iterator through one stateful worker session.
 * @param loader Parser-bearing loader with a batched worker implementation.
 * @param inputIterator Input fragments to stream to the worker.
 * @param options Loader and worker options.
 * @param context Serializable loader context.
 * @param parseOnMainThread Callback for worker requests that must run on the calling thread.
 * @param signal Optional cancellation signal for this worker job.
 */
export async function* parseWithWorkerInBatches(
  loader: LoaderWithParser,
  inputIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: StrictLoaderOptions,
  context?: LoaderContext,
  parseOnMainThread?: ParseOnMainThread,
  signal?: AbortSignal
): AsyncIterable<unknown> {
  const workerSignal = signal || getWorkerAbortSignal(options);
  const outputIterator = processOnWorkerInBatches(
    loader,
    inputIterator,
    {...getWorkerOptions(options), signal: workerSignal},
    {
      process: async (input, processOptions, _workerContext, parseContext) => {
        if (!parseOnMainThread) {
          throw new Error('Worker not set up to parse on main thread');
        }
        const mainThreadContext = context
          ? ({...context, ...(parseContext || {})} as LoaderContext)
          : undefined;
        return await callParseOnMainThread(
          parseOnMainThread,
          input,
          processOptions,
          mainThreadContext
        );
      }
    },
    getSerializableLoaderContext(context)
  );

  for await (const batch of outputIterator) {
    yield loader.deserializeWorkerBatch
      ? loader.deserializeWorkerBatch(batch, options, context)
      : batch;
  }
}

/** Returns the loader-specific abort signal used to cancel a worker job. */
function getWorkerAbortSignal(options?: StrictLoaderOptions): AbortSignal | undefined {
  const parquetSignal = (options as {parquet?: {signal?: unknown}} | undefined)?.parquet?.signal;
  if (typeof AbortSignal !== 'undefined' && parquetSignal instanceof AbortSignal) {
    return parquetSignal;
  }
  return undefined;
}

/**
 * Calls either the legacy two-argument parse callback or the loader-utils callback.
 * @param parseOnMainThread Main-thread parse callback.
 * @param input Data to parse on the main thread.
 * @param options Loader options from the worker.
 * @param context Loader context merged from the worker and caller.
 */
function callParseOnMainThread(
  parseOnMainThread: ParseOnMainThread,
  input: ArrayBuffer,
  options?: StrictLoaderOptions,
  context?: LoaderContext
): Promise<unknown> {
  if (parseOnMainThread.length <= 2) {
    return parseOnMainThread(input, options);
  }
  return parseOnMainThread(input, undefined, options, context);
}

/**
 * Create worker options with deprecated top-level worker fields available to worker-utils.
 * @param options
 */
function getWorkerOptions(options: StrictLoaderOptions = {}) {
  const serializedOptions = JSON.parse(JSON.stringify(options));
  const workerOptions = {
    ...serializedOptions.core,
    ...serializedOptions
  };
  // The decision has already been made before dispatch, so worker runtimes should
  // receive the established boolean form even when the caller selected `auto`.
  if (workerOptions.worker === 'auto') {
    workerOptions.worker = true;
  }
  return workerOptions;
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
function shouldParseCSVWithWorker(options?: StrictLoaderOptions): boolean {
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
