// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  ArrayType,
  ArrowTable,
  ArrowTableBatch,
  DataType,
  Field,
  ObjectRowTable,
  Schema,
  SchemaMetadata
} from '@loaders.gl/schema';
import {convertTable, deserializeArrowType} from '@loaders.gl/schema-utils';

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
import {createNestedArrowVector} from '../arrow/create-nested-arrow-vector';
import {getSchemaFromParquetReader} from './get-parquet-schema';

/** Largest byte value copied inline to avoid TypedArray#set call overhead. */
const MAXIMUM_INLINE_BYTE_COPY_LENGTH = 7;

/** Primitive Arrow type instances used by serialized Parquet schemas. */
const PARQUET_ARROW_PRIMITIVE_TYPES: Partial<Record<Extract<DataType, string>, arrow.DataType>> = {
  binary: new arrow.Binary(),
  bool: new arrow.Bool(),
  float32: new arrow.Float32(),
  float64: new arrow.Float64(),
  int8: new arrow.Int8(),
  int16: new arrow.Int16(),
  int32: new arrow.Int32(),
  int64: new arrow.Int64(),
  uint8: new arrow.Uint8(),
  uint16: new arrow.Uint16(),
  uint32: new arrow.Uint32(),
  uint64: new arrow.Uint64(),
  utf8: new arrow.Utf8()
};

/** Inputs accepted by Apache Arrow's overloaded `Schema.assign` method. */
type ArrowSchemaAssignment = arrow.Schema | arrow.Field | arrow.Field[];

/** Arrow schema that preserves identity when Apache Arrow assigns its existing fields. */
class ParquetArrowSchema extends arrow.Schema {
  /** Whether the next exact field assignment may reuse this schema. */
  private reuseIdentityAssignment = false;

  /** Enables identity reuse for one synchronous Arrow RecordBatch construction. */
  enableIdentityAssignmentReuse(): void {
    this.reuseIdentityAssignment = true;
  }

  /** Restores Apache Arrow's normal public assignment semantics. */
  disableIdentityAssignmentReuse(): void {
    this.reuseIdentityAssignment = false;
  }

  /**
   * Avoids cloning fields and merging metadata when assignment is already an exact match.
   * @param assignments schemas or fields to merge into this schema
   * @returns this schema for an identity assignment, otherwise Apache Arrow's assigned schema
   */
  override assign(...assignments: ArrowSchemaAssignment[]): arrow.Schema {
    const firstAssignment = assignments[0];
    if (
      this.reuseIdentityAssignment &&
      assignments.length === 1 &&
      Array.isArray(firstAssignment) &&
      firstAssignment.length === this.fields.length &&
      firstAssignment.every((field, index) => field === this.fields[index])
    ) {
      return this;
    }
    const assignedSchema =
      assignments.length === 1 && firstAssignment instanceof arrow.Schema
        ? super.assign(firstAssignment)
        : super.assign(...(assignments as Array<arrow.Field | arrow.Field[]>));
    return new ParquetArrowSchema(
      assignedSchema.fields,
      assignedSchema.metadata,
      assignedSchema.dictionaries,
      assignedSchema.metadataVersion
    );
  }
}

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
    : new arrow.Table(createParquetArrowSchema(schema), []);
  return {shape: 'arrow-table', data: table, schema};
}

