// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Schema,
  TableBatch,
  Table,
  ObjectRowTable,
  ArrayRowTable,
  Feature
} from '@loaders.gl/core/schema';
import type * as arrow from 'apache-arrow';
import {makeArrowTableFromBatches} from '../../arrow/arrow-metadata';
import {isNativeArrowRecordBatch} from '../../../../lib/loader-utils/native-arrow';
import {getTableLength} from '../tables/table-accessors';

/**
 * Assembles all batches from an async iterator into a single table.
 * All batches must have the same shape and compatible schemas. A native RecordBatch stream
 * produces a native Arrow table with metadata refined in emission order.
 * @param batchIterator
 * @returns `null` if no batches are yielded by the async iterator
 */
export function makeTableFromBatches(
  batchIterator: AsyncIterable<arrow.RecordBatch> | Iterable<arrow.RecordBatch>
): Promise<arrow.Table | null>;
export function makeTableFromBatches(
  batchIterator: AsyncIterable<TableBatch> | Iterable<TableBatch>
): Promise<Table | null>;
export async function makeTableFromBatches(
  batchIterator:
    | AsyncIterable<TableBatch | arrow.RecordBatch>
    | Iterable<TableBatch | arrow.RecordBatch>
): Promise<Table | arrow.Table | null> {
  let arrayRows: ArrayRowTable['data'];
  let objectRows: ObjectRowTable['data'];
  let features: Feature[];
  let shape: Table['shape'] | 'arrow' | null = null;
  let schema: Schema | undefined;
  const arrowBatches: arrow.RecordBatch[] = [];

  for await (const batch of batchIterator) {
    const batchShape = isNativeArrowRecordBatch(batch) ? 'arrow' : batch.shape;
    shape ??= batchShape;
    if (shape !== batchShape) throw new Error('Batches must have the same shape');
    if (isNativeArrowRecordBatch(batch)) {
      arrowBatches.push(batch);
      continue;
    }
    schema = schema || batch.schema;

    switch (batch.shape) {
      case 'array-row-table':
        arrayRows = arrayRows! || [];
        for (let rowIndex = 0; rowIndex < getTableLength(batch); rowIndex++) {
          const row = batch.data[rowIndex];
          arrayRows.push(row);
        }
        break;

      case 'object-row-table':
        objectRows = objectRows! || [];
        for (let rowIndex = 0; rowIndex < getTableLength(batch); rowIndex++) {
          const row = batch.data[rowIndex];
          objectRows.push(row);
        }
        break;

      case 'geojson-table':
        features = features! || [];
        for (let rowIndex = 0; rowIndex < getTableLength(batch); rowIndex++) {
          const row = batch.features[rowIndex];
          features.push(row);
        }
        break;

      case 'columnar-table':
      default:
        throw new Error('shape');
    }
  }

  if (!shape) {
    return null;
  }

  switch (shape) {
    case 'arrow':
      return makeArrowTableFromBatches(arrowBatches);
    case 'array-row-table':
      return {shape: 'array-row-table', data: arrayRows!, schema};

    case 'object-row-table':
      return {shape: 'object-row-table', data: objectRows!, schema};

    case 'geojson-table':
      return {shape: 'geojson-table', type: 'FeatureCollection', features: features!, schema};

    default:
      return null;
  }
}
