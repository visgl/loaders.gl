// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  ArrayType,
  ArrowTable,
  ArrowTableBatch,
  ColumnarTable,
  ObjectRowTable,
  Schema
} from '@loaders.gl/schema';
import {convertSchemaToArrow, convertTable} from '@loaders.gl/schema-utils';

import type {ParquetJSLoaderOptions} from '../../parquet-loader-options';
import {preloadCompressions} from '../../parquetjs/compression';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import type {ParquetRowGroup} from '../../parquetjs/schema/declare';
import type {ParquetSchema} from '../../parquetjs/schema/schema';
import {materializeColumns, materializeRows} from '../../parquetjs/schema/shred';
import {normalizeArrowTableGeoMetadata} from '../geo/geospatial-metadata';
import {getSchemaFromParquetReader} from './get-parquet-schema';

/**
 * Parses a Parquet file with the TypeScript implementation directly into Arrow batches.
 * @param file readable Parquet file
 * @param options loader options applied before Arrow conversion
 * @returns Arrow table containing the decoded rows
 */
export async function parseParquetFileToArrowWithJs(
  file: ReadableFile,
  options?: ParquetJSLoaderOptions
): Promise<ArrowTable> {
  const recordBatches: arrow.RecordBatch[] = [];
  let schema: Schema | undefined;

  for await (const batch of parseParquetFileToArrowInBatchesWithJs(file, options)) {
    schema ||= batch.schema;
    recordBatches.push(...batch.data.batches);
  }

  schema ||= await readProjectedSchema(file, options);
  const table = recordBatches.length
    ? new arrow.Table(recordBatches)
    : new arrow.Table(convertSchemaToArrow(schema), []);
  return normalizeArrowTableGeoMetadata(
    {shape: 'arrow-table', data: table, schema},
    schema.metadata
  );
}

/** Reads the projected loaders.gl schema when row selection produces no Arrow record batches. */
async function readProjectedSchema(
  file: ReadableFile,
  options?: ParquetJSLoaderOptions
): Promise<Schema> {
  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });
  return projectSchema(await getSchemaFromParquetReader(reader), options?.parquet?.columns);
}

/**
 * Parses a Parquet file in batches with the TypeScript implementation and materializes Arrow directly
 * from decoded columns whenever the selected schema is flat.
 * @param file readable Parquet file
 * @param options loader options applied before Arrow conversion
 * @returns asynchronous Arrow table batches
 */
export async function* parseParquetFileToArrowInBatchesWithJs(
  file: ReadableFile,
  options?: ParquetJSLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  await preloadCompressions(options);

  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary
  });
  const schema = projectSchema(await getSchemaFromParquetReader(reader), options?.parquet?.columns);
  const parquetSchema = await reader.getSchema();
  const rowGroups = reader.rowGroupIterator(getParquetIterationProps(options));
  const rowOffset = Math.max(0, options?.parquet?.offset || 0);
  const rowLimit = options?.parquet?.limit;
  const requestedBatchSize = options?.parquet?.batchSize;
  let rowsVisited = 0;
  let rowsYielded = 0;

  for await (const rowGroup of rowGroups) {
    const selectionStart = Math.min(rowGroup.rowCount, Math.max(0, rowOffset - rowsVisited));
    const availableRowCount = rowGroup.rowCount - selectionStart;
    const remainingRowCount =
      rowLimit === undefined
        ? availableRowCount
        : Math.max(0, Math.min(availableRowCount, rowLimit - rowsYielded));
    const selectionEnd = selectionStart + remainingRowCount;
    rowsVisited += rowGroup.rowCount;

    if (selectionEnd <= selectionStart) {
      if (rowLimit !== undefined && rowsYielded >= rowLimit) {
        return;
      }
      continue;
    }

    const decodedTable = materializeRowGroup(schema, parquetSchema, rowGroup);
    const batchSize =
      requestedBatchSize && requestedBatchSize > 0 ? requestedBatchSize : remainingRowCount;

    for (let batchStart = selectionStart; batchStart < selectionEnd; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, selectionEnd);
      const batchTable = sliceDecodedTable(decodedTable, batchStart, batchEnd);
      const arrowTable = normalizeArrowTableGeoMetadata(
        convertDecodedTableToArrow(batchTable),
        schema.metadata
      );
      const length = batchEnd - batchStart;

      yield {
        batchType: 'data',
        shape: arrowTable.shape,
        schema: arrowTable.schema,
        data: arrowTable.data,
        length
      };
      rowsYielded += length;
    }

    if (rowLimit !== undefined && rowsYielded >= rowLimit) {
      return;
    }
  }
}

