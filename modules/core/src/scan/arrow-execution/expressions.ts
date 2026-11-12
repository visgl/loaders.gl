// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {compileArrowArray, compileArrowExpression} from '@math.gl/expressions/arrow';
import type {TableSelection} from '@math.gl/expressions/sql';
import {getExpressionColumns} from '@math.gl/expressions';

export {compileArrowExpression, compileArrowPredicate} from '@math.gl/expressions/arrow';
export {getExpressionColumns} from '@math.gl/expressions';

/** Finds source columns and rejects ambiguous projection shapes before a scan. */
export function getProjectionColumns(selections: readonly TableSelection[]): string[] {
  return selections.flatMap(selection => {
    if (typeof selection === 'string') return [selection];
    if (!selection || typeof selection !== 'object' || Array.isArray(selection))
      throw new Error('Invalid SQL projection.');
    const keys = Object.keys(selection);
    if ('array' in selection && keys.every(key => ['array', 'as', 'type'].includes(key))) {
      if (!Array.isArray(selection.array))
        throw new Error('SQL ARRAY must specify source columns.');
      return [...selection.array];
    }
    if ('expression' in selection && keys.every(key => ['expression', 'as'].includes(key)))
      return getExpressionColumns(selection.expression);
    if ('column' in selection && keys.every(key => ['column', 'as'].includes(key)))
      return [selection.column];
    throw new Error('Unsupported SQL projection field.');
  });
}

/** Binds SQL projections once and reuses source buffers for uncomputed fields. */
export function compileArrowProjection(
  inputSchema: arrow.Schema,
  selections: readonly TableSelection[],
  signal?: AbortSignal
): (source: arrow.Table) => arrow.Table {
  const names = new Set<string>();
  const columns = selections.map((selection, index) => {
    const computed =
      typeof selection === 'string' || 'column' in selection
        ? undefined
        : 'array' in selection
          ? compileArrowArray(selection.array, {inputSchema, type: selection.type})
          : compileArrowExpression(selection.expression, {inputSchema});
    const column =
      typeof selection === 'string' ? selection : 'column' in selection ? selection.column : '';
    const sourceIndex = inputSchema.fields.findIndex(field => field.name === column);
    const field = computed?.outputField ?? inputSchema.fields[sourceIndex];
    if (!field) throw new Error(`Arrow projection column not found: ${column}`);
    const alias = typeof selection === 'string' ? undefined : selection.as;
    const name = alias === undefined ? (computed ? `column${index + 1}` : column) : alias;
    if (typeof name !== 'string' || !name.length || names.has(name))
      throw new Error(`Invalid or duplicate Arrow projection output name: ${name}`);
    names.add(name);
    return {field: field.clone({name}), computed, sourceIndex};
  });
  const fields = columns.map(column => column.field);
  const schema = new arrow.Schema(
    fields,
    inputSchema.metadata,
    undefined,
    inputSchema.metadataVersion
  );
  return source =>
    new arrow.Table(
      schema,
      source.batches.map(
        batch =>
          new arrow.RecordBatch(
            schema,
            arrow.makeData({
              type: new arrow.Struct(fields),
              length: batch.numRows,
              children: columns.map(({computed, sourceIndex}) =>
                computed
                  ? computed.evaluate(batch, {signal}).data[0]
                  : batch.data.children[sourceIndex]
              )
            }),
            batch.metadata
          )
      )
    );
}
