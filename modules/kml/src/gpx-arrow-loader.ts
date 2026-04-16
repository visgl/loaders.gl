// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {GPXLoaderOptions} from './gpx-loader';
import {GPXLoader, parseGPXTextToFeatureCollection} from './gpx-loader';
import {convertFeatureCollectionToArrowTable} from './lib/feature-collection-to-arrow';

/** Options for `GPXArrowLoader`. */
export type GPXArrowLoaderOptions = GPXLoaderOptions;

/**
 * Loader for GPX that returns Arrow tables with a WKB geometry column.
 */
export const GPXArrowLoader = {
  ...GPXLoader,
  name: 'GPX Arrow',
  id: 'gpx-arrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  parse: async (arrayBuffer: ArrayBuffer, options?: GPXArrowLoaderOptions) =>
    parseGPXArrow(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseGPXArrow
} as const satisfies LoaderWithParser<ArrowTable, never, GPXArrowLoaderOptions>;

/**
 * Parses GPX XML text into an Arrow table.
 *
 * @param text - GPX XML document text.
 * @param _options - Loader options accepted for API parity with `GPXLoader`.
 * @returns Arrow table with properties and WKB geometry.
 */
function parseGPXArrow(text: string, _options?: GPXArrowLoaderOptions): ArrowTable {
  const geojson = parseGPXTextToFeatureCollection(text);
  return convertFeatureCollectionToArrowTable(geojson.features);
}
