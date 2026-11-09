// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {TableSelection} from '@loaders.gl/core/loader-utils';

/**
 * Projects and renames Arrow fields without copying column data buffers.
 * New schema and batch wrappers preserve source row order, batch boundaries, and metadata.
 */
export function projectArrowTable(
  source: arrow.Table,
  selections: readonly TableSelection[]
): arrow.Table {
  const outputNames = new Set<string>();
  const indices: number[] = [];
  const fields = selections.map(selection => {
    const column = typeof selection === 'string' ? selection : selection.column;
    const name =
      typeof selection === 'string'
        ? selection
        : selection.as === undefined
          ? column
          : selection.as;
    const index = source.schema.fields.findIndex(field => field.name === column);
    if (index < 0) throw new Error(`Arrow projection column not found: ${column}`);
    if (
      typeof name !== 'string' ||
      (typeof selection !== 'string' && selection.as !== undefined && !name.length) ||
      outputNames.has(name)
    ) {
      throw new Error(`Invalid or duplicate Arrow projection output name: ${name}`);
    }
    outputNames.add(name);
    indices.push(index);
    return source.schema.fields[index].clone({name});
  });
  const schema = new arrow.Schema(fields, source.schema.metadata);
  const batches = source.batches.map(
    batch =>
      new arrow.RecordBatch(
        schema,
        arrow.makeData({
          type: new arrow.Struct(fields),
          length: batch.numRows,
          children: indices.map(index => batch.data.children[index])
        }),
        batch.metadata
      )
  );
  return new arrow.Table(schema, batches);
}
