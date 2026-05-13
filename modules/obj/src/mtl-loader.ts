// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MTLMaterial, ParseMTLOptions} from './lib/parse-mtl';
import {MTLFormat} from './mtl-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MTLLoaderOptions = LoaderOptions & {
  mtl?: ParseMTLOptions;
};

/**
 * Preloads the parser-bearing MTL loader implementation.
 */
async function preload() {
  const {MTLLoaderWithParser} = await import('./mtl-loader-with-parser');
  return MTLLoaderWithParser;
}

/**
 * Metadata-only loader for the MTL material format
 * Parses a Wavefront .mtl file specifying materials
 */
export const MTLWorkerLoader = {
  ...MTLFormat,

  dataType: null as unknown as MTLMaterial[],
  batchType: null as never,

  version: VERSION,
  worker: true,
  text: true,
  testText: (text: string): boolean => text.includes('newmtl'),
  options: {
    mtl: {}
  },
  preload
} as const satisfies Loader<MTLMaterial[], never, LoaderOptions>;

// MTLLoader

/**
 * Metadata-only loader for the MTL material format
 */
export const MTLLoader = {
  ...MTLWorkerLoader
} as const satisfies Loader<MTLMaterial[], never, MTLLoaderOptions>;
