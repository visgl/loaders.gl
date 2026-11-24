// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {selectArrowBatchRows} from '@math.gl/core/arrow';
import {
  compileColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateReader
} from '@math.gl/sql/columnar-predicate';
import {validateColumnarPredicate} from '@loaders.gl/core/loader-utils';

/** Controls residual filtering of one Arrow input. */
export type ArrowFilterOptions = Readonly<{
  /** Stops after retaining this many rows, in source order. */
  limit?: number;
  /** Cooperatively cancels predicate evaluation. */
  signal?: AbortSignal;
}>;

/** Filters record batches independently while preserving source schema and batch metadata. */
export function filterArrowTable(
  source: arrow.Table,
  predicate: ColumnarPredicate<unknown>,
  options: ArrowFilterOptions = {}
): arrow.Table {
  validateColumnarPredicate(predicate, new Set(source.schema.fields.map(field => field.name)));
  return filterArrowRows(
    source,
    batch => {
      const evaluate = compileColumnarPredicate(predicate as ColumnarPredicate, path =>
        bindPredicateColumn(batch, path)
      );
      return rowIndex => evaluate(rowIndex) === true;
    },
    options
  );
}

/** Binds an exact Arrow column and any nested property path within it. */
function bindPredicateColumn(
  batch: arrow.RecordBatch,
  [name, ...properties]: readonly string[]
): ColumnarPredicateReader {
  const column = batch.getChild(name);
  if (!column) throw new Error(`Arrow query column not found: ${name}`);
  return rowIndex => {
    let value = column.get(rowIndex);
    for (const property of properties) {
      if (value == null) return null;
      value = value[property];
    }
    return value;
  };
}

/** Retains matching rows while preserving Arrow schema and batch metadata. */
export function filterArrowRows(
  source: arrow.Table,
  selectBatch: (batch: arrow.RecordBatch) => (rowIndex: number) => boolean,
  options: ArrowFilterOptions = {}
): arrow.Table {
  let remaining = options.limit ?? Infinity;
  if (remaining !== Infinity && (!Number.isSafeInteger(remaining) || remaining < 0)) {
    throw new Error('Arrow filter limit must be a non-negative safe integer.');
  }
  options.signal?.throwIfAborted();
  const batches: arrow.RecordBatch[] = [];
  for (const batch of source.batches) {
    if (remaining === 0) break;
    options.signal?.throwIfAborted();
    const selectRow = selectBatch(batch);
    const indices: number[] = [];
    for (let rowIndex = 0; rowIndex < batch.numRows && indices.length < remaining; rowIndex++) {
      options.signal?.throwIfAborted();
      if (selectRow(rowIndex)) indices.push(rowIndex);
    }
    remaining -= indices.length;
    const selected = selectArrowBatchRows(batch, indices);
    if (selected) batches.push(selected);
  }
  return new arrow.Table(source.schema, batches);
}
