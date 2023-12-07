// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema} from './schema';
// import type {RecordBatch} from 'apache-arrow';

type ApacheRecordBatch = unknown;

/**
 * A batch of data (or metadata/schema), from a streaming loader
 * @see parseInBatches()
 * @see loadInBatches()
 */
export type Batch = {
  /** A batch can contain metadata, data, or in case of unstructured data (JSON) */
  batchType: 'data' | 'metadata' | 'partial-result' | 'final-result';
  /** A string identifying the shape of data in this batch (table, etc) */
  shape: string;
  /** Schema of the data in this batch */
  schema?: Schema;
  /** Data in this batch */
  data?: unknown;
  /**  If this is an arrow table. @deprecated Use `data` */
  recordBatch?: ApacheRecordBatch;
  /** Length of data in this batch */
  length: number;

  /** A count of batches received */
  batch?: number;

  /** A count of batches received */
  count?: number;

  /** Bytes used so far */
  bytesUsed?: number;
  /** cursor is the  */
  cursor?: number;

  /** MIME type of the data generating this batch */
  mimeType?: string;

  /** Any other data */
  [key: string]: unknown;
};
