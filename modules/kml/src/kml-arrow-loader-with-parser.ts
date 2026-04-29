// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {KMLLoaderOptions} from './kml-loader';
import {KMLLoaderWithParser} from './kml-loader-with-parser';
import {KMLArrowLoader as KMLArrowLoaderMetadata} from './kml-arrow-loader';

const {preload: _KMLArrowLoaderPreload, ...KMLArrowLoaderMetadataWithoutPreload} =
  KMLArrowLoaderMetadata;

/** Options for `KMLArrowLoaderWithParser`. */
export type KMLArrowLoaderOptions = KMLLoaderOptions;

/**
 * Loader for KML that returns Arrow tables with a WKB geometry column.
 */
export const KMLArrowLoaderWithParser = {
  ...KMLArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: KMLArrowLoaderOptions) =>
    KMLLoaderWithParser.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: KMLArrowLoaderOptions) =>
    KMLLoaderWithParser.parseTextSync(text, withArrowShape(options)) as ArrowTable
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
