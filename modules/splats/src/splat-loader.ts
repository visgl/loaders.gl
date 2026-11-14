// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {SplatsLoaderOptions} from './types';
import {parseSPLAT} from './lib/parse-splat';
import {SPLATLoader as SPLATLoaderMetadata} from './splat-loader-types';

const {preload: _SPLATLoaderPreload, ...SPLATLoaderMetadataWithoutPreload} = SPLATLoaderMetadata;

/** Parser-bearing loader for raw `.splat` Gaussian splat files. */
export const SPLATLoaderWithParser = {
  ...SPLATLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer) => parseSPLAT(arrayBuffer).data,
  parseSync: (arrayBuffer: ArrayBuffer) => parseSPLAT(arrayBuffer).data
} as const satisfies LoaderWithParser<Table, never, SplatsLoaderOptions>;
