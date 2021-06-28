import {TableBatchBuilder} from '@loaders.gl/schema';
import ArrowTableBatchAggregator from './lib/arrow-table-batch';

export type {ArrowLoaderOptions} from './arrow-loader';
export {ArrowLoader, ArrowWorkerLoader} from './arrow-loader';
export {ArrowWriter} from './arrow-writer';

export {VECTOR_TYPES} from './types';

TableBatchBuilder.ArrowBatch = ArrowTableBatchAggregator;
