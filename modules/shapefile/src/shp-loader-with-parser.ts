// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {parseSHP, parseSHPInBatches} from './lib/parsers/parse-shp';
import {SHPWorkerLoader as SHPWorkerLoaderMetadata} from './shp-loader';
import {SHPLoader as SHPLoaderMetadata} from './shp-loader';

const {preload: _SHPWorkerLoaderPreload, ...SHPWorkerLoaderMetadataWithoutPreload} =
  SHPWorkerLoaderMetadata;
const {preload: _SHPLoaderPreload, ...SHPLoaderMetadataWithoutPreload} = SHPLoaderMetadata;

export const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

/** SHPLoaderWithParser */
export type SHPLoaderOptions = StrictLoaderOptions & {
  shp?: {
    _maxDimensions?: number;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * SHP file loader
 */
export const SHPWorkerLoaderWithParser = {
  ...SHPWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<any, any, SHPLoaderOptions>;

/** SHP file loader */
export const SHPLoaderWithParser: LoaderWithParser = {
  ...SHPLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?) => parseSHP(arrayBuffer, options),
  parseSync: parseSHP,
  parseInBatches: (
    arrayBufferIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) => parseSHPInBatches(arrayBufferIterator, options)
};
