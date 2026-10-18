// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {DehydratedArrowTable, SplitArrowBuffersOptions} from '@loaders.gl/arrow/transport';
import {dehydrateArrowTable, hydrateArrowTable} from '@loaders.gl/arrow/transport';
import type {ArrowTable} from '@loaders.gl/schema';
import type {MVTLoaderOptions} from '../mvt-loader';

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  data: DehydratedArrowTable;
};

/**
 * Serializes MVT worker results so Arrow tables survive structured clone.
 * @param result Parser result.
 * @param options MVT loader options.
 * @returns Worker-safe parser result.
 */
export function serializeMVTWorkerResult(result: unknown, options?: MVTLoaderOptions): unknown {
  if (isArrowTable(result)) {
    const bufferCopyMode = getWorkerTransferBufferCopyMode(options);
    return {
      ...result,
      data: dehydrateArrowTable(result.data, bufferCopyMode ? {copy: bufferCopyMode} : undefined)
    };
  }

  return result;
}

/**
 * Deserializes MVT worker results into real Arrow tables on the main thread.
 * @param result Worker result.
 * @returns Hydrated worker result.
 */
export function deserializeMVTWorkerResult(result: unknown): unknown {
  if (isSerializedArrowTable(result)) {
    return {
      ...result,
      data: hydrateArrowTable(result.data)
    };
  }

  return result;
}

function isArrowTable(value: unknown): value is ArrowTable {
  const table = value as ArrowTable;
  return Boolean(
    table &&
      typeof table === 'object' &&
      table.shape === 'arrow-table' &&
      table.data &&
      'batches' in table.data
  );
}

function isSerializedArrowTable(value: unknown): value is SerializedArrowTable {
  const table = value as SerializedArrowTable;
  return Boolean(
    table &&
      typeof table === 'object' &&
      table.shape === 'arrow-table' &&
      table.data &&
      table.data.transport === 'arrow-js'
  );
}

function getWorkerTransferBufferCopyMode(
  options?: MVTLoaderOptions
): SplitArrowBuffersOptions['copy'] | undefined {
  return options?.core?.workerTransferBufferCopy ?? options?.workerTransferBufferCopy;
}
