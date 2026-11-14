// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table} from 'apache-arrow';
import {
  serializeNativeArrowWorkerResult,
  deserializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import type {BinaryFeatureCollection, ColumnarTable, GeoJSONTable} from '@loaders.gl/core/schema';

type FlatGeobufWorkerResult = Table | GeoJSONTable | ColumnarTable | BinaryFeatureCollection;

/** Transfers native Arrow columns and leaves other supported shapes structured cloneable. */
export function serializeFlatGeobufWorkerResult(result: unknown): unknown {
  return result instanceof Table ? serializeNativeArrowWorkerResult(result) : result;
}

/** Rehydrates Arrow tables after worker transfer. */
export function deserializeFlatGeobufWorkerResult(result: unknown): FlatGeobufWorkerResult {
  if ((result as {transport?: string} | null)?.transport === 'arrow-table-columns') {
    return deserializeNativeArrowWorkerResult(result) as Table;
  }
  return result as FlatGeobufWorkerResult;
}
