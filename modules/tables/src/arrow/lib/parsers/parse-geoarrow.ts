// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import type {GeoJSONTable} from '@loaders.gl/core/schema';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {convertGeoArrowTableToGeoJSON} from '@loaders.gl/core/arrow-geometry/geojson-table';
import type {GeoArrowLoaderOptions} from '../../geoarrow-loader-types';
import {parseArrowSync, parseArrowInBatches} from './parse-arrow';

/** Decodes Arrow IPC and materializes GeoJSON only when requested. */
export function parseGeoArrowSync(
  input: ArrayBuffer,
  options?: GeoArrowLoaderOptions['arrow']
): Table | GeoJSONTable {
  const table = parseArrowSync(input);
  return options?.shape === 'geojson-table'
    ? convertGeoArrowTableToGeoJSON(table, convertArrowToSchema(table.schema))
    : table;
}

/** Streams native record batches with geometry extension metadata. */
export function parseGeoArrowInBatches(
  input:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: GeoArrowLoaderOptions
): AsyncIterable<RecordBatch> {
  return parseArrowInBatches(input, {core: options?.core, signal: options?.signal});
}
