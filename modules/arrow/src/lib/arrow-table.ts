// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Batch, Schema} from '@loaders.gl/schema';
import type {Table as ApacheArrowTable} from 'apache-arrow';

/**
 * A table organized as an Apache Arrow table
 * @note This is a variant of the type from loaders.gl/schema
 */
export type ArrowTable = {
  shape: 'arrow-table';
  schema?: Schema;
  data: ApacheArrowTable;
};

/**
 * Batch for a table organized as an Apache Arrow table
 * @note This is a variant of the type from loaders.gl/schema
 */
export type ArrowTableBatch = Batch & {
  shape: 'arrow-table';
  schemaType?: 'explicit' | 'deduced';
  schema?: Schema;
  data: ApacheArrowTable; // ApacheRecordBatch;
  length: number;
};
