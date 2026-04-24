// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import type {Loader} from '@loaders.gl/loader-utils';
import type {DracoLoaderOptions} from './draco-loader';
import {DracoLoader} from './draco-loader';

/**
 * Metadata-only loader for Draco3D compressed geometries as Apache Arrow tables.
 */
export const DracoArrowLoader = {
  ...DracoLoader,
  dataType: null as unknown as ArrowTable,
  worker: false,
  preload: async () => {
    const {DracoArrowLoaderWithParser} = await import('./draco-arrow-loader-with-parser');
    return DracoArrowLoaderWithParser;
  }
} as const satisfies Loader<ArrowTable, never, DracoLoaderOptions>;
