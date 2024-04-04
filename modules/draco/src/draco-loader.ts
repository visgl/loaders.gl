// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoParseOptions} from './lib/draco-parser';
import {VERSION} from './lib/utils/version';

export type DracoLoaderOptions = LoaderOptions & {
  draco?: DracoParseOptions & {
    /** @deprecated WASM decoding is faster but JS is more backwards compatible */
    decoderType?: 'wasm' | 'js';
    /** @deprecated Specify where to load the Draco decoder library */
    libraryPath?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * Worker loader for Draco3D compressed geometries
 */
export const DracoLoader = {
  dataType: null as unknown as DracoMesh,
  batchType: null as never,
  name: 'Draco',
  id: 'draco',
  module: 'draco',
  // shapes: ['mesh'],
  version: VERSION,
  worker: true,
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO'],
  options: {
    draco: {
      decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
      libraryPath: 'libs/',
      extraAttributes: {},
      attributeNameEntry: undefined
    }
  }
} as const satisfies Loader<DracoMesh, never, DracoLoaderOptions>;
