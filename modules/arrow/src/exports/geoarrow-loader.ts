// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, BinaryGeometry} from '@loaders.gl/schema';
import {ArrowWorkerLoader} from './arrow-loader';

export type GeoArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape?: 'arrow-table' | 'binary-geometry';
  };
};

/** ArrowJS table loader */
export const GeoArrowWorkerLoader = {
  ...ArrowWorkerLoader,
  options: {
    arrow: {
      shape: 'arrow-table'
    }
  }
} as const satisfies Loader<ArrowTable | BinaryGeometry, ArrowTableBatch, GeoArrowLoaderOptions>;
