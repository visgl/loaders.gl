// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GeoJSONTable,
  GeoJSONTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';
import {parseArrowSync, parseArrowInBatches} from './parse-arrow';
import {convertArrowToTable} from '../tables/convert-arrow-to-table';

// Parses arrow to a columnar table
export function parseGeoArrowSync(
  arrayBuffer,
  options?: {shape?: 'arrow-table' | 'geojson-table' | 'binary-geometry'}
): ArrowTable | GeoJSONTable {
  // | BinaryGeometry
  const table = parseArrowSync(arrayBuffer, {shape: 'arrow-table'}) as ArrowTable;
  switch (options?.shape) {
    case 'geojson-table':
      return convertArrowToTable(table.data, 'geojson-table');
    default:
      return table;
  }
}

/**
 */
export function parseGeoArrowInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<ArrowTableBatch | GeoJSONTableBatch> {
  // | BinaryGeometry
  return parseArrowInBatches(asyncIterator);
}
