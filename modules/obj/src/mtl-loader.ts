// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MTLMaterial, ParseMTLOptions} from './lib/parse-mtl';
import {parseMTL} from './lib/parse-mtl';
import {MTLFormat} from './mtl-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MTLLoaderOptions = LoaderOptions & {
  mtl?: ParseMTLOptions;
};

/**
 * Loader for the MTL material format
 * Parses a Wavefront .mtl file specifying materials
 */
export const MTLWorkerLoader = {
  ...MTLFormat,

  dataType: null as unknown as MTLMaterial[],
  batchType: null as never,

  version: VERSION,
  worker: true,
  testText: (text: string): boolean => text.includes('newmtl'),
  options: {
    mtl: {}
  }
} as const satisfies Loader<MTLMaterial[], never, LoaderOptions>;

// MTLLoader

/**
 * Loader for the MTL material format
 */
export const MTLLoader = {
  ...MTLWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: MTLLoaderOptions) =>
    parseMTL(new TextDecoder().decode(arrayBuffer), options?.mtl),
  parseTextSync: (text: string, options?: MTLLoaderOptions) => parseMTL(text, options?.mtl)
} as const satisfies LoaderWithParser<MTLMaterial[], never, MTLLoaderOptions>;
