// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema} from '../../../types/schema';
import type {TableBatch} from '../../../types/category-table';
import type {TableBatchAggregator, TableBatchConstructor} from './table-batch-aggregator';
import {BaseTableBatchAggregator} from './base-table-batch-aggregator';
import {RowTableBatchAggregator} from './row-table-batch-aggregator';
import {ColumnarTableBatchAggregator} from './columnar-table-batch-aggregator';

// TODO define interface instead
type TableBatchBuilderOptions = {
  shape?: 'array-row-table' | 'object-row-table' | 'columnar-table' | 'arrow-table';
  batchSize?: number | 'auto';
  batchDebounceMs?: number;
  limit?: number;
  _limitMB?: number;
};

type GetBatchOptions = {
  bytesUsed?: number;
  [key: string]: any;
};

const DEFAULT_OPTIONS: Required<TableBatchBuilderOptions> = {
  shape: undefined!,
  batchSize: 'auto',
  batchDebounceMs: 0,
  limit: 0,
  _limitMB: 0
};

const ERR_MESSAGE = 'TableBatchBuilder';

/** Incrementally builds batches from a stream of rows */
export class TableBatchBuilder {
  schema: Schema;
  options: Required<TableBatchBuilderOptions>;

  private aggregator: TableBatchAggregator | null = null;
  private batchCount: number = 0;
  private bytesUsed: number = 0;
  private isChunkComplete: boolean = false;
  private lastBatchEmittedMs: number = Date.now();
  private totalLength: number = 0;
  private totalBytes: number = 0;
  private rowBytes: number = 0;

  static ArrowBatch?: TableBatchConstructor;

  constructor(schema: Schema, options?: TableBatchBuilderOptions) {
    this.schema = schema;
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  limitReached(): boolean {
    if (Boolean(this.options?.limit) && this.totalLength >= this.options.limit) {
      return true;
    }
    if (Boolean(this.options?._limitMB) && this.totalBytes / 1e6 >= this.options._limitMB) {
      return true;
    }
    return false;
  }

  /** @deprecated Use addArrayRow or addObjectRow */
  addRow(row: any[] | {[columnName: string]: any}): void {
    if (this.limitReached()) {
      return;
    }
    this.totalLength++;
    this.rowBytes = this.rowBytes || this._estimateRowMB(row);
    this.totalBytes += this.rowBytes;
    if (Array.isArray(row)) {
      this.addArrayRow(row);
    } else {
      this.addObjectRow(row);
    }
  }

  /** Add one row to the batch */
  protected addArrayRow(row: any[]) {
    if (!this.aggregator) {
      const TableBatchType = this._getTableBatchType();
      this.aggregator = new TableBatchType(this.schema, this.options);
    }
    this.aggregator.addArrayRow(row);
  }

  /** Add one row to the batch */
  protected addObjectRow(row: {[columnName: string]: any}): void {
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

  _estimateRowMB(row: any[] | object): number {
    return Array.isArray(row) ? row.length * 8 : Object.keys(row).length * 8;
  }

  private _isFull(): boolean {
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
  private _getBatch(options?: GetBatchOptions): TableBatch | null {
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

  private _getTableBatchType(): TableBatchConstructor {
    switch (this.options.shape) {
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
        return BaseTableBatchAggregator;
    }
  }
}