/** Reads the projected loaders.gl schema when row selection produces no Arrow record batches. */
async function readProjectedSchema(
  file: ReadableFile,
  options?: ParquetJSLoaderOptions
): Promise<Schema> {
  const reader = new ParquetReader(file, {
    preserveBinary: options?.parquet?.preserveBinary,
    keyRetriever: options?.parquet?.keyRetriever,
    aadPrefix: options?.parquet?.aadPrefix
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
    preserveBinary: options?.parquet?.preserveBinary,
    retainByteArrayViews: true,
    useTypedValueBuffers: true,
    useTypedLevelBuffers: true,
    keyRetriever: options?.parquet?.keyRetriever,
    aadPrefix: options?.parquet?.aadPrefix
  });
  const schema = projectSchema(await getSchemaFromParquetReader(reader), options?.parquet?.columns);
  const arrowSchema = createParquetArrowSchema(schema);
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

    const arrowTable = convertRowGroupSliceToArrow(
      schema,
      arrowSchema,
      parquetSchema,
      rowGroup,
      selectionStart,
      selectionEnd
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

/** Converts a loaders.gl schema into the identity-aware Arrow schema used by Parquet batches. */
function createParquetArrowSchema(schema: Schema): ParquetArrowSchema {
  return new ParquetArrowSchema(
    schema.fields.map(field => createParquetArrowField(field)),
    createParquetArrowMetadata(schema.metadata)
  );
}

/** Hydrates one serialized Parquet field without generic Arrow conversion allocations. */
function createParquetArrowField(field: Field): arrow.Field {
  return new arrow.Field(
    field.name,
    createParquetArrowType(field.type),
    field.nullable,
    createParquetArrowMetadata(field.metadata)
  );
}

/** Reuses immutable primitive Arrow types and falls back for composite serialized types. */
function createParquetArrowType(dataType: DataType): arrow.DataType {
  const primitiveType =
    typeof dataType === 'string' ? PARQUET_ARROW_PRIMITIVE_TYPES[dataType] : undefined;
  return primitiveType || deserializeArrowType(dataType);
}

/** Hydrates serialized Parquet metadata without an intermediate entries array. */
function createParquetArrowMetadata(metadata?: SchemaMetadata): Map<string, string> {
  const arrowMetadata = new Map<string, string>();
  if (metadata) {
    for (const key of Object.keys(metadata)) {
      arrowMetadata.set(key, metadata[key]);
    }
  }
  return arrowMetadata;
}

/** Builds Arrow from one selected row-group range with per-column fallbacks. */
function convertRowGroupSliceToArrow(
  schema: Schema,
  arrowSchema: arrow.Schema,
  parquetSchema: ParquetSchema,
  rowGroup: ParquetRowGroup,
  start: number,
  end: number
): ArrowTable {
  const vectors: Record<string, arrow.Vector> = {};
  let materializedRows: Record<string, unknown>[] | undefined;
  for (const field of arrowSchema.fields) {
    const parquetField = parquetSchema.findField(field.name);
    const columnData = rowGroup.columnData[field.name];
    const nestedVector = createNestedArrowVector(field.type, parquetField, rowGroup, start, end);
    if (nestedVector) {
      vectors[field.name] = nestedVector;
      continue;
    }
    const decimalVector = createDecimalArrowVector(
      field.type,
      parquetField,
      columnData,
      start,
      end
    );
    if (decimalVector) {
      vectors[field.name] = decimalVector;
      continue;
    }
    const primitiveVector = createRawPrimitiveArrowVector(
      field.type,
      parquetField,
      columnData,
      start,
      end
    );
    if (primitiveVector) {
      vectors[field.name] = primitiveVector;
      continue;
    }
    const byteVector = createRawByteArrowVector(field.type, parquetField, columnData, start, end);
    if (byteVector) {
      vectors[field.name] = byteVector;
      continue;
    }

    let fullColumn = materializeColumn(parquetSchema, rowGroup, field.name);
    if (parquetField.fields && hasStandardNestedCollection(parquetField)) {
      materializedRows ||= materializeRows(parquetSchema, rowGroup);
      const normalizedValues = materializedRows
        .slice(start, end)
        .map(row => normalizeNestedParquetValue(row[field.name], parquetField));
      vectors[field.name] = arrow.vectorFromArray(normalizedValues, field.type);
      continue;
    }
    if (!fullColumn && parquetField.fields) {
      materializedRows ||= materializeRows(parquetSchema, rowGroup);
      const fallbackTable: ObjectRowTable = {
        shape: 'object-row-table',
        schema: {
          ...schema,
          fields: schema.fields.filter(schemaField => schemaField.name === field.name)
        },
        data: materializedRows.slice(start, end)
      };
      const fallbackArrowTable = convertTable(fallbackTable, 'arrow-table');
      const fallbackVector = fallbackArrowTable.data.getChild(field.name);
      if (!fallbackVector) {
        throw new Error(`Failed to materialize nested Parquet column ${field.name}`);
      }
      vectors[field.name] = fallbackVector;
      continue;
    }
    fullColumn ||= new Array(rowGroup.rowCount).fill(null);
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

/** Detects standard collection wrappers that need normalization before Arrow conversion. */
function hasStandardNestedCollection(field: ParquetField): boolean {
  if (field.logicalType?.type === 'LIST') {
    const element = field.fields?.list?.fields?.element;
    if (!element) return false;
    // Nested repeated continuation is still handled by the legacy materializer;
    // only normalize one-level collections here until that path is fully aligned.
    if (element.logicalType?.type === 'LIST' || element.logicalType?.type === 'MAP') return false;
    return true;
  }
  if (field.logicalType?.type === 'MAP') {
    return Boolean(field.fields?.key_value?.fields?.key && field.fields.key_value.fields.value);
  }
  return Object.values(field.fields || {}).some(hasStandardNestedCollection);
}

/** Normalizes standard Parquet LIST/MAP wrapper groups before Arrow conversion. */
function normalizeNestedParquetValue(value: unknown, field: ParquetField): unknown {
  if (value === undefined || value === null || !field.fields) {
    return value;
  }

  if (field.logicalType?.type === 'LIST') {
    const listField = field.fields.list;
    const elementField = listField?.fields?.element;
    if (!listField || !elementField) {
      return value;
    }
    const listValue = value && typeof value === 'object' ? Reflect.get(value, 'list') : undefined;
    if (!Array.isArray(listValue)) {
      return [];
    }
    return listValue.map(element =>
      normalizeNestedParquetValue(
        element && typeof element === 'object' ? Reflect.get(element, 'element') : element,
        elementField
      )
    );
  }

  if (field.logicalType?.type === 'MAP') {
    const entryField = field.fields.key_value;
    const keyField = entryField?.fields?.key;
    const valueField = entryField?.fields?.value;
    if (!entryField || !keyField || !valueField) {
      return value;
    }
    const entries =
      value && typeof value === 'object' ? Reflect.get(value, 'key_value') : undefined;
    if (!Array.isArray(entries)) {
      return new Map();
    }
    return new Map(
      entries.map(entry => [
        Reflect.get(entry, 'key'),
        normalizeNestedParquetValue(Reflect.get(entry, 'value'), valueField)
      ])
    );
  }

  if (typeof value !== 'object' || Array.isArray(value) || ArrayBuffer.isView(value)) {
    return value;
  }
  const normalized: Record<string, unknown> = {};
  for (const [name, childField] of Object.entries(field.fields)) {
    normalized[name] = normalizeNestedParquetValue(Reflect.get(value, name), childField);
  }
  return normalized;
}

/** Creates an exact Arrow Decimal128/256 vector from unscaled Parquet decimal values. */
function createDecimalArrowVector(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk | undefined,
  start: number,
  end: number
): arrow.Vector | undefined {
  if (!(arrowType instanceof arrow.Decimal) || !columnData) {
    return undefined;
  }
  const rowCount = end - start;
  const wordCount = arrowType.bitWidth / 32;
  const data = new Uint32Array(rowCount * wordCount);
  const nullBitmap = parquetField.dLevelMax ? new Uint8Array(Math.ceil(rowCount / 8)) : undefined;
  let nullCount = 0;
  let valueIndex = 0;

  if (nullBitmap) {
    for (let rowIndex = 0; rowIndex < start; rowIndex++) {
      if (columnData.dlevels[rowIndex] === parquetField.dLevelMax) valueIndex++;
    }
  } else {
    valueIndex = start;
  }

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceRowIndex = start + rowIndex;
    if (!nullBitmap || columnData.dlevels[sourceRowIndex] === parquetField.dLevelMax) {
      writeArrowDecimal(
        data,
        rowIndex * wordCount,
        wordCount,
        getUnscaledDecimal(columnData.values[valueIndex++]),
        arrowType.bitWidth
      );
      if (nullBitmap) nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
    } else {
      nullCount++;
    }
  }

  return new arrow.Vector([
    arrow.makeData({
      type: arrowType,
      data,
      nullBitmap: nullCount ? nullBitmap : undefined,
      nullCount
    })
  ]);
}

/** Converts one Parquet decimal physical value to its signed unscaled integer. */
function getUnscaledDecimal(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  const bytes = value as Uint8Array;
  let unsignedValue = 0n;
  for (const byte of bytes) unsignedValue = (unsignedValue << 8n) | BigInt(byte);
  return bytes.length && bytes[0] & 0x80
    ? unsignedValue - (1n << BigInt(bytes.length * 8))
    : unsignedValue;
}

/** Writes one signed bigint into Arrow's little-endian two's-complement decimal buffer. */
function writeArrowDecimal(
  data: Uint32Array,
  offset: number,
  wordCount: number,
  value: bigint,
  bitWidth: number
): void {
  const minimum = -(1n << BigInt(bitWidth - 1));
  const maximum = (1n << BigInt(bitWidth - 1)) - 1n;
  if (value < minimum || value > maximum) {
    throw new Error(`Parquet decimal value ${value} exceeds Arrow Decimal${bitWidth}`);
  }
  let unsignedValue = BigInt.asUintN(bitWidth, value);
  for (let wordIndex = 0; wordIndex < wordCount; wordIndex++) {
    data[offset + wordIndex] = Number(unsignedValue & 0xffffffffn);
    unsignedValue >>= 32n;
  }
}

/** Creates an Arrow table while retaining row counts for a schema with no projected fields. */
function createArrowTable(
  schema: arrow.Schema,
  vectors: Record<string, arrow.Vector>,
  rowCount: number
): arrow.Table {
  if (schema.fields.length) {
    // Every vector represents one row-group slice and therefore has one data chunk. Supplying the
    // Struct directly avoids Arrow Table's generic vector redistribution and schema reassignment.
    const children = schema.fields.map(field => vectors[field.name].data[0]);
    const data = arrow.makeData({
      type: new arrow.Struct(schema.fields),
      length: rowCount,
      nullCount: 0,
      children
    });
    const recordBatch = createParquetRecordBatch(schema, data);
    return new arrow.Table(recordBatch);
  }
  if (rowCount === 0) {
    return new arrow.Table(schema, vectors);
  }

  const recordBatch = createParquetRecordBatch(
    schema,
    arrow.makeData({type: new arrow.Struct([]), children: []})
  );
  // Apache Arrow JS derives RecordBatch length from its children and therefore resets an empty
  // Struct to zero rows. Restore the explicit Parquet selection length after construction.
  Object.defineProperty(recordBatch.data, 'length', {value: rowCount});
  return new arrow.Table(schema, [recordBatch]);
}

/** Constructs a RecordBatch while restricting schema identity reuse to the synchronous call. */
function createParquetRecordBatch(
  schema: arrow.Schema,
  data: arrow.Data<arrow.Struct>
): arrow.RecordBatch {
  if (!(schema instanceof ParquetArrowSchema)) {
    return new arrow.RecordBatch(schema, data);
  }

  schema.enableIdentityAssignmentReuse();
  try {
    return new arrow.RecordBatch(schema, data);
  } finally {
    schema.disableIdentityAssignmentReuse();
  }
}

/** Typed arrays accepted by the direct primitive Arrow materialization path. */
type RawPrimitiveArrowArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigInt64Array
  | BigUint64Array;

/** Creates a fixed-width Arrow vector directly from decoded primitive Parquet values. */
function createRawPrimitiveArrowVector(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk | undefined,
  start: number,
  end: number
): arrow.Vector | undefined {
  if (!columnData) {
    return undefined;
  }
  const rowCount = end - start;
  const directData = createRawPrimitiveArrowArrayView(
    arrowType,
    parquetField,
    columnData,
    start,
    end
  );
  const data = directData || createRawPrimitiveArrowArray(arrowType, parquetField, rowCount);
  if (!data) {
    return undefined;
  }

  const nullBitmap = parquetField.dLevelMax ? new Uint8Array(Math.ceil(rowCount / 8)) : undefined;
  let valueIndex = 0;
  let nullCount = 0;

  if (!nullBitmap) {
    if (!directData) {
      valueIndex = start;
      for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        setRawPrimitiveArrowValue(data, rowIndex, columnData.values[valueIndex++]);
      }
    }
  } else {
    for (let rowIndex = 0; rowIndex < start; rowIndex++) {
      if (columnData.dlevels[rowIndex] === parquetField.dLevelMax) {
        valueIndex++;
      }
    }
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const sourceRowIndex = start + rowIndex;
      if (columnData.dlevels[sourceRowIndex] === parquetField.dLevelMax) {
        setRawPrimitiveArrowValue(data, rowIndex, columnData.values[valueIndex++]);
        nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
      } else {
        nullCount++;
      }
    }
  }

  const nulls = nullCount ? nullBitmap : undefined;
  return new arrow.Vector([
    arrow.makeData({type: arrowType, data, nullBitmap: nulls, nullCount} as any)
  ]);
}

/** Reuses a typed decoded column as the Arrow value buffer for required primitive fields. */
function createRawPrimitiveArrowArrayView(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  columnData: ParquetColumnChunk,
  start: number,
  end: number
): RawPrimitiveArrowArray | undefined {
  if (parquetField.repetitionType !== 'REQUIRED') {
    return undefined;
  }
  const values = columnData.values;
  if (
    parquetField.primitiveType === 'FLOAT' &&
    arrowType instanceof arrow.Float32 &&
    values instanceof Float32Array
  ) {
    return values.subarray(start, end);
  }
  if (
    parquetField.primitiveType === 'DOUBLE' &&
    arrowType instanceof arrow.Float64 &&
    values instanceof Float64Array
  ) {
    return values.subarray(start, end);
  }
  if (
    parquetField.primitiveType === 'INT32' &&
    (arrowType instanceof arrow.Int32 ||
      arrowType instanceof arrow.DateDay ||
      arrowType instanceof arrow.TimeMillisecond) &&
    values instanceof Int32Array
  ) {
    return values.subarray(start, end);
  }
  if (
    parquetField.primitiveType === 'INT64' &&
    (arrowType instanceof arrow.Int64 ||
      arrowType instanceof arrow.TimeMicrosecond ||
      arrowType instanceof arrow.TimeNanosecond ||
      arrowType instanceof arrow.TimestampMillisecond ||
      arrowType instanceof arrow.TimestampMicrosecond ||
      arrowType instanceof arrow.TimestampNanosecond) &&
    values instanceof BigInt64Array
  ) {
    return values.subarray(start, end);
  }
  return undefined;
}

/** Allocates the Arrow typed array matching an unconverted physical Parquet primitive. */
function createRawPrimitiveArrowArray(
  arrowType: arrow.DataType,
  parquetField: ParquetField,
  rowCount: number
): RawPrimitiveArrowArray | undefined {
  if (parquetField.primitiveType === 'FLOAT' && arrowType instanceof arrow.Float32) {
    return new Float32Array(rowCount);
  }
  if (parquetField.primitiveType === 'DOUBLE' && arrowType instanceof arrow.Float64) {
    return new Float64Array(rowCount);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Int8) {
    return new Int8Array(rowCount);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Int16) {
    return new Int16Array(rowCount);
  }
  if (
    parquetField.primitiveType === 'INT32' &&
    (arrowType instanceof arrow.Int32 ||
      arrowType instanceof arrow.DateDay ||
      arrowType instanceof arrow.TimeMillisecond)
  ) {
    return new Int32Array(rowCount);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Uint8) {
    return new Uint8Array(rowCount);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Uint16) {
    return new Uint16Array(rowCount);
  }
  if (parquetField.primitiveType === 'INT32' && arrowType instanceof arrow.Uint32) {
    return new Uint32Array(rowCount);
  }
  if (
    parquetField.primitiveType === 'INT64' &&
    (arrowType instanceof arrow.Int64 ||
      arrowType instanceof arrow.TimeMicrosecond ||
      arrowType instanceof arrow.TimeNanosecond ||
      arrowType instanceof arrow.TimestampMillisecond ||
      arrowType instanceof arrow.TimestampMicrosecond ||
      arrowType instanceof arrow.TimestampNanosecond)
  ) {
    return new BigInt64Array(rowCount);
  }
  if (parquetField.primitiveType === 'INT64' && arrowType instanceof arrow.Uint64) {
    return new BigUint64Array(rowCount);
  }
  return undefined;
}

/** Writes a decoded primitive into the exact TypedArray expected by Arrow. */
function setRawPrimitiveArrowValue(
  data: RawPrimitiveArrowArray,
  index: number,
  value: unknown
): void {
  if (data instanceof BigInt64Array) {
    data[index] = typeof value === 'bigint' ? value : BigInt(value as number | string);
  } else if (data instanceof BigUint64Array) {
    data[index] = BigInt.asUintN(
      64,
      typeof value === 'bigint' ? value : BigInt(value as number | string)
    );
  } else {
    data[index] = Number(value);
  }
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
  const byteValues = columnData.values as Uint8Array[];
  const nullBitmap = parquetField.dLevelMax ? new Uint8Array(Math.ceil(rowCount / 8)) : undefined;
  let valueIndex = 0;
  let firstValueIndex = 0;
  let dataByteLength = 0;
  let nullCount = 0;

  if (!nullBitmap) {
    valueIndex = start;
    firstValueIndex = valueIndex;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      dataByteLength += byteValues[valueIndex++].byteLength;
      if (dataByteLength > 0x7fffffff) {
        throw new Error('Arrow Utf8/Binary column exceeds the 32-bit offset range');
      }
      valueOffsets[rowIndex + 1] = dataByteLength;
    }
  } else {
    for (let rowIndex = 0; rowIndex < start; rowIndex++) {
      if (columnData.dlevels[rowIndex] === parquetField.dLevelMax) {
        valueIndex++;
      }
    }
    firstValueIndex = valueIndex;
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const sourceRowIndex = start + rowIndex;
      if (columnData.dlevels[sourceRowIndex] === parquetField.dLevelMax) {
        dataByteLength += byteValues[valueIndex++].byteLength;
        nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
      } else {
        nullCount++;
      }
      if (dataByteLength > 0x7fffffff) {
        throw new Error('Arrow Utf8/Binary column exceeds the 32-bit offset range');
      }
      valueOffsets[rowIndex + 1] = dataByteLength;
    }
  }

  const data = new Uint8Array(dataByteLength);
  let dataOffset = 0;
  for (let index = firstValueIndex; index < valueIndex; index++) {
    const bytes = byteValues[index];
    if (bytes.byteLength <= MAXIMUM_INLINE_BYTE_COPY_LENGTH) {
      for (let byteIndex = 0; byteIndex < bytes.byteLength; byteIndex++) {
        data[dataOffset++] = bytes[byteIndex];
      }
    } else {
      data.set(bytes, dataOffset);
      dataOffset += bytes.byteLength;
    }
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
    return parquetField.originalType === 'UTF8' || parquetField.originalType === 'ENUM';
  }
  if (arrowType instanceof arrow.Binary) {
    return (
      (!parquetField.originalType ||
        parquetField.originalType === 'GEOMETRY' ||
        parquetField.originalType === 'GEOGRAPHY') &&
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
