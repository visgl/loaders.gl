// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  ArrayType,
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  Schema
} from '@loaders.gl/schema';
import {convertSchemaToArrow, convertTable} from '@loaders.gl/schema-utils';

import type {ParquetJSLoaderOptions} from '../../parquet-loader-options';
import {preloadCompressions} from '../../parquetjs/compression';
import {ParquetReader} from '../../parquetjs/parser/parquet-reader';
import type {
  ParquetColumnChunk,
  ParquetField,
  ParquetRowGroup
} from '../../parquetjs/schema/declare';
import type {ParquetSchema} from '../../parquetjs/schema/schema';
import {materializeColumn, materializeRows} from '../../parquetjs/schema/shred';
import {toUint8Array} from '../../parquetjs/utils/binary-utils';
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

    const arrowTable = normalizeArrowTableGeoMetadata(
      convertRowGroupSliceToArrow(schema, parquetSchema, rowGroup, selectionStart, selectionEnd),
      schema.metadata
    );
    const batchSize =
      requestedBatchSize && requestedBatchSize > 0 ? requestedBatchSize : remainingRowCount;

    for (let batchStart = selectionStart; batchStart < selectionEnd; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, selectionEnd);
      const batchTable = sliceArrowTable(
        arrowTable,
        batchStart - selectionStart,
        batchEnd - selectionStart
      );
      const length = batchEnd - batchStart;

      yield {
        batchType: 'data',
        shape: batchTable.shape,
        schema: batchTable.schema,
        data: batchTable.data,
        length
      };
      rowsYielded += length;
    }

    if (rowLimit !== undefined && rowsYielded >= rowLimit) {
      return;
    }
  }
}

/** Builds Arrow from one selected row-group range and falls back for nested columns. */
function convertRowGroupSliceToArrow(
  schema: Schema,
  parquetSchema: ParquetSchema,
  rowGroup: ParquetRowGroup,
  start: number,
  end: number
): ArrowTable {
  if (Object.keys(rowGroup.columnData).some(columnKey => columnKey.includes(','))) {
    const table: ObjectRowTable = {
      shape: 'object-row-table',
      schema,
      data: materializeRows(parquetSchema, rowGroup).slice(start, end)
    };
    return convertTable(table, 'arrow-table');
  }

  const arrowSchema = convertSchemaToArrow(schema);
  const vectors: Record<string, arrow.Vector> = {};
  for (const field of arrowSchema.fields) {
    const parquetField = parquetSchema.findField(field.name);
    const columnData = rowGroup.columnData[field.name];
    const byteVector = createRawByteArrowVector(field.type, parquetField, columnData, start, end);
    if (byteVector) {
      vectors[field.name] = byteVector;
      continue;
    }

    const fullColumn =
      materializeColumn(parquetSchema, rowGroup, field.name) ||
      new Array(rowGroup.rowCount).fill(null);
    const column = sliceColumn(fullColumn, start, end);
    vectors[field.name] = arrow.vectorFromArray(
      normalizeArrowColumn(column, field.type),
      field.type
    );
  }

  return {
    shape: 'arrow-table',
    schema,
    data: createArrowTable(arrowSchema, vectors, end - start)
  };
}

/** Creates an Arrow table while retaining row counts for a schema with no projected fields. */
function createArrowTable(
  schema: arrow.Schema,
  vectors: Record<string, arrow.Vector>,
  rowCount: number
): arrow.Table {
  if (schema.fields.length || rowCount === 0) {
    return new arrow.Table(schema, vectors);
  }

  const recordBatch = new arrow.RecordBatch(
    schema,
    arrow.makeData({type: new arrow.Struct([]), children: []})
  );
  // Apache Arrow JS derives RecordBatch length from its children and therefore resets an empty
  // Struct to zero rows. Restore the explicit Parquet selection length after construction.
  Object.defineProperty(recordBatch.data, 'length', {value: rowCount});
  return new arrow.Table(schema, [recordBatch]);
}

/** Creates an Arrow Utf8 or Binary vector directly from decoded Parquet byte arrays. */
function createRawByteArrowVector(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk | undefined,
  start: number,
  end: number
): arrow.Vector | undefined {
  if (!columnData || !supportsRawByteArrowVector(arrowType, parquetField)) {
    return undefined;
  }

  const rowCount = end - start;
  const valueOffsets = new Int32Array(rowCount + 1);
  const nullBitmap = new Uint8Array(Math.ceil(rowCount / 8));
  let valueIndex = 0;
  let dataByteLength = 0;
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < start; rowIndex++) {
    if (columnData.dlevels[rowIndex] === parquetField.dLevelMax) {
      valueIndex++;
    }
  }
  const firstValueIndex = valueIndex;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceRowIndex = start + rowIndex;
    if (columnData.dlevels[sourceRowIndex] === parquetField.dLevelMax) {
      const bytes = toUint8Array(columnData.values[valueIndex++]);
      dataByteLength += bytes.byteLength;
      nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
    } else {
      nullCount++;
    }
    if (dataByteLength > 0x7fffffff) {
      throw new Error('Arrow Utf8/Binary column exceeds the 32-bit offset range');
    }
    valueOffsets[rowIndex + 1] = dataByteLength;
  }

  const data = new Uint8Array(dataByteLength);
  let dataOffset = 0;
  for (let index = firstValueIndex; index < valueIndex; index++) {
    const bytes = toUint8Array(columnData.values[index]);
    data.set(bytes, dataOffset);
    dataOffset += bytes.byteLength;
  }

  const nulls = nullCount ? nullBitmap : undefined;
  if (arrowType instanceof arrow.Utf8) {
    return new arrow.Vector([
      arrow.makeData({
        type: arrowType,
        valueOffsets,
        data,
        nullBitmap: nulls,
        nullCount
      })
    ]);
  }
  if (arrowType instanceof arrow.Binary) {
    return new arrow.Vector([
      arrow.makeData({
        type: arrowType,
        valueOffsets,
        data,
        nullBitmap: nulls,
        nullCount
      })
    ]);
  }
  return undefined;
}

/** Returns whether one flat Parquet byte column maps directly to Arrow Utf8 or Binary. */
function supportsRawByteArrowVector(
  arrowType: arrow.DataType,
  parquetField: ParquetField
): boolean {
  if (arrowType instanceof arrow.Utf8) {
    return parquetField.originalType === 'UTF8';
  }
  if (arrowType instanceof arrow.Binary) {
    return (
      !parquetField.originalType &&
      (parquetField.primitiveType === 'BYTE_ARRAY' ||
        parquetField.primitiveType === 'FIXED_LEN_BYTE_ARRAY')
    );
  }
  return false;
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

/** Slices one Arrow table while preserving the loaders.gl schema wrapper. */
function sliceArrowTable(table: ArrowTable, start: number, end: number): ArrowTable {
  if (start === 0 && end === table.data.numRows) {
    return table;
  }
  if (table.data.numCols === 0) {
    return {...table, data: createArrowTable(table.data.schema, {}, end - start)};
  }
  return {...table, data: table.data.slice(start, end)};
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
