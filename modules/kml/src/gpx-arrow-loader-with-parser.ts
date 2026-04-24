// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {GPXLoaderOptions} from './gpx-loader';
import {GPXLoaderWithParser} from './gpx-loader-with-parser';
import {GPXArrowLoader as GPXArrowLoaderMetadata} from './gpx-arrow-loader';

const {preload: _GPXArrowLoaderPreload, ...GPXArrowLoaderMetadataWithoutPreload} =
  GPXArrowLoaderMetadata;

/** Options for `GPXArrowLoaderWithParser`. */
export type GPXArrowLoaderOptions = GPXLoaderOptions;

/**
 * Loader for GPX that returns Arrow tables with a WKB geometry column.
 */
export const GPXArrowLoaderWithParser = {
  ...GPXArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: GPXArrowLoaderOptions) =>
    GPXLoaderWithParser.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: GPXArrowLoaderOptions) =>
    GPXLoaderWithParser.parseTextSync(text, withArrowShape(options)) as ArrowTable
} as const satisfies LoaderWithParser<ArrowTable, never, GPXArrowLoaderOptions>;

function withArrowShape(options?: GPXLoaderOptions): GPXLoaderOptions {
  return {
    ...options,
    gpx: {
      ...options?.gpx,
      shape: 'arrow-table'
    }
  };
}
