// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DehydratedArrowTable, SplitArrowBuffersOptions} from '@loaders.gl/arrow/transport';
import {dehydrateArrowTable, hydrateArrowTable} from '@loaders.gl/arrow/transport';
import type {ArrayRowTable, ArrowTable, ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';
import type {CSVLoaderOptions} from '../csv-loader-options';

type CSVWorkerResult = ArrowTable | ObjectRowTable | ArrayRowTable | ColumnarTable;

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  data: DehydratedArrowTable;
};

/**
 * Serializes CSV worker results so Arrow tables survive structured clone.
 * @param result Parser result.
 * @param options Loader options.
 * @returns Worker-safe parser result.
 */
export function serializeCSVWorkerResult(result: unknown, options?: CSVLoaderOptions): unknown {
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
 * Deserializes CSV worker results into real Arrow tables on the main thread.
 * @param result Worker parser result.
 * @returns Hydrated parser result.
 */
export function deserializeCSVWorkerResult(result: unknown): CSVWorkerResult {
  if (isSerializedArrowTable(result)) {
    return {
      ...result,
      data: hydrateArrowTable(result.data)
    };
  }

  return result as CSVWorkerResult;
}

/**
 * Tests whether a result is an Arrow table wrapper.
 * @param value Value to test.
 * @returns True when the value is an Arrow table wrapper.
 */
function isArrowTable(value: unknown): value is ArrowTable {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as ArrowTable).shape === 'arrow-table' &&
      (value as ArrowTable).data &&
      'batches' in (value as ArrowTable).data
  );
}

/**
 * Gets the Arrow worker-result buffer copy mode from normalized or deprecated core options.
 * @param options Loader options.
 * @returns Buffer copy mode, or undefined for the Arrow transport default.
 */
function getWorkerTransferBufferCopyMode(
  options?: CSVLoaderOptions
): SplitArrowBuffersOptions['copy'] | undefined {
  return options?.core?.workerTransferBufferCopy ?? options?.workerTransferBufferCopy;
}

/**
 * Tests whether a result is a dehydrated Arrow table wrapper.
 * @param value Value to test.
 * @returns True when the value is a dehydrated Arrow table wrapper.
 */
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
