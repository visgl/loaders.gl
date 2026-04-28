// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

/** QuantizedMeshLoader options */
export type QuantizedMeshLoaderOptions = LoaderOptions & {
  /** QuantizedMeshLoader options */
  'quantized-mesh'?: {
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
  dataType: null as unknown as any, // Mesh,
  batchType: null as never,

  name: 'Quantized Mesh',
  id: 'quantized-mesh',
  module: 'terrain',
  version: VERSION,
  worker: true,
  workerFile: 'terrain-classic.js',
  workerModuleFile: 'terrain-module.js',
  workerNodeFile: 'terrain-classic-node.cjs',
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  /** Loads the parser-bearing quantized mesh loader implementation. */
  preload: async () =>
    (await import('./quantized-mesh-loader-with-parser')).QuantizedMeshLoaderWithParser,
  options: {
    'quantized-mesh': {
      bounds: [0, 0, 1, 1],
      skirtHeight: null
    }
  }
} as const satisfies Loader<any, never, QuantizedMeshLoaderOptions>;