/** Builds Arrow vectors directly from flat decoded columns and falls back for nested row tables. */
function convertDecodedTableToArrow(table: ColumnarTable | ObjectRowTable): ArrowTable {
  if (table.shape === 'object-row-table') {
    return convertTable(table, 'arrow-table');
  }

  const arrowSchema = convertSchemaToArrow(table.schema!);
  const vectors: Record<string, arrow.Vector> = {};
  for (const field of arrowSchema.fields) {
    const column = table.data[field.name];
    vectors[field.name] = arrow.vectorFromArray(
      normalizeArrowColumn(column, field.type),
      field.type
    );
  }

  return {
    shape: 'arrow-table',
    schema: table.schema,
    data: new arrow.Table(arrowSchema, vectors)
  };
}

/** Normalizes JavaScript values that Apache Arrow's 64-bit integer builders require as bigints. */
function normalizeArrowColumn(
  column: ArrayLike<unknown>,
  type: arrow.DataType
): readonly unknown[] {
  if (!(type instanceof arrow.Int) || type.bitWidth !== 64) {
    return column as readonly unknown[];
  }

  return Array.from(column, value => {
    if (value === null || value === undefined || typeof value === 'bigint') {
      return value;
    }
    if (value instanceof Date) {
      return BigInt(value.getTime());
    }
    return BigInt(value as number | string);
  });
}

/** Materializes one decoded row group in the cheapest shape supported by its selected schema. */
function materializeRowGroup(
  schema: Schema,
  parquetSchema: ParquetSchema,
  rowGroup: ParquetRowGroup
): ColumnarTable | ObjectRowTable {
  if (Object.keys(rowGroup.columnData).every(columnKey => !columnKey.includes(','))) {
    return {
      shape: 'columnar-table',
      schema,
      data: materializeColumns(parquetSchema, rowGroup)
    };
  }

  return {
    shape: 'object-row-table',
    schema,
    data: materializeRows(parquetSchema, rowGroup)
  };
}

/** Slices a decoded table without transposing its rows or columns. */
function sliceDecodedTable(
  table: ColumnarTable | ObjectRowTable,
  start: number,
  end: number
): ColumnarTable | ObjectRowTable {
  if (start === 0 && end === getDecodedTableLength(table)) {
    return table;
  }

  if (table.shape === 'object-row-table') {
    return {...table, data: table.data.slice(start, end)};
  }

  const data: Record<string, ArrayLike<unknown>> = {};
  for (const [columnName, column] of Object.entries(table.data)) {
    data[columnName] = sliceColumn(column, start, end);
  }
  return {...table, data};
}

/** Returns the row count of a decoded row or column table. */
function getDecodedTableLength(table: ColumnarTable | ObjectRowTable): number {
  if (table.shape === 'object-row-table') {
    return table.data.length;
  }
  const firstColumn = Object.values(table.data)[0];
  return firstColumn?.length || 0;
}

/** Slices an arbitrary column while preserving efficient native slice implementations. */
function sliceColumn(column: ArrayLike<unknown>, start: number, end: number): ArrayLike<unknown> {
  if ('slice' in column && typeof column.slice === 'function') {
    return (column.slice as (start: number, end: number) => ArrayType)(start, end);
  }
  return Array.from(column).slice(start, end);
}

/** Creates row-group projection properties from public loader options. */
function getParquetIterationProps(
  options?: ParquetJSLoaderOptions
): {columnList?: string[] | string[][]} | undefined {
  const columnList = options?.parquet?.columns;
  return columnList?.length ? {columnList} : undefined;
}

/** Restricts the loaders.gl schema to explicitly selected top-level columns. */
function projectSchema(schema: Schema, columns?: string[]): Schema {
  if (!columns?.length) {
    return schema;
  }

  return {
    ...schema,
    fields: schema.fields.filter(field => columns.includes(field.name))
  };
}
