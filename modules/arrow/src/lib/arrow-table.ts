// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Batch, Schema} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';

/**
 * A table organized as an Apache Arrow table
 * @note This is a variant of the type from loaders.gl/schema
 */
export type ArrowTable = {
  shape: 'arrow-table';
  schema?: Schema;
  data: arrow.Table;
};

/**
 * Batch for a table organized as an Apache Arrow table
 * @note This is a variant of the type from loaders.gl/schema
 */
export type ArrowTableBatch = Batch & {
  shape: 'arrow-table';
  schemaType?: 'explicit' | 'deduced';
  schema?: Schema;
  data: arrow.Table; // ApacheRecordBatch;
  length: number;
};
