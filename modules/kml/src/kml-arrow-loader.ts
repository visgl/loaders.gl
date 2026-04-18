// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {KMLLoaderOptions} from './kml-loader';
import {KMLLoader, parseKMLTextToFeatureCollection} from './kml-loader';
import {convertFeatureCollectionToArrowTable} from './lib/feature-collection-to-arrow';

/** Options for `KMLArrowLoader`. */
export type KMLArrowLoaderOptions = KMLLoaderOptions;

/**
 * Loader for KML that returns Arrow tables with a WKB geometry column.
 */
export const KMLArrowLoader = {
  ...KMLLoader,
  name: 'KML Arrow',
  id: 'kml-arrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  parse: async (arrayBuffer: ArrayBuffer, options?: KMLArrowLoaderOptions) =>
    parseKMLArrow(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseKMLArrow
} as const satisfies LoaderWithParser<ArrowTable, never, KMLArrowLoaderOptions>;

/**
 * Parses KML XML text into an Arrow table.
 *
 * @param text - KML XML document text.
 * @param _options - Loader options accepted for API parity with `KMLLoader`.
 * @returns Arrow table with properties and WKB geometry.
 */
function parseKMLArrow(text: string, _options?: KMLArrowLoaderOptions): ArrowTable {
  const geojson = parseKMLTextToFeatureCollection(text);
  return convertFeatureCollectionToArrowTable(geojson.features);
}
