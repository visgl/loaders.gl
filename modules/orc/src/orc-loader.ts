// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {ORCLoaderOptions} from './orc-loader-types';
import {ORCLoader as ORCLoaderMetadata} from './orc-loader-types';
import {parseORCToArrow} from './lib/parsers/parse-orc-to-arrow';
import {preloadORCCompression} from './lib/parsers/orc-compression';

const {preload: _ORCLoaderPreload, ...ORCLoaderMetadataWithoutPreload} = ORCLoaderMetadata;

/** Minimal parser-bearing Apache ORC loader. */
export const ORCLoaderWithParser = {
  ...ORCLoaderMetadataWithoutPreload,
  async parse(arrayBuffer: ArrayBuffer, options?: ORCLoaderOptions) {
    await preloadORCCompression(options?.modules);
    return parseORCToArrow(arrayBuffer);
  }
} as const satisfies LoaderWithParser<ArrowTable, never, ORCLoaderOptions>;
