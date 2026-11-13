// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import type {ORCLoaderOptions} from './orc-loader-types';
import {ORCLoader as ORCLoaderMetadata} from './orc-loader-types';
import {parseORCToArrow} from './lib/parsers/parse-orc-to-arrow';
import {readORCPostScript} from './lib/parsers/parse-orc';
import {preloadORCCompression} from './lib/parsers/orc-compression';

const {preload: _ORCLoaderPreload, ...ORCLoaderMetadataWithoutPreload} = ORCLoaderMetadata;

/** Minimal parser-bearing Apache ORC loader. */
export const ORCLoaderWithParser = {
  ...ORCLoaderMetadataWithoutPreload,
  async parse(arrayBuffer: ArrayBuffer, options?: ORCLoaderOptions) {
    await preloadORCCompression(readORCPostScript(arrayBuffer).compression, options?.modules);
    return parseORCToArrow(arrayBuffer).data;
  }
} as const satisfies LoaderWithParser<Table, RecordBatch, ORCLoaderOptions>;
