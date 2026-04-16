// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {TCXLoaderOptions} from './tcx-loader';
import {TCXLoader, parseTCXTextToFeatureCollection} from './tcx-loader';
import {convertFeatureCollectionToArrowTable} from './lib/feature-collection-to-arrow';

/** Options for `TCXArrowLoader`. */
export type TCXArrowLoaderOptions = TCXLoaderOptions;

/**
 * Loader for TCX that returns Arrow tables with a WKB geometry column.
 */
export const TCXArrowLoader = {
  ...TCXLoader,
  name: 'TCX Arrow',
  id: 'tcx-arrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  parse: async (arrayBuffer: ArrayBuffer, options?: TCXArrowLoaderOptions) =>
    parseTCXArrow(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseTCXArrow
} as const satisfies LoaderWithParser<ArrowTable, never, TCXArrowLoaderOptions>;

/**
 * Parses TCX XML text into an Arrow table.
 *
 * @param text - TCX XML document text.
 * @param _options - Loader options accepted for API parity with `TCXLoader`.
 * @returns Arrow table with properties and WKB geometry.
 */
function parseTCXArrow(text: string, _options?: TCXArrowLoaderOptions): ArrowTable {
  const geojson = parseTCXTextToFeatureCollection(text);
  return convertFeatureCollectionToArrowTable(geojson.features);
}
