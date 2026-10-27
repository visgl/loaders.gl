// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeArrowWorkerTable,
  deserializeArrowWorkerTable
} from '@loaders.gl/core/schema-utils/arrow-transport';

/** Transfers owned Arrow columns or WKB buffers, with small SHP/DBF header envelopes. */
export function serializeShapefileWorkerResult(result: any): unknown {
  if (result?.shape === 'arrow-table') return serializeArrowWorkerTable(result);
  if (
    Array.isArray(result) &&
    result.every(value => value === null || value instanceof Uint8Array)
  ) {
    return {transport: 'shp-wkb', geometries: result.map(value => value?.slice() ?? null)};
  }
  if (result && 'geometries' in result) {
    return {
      ...(serializeShapefileWorkerResult(result.geometries) as object),
      header: result.header,
      progress: result.progress,
      currentIndex: result.currentIndex,
      error: result.error
    };
  }
  if (result && ('magic' in result || 'nRecords' in result))
    return {transport: 'shapefile-header', header: result};
  throw new Error('Shapefile workers require Arrow columns or WKB buffers');
}

/** Restores Arrow instances and binary geometry envelopes without accepting decoded row payloads. */
export function deserializeShapefileWorkerResult<T>(result: any): T {
  if (result?.shape === 'arrow-table') return deserializeArrowWorkerTable(result);
  if (result?.transport === 'shapefile-header') return result.header as T;
  if (result?.transport === 'shp-wkb') {
    return (
      result.header
        ? {
            header: result.header,
            geometries: result.geometries,
            ...(result.progress ? {progress: result.progress} : {}),
            ...(result.currentIndex !== undefined ? {currentIndex: result.currentIndex} : {}),
            ...(result.error !== undefined ? {error: result.error} : {})
          }
        : result.geometries
    ) as T;
  }
  throw new Error('Shapefile workers require Arrow columns or WKB buffers');
}

/** Serializes one Arrow, binary geometry, or header batch. */
export const serializeShapefileWorkerBatch = serializeShapefileWorkerResult;
/** Hydrates one Arrow, binary geometry, or header batch. */
export const deserializeShapefileWorkerBatch = deserializeShapefileWorkerResult;
