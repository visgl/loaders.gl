// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Portable options for applying a residual query to an Arrow table. */
export type ArrowTableQueryOptions<PredicateT = unknown> = Readonly<{
  /** Predicate evaluated against all source columns before projection. */
  predicate?: PredicateT;
  /** Output columns in caller-specified order. Defaults to all source columns. */
  columns?: readonly string[];
  /** Maximum number of rows retained after filtering. */
  limit?: number;
}>;

/** Callback used by Arrow table query adapters to evaluate a portable predicate. */
export type ArrowTableRowFilter<PredicateT = unknown> = (
  predicate: PredicateT,
  columns: Record<string, unknown[]>,
  rowCount: number
) => readonly number[];

/**
 * Applies residual filtering, projection, and limiting to a materialized Arrow table.
 *
 * The Arrow-specific vector construction lives here so format adapters only provide their
 * predicate evaluator. Predicate columns are materialized independently from the projection,
 * allowing WHERE columns that are not returned to the caller.
 */
export function queryArrowTable<PredicateT = unknown>(
  table: arrow.Table,
  options: ArrowTableQueryOptions<PredicateT> = {},
  filterRows?: ArrowTableRowFilter<PredicateT>
): arrow.Table {
  const availableColumns = table.schema.fields.map(field => field.name);
  const selectedColumns = options.columns ? [...options.columns] : availableColumns;
  for (const columnName of selectedColumns) {
    if (!availableColumns.includes(columnName)) {
      throw new Error(`Arrow table query could not read column "${columnName}".`);
    }
  }

  let rowIndices: readonly number[] | undefined;
  if (options.predicate !== undefined) {
    if (!filterRows) throw new Error('Arrow table query requires a predicate evaluator.');
    const columns = Object.fromEntries(
      availableColumns.map(name => [name, [...(table.getChild(name) || [])]])
    );
    rowIndices = filterRows(options.predicate, columns, table.numRows);
  }

  const limitedRowIndices = rowIndices
    ? rowIndices.slice(0, options.limit ?? Number.POSITIVE_INFINITY)
    : undefined;
  return limitedRowIndices
    ? createArrowTableFromRowIndices(table, selectedColumns, limitedRowIndices)
    : table.select(selectedColumns).slice(0, options.limit ?? Number.POSITIVE_INFINITY);
}

/** Selects rows from an Arrow table while preserving the requested column order. */
export function selectArrowTableRows(
  table: arrow.Table,
  rowIndices: readonly number[],
  columns?: readonly string[],
  limit?: number
): arrow.Table {
  const availableColumns = table.schema.fields.map(field => field.name);
  const selectedColumns = columns ? [...columns] : availableColumns;
  for (const columnName of selectedColumns) {
    if (!availableColumns.includes(columnName)) {
      throw new Error(`Arrow table query could not read column "${columnName}".`);
    }
  }
  const limitedRowIndices = rowIndices.slice(0, limit ?? Number.POSITIVE_INFINITY);
  return createArrowTableFromRowIndices(table, selectedColumns, limitedRowIndices);
}

function createArrowTableFromRowIndices(
  sourceData: arrow.Table,
  selectedColumns: readonly string[],
  rowIndices: readonly number[]
): arrow.Table {
  const schema = new arrow.Schema(
    selectedColumns.map(
      columnName => sourceData.schema.fields.find(field => field.name === columnName)!
    ),
    sourceData.schema.metadata
  );
  const vectors = Object.fromEntries(
    selectedColumns.map(columnName => {
      const sourceVector = sourceData.getChild(columnName);
      return [
        columnName,
        arrow.vectorFromArray(
          rowIndices.map(rowIndex => sourceVector?.get(rowIndex)),
          sourceVector?.type
        )
      ];
    })
  );
  const children = selectedColumns.map(columnName => vectors[columnName].data[0]);
  const data = new arrow.Data(
    new arrow.Struct(schema.fields),
    0,
    rowIndices.length,
    0,
    undefined,
    children
  );
  return new arrow.Table(schema, new arrow.RecordBatch(schema, data));
}
