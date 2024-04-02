// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh} from '@loaders.gl/schema';
import {parseOBJ} from './lib/parse-obj';
import type {OBJLoaderOptions} from './obj-loader';
import {OBJLoader as OBJWorkerLoader} from './obj-loader';

import type {MTLMaterial} from './lib/parse-mtl';
import {parseMTL} from './lib/parse-mtl';
import type {MTLLoaderOptions} from './mtl-loader';
import {MTLLoader as MTLWorkerLoader} from './mtl-loader';

// OBJLoader

export {OBJWorkerLoader};

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoader = {
  ...OBJWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    parseOBJ(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) => parseOBJ(text, options)
} as const satisfies LoaderWithParser<Mesh, never, OBJLoaderOptions>;

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
