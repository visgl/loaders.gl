// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from './las-loader-shared';
import type {LASMesh} from './lib/las-types';

/** Metadata-only LAS/LAZ loader variant using the COPC package decoder. */
export const LASCOPCLoader = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (COPC)',
  preload: async () => {
    const {LASCOPCLoaderWithParser} = await import('@loaders.gl/las/las-copc-loader');
    return LASCOPCLoaderWithParser;
  }
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;
