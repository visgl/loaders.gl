// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';

export type QuantizedMeshLoaderOptions = LoaderOptions & {
  'quantized-mesh'?: {
    bounds?: [number, number, number, number];
    skirtHeight?: number | null;
  };
};

/**
 * Worker loader for quantized meshes
 */
export const QuantizedMeshLoader: Loader<any, never, QuantizedMeshLoaderOptions> = {
  name: 'Quantized Mesh',
  id: 'quantized-mesh',
  module: 'terrain',
  version: VERSION,
  worker: true,
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  options: {
    'quantized-mesh': {
      bounds: [0, 0, 1, 1],
      skirtHeight: null
    }
  }
};
