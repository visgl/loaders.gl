// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DehydratedArrowTable} from '@loaders.gl/arrow/transport';
import {dehydrateArrowTable, hydrateArrowTable} from '@loaders.gl/arrow/transport';
import type {ArrowTable} from '@loaders.gl/schema';

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  data: DehydratedArrowTable;
};

/**
 * Serializes CSV worker results so Arrow tables survive structured clone.
 * @param result Parser result.
 * @returns Worker-safe parser result.
 */
export function serializeCSVWorkerResult(result: unknown): unknown {
  if (isArrowTable(result)) {
    return {
      ...result,
      data: dehydrateArrowTable(result.data)
    };
  }

  return result;
}

/**
 * Deserializes CSV worker results into real Arrow tables on the main thread.
 * @param result Worker parser result.
 * @returns Hydrated parser result.
 */
export function deserializeCSVWorkerResult(result: unknown): unknown {
  if (isSerializedArrowTable(result)) {
    return {
      ...result,
      data: hydrateArrowTable(result.data)
    };
  }

  return result;
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
