// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {createFloat16Array, getFloat16Storage, isNativeFloat16Array} from '@loaders.gl/core/schema';
import type {Field, Schema, TableBatch} from '@loaders.gl/core/schema';
import {convertSchemaToArrow} from '@loaders.gl/core/schema-utils';
import {
  type TableQueryPushdownPlan,
  type TableQueryPushdownRequest,
  type TableQueryReadOptions
} from '@loaders.gl/core/loader-utils';

/** Plans simple float projections on decoded text rows before Arrow materialization. */
export function planTextFloatProjection(
  schema: Schema,
  query: TableQueryPushdownRequest,
  read: (options: TableQueryReadOptions) => AsyncIterable<TableBatch>
): TableQueryPushdownPlan | null {
  if (!query.select?.length || query.where) return null;
  const columns: {source: Field; output: Field; cast: boolean}[] = [];
  let casts = 0;
  let half: Float16Array | undefined;
  for (const [index, item] of query.select.entries()) {
    if (typeof item === 'object' && 'array' in item) return null;
    const expression =
      typeof item === 'object' && 'expression' in item ? item.expression : undefined;
    const cast =
      expression?.type === 'CallExpression' &&
      expression.callee.type === 'Identifier' &&
      expression.callee.name === 'cast' &&
      expression.arguments.length === 2
        ? expression.arguments
        : undefined;
    const column =
      typeof item === 'string'
        ? item
        : 'column' in item
          ? item.column
          : cast?.[0]?.type === 'Identifier'
            ? cast[0].name
            : undefined;
    const field = schema.fields.find(candidate => candidate.name === column);
    if (!field) return null;
    const name =
      typeof item === 'string'
        ? item
        : (item.as ?? (expression ? `column${index + 1}` : field.name));
    if (!expression) {
      columns.push({source: field, output: {...field, name}, cast: false});
      continue;
    }
    const target = cast?.[1]?.type === 'Literal' ? cast[1].value : undefined;
    if (field.type !== 'float64' && field.type !== 'float32') return null;
    if (target !== 'float64' && target !== 'float32' && target !== 'float16') return null;
    if (target === 'float16' && !half) {
      const storage = createFloat16Array(1);
      if (!isNativeFloat16Array(storage)) return null;
      half = storage;
    }
    casts++;
    columns.push({
      source: field,
      output: {name, type: target, nullable: field.nullable},
      cast: true
    });
  }
  if (!casts) return null;
  const outputSchema: Schema = {...schema, fields: columns.map(column => column.output)};
  const arrowSchema = convertSchemaToArrow(outputSchema);
  const halfBits = half && getFloat16Storage(half);
  const struct = new arrow.Struct(arrowSchema.fields);
  return {
    schema: outputSchema,
    /** Applies the row window before converting selected values into the output buffers. */
    async *read({signal} = {}) {
      for await (const batch of read({offset: query.offset, limit: query.limit, signal})) {
        if (batch.shape !== 'object-row-table' && batch.shape !== 'array-row-table') {
          throw new Error('Expected text row batches for typed projection.');
        }
        const rowData = batch.data;
        const isArrayRow = batch.shape === 'array-row-table';
        const children = columns.map(({source, output, cast}, index) => {
          const inputIndex =
            batch.schema?.fields.findIndex(field => field.name === source.name) ?? -1;
          if (inputIndex < 0 || batch.schema?.fields[inputIndex].type !== source.type) {
            throw new Error('Text query input schema changed during projection.');
          }
          const readValue = isArrayRow
            ? (row: number) => (rowData[row] as unknown[])[inputIndex]
            : (row: number) => (rowData[row] as Record<string, unknown>)[source.name];
          const halfOutput = cast && output.type === 'float16';
          const builder = arrow.makeBuilder({
            type: halfOutput ? new arrow.Uint16() : arrowSchema.fields[index].type,
            nullValues: [null, undefined]
          });
          for (let row = 0; row < batch.length; row++) {
            signal?.throwIfAborted();
            let value = readValue(row);
            if (cast && value == null && source.nullable === false) {
              throw new Error('Non-nullable expression cast returned null');
            }
            if (cast && value != null) {
              let numeric = source.type === 'float32' ? Math.fround(Number(value)) : Number(value);
              if (output.type === 'float32') numeric = Math.fround(numeric);
              if (output.type === 'float16') {
                half![0] = numeric;
                numeric = half![0];
              }
              if (!Number.isFinite(numeric))
                throw new Error('Floating CAST overflow or non-finite value');
              value = halfOutput ? halfBits![0] : numeric;
            }
            builder.append(value);
          }
          const data = builder.finish().flush();
          return halfOutput
            ? arrow.makeData({
                type: new arrow.Float16(),
                length: data.length,
                data: data.values,
                nullBitmap: data.nullBitmap,
                nullCount: data.nullCount
              })
            : data;
        });
        const recordBatch = new arrow.RecordBatch(
          arrowSchema,
          arrow.makeData({
            type: struct,
            length: batch.length,
            children
          })
        );
        yield recordBatch;
      }
    }
  };
}
