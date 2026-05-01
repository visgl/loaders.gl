// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {TCXLoaderOptions} from './tcx-loader';
import {TCXLoaderWithParser} from './tcx-loader-with-parser';
import {TCXArrowLoader as TCXArrowLoaderMetadata} from './tcx-arrow-loader';

const {preload: _TCXArrowLoaderPreload, ...TCXArrowLoaderMetadataWithoutPreload} =
  TCXArrowLoaderMetadata;

/** Options for `TCXArrowLoaderWithParser`. */
export type TCXArrowLoaderOptions = TCXLoaderOptions;

/**
 * Loader for TCX that returns Arrow tables with a WKB geometry column.
 */
export const TCXArrowLoaderWithParser = {
  ...TCXArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: TCXArrowLoaderOptions) =>
    TCXLoaderWithParser.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: TCXArrowLoaderOptions) =>
    TCXLoaderWithParser.parseTextSync(text, withArrowShape(options)) as ArrowTable
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
