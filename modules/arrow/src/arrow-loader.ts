// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ArrayRowTable,
  ArrowTableBatch,
  ColumnarTable,
  ObjectRowTable
} from '@loaders.gl/schema';
import type {ArrowTable} from './lib/arrow-table';
import {parseArrowSync} from './parsers/parse-arrow-sync';
import {parseArrowInBatches} from './parsers/parse-arrow-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape: 'arrow-table' | 'columnar-table' | 'array-row-table' | 'object-row-table';
    batchDebounceMs?: number;
  };
};

/** ArrowJS table loader */
export const ArrowWorkerLoader: Loader<ArrowTable, never, ArrowLoaderOptions> = {
  name: 'Apache Arrow',
  id: 'arrow',
  module: 'arrow',
  version: VERSION,
  // worker: true,
  category: 'table',
  extensions: ['arrow', 'feather'],
  mimeTypes: [
    'application/vnd.apache.arrow.file',
    'application/vnd.apache.arrow.stream',
    'application/octet-stream'
  ],
  binary: true,
  tests: ['ARROW'],
  options: {
    arrow: {
      shape: 'columnar-table'
    }
  }
};

/** ArrowJS table loader */
export const ArrowLoader: LoaderWithParser<
  ArrowTable | ColumnarTable | ObjectRowTable | ArrayRowTable,
  ArrowTableBatch,
  ArrowLoaderOptions
> = {
  ...ArrowWorkerLoader,
  parse: async (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseArrowSync(arraybuffer, options?.arrow),
  parseSync: (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseArrowSync(arraybuffer, options?.arrow),
  parseInBatches: parseArrowInBatches
};
