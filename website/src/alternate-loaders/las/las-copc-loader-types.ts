// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import {LAS_LOADER_METADATA, type LASLoaderOptions} from '../../../../modules/pointclouds/src/las/las-loader-shared';
import type {LASMesh} from '../../../../modules/pointclouds/src/las/lib/las-types';

/** Metadata-only LAS/LAZ loader variant using the COPC package decoder. */
export const LASCOPCLoader = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (COPC)',
  preload: async () => {
    const {LASCOPCLoaderWithParser} = await import('./las-copc-loader');
    return LASCOPCLoaderWithParser;
  }
} as const satisfies Loader<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions>;
