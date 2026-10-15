// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, BinaryFeatureCollection, GeoJSONTable} from '@loaders.gl/schema';

type FlatGeobufWorkerResult = ArrowTable | GeoJSONTable | BinaryFeatureCollection;

type SerializedArrowTable = Omit<ArrowTable, 'data'> & {
  data: {
    shape: 'arrow-table';
    transport: 'arrow-ipc';
    data: Uint8Array;
  };
};

/** Serializes FlatGeobuf Arrow results into a structured-cloneable IPC payload. */
export function serializeFlatGeobufWorkerResult(result: unknown): unknown {
  if (!isArrowTable(result)) {
    return result;
  }
  return {
    ...result,
    data: {
      shape: 'arrow-table' as const,
      transport: 'arrow-ipc' as const,
      data: arrow.tableToIPC(result.data)
    }
  };
}

/** Rehydrates a FlatGeobuf Arrow result after it crosses the worker boundary. */
export function deserializeFlatGeobufWorkerResult(result: unknown): FlatGeobufWorkerResult {
  if (isSerializedArrowTable(result)) {
    return {...result, data: arrow.tableFromIPC(result.data.data)};
  }
  return result as FlatGeobufWorkerResult;
}

/** Returns true when a result wraps an Apache Arrow table. */
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

/** Returns true when a result contains the FlatGeobuf Arrow IPC transport format. */
function isSerializedArrowTable(value: unknown): value is SerializedArrowTable {
  const table = value as SerializedArrowTable;
  return Boolean(
    table &&
      typeof table === 'object' &&
      table.shape === 'arrow-table' &&
      table.data &&
      table.data.transport === 'arrow-ipc'
  );
}
