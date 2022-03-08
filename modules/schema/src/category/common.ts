import type {RecordBatch} from 'apache-arrow';

export type Field = any;

export type Schema = {
  [key: string]: Field;
};

export type Batch = {
  batchType: 'data' | 'metadata' | 'partial-result' | 'final-result';
  mimeType?: string;
  shape: string;
  data: any;
  recordBatch?: RecordBatch;
  length: number;
  schema?: Schema;

  /** Bytes processed in all batches up to and including this batch */
  bytesUsed?: number;

  /**
   * Total number of bytes in all batches
   *
   * This field is not always available, for instance when fetching compressed data
   */
  bytesTotal?: number;

  /**
   * Total number of rows parsed up to and including this batch
   */
  rowsUsed?: number;

  /** Total number of rows in all batches
   *
   * This field is not always available
   */
  rowsTotal?: number;

  /** @deprecated Use bytesUsed or rowsUsed */
  count?: number;

  /** @deprecated */
  cursor?: number;
};
