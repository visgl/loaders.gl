// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {selectArrowBatchRows} from '@math.gl/core/arrow';
import {
  compileColumnarPredicate,
  type ColumnarPredicate,
  type ColumnarPredicateReader,
  type ColumnarPredicateValue
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
  const boundPredicate = normalizeArrowDatePredicate(predicate as ColumnarPredicate);
  return filterArrowRows(
    source,
    batch => {
      const evaluate = compileColumnarPredicate(boundPredicate, path =>
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
    return dateToMilliseconds(value);
  };
}

/** Normalizes date literals to the millisecond values exposed by Arrow row accessors. */
function normalizeArrowDatePredicate(predicate: ColumnarPredicate): ColumnarPredicate {
  switch (predicate.op) {
    case 'and':
    case 'or':
      return {...predicate, args: predicate.args.map(normalizeArrowDatePredicate)};
    case 'not':
      return {...predicate, args: [normalizeArrowDatePredicate(predicate.args[0])]};
    case 'isNull':
      return predicate;
    case 'in':
      return {...predicate, args: [predicate.args[0], predicate.args[1].map(dateToMilliseconds)]};
    default:
      return {...predicate, args: [predicate.args[0], dateToMilliseconds(predicate.args[1])]};
  }
}

/** Converts logical dates while retaining all other portable predicate values. */
function dateToMilliseconds<Value extends ColumnarPredicateValue | null | undefined>(
  value: Value
): Value | number {
  return value instanceof Date ? value.getTime() : value;
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
