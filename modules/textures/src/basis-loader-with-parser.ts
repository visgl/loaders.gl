// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {TextureLevel} from '@loaders.gl/schema';
import {parseBasis} from './lib/parsers/parse-basis';
import type {BasisLoaderOptions} from './basis-types';
import {BasisWorkerLoader as BasisWorkerLoaderMetadata} from './basis-loader';
import {BasisLoader as BasisLoaderMetadata} from './basis-loader';

const {preload: _BasisWorkerLoaderPreload, ...BasisWorkerLoaderMetadataWithoutPreload} =
  BasisWorkerLoaderMetadata;
const {preload: _BasisLoaderPreload, ...BasisLoaderMetadataWithoutPreload} = BasisLoaderMetadata;

export type {BasisLoaderOptions} from './basis-types';

/**
 * Worker loader for Basis super compressed textures
 */
export const BasisWorkerLoaderWithParser = {
  ...BasisWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<TextureLevel[][], never, BasisLoaderOptions>;

/**
 * Loader for Basis super compressed textures
 */
export const BasisLoaderWithParser = {
  ...BasisLoaderMetadataWithoutPreload,
  parse: parseBasis
} as const satisfies LoaderWithParser<TextureLevel[][], never, LoaderOptions>;
