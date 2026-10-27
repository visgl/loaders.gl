// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  serializeArrowTableResult,
  deserializeArrowTableResult,
  deserializeArrowTableBatch
} from './lib/arrow-worker-transport';
import {preloadArrowCompressionDecoders} from './lib/parsers/arrow-compression';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table, ArrowTableBatch} from '@loaders.gl/core/schema';
import {parseArrowSync, parseArrowInBatches} from './lib/parsers/parse-arrow';

import type {ArrowLoaderOptions} from './exports/arrow-loader';
import {ArrowLoader as ArrowLoaderMetadata} from './arrow-loader-types';

const {preload: _ArrowLoaderPreload, ...ArrowLoaderMetadataWithoutPreload} = ArrowLoaderMetadata;

/** ArrowJS table loader */
export const ArrowLoaderWithParser = {
  ...ArrowLoaderMetadataWithoutPreload,
  serializeWorkerResult: serializeArrowTableResult,
  deserializeWorkerResult: deserializeArrowTableResult,
  serializeWorkerBatch: serializeArrowTableResult,
  deserializeWorkerBatch: deserializeArrowTableBatch,
  parse: async (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) => {
    await preloadArrowCompressionDecoders();
    return parseArrowSync(arraybuffer, options?.arrow);
  },
  parseSync: (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseArrowInBatches
} as const satisfies LoaderWithParser<Table, ArrowTableBatch, ArrowLoaderOptions>;
