// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoJSONTable,
  GeoJSONTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/gis';
import {parseArrowSync, parseArrowInBatches} from './parse-arrow';

// Parses arrow to a columnar table
export function parseGeoArrowSync(
  arrayBuffer,
  options?: {shape?: 'arrow-table' | 'geojson-table' | 'binary-geometry'}
): ArrowTable | GeoJSONTable {
  // | BinaryGeometry
  const table = parseArrowSync(arrayBuffer, {shape: 'arrow-table'}) as ArrowTable;
  switch (options?.shape) {
    case 'geojson-table': {
      if (!table.schema) {
        throw new Error('Arrow table is missing its schema');
      }
      return convertGeoArrowTableToGeoJSON(table.data, table.schema);
    }
    default:
      return table;
  }
}

/**
 */
export function parseGeoArrowInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>
): AsyncIterable<ArrowTableBatch | GeoJSONTableBatch> {
  // | BinaryGeometry
  return parseArrowInBatches(asyncIterator);
}
