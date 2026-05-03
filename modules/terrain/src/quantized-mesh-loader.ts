// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import {QuantizedMeshFormat} from './terrain-format';

/** QuantizedMeshLoader options */
export type QuantizedMeshLoaderOptions = LoaderOptions & {
  /** QuantizedMeshLoader options */
  'quantized-mesh'?: {
    /** Selects mesh output or Apache Arrow output. */
    shape?: 'mesh' | 'arrow-table';
    bounds?: [number, number, number, number];
    skirtHeight?: number | null;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for quantized meshes
 */
export const QuantizedMeshLoader = {
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as never,

  ...QuantizedMeshFormat,
  version: VERSION,
  worker: true,
  /** Loads the parser-bearing quantized mesh loader implementation. */
  preload: async () =>
    (await import('./quantized-mesh-loader-with-parser')).QuantizedMeshLoaderWithParser,
  options: {
    'quantized-mesh': {
      bounds: [0, 0, 1, 1],
      skirtHeight: null
    }
  }
} as const satisfies Loader<Mesh | MeshArrowTable, never, QuantizedMeshLoaderOptions>;
