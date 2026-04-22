// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {TCXLoaderOptions} from './tcx-loader';
import {TCXLoader} from './tcx-loader';

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
    TCXLoader.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: TCXArrowLoaderOptions) =>
    TCXLoader.parseTextSync(text, withArrowShape(options)) as ArrowTable
} as const satisfies LoaderWithParser<ArrowTable, never, TCXArrowLoaderOptions>;

function withArrowShape(options?: TCXLoaderOptions): TCXLoaderOptions {
  return {
    ...options,
    tcx: {
      ...options?.tcx,
      shape: 'arrow-table'
    }
  };
}
