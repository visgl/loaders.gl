// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {SplatsLoaderOptions} from './types';
import {parseSPZ} from './lib/parse-spz';
import {SPZLoader as SPZLoaderMetadata} from './spz-loader-types';

const {preload: _SPZLoaderPreload, ...SPZLoaderMetadataWithoutPreload} = SPZLoaderMetadata;

/** Parser-bearing loader for Niantic Spatial `.spz` Gaussian splat files. */
export const SPZLoaderWithParser = {
  ...SPZLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: SplatsLoaderOptions) =>
    (await parseSPZ(arrayBuffer, options)).data
} as const satisfies LoaderWithParser<Table, never, SplatsLoaderOptions>;
