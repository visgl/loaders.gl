// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTable} from '@loaders.gl/schema';
import type {ArrowTable} from '../lib/arrow-table';
import {parseArrowSync} from './parse-arrow-sync';
import {convertArrowToGeoJSONTable} from '../tables/convert-arrow-to-geojson-table';

// Parses arrow to a columnar table
export function parseGeoArrowSync(
  arrayBuffer,
  options?: {shape?: 'arrow-table' | 'geojson-table' | 'binary-geometry'}
): ArrowTable | GeoJSONTable {
  // | BinaryGeometry
  const table = parseArrowSync(arrayBuffer, {shape: 'arrow-table'}) as ArrowTable;
  switch (options?.shape) {
    case 'geojson-table':
      return convertArrowToGeoJSONTable(table);
    default:
      return table;
  }
}
