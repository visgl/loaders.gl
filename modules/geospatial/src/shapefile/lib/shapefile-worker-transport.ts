// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DehydratedArrowTable, SplitArrowBuffersOptions} from '@loaders.gl/arrow/transport';
import {dehydrateArrowTable, hydrateArrowTable} from '@loaders.gl/arrow/transport';
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  data: DehydratedArrowTable;
};

/** Serializes Shapefile-family worker results so Arrow tables survive structured clone. */
export function serializeShapefileWorkerResult(result: unknown, options?: LoaderOptions): unknown {
  if (!isArrowTable(result)) {
    return result;
  }
  const bufferCopyMode = getWorkerTransferBufferCopyMode(options);
  return {
    ...result,
    data: dehydrateArrowTable(result.data, bufferCopyMode ? {copy: bufferCopyMode} : undefined)
  };
}

/** Deserializes a Shapefile-family worker result into a real Arrow table. */
export function deserializeShapefileWorkerResult<T>(result: unknown): T {
  if (isSerializedArrowTable(result)) {
    return {...result, data: hydrateArrowTable(result.data)} as T;
  }
  return result as T;
}

/** Serializes one Shapefile-family Arrow batch using the same transport as an atomic result. */
export const serializeShapefileWorkerBatch = serializeShapefileWorkerResult;

/** Deserializes one Shapefile-family Arrow batch. */
export const deserializeShapefileWorkerBatch = deserializeShapefileWorkerResult;

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
  options?: LoaderOptions
): SplitArrowBuffersOptions['copy'] | undefined {
  return options?.core?.workerTransferBufferCopy ?? options?.workerTransferBufferCopy;
}
