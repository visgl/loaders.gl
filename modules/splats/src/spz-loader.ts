// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {SplatsLoaderOptions} from './types';
import {parseSPZ} from './lib/parse-spz';
import {SPZLoader as SPZLoaderMetadata} from './spz-loader-types';

const {preload: _SPZLoaderPreload, ...SPZLoaderMetadataWithoutPreload} = SPZLoaderMetadata;

/** Parser-bearing loader for Niantic Spatial `.spz` Gaussian splat files. */
export const SPZLoaderWithParser = {
  ...SPZLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: SplatsLoaderOptions) =>
    parseSPZ(arrayBuffer, options)
} as const satisfies LoaderWithParser<MeshArrowTable, never, SplatsLoaderOptions>;
