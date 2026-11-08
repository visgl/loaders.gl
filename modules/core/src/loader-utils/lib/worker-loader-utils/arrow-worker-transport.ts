// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  dehydrateArrowTable,
  hydrateArrowTable,
  type DehydratedArrowTable,
  type SplitArrowBuffersOptions
} from '@math.gl/arrow';

type ArrowWorkerOptions = {
  core?: {workerTransferBufferCopy?: SplitArrowBuffersOptions['copy']};
  workerTransferBufferCopy?: SplitArrowBuffersOptions['copy'];
};
type SerializedArrowWorkerTable = {
  shape: 'arrow-table';
  data: DehydratedArrowTable;
  [key: string]: unknown;
};

/** Serializes Arrow columns with owned buffers so transfers cannot detach retained parser state. */
export function serializeArrowWorkerTable(result: unknown): unknown {
  if (!isArrowTableWrapper(result)) {
    throw new Error('Workers require Arrow table output');
  }
  const {data, ...metadata} = result;
  // Headers, sidecar indexes, and mesh indices can also retain parser-owned binary buffers.
  // Clone only this small envelope; the Arrow table always uses column-buffer transfer.
  return {
    ...structuredClone(metadata),
    data: dehydrateArrowTable(data, {copy: 'all'})
  };
}

/** Hydrates the column-buffer worker protocol; other wire formats are rejected. */
export function deserializeArrowWorkerTable(result: unknown): any {
  if (!isDehydratedArrowTableWrapper(result)) {
    throw new Error('Workers require Arrow column transport');
  }
  return {...result, data: hydrateArrowTable(result.data)};
}

/** Serializes any loaders.gl Arrow table wrapper for worker postMessage transport. */
export function serializeArrowWorkerResult(result: unknown, options?: unknown): unknown {
  if (!isArrowTableWrapper(result)) {
    return result;
  }
  const workerOptions = options as ArrowWorkerOptions | undefined;
  const bufferCopyMode =
    workerOptions?.core?.workerTransferBufferCopy ?? workerOptions?.workerTransferBufferCopy;
  return {
    ...result,
    data: dehydrateArrowTable(result.data, bufferCopyMode ? {copy: bufferCopyMode} : undefined)
  };
}

/** Rehydrates any loaders.gl Arrow table wrapper returned from worker postMessage transport. */
export function deserializeArrowWorkerResult(result: unknown): any {
  if (!isDehydratedArrowTableWrapper(result)) {
    return result;
  }
  return {...result, data: hydrateArrowTable(result.data)};
}

function isArrowTableWrapper(value: unknown): value is {shape: 'arrow-table'; data: arrow.Table} {
  const table = value as {shape?: unknown; data?: unknown} | null;
  return Boolean(
    table &&
      table.shape === 'arrow-table' &&
      table.data &&
      typeof table.data === 'object' &&
      'batches' in table.data
  );
}

function isDehydratedArrowTableWrapper(value: unknown): value is SerializedArrowWorkerTable {
  const table = value as SerializedArrowWorkerTable | null;
  return Boolean(
    table &&
      table.shape === 'arrow-table' &&
      table.data &&
      table.data.transport === 'arrow-js' &&
      Array.isArray(table.data.batches)
  );
}
