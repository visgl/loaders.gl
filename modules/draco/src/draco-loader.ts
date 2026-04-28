// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {DracoMesh} from './lib/draco-types';
import type {DracoParseOptions} from './lib/draco-parser';
import {VERSION} from './lib/utils/version';

export type DracoLoaderOptions = StrictLoaderOptions & {
  draco?: DracoParseOptions & {
    /** @deprecated WASM decoding is faster but JS is more backwards compatible */
    decoderType?: 'wasm' | 'js';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing Draco loader implementation. */
async function preload() {
  const {DracoLoaderWithParser} = await import('./draco-loader-with-parser');
  return DracoLoaderWithParser;
}

/** Metadata-only worker loader for Draco3D compressed geometries. */
export const DracoWorkerLoader = {
  dataType: null as unknown as DracoMesh,
  batchType: null as never,
  name: 'Draco',
  id: 'draco',
  module: 'draco',
  // shapes: ['mesh'],
  version: VERSION,
  worker: true,
  workerFile: 'draco-classic.js',
  workerModuleFile: 'draco-module.js',
  workerNodeFile: 'draco-classic-node.cjs',
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO'],
  options: {
    draco: {
      decoderType: typeof WebAssembly === 'object' ? 'wasm' : 'js', // 'js' for IE11
      extraAttributes: {},
      attributeNameEntry: undefined
    }
  },
  preload
} as const satisfies Loader<DracoMesh, never, DracoLoaderOptions>;

/** Metadata-only loader for Draco3D compressed geometries. */
export const DracoLoader = {
  ...DracoWorkerLoader,
  preload
} as const satisfies Loader<DracoMesh, never, DracoLoaderOptions>;
