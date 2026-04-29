// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {parseSHP, parseSHPInBatches} from './lib/parsers/parse-shp';
import type {SHPGeometry, SHPResult} from './lib/parsers/parse-shp';
import {parseSHPToArrow, parseSHPToArrowInBatches} from './lib/parsers/parse-shp-to-arrow';
import type {SHPHeader} from './lib/parsers/parse-shp-header';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
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
    shape?: 'binary-geometry' | 'arrow-table' | 'wkb';
    geoarrowEncoding?: SHPGeoArrowEncoding;
    batchSize?: number;
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
export const SHPLoaderWithParser: LoaderWithParser<
  SHPResult | ArrowTable,
  SHPHeader | (SHPGeometry | null)[] | ArrowTableBatch,
  SHPLoaderOptions
> = {
  ...SHPLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options?) =>
    getSHPShape(options) === 'arrow-table'
      ? parseSHPToArrow(arrayBuffer, options)
      : parseSHP(arrayBuffer, options),
  parseSync: (arrayBuffer, options?) =>
    getSHPShape(options) === 'arrow-table'
      ? parseSHPToArrow(arrayBuffer, options)
      : parseSHP(arrayBuffer, options),
  parseInBatches: (
    arrayBufferIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ): AsyncIterable<SHPHeader | (SHPGeometry | null)[] | ArrowTableBatch> =>
    (getSHPShape(options) === 'arrow-table'
      ? parseSHPToArrowInBatches(arrayBufferIterator, options)
      : parseSHPInBatches(arrayBufferIterator, options)) as AsyncIterable<
      SHPHeader | (SHPGeometry | null)[] | ArrowTableBatch
    >
};

function getSHPShape(options?: SHPLoaderOptions): NonNullable<SHPLoaderOptions['shp']>['shape'] {
  return options?.shp?.shape;
}
