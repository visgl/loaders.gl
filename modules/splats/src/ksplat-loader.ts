// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {SplatsLoaderOptions} from './types';
import {parseKSPLAT} from './lib/parse-ksplat';
import {KSPLATLoader as KSPLATLoaderMetadata} from './ksplat-loader-types';

const {preload: _KSPLATLoaderPreload, ...KSPLATLoaderMetadataWithoutPreload} = KSPLATLoaderMetadata;

/** Parser-bearing loader for `.ksplat` Gaussian splat files. */
export const KSPLATLoaderWithParser = {
  ...KSPLATLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseKSPLAT(arrayBuffer).data,
  parseSync: (arrayBuffer: ArrayBuffer) => parseKSPLAT(arrayBuffer).data
} as const satisfies LoaderWithParser<Table, never, SplatsLoaderOptions>;
