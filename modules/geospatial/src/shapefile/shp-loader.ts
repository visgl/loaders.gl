// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/core/schema';
import {parseSHP, parseSHPInBatches} from './lib/parsers/parse-shp';
import type {SHPResult} from './lib/parsers/parse-shp';
import {parseSHPToArrow, parseSHPToArrowInBatches} from './lib/parsers/parse-shp-to-arrow';
import type {SHPHeader} from './lib/parsers/parse-shp-header';
import type {SHPGeoArrowEncoding} from './lib/parsers/types';
import {SHPLoader as SHPWorkerLoaderMetadata} from './shp-loader-types';
import {SHPLoader as SHPLoaderMetadata} from './shp-loader-types';
import {
  deserializeShapefileWorkerBatch,
  deserializeShapefileWorkerResult,
  serializeShapefileWorkerBatch,
  serializeShapefileWorkerResult
} from './lib/shapefile-worker-transport';

const {preload: _SHPWorkerLoaderPreload, ...SHPWorkerLoaderMetadataWithoutPreload} =
  SHPWorkerLoaderMetadata;
const {preload: _SHPLoaderPreload, ...SHPLoaderMetadataWithoutPreload} = SHPLoaderMetadata;

export const SHP_MAGIC_NUMBER = [0x00, 0x00, 0x27, 0x0a];

/** SHPLoaderWithParser */
export type SHPLoaderOptions = StrictLoaderOptions & {
  shp?: {
    _maxDimensions?: number;
    shape?: 'arrow' | 'wkb';
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
export const SHPColumnLoader: LoaderWithParser<
  SHPResult | ArrowTable,
  SHPHeader | (Uint8Array | null)[] | ArrowTableBatch,
  SHPLoaderOptions
> = {
  ...SHPLoaderMetadataWithoutPreload,
  dataType: null as unknown as SHPResult | ArrowTable,
  batchType: null as unknown as SHPHeader | (Uint8Array | null)[] | ArrowTableBatch,
  parse: async (arrayBuffer, options?) =>
    getSHPShape(options) === 'arrow'
      ? parseSHPToArrow(arrayBuffer, options)
      : parseSHP(arrayBuffer, options),
  parseSync: (arrayBuffer, options?) =>
    getSHPShape(options) === 'arrow'
      ? parseSHPToArrow(arrayBuffer, options)
      : parseSHP(arrayBuffer, options),
  parseInBatches: (
    arrayBufferIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ): AsyncIterable<SHPHeader | (Uint8Array | null)[] | ArrowTableBatch> => {
    const batchOptions =
      typeof options?.core?.batchSize === 'number'
        ? {...options, shp: {...options.shp, batchSize: options.core.batchSize}}
        : options;
    return (
      getSHPShape(batchOptions) === 'arrow'
        ? parseSHPToArrowInBatches(arrayBufferIterator, batchOptions)
        : parseSHPInBatches(arrayBufferIterator, batchOptions)
    ) as AsyncIterable<SHPHeader | (Uint8Array | null)[] | ArrowTableBatch>;
  },
  serializeWorkerResult: serializeShapefileWorkerResult,
  deserializeWorkerResult: deserializeShapefileWorkerResult,
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  deserializeWorkerBatch: deserializeShapefileWorkerBatch
};

function getSHPShape(options?: SHPLoaderOptions): NonNullable<SHPLoaderOptions['shp']>['shape'] {
  return options?.shp?.shape || 'arrow';
}

/** Exposes native Arrow output after parsing or worker hydration. */
export const SHPLoaderWithParser = {
  ...SHPColumnLoader,
  serializeWorkerResult: serializeShapefileWorkerResult,
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  dataType: null as unknown as SHPResult | Table,
  batchType: null as unknown as SHPHeader | (Uint8Array | null)[] | RecordBatch,
  async parse(input, options, context) {
    return unwrapSHPTable(await SHPColumnLoader.parse!(input, options, context));
  },
  parseSync(input, options, context) {
    return unwrapSHPTable(SHPColumnLoader.parseSync!(input, options, context));
  },
  async *parseInBatches(input, options, context) {
    for await (const batch of SHPColumnLoader.parseInBatches!(input, options, context)) {
      if (isSHPArrowTable(batch)) {
        const table = unwrapSHPTable(batch);
        if (table.batches.length) yield* table.batches;
        else yield makeArrowMetadataBatch(table.schema);
      } else yield batch;
    }
  },
  deserializeWorkerResult(result) {
    return unwrapSHPTable(deserializeShapefileWorkerResult(result));
  },
  deserializeWorkerBatch(result) {
    const batch = deserializeShapefileWorkerBatch<SHPHeader | (Uint8Array | null)[] | ArrowTable>(
      result
    );
    if (!isSHPArrowTable(batch)) return batch;
    const table = unwrapSHPTable(batch);
    return table.batches[0] ?? makeArrowMetadataBatch(table.schema);
  }
} as const satisfies LoaderWithParser<
  SHPResult | Table,
  SHPHeader | (Uint8Array | null)[] | RecordBatch,
  SHPLoaderOptions
>;

/** Identifies Arrow output from the private column parser. */
function isSHPArrowTable(result: unknown): result is ArrowTable {
  return (result as {shape?: string} | null)?.shape === 'arrow-table';
}

/** Unwraps Arrow columns and passes through legacy results. */
function unwrapSHPTable(result: ArrowTable): Table;
function unwrapSHPTable<T>(result: T): Exclude<T, ArrowTable> | Table;
function unwrapSHPTable(result: unknown): unknown {
  if (!isSHPArrowTable(result)) return result;
  return result.data;
}
