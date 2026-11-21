// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {GeoJSONTable, GeoJSONTableBatch} from '@loaders.gl/core/schema';
import {ARROW_WORKER_URL} from './arrow-worker-url';
import {ArrowLoaderDefinition} from './arrow-loader-definition';

/** GeoArrow loader options. */
export type GeoArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape?: 'arrow' | 'geojson-table' | 'binary-geometry';
  };
};

const {
  testURL: _testURL,
  fromUrl: _fromUrl,
  fromBlob: _fromBlob,
  type: _type,
  ...arrowParserMetadata
} = ArrowLoaderDefinition;

/** Shared GeoArrow loader metadata for the caller and worker. */
export const GeoArrowLoaderDefinition = {
  ...arrowParserMetadata,
  batchType: null as unknown as RecordBatch,
  dataType: null as unknown as GeoJSONTable | NativeArrowTable,
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
  }
} as const satisfies Loader<
  GeoJSONTable | NativeArrowTable,
  GeoJSONTableBatch | RecordBatch,
  GeoArrowLoaderOptions
>;
