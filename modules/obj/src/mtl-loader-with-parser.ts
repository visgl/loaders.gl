// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MTLMaterial, ParseMTLOptions} from './lib/parse-mtl';
import {parseMTL} from './lib/parse-mtl';
import {MTLWorkerLoader as MTLWorkerLoaderMetadata} from './mtl-loader';
import {MTLLoader as MTLLoaderMetadata} from './mtl-loader';

const {preload: _MTLWorkerLoaderPreload, ...MTLWorkerLoaderMetadataWithoutPreload} =
  MTLWorkerLoaderMetadata;
const {preload: _MTLLoaderPreload, ...MTLLoaderMetadataWithoutPreload} = MTLLoaderMetadata;

export type MTLLoaderOptions = LoaderOptions & {
  mtl?: ParseMTLOptions;
};

/**
 * Loader for the MTL material format
 * Parses a Wavefront .mtl file specifying materials
 */
export const MTLWorkerLoaderWithParser = {
  ...MTLWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<MTLMaterial[], never, LoaderOptions>;

// MTLLoaderWithParser

/**
 * Loader for the MTL material format
 */
export const MTLLoaderWithParser = {
  ...MTLLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: MTLLoaderOptions) =>
    parseMTL(new TextDecoder().decode(arrayBuffer), options?.mtl),
  parseTextSync: (text: string, options?: MTLLoaderOptions) => parseMTL(text, options?.mtl)
} as const satisfies LoaderWithParser<MTLMaterial[], never, MTLLoaderOptions>;
