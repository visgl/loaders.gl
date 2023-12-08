// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {TextureLevel} from '@loaders.gl/schema';
import {VERSION} from './lib/utils/version';
import parseBasis from './lib/parsers/parse-basis';

/**
 * Worker loader for Basis super compressed textures
 */
export const BasisWorkerLoader: Loader<TextureLevel[][], never, LoaderOptions> = {
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
      format: 'auto', // gl context doesn't exist on a worker thread
      libraryPath: 'libs/',
      containerFormat: 'auto', // 'basis' || 'ktx2' || 'auto'
      module: 'transcoder' // 'transcoder' || 'encoder'
    }
  }
};

/**
 * Loader for Basis super compressed textures
 */
export const BasisLoader: LoaderWithParser<TextureLevel[][], never, LoaderOptions> = {
  ...BasisWorkerLoader,
  parse: parseBasis
};
