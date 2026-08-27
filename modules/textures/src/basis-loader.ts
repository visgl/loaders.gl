// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {TextureLevel} from '@loaders.gl/schema';
import {BasisTextureFormat} from './texture-format';
import {VERSION} from './lib/utils/version';
import type {BasisLoaderOptions} from './basis-types';

export type {BasisLoaderOptions} from './basis-types';

/** Preloads the parser-bearing Basis loader implementation. */
async function preload() {
  const {BasisLoaderWithParser} = await import('./basis-loader-with-parser');
  return BasisLoaderWithParser;
}

/** Metadata-only worker loader for Basis super compressed textures. */
export const BasisWorkerLoader = {
  ...BasisTextureFormat,
  dataType: null as unknown as TextureLevel[][],
  batchType: null as never,

  name: 'Basis',
  id: 'basis',
  module: 'textures',
  version: VERSION,
  worker: true,
  extensions: ['basis', 'ktx2'],
  mimeTypes: ['application/octet-stream', 'image/ktx2'],
  tests: ['sB'],
  binary: true,
  options: {
    basis: {
      format: 'auto',
      containerFormat: 'auto'
    }
  },
  preload
} as const satisfies Loader<TextureLevel[][], never, BasisLoaderOptions>;

/** Metadata-only loader for Basis super compressed textures. */
export const BasisLoader = {
  ...BasisWorkerLoader,
  preload
} as const satisfies Loader<TextureLevel[][], never, LoaderOptions>;
