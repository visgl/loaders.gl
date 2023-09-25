// loaders.gl, MIT

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowLoaderOptions} from './arrow-loader';
import type {ArrowTableBatch, ColumnarTable, ObjectRowTable} from '@loaders.gl/schema';
import type {ArrowTable} from './lib/arrow-table';

import {TableBatchBuilder} from '@loaders.gl/schema';
import {ArrowLoader as ArrowWorkerLoader} from './arrow-loader';
import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches} from './lib/parse-arrow-in-batches';

import {ArrowTableBatchAggregator} from './lib/arrow-table-batch';

// Make the ArrowBatch type available
TableBatchBuilder.ArrowBatch = ArrowTableBatchAggregator;

// Types
export type {ArrowTable, ArrowTableBatch} from './lib/arrow-table';
export {VECTOR_TYPES} from './types';

// Arrow writer

export {ArrowWriter} from './arrow-writer';

// Arrow loader

export type {ArrowLoaderOptions};
export {ArrowWorkerLoader};

/** ArrowJS table loader */
export const ArrowLoader: LoaderWithParser<
  ArrowTable | ColumnarTable | ObjectRowTable,
  ArrowTableBatch,
  ArrowLoaderOptions
> = {
  ...ArrowWorkerLoader,
  parse: async (arraybuffer: ArrayBuffer, options?: ArrowLoaderOptions) =>
    parseSync(arraybuffer, options),
  parseSync,
  parseInBatches: parseArrowInBatches
};
