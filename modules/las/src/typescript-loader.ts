// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {LASLoaderOptions} from './las-loader';
import {LASWorkerLoader} from './las-loader';
import type {LASMesh} from './lib/las-types';

/** Metadata-only loader for the TypeScript-only LAS backend. */
export const TypeScriptLASLoader = {
  ...LASWorkerLoader,
  worker: false,
  preload: async () => {
    const {TypeScriptLASLoaderWithParser} = await import('./typescript-loader-with-parser');
    return TypeScriptLASLoaderWithParser;
  }
} as const satisfies Loader<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>;
