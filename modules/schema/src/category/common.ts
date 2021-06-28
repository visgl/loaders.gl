import type {RecordBatch} from 'apache-arrow';

export type Field = any;

export type Schema = {
  [key: string]: Field;
};

export type Batch = {
  type: string;
  batchType: 'data' | 'metadata' | 'partial-result' | 'final-result';
  data: any;
  recordBatch?: RecordBatch;
  length: number;
  schema?: Schema;
  bytesUsed?: number;
  count?: number;
  cursor?: number;
  [key: string]: any;
};

/*
export type Batch = {
  bytesUsed?: number;
  count?: number;
  cursor?: number;
  [key: string]: any;
}
*/
