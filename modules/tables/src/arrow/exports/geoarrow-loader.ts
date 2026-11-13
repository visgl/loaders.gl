// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ArrowTable, ArrowTableBatch, GeoJSONTable} from '@loaders.gl/core/schema';
import {ARROW_WORKER_URL} from '../arrow-worker-url';
import {ArrowWorkerLoader} from './arrow-loader';

export type GeoArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape?: 'arrow' | 'geojson-table' | 'binary-geometry';
  };
};

/** Preloads the parser-bearing GeoArrow loader implementation. */
async function preload() {
  const {GeoArrowLoaderWithParser} = await import('@loaders.gl/tables/geoarrow-loader');
  const {preloadArrowCompressionDecoders} = await import('../lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return GeoArrowLoaderWithParser;
}

/** Metadata-only GeoArrow worker loader. */
export const GeoArrowWorkerLoader = {
  ...ArrowWorkerLoader,
  batchType: null as unknown as ArrowTableBatch | RecordBatch,
  dataType: null as unknown as ArrowTable | GeoJSONTable | NativeArrowTable,
  format: 'geoarrow',
  worker:
    typeof ARROW_WORKER_URL === 'string'
      ? ARROW_WORKER_URL.replace('arrow-worker-node.cjs', 'geoarrow-worker-node.cjs')
      : ARROW_WORKER_URL,
  workerFile: 'geoarrow-worker.js',
  workerNode: 'geoarrow-worker-node.cjs',
  workerSourceNode: 'arrow/workers/geoarrow-worker.ts',
  options: {
    arrow: {
      shape: 'arrow'
    }
  },
  preload
} as const satisfies Loader<
  ArrowTable | GeoJSONTable | NativeArrowTable,
  ArrowTableBatch | RecordBatch,
  GeoArrowLoaderOptions
>;
