// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TableBatch,
  ArrayRowTableBatch,
  ObjectRowTableBatch,
  ColumnarTableBatch
} from '@loaders.gl/core/schema';
import * as arrow from 'apache-arrow';
import {isNativeArrowRecordBatch} from '../../../../lib/loader-utils/native-arrow';
import {makeArrowMetadataBatch} from '../../arrow/arrow-metadata';
import {convertTable} from '../tables/convert-table';

export function convertBatch(batches: TableBatch, shape: 'object-row-table'): ObjectRowTableBatch;
export function convertBatch(batches: TableBatch, shape: 'array-row-table'): ArrayRowTableBatch;
export function convertBatch(batches: TableBatch, shape: 'columnar-table'): ColumnarTableBatch;
export function convertBatch(
  batch: TableBatch | arrow.RecordBatch,
  shape: 'arrow'
): arrow.RecordBatch;

/** Converts one batch. Use convertBatches to expand an Arrow wrapper containing multiple batches. */
export function convertBatch(
  batch: TableBatch | arrow.RecordBatch,
  shape: 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow'
): TableBatch | arrow.RecordBatch {
  if (isNativeArrowRecordBatch(batch)) {
    if (shape === 'arrow') return batch;
    throw new Error('Convert a native RecordBatch as a table to select a row or column layout');
  }
  switch (shape) {
    case 'object-row-table':
      return {...batch, ...convertTable(batch, 'object-row-table')};
    case 'array-row-table':
      return {...batch, ...convertTable(batch, 'array-row-table')};
    case 'columnar-table':
      return {...batch, ...convertTable(batch, 'columnar-table')};
    case 'arrow': {
      const table = convertTable(batch, 'arrow');
      if (table.batches.length > 1) {
        throw new Error('Use convertBatches to expand multiple Arrow record batches');
      }
      return table.batches[0] ?? makeArrowMetadataBatch(table.schema);
    }
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
  batches: Iterable<TableBatch | arrow.RecordBatch> | AsyncIterable<TableBatch | arrow.RecordBatch>,
  shape: 'arrow'
): AsyncIterableIterator<arrow.RecordBatch>;

/**
 * Converts batches in emission order. For Arrow output, yields native record batches,
 * expanding wrapped tables and preserving the declared schema of empty inputs.
 */
export async function* convertBatches(
  batches: Iterable<TableBatch | arrow.RecordBatch> | AsyncIterable<TableBatch | arrow.RecordBatch>,
  shape: 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow'
): AsyncIterableIterator<TableBatch | arrow.RecordBatch> {
  for await (const batch of batches) {
    if (isNativeArrowRecordBatch(batch)) {
      if (shape !== 'arrow') throw new Error('Expected a loaders.gl table batch');
      yield batch;
      continue;
    }
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
      case 'arrow': {
        const table = convertTable(batch, 'arrow');
        if (table.batches.length) yield* table.batches;
        else yield makeArrowMetadataBatch(table.schema);
        break;
      }
      default:
        throw new Error(shape);
    }
  }
}
