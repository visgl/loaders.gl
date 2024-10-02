// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Table, ArrowTableBatch} from '@loaders.gl/schema';
import {parseArrowSync, parseArrowInBatches} from './lib/parsers/parse-arrow';

import type {ArrowLoaderOptions} from './exports/arrow-loader';
import {ArrowWorkerLoader} from './exports/arrow-loader';

/** ArrowJS table loader */
export const ArrowLoader = {
  ...ArrowWorkerLoader,
  parse: async (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseArrowSync(arraybuffer, options?.arrow),
  parseSync: (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseArrowInBatches
} as const satisfies LoaderWithParser<Table, ArrowTableBatch, ArrowLoaderOptions>;
