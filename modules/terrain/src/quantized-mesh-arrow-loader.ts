// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {QuantizedMeshLoader, type QuantizedMeshLoaderOptions} from './quantized-mesh-loader';

/**
 * Metadata-only loader for quantized meshes as Apache Arrow tables.
 */
export const QuantizedMeshArrowLoader = {
  ...QuantizedMeshLoader,
  dataType: null as unknown as MeshArrowTable,
  batchType: null as never,
  worker: false,
  /** Loads the parser-bearing quantized mesh Arrow loader implementation. */
  preload: async () =>
    (await import('./quantized-mesh-arrow-loader-with-parser')).QuantizedMeshArrowLoaderWithParser
} as const satisfies Loader<MeshArrowTable, never, QuantizedMeshLoaderOptions>;
