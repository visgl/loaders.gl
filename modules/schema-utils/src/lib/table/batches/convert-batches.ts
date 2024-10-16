// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TableBatch,
  ArrayRowTableBatch,
  ObjectRowTableBatch,
  ColumnarTableBatch,
  ArrowTableBatch
} from '@loaders.gl/schema';
import {convertTable} from '../tables/convert-table';

export function convertBatch(batches: TableBatch, shape: 'object-row-table'): ObjectRowTableBatch;
export function convertBatch(batches: TableBatch, shape: 'array-row-table'): ArrayRowTableBatch;
export function convertBatch(batches: TableBatch, shape: 'columnar-table'): ColumnarTableBatch;
export function convertBatch(batches: TableBatch, shape: 'arrow-table'): ArrowTableBatch;

/** Convert a table batch to a different shape */
export function convertBatch(
  batch: TableBatch,
  shape: 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow-table'
): TableBatch {
  switch (batch.shape) {
    case 'object-row-table':
      return {...batch, ...convertTable(batch, 'object-row-table')};
    case 'array-row-table':
      return {...batch, ...convertTable(batch, 'array-row-table')};
    case 'columnar-table':
      return {...batch, ...convertTable(batch, 'columnar-table')};
    case 'arrow-table':
      return {...batch, ...convertTable(batch, 'arrow-table')};
    default:
      throw new Error(shape);
  }
}

export function convertBatches(
  batches: Iterable<TableBatch> | AsyncIterable<TableBatch>,
  shape: 'object-row-table'
): AsyncIterableIterator<ObjectRowTableBatch>;
export function convertBatches(
  batches: Iterable<TableBatch> | AsyncIterable<TableBatch>,
  shape: 'array-row-table'
): AsyncIterableIterator<ArrayRowTableBatch>;
export function convertBatches(
  batches: Iterable<TableBatch> | AsyncIterable<TableBatch>,
  shape: 'columnar-table'
): AsyncIterableIterator<ColumnarTableBatch>;
export function convertBatches(
  batches: Iterable<TableBatch> | AsyncIterable<TableBatch>,
  shape: 'arrow-table'
): AsyncIterableIterator<ArrowTableBatch>;

/**
 * Convert batches to a different shape
 * @param table
 * @param shape
 * @returns
 */
export async function* convertBatches(
  batches: Iterable<TableBatch> | AsyncIterable<TableBatch>,
  shape: 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow-table'
): AsyncIterableIterator<TableBatch> {
  for await (const batch of batches) {
    switch (shape) {
      case 'object-row-table':
        yield convertBatch(batch, 'object-row-table');
        break;
      case 'array-row-table':
        yield convertBatch(batch, 'array-row-table');
        break;
      case 'columnar-table':
        yield convertBatch(batch, 'columnar-table');
        break;
      case 'arrow-table':
        yield convertBatch(batch, 'arrow-table');
        break;
      default:
        throw new Error(shape);
    }
  }
}
