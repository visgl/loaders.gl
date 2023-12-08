// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoJSONTableBatch} from '@loaders.gl/schema';
import type {ArrowTableBatch} from '../lib/arrow-table';
import {parseArrowInBatches} from './parse-arrow-in-batches';

/**
 */
export function parseGeoArrowInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<ArrowTableBatch | GeoJSONTableBatch> {
  // | BinaryGeometry
  return parseArrowInBatches(asyncIterator);
}
