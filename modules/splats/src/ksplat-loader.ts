// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {SplatsLoaderOptions} from './types';
import {parseKSPLAT} from './lib/parse-ksplat';
import {KSPLATLoader as KSPLATLoaderMetadata} from './ksplat-loader-types';

const {preload: _KSPLATLoaderPreload, ...KSPLATLoaderMetadataWithoutPreload} = KSPLATLoaderMetadata;

/** Parser-bearing loader for `.ksplat` Gaussian splat files. */
export const KSPLATLoaderWithParser = {
  ...KSPLATLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseKSPLAT(arrayBuffer),
  parseSync: (arrayBuffer: ArrayBuffer) => parseKSPLAT(arrayBuffer)
} as const satisfies LoaderWithParser<MeshArrowTable, never, SplatsLoaderOptions>;
