import type {TableBatch} from '../../category/table';
import type Schema from '../schema/classes/schema';
import type {TableBatchAggregator, TableBatchConstructor} from './table-batch-aggregator';
import BaseTableBatchAggregator from './base-table-batch-aggregator';
import RowTableBatchAggregator from './row-table-batch-aggregator';
import ColumnarTableBatchAggregator from './columnar-table-batch-aggregator';

// TODO define interface instead
type TableBatchBuilderOptions = {
  type: 'row-table' | 'array-row-table' | 'object-row-table' | 'columnar-table' | 'arrow-table';
  batchSize?: number | 'auto';
  batchDebounceMs?: number;
};

type GetBatchOptions = {
  bytesUsed?: number;
  [key: string]: any;
};

const DEFAULT_OPTIONS: Required<TableBatchBuilderOptions> = {
  type: 'array-row-table',
  batchSize: 'auto',
  batchDebounceMs: 0
};

const ERR_MESSAGE = 'TableBatchBuilder';

/** Incrementally builds batches from a stream of rows */
export default class TableBatchBuilder {
  schema: Schema;
  options: Required<TableBatchBuilderOptions>;

  aggregator: TableBatchAggregator | null = null;
  batchCount: number = 0;
  bytesUsed: number = 0;
  isChunkComplete: boolean = false;
  lastBatchEmittedMs: number = Date.now();

  static ArrowBatch?: TableBatchConstructor;

  constructor(schema: Schema, options?: TableBatchBuilderOptions) {
    this.schema = schema;
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  /** @deprecated Use addArrayRow or addObjectRow */
  addRow(row: any[] | {[columnName: string]: any}): void {
    return Array.isArray(row) ? this.addArrayRow(row) : this.addObjectRow(row);
  }

  /** Add one row to the batch */
  addArrayRow(row: any[]) {
    if (!this.aggregator) {
      const TableBatchType = this._getTableBatchType();
      this.aggregator = new TableBatchType(this.schema, this.options);
    }
    this.aggregator.addArrayRow(row);
  }

  /** Add one row to the batch */
  addObjectRow(row: {[columnName: string]: any}): void {
    if (!this.aggregator) {
      const TableBatchType = this._getTableBatchType();
      this.aggregator = new TableBatchType(this.schema, this.options);
    }
    this.aggregator.addObjectRow(row);
  }

  /** Mark an incoming raw memory chunk has completed */
  chunkComplete(chunk: ArrayBuffer | string): void {
    if (chunk instanceof ArrayBuffer) {
      this.bytesUsed += chunk.byteLength;
    }
    if (typeof chunk === 'string') {
      this.bytesUsed += chunk.length;
    }
    this.isChunkComplete = true;
  }

  getFullBatch(options?: GetBatchOptions): TableBatch | null {
    return this._isFull() ? this._getBatch(options) : null;
  }

  getFinalBatch(options?: GetBatchOptions): TableBatch | null {
    return this._getBatch(options);
  }

  // INTERNAL

  /** @deprecated */
  _hasBatch(): boolean {
    return Boolean(this.aggregator);
  }

  _isFull(): boolean {
    // No batch, not ready
    if (!this.aggregator || this.aggregator.rowCount() === 0) {
      return false;
    }

    // if batchSize === 'auto' we wait for chunk to complete
    // if batchSize === number, ensure we have enough rows
    if (this.options.batchSize === 'auto') {
      if (!this.isChunkComplete) {
        return false;
      }
    } else if (this.options.batchSize > this.aggregator.rowCount()) {
      return false;
    }

    // Debounce batches
    if (this.options.batchDebounceMs > Date.now() - this.lastBatchEmittedMs) {
      return false;
    }

    // Emit batch
    this.isChunkComplete = false;
    this.lastBatchEmittedMs = Date.now();
    return true;
  }

  /**
   * bytesUsed can be set via chunkComplete or via getBatch*
   */
  _getBatch(options?: GetBatchOptions): TableBatch | null {
    if (!this.aggregator) {
      return null;
    }

    // TODO - this can overly increment bytes used?
    if (options?.bytesUsed) {
      this.bytesUsed = options.bytesUsed;
    }
    const normalizedBatch = this.aggregator.getBatch() as TableBatch;
    normalizedBatch.count = this.batchCount;
    normalizedBatch.bytesUsed = this.bytesUsed;
    Object.assign(normalizedBatch, options);

    this.batchCount++;
    this.aggregator = null;
    return normalizedBatch;
  }

  _getTableBatchType(): TableBatchConstructor {
    switch (this.options.type) {
      case 'row-table':
        return BaseTableBatchAggregator;
      case 'array-row-table':
      case 'object-row-table':
        return RowTableBatchAggregator;
      case 'columnar-table':
        return ColumnarTableBatchAggregator;
      case 'arrow-table':
        if (!TableBatchBuilder.ArrowBatch) {
          throw new Error(ERR_MESSAGE);
        }
        return TableBatchBuilder.ArrowBatch;
      default:
        throw new Error(ERR_MESSAGE);
    }
  }
}
