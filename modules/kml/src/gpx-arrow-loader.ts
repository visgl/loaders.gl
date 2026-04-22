// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {GPXLoaderOptions} from './gpx-loader';
import {GPXLoader} from './gpx-loader';

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
    GPXLoader.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: GPXArrowLoaderOptions) =>
    GPXLoader.parseTextSync(text, withArrowShape(options)) as ArrowTable
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
