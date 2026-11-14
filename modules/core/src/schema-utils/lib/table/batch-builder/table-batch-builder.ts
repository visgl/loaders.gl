// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, TableBatch} from '@loaders.gl/core/schema';
import {ArrowTableBuilder} from './arrow-table-builder';
import {convertToColumnarTable} from '../tables/convert-table';
import {
  convertToArrayRow,
  convertToObjectRow,
  inferHeadersFromArrayRow,
  inferHeadersFromObjectRow
} from '../tables/row-utils';

// TODO define interface instead
type TableBatchBuilderOptions = {
  shape?: 'array-row-table' | 'object-row-table' | 'columnar-table';
  batchSize?: number | 'auto';
};

type GetBatchOptions = {
  bytesUsed?: number;
  [key: string]: any;
};

const DEFAULT_OPTIONS: Required<TableBatchBuilderOptions> = {
  shape: undefined!,
  batchSize: 'auto'
};

/** Incrementally builds batches from a stream of rows */
export class TableBatchBuilder {
  schema: Schema;
  options: Required<TableBatchBuilderOptions>;

  /** Persistent Arrow builders for typed output. */
  private arrowBuilder: ArrowTableBuilder | null = null;
  /** Rows retained for explicit raw output, including schema-less JSON. */
  private rows: (any[] | Record<string, any>)[] = [];
  private batchCount: number = 0;
  private bytesUsed: number = 0;
  private isChunkComplete: boolean = false;

  constructor(schema: Schema, options?: TableBatchBuilderOptions) {
    this.schema = schema;
    this.options = {...DEFAULT_OPTIONS, ...options};
  }

  /** @deprecated Use addArrayRow or addObjectRow */
  addRow(row: any[] | {[columnName: string]: any}): void {
    if (this.options.shape === 'columnar-table') {
      this.arrowBuilder ??= new ArrowTableBuilder(this.schema);
      if (Array.isArray(row)) {
        this.arrowBuilder.addArrayRow(row);
      } else {
        this.arrowBuilder.addObjectRow(row);
      }
    } else {
      this.rows.push(row);
    }
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

  private _isFull(): boolean {
    // No batch, not ready
    if (this.rowCount() === 0) {
      return false;
    }

    // if batchSize === 'auto' we wait for chunk to complete
    // if batchSize === number, ensure we have enough rows
    if (this.options.batchSize === 'auto') {
      if (!this.isChunkComplete) {
        return false;
      }
    } else if (this.options.batchSize > this.rowCount()) {
      return false;
    }

    // Emit batch
    this.isChunkComplete = false;
    return true;
  }

  /**
   * bytesUsed can be set via chunkComplete or via getBatch*
   */
  private _getBatch(options?: GetBatchOptions): TableBatch | null {
    if (this.rowCount() === 0) {
      return null;
    }

    // TODO - this can overly increment bytes used?
    if (options?.bytesUsed) {
      this.bytesUsed = options.bytesUsed;
    }
    const normalizedBatch = this.takeBatch();
    normalizedBatch.count = this.batchCount;
    normalizedBatch.bytesUsed = this.bytesUsed;
    Object.assign(normalizedBatch, options);

    this.batchCount++;
    return normalizedBatch;
  }

  /** Returns the number of rows buffered for the next batch. */
  private rowCount(): number {
    return this.arrowBuilder?.length ?? this.rows.length;
  }

  /** Flushes typed output or takes ownership of the buffered raw rows. */
  private takeBatch(): TableBatch {
    if (this.arrowBuilder) {
      const batch = this.arrowBuilder.flushBatch()!;
      return {...batch, ...convertToColumnarTable(batch)};
    }
    const rows = this.rows;
    this.rows = [];
    const shape =
      this.options.shape ?? (Array.isArray(rows[0]) ? 'array-row-table' : 'object-row-table');
    const firstRow = rows[0];
    const fieldNames =
      this.schema?.fields.map(field => field.name) ??
      (Array.isArray(firstRow)
        ? inferHeadersFromArrayRow(firstRow)
        : inferHeadersFromObjectRow(firstRow));
    if (shape === 'array-row-table') {
      return {
        shape,
        batchType: 'data',
        data: rows.map(row => (Array.isArray(row) ? row : convertToArrayRow(row, fieldNames))),
        schema: this.schema,
        length: rows.length
      };
    }
    return {
      shape: 'object-row-table',
      batchType: 'data',
      data: rows.map(row => (Array.isArray(row) ? convertToObjectRow(row, fieldNames) : row)),
      schema: this.schema,
      length: rows.length
    };
  }
}
