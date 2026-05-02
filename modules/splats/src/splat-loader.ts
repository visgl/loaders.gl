// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {SplatsLoaderOptions} from './types';
import {parseSPLAT} from './lib/parse-splat';
import {SPLATLoader as SPLATLoaderMetadata} from './splat-loader-types';

const {preload: _SPLATLoaderPreload, ...SPLATLoaderMetadataWithoutPreload} = SPLATLoaderMetadata;

/** Parser-bearing loader for raw `.splat` Gaussian splat files. */
export const SPLATLoaderWithParser = {
  ...SPLATLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseSPLAT(arrayBuffer),
  parseSync: (arrayBuffer: ArrayBuffer) => parseSPLAT(arrayBuffer)
} as const satisfies LoaderWithParser<MeshArrowTable, never, SplatsLoaderOptions>;
