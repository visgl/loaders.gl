// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {TableSelection} from '@loaders.gl/core/loader-utils';

/**
 * Projects and aliases existing Arrow fields without copying their data.
 * ARRAY[x, y, z] creates an interleaved FixedSizeList<Float32|Float64> with row-level validity.
 * A null component marks the entire list null and leaves finite zero padding in its data buffer.
 */
export function projectArrowTable(
  source: arrow.Table,
  selections: readonly TableSelection[]
): arrow.Table {
  const outputNames = new Set<string>();
  const fields: arrow.Field[] = [];
  const specifications: Array<
    {kind: 'column'; index: number} | {kind: 'array'; indices: number[]; precision: 'float32' | 'float64'}
  > = [];

  for (const selection of selections) {
    if (typeof selection === 'object' && 'array' in selection) {
      if (!Array.isArray(selection.array) || selection.array.length === 0) {
        throw new Error('Arrow ARRAY projection requires at least one source column.');
      }
      const indices = selection.array.map(column => {
        const index = source.schema.fields.findIndex(field => field.name === column);
        if (index < 0) throw new Error(`Arrow ARRAY column not found: ${column}`);
        const type = source.schema.fields[index].type;
        if (!(type instanceof arrow.Float)) {
          throw new Error(`Arrow ARRAY requires floating-point source column: ${column}`);
        }
        return index;
      });
      if (!selection.as || outputNames.has(selection.as)) {
        throw new Error(`Invalid or duplicate Arrow projection output name: ${selection.as}`);
      }
      outputNames.add(selection.as);
      const precision = selection.type ??
        (indices.some(index => source.schema.fields[index].type instanceof arrow.Float64)
          ? 'float64'
          : 'float32');
      const floatType = precision === 'float64' ? new arrow.Float64() : new arrow.Float32();
      fields.push(new arrow.Field(
        selection.as,
        new arrow.FixedSizeList(indices.length, new arrow.Field('value', floatType, false)),
        indices.some(index => source.schema.fields[index].nullable)
      ));
      specifications.push({kind: 'array', indices, precision});
      continue;
    }
    const column = typeof selection === 'string' ? selection : selection.column;
    const name = typeof selection === 'string' ? selection : selection.as ?? column;
    const index = source.schema.fields.findIndex(field => field.name === column);
    if (index < 0) throw new Error(`Arrow projection column not found: ${column}`);
    if (!name || outputNames.has(name)) {
      throw new Error(`Invalid or duplicate Arrow projection output name: ${name}`);
    }
    outputNames.add(name);
    fields.push(source.schema.fields[index].clone({name}));
    specifications.push({kind: 'column', index});
  }

  const schema = new arrow.Schema(fields, source.schema.metadata);
  const batches = source.batches.map(batch => {
    const children = specifications.map(specification => {
      if (specification.kind === 'column') return batch.data.children[specification.index];
      const {indices, precision} = specification;
      const floatType = precision === 'float64' ? new arrow.Float64() : new arrow.Float32();
      const values = precision === 'float64'
        ? new Float64Array(batch.numRows * indices.length)
        : new Float32Array(batch.numRows * indices.length);
      const bitmap = new Uint8Array(Math.ceil(batch.numRows / 8));
      const vectors = indices.map(index => batch.getChildAt(index)!);
      let nullCount = 0;
      for (let row = 0; row < batch.numRows; row++) {
        const components = vectors.map(vector => vector.get(row));
        if (components.some(value => value === null || value === undefined)) {
          nullCount++;
        } else {
          bitmap[row >> 3] |= 1 << (row & 7);
          for (let index = 0; index < components.length; index++) {
            values[row * indices.length + index] = components[index] as number;
          }
        }
      }
      return arrow.makeData({
        type: new arrow.FixedSizeList(
          indices.length,
          new arrow.Field('value', floatType, false)
        ),
        length: batch.numRows,
        nullCount,
        nullBitmap: nullCount ? bitmap : undefined,
        child: arrow.makeData({
          type: floatType,
          data: values,
          length: values.length
        })
      });
    });
    return new arrow.RecordBatch(
      schema,
      arrow.makeData({
        type: new arrow.Struct(fields),
        length: batch.numRows,
        children
      }),
      batch.metadata
    );
  });
  return new arrow.Table(schema, batches);
}
