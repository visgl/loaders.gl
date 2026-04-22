// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {KMLLoaderOptions} from './kml-loader';
import {KMLLoader} from './kml-loader';

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
    KMLLoader.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: KMLArrowLoaderOptions) =>
    KMLLoader.parseTextSync(text, withArrowShape(options)) as ArrowTable
} as const satisfies LoaderWithParser<ArrowTable, never, KMLArrowLoaderOptions>;

function withArrowShape(options?: KMLLoaderOptions): KMLLoaderOptions {
  return {
    ...options,
    kml: {
      ...options?.kml,
      shape: 'arrow-table'
    }
  };
}
