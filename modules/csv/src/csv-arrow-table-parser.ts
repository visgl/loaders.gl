// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import {parseUTF8Boolean, parseUTF8Number} from '@loaders.gl/arrow';
import {
  ArrowTableBuilder,
  convertArrowToSchema,
  convertSchemaToArrow,
  type ArrowViewTypeMode
} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

import type {CSVLoaderOptions} from './csv-loader-options';
import {CSV_LOADER_OPTIONS} from './csv-loader-options';
import {CSVLoaderWithParser} from './csv-loader-with-parser';
import {
  parseRawArrowCSVInBatches,
  parseRawArrowCSVTable,
  parseRawArrowCSVText
} from './lib/parsers/parse-csv-to-arrow';
import type {CSVRawArrowParseOptions} from './lib/parsers/parse-csv-to-arrow';

export type ArrowTableCSVOptions = Omit<NonNullable<CSVLoaderOptions['csv']>, 'shape'> & {
  /** @internal Whether the caller explicitly supplied `skipEmptyLines`. */
  skipEmptyLinesIsExplicit?: boolean;
};

export type ArrowTableCSVParseOptions = CSVLoaderOptions;

const ARROW_TABLE_CSV_DEFAULT_OPTIONS: ArrowTableCSVOptions = {
  optimizeMemoryUsage: CSV_LOADER_OPTIONS.csv.optimizeMemoryUsage,
  header: CSV_LOADER_OPTIONS.csv.header,
  columnPrefix: CSV_LOADER_OPTIONS.csv.columnPrefix,
  quoteChar: CSV_LOADER_OPTIONS.csv.quoteChar,
  escapeChar: CSV_LOADER_OPTIONS.csv.escapeChar,
  dynamicTyping: false,
  viewTypes: 'never',
  comments: CSV_LOADER_OPTIONS.csv.comments,
  skipEmptyLines: false,
  detectGeometryColumns: CSV_LOADER_OPTIONS.csv.detectGeometryColumns,
  delimitersToGuess: CSV_LOADER_OPTIONS.csv.delimitersToGuess
};

const RAW_UTF8_VALUE = Symbol('raw-utf8-value');

/** Cell value after Papa-style dynamic typing has been applied. */
type DynamicColumnValue = string | number | boolean | Date | typeof RAW_UTF8_VALUE | null;

/** Arrow data types inferred by the typed Arrow conversion pass. */
type TypedColumnDataType = 'utf8' | 'float64' | 'bool' | 'date-millisecond';

/** Result of converting a raw Utf8 Arrow table to typed Arrow columns. */
type TypedArrowConversionResult = {
  typedArrowTable: ArrowTable;
  typedColumnDataTypes: TypedColumnDataType[];
};

const ISO_DATE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
const UTF8_DECODER = new TextDecoder();
const UTF8_ENCODER = new TextEncoder();

/** Applies Arrow-shaped CSV defaults before delegating to Arrow CSV parsing helpers. */
function normalizeArrowTableCSVOptions(
  options?: ArrowTableCSVParseOptions
): ArrowTableCSVParseOptions {
  const skipEmptyLinesIsExplicit =
    (options?.csv && Object.prototype.hasOwnProperty.call(options.csv, 'skipEmptyLinesIsExplicit')
      ? Boolean(options.csv.skipEmptyLinesIsExplicit)
      : undefined) ?? Boolean(options?.csv && options.csv.skipEmptyLines === true);

  return {
    ...options,
    csv: {
      ...ARROW_TABLE_CSV_DEFAULT_OPTIONS,
      ...options?.csv,
      skipEmptyLinesIsExplicit
    }
  };
}

/** Parses ArrayBuffer CSV input into an Arrow table. */
export async function parseCSVArrayBufferAsArrow(
  arrayBuffer: ArrayBuffer,
  options?: ArrowTableCSVParseOptions
): Promise<ArrowTable> {
  const normalizedOptions = normalizeArrowTableCSVOptions(options);
  const csvOptions = createArrowTableCSVOptions(normalizedOptions);
  if (csvOptions.detectGeometryColumns) {
    const rowTable = await CSVLoaderWithParser.parse(arrayBuffer, {
      ...normalizedOptions,
      csv: {
        ...normalizedOptions.csv,
        shape: 'object-row-table',
        dynamicTyping: csvOptions.dynamicTyping
      }
    });
    return convertCSVRowTableToArrowTable(rowTable as ObjectRowTable, csvOptions.viewTypes);
  }
  const rawArrowCSVOptions = createRawArrowTableCSVOptions(normalizedOptions);

  if (shouldApplyDynamicTyping(csvOptions)) {
    const directlyTypedTable = tryParseTypedUnquotedCSVBytes(
      new Uint8Array(arrayBuffer),
      csvOptions
    );
    if (directlyTypedTable) {
      return directlyTypedTable;
    }
  }

  const rawArrowTable = await parseRawArrowCSVTable(arrayBuffer, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(csvOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable, {
    viewTypes: csvOptions.viewTypes
  }).typedArrowTable;
}

/** Parses string CSV input into an Arrow table. */
export async function parseCSVTextAsArrow(
  csvText: string,
  options?: ArrowTableCSVParseOptions
): Promise<ArrowTable> {
  const normalizedOptions = normalizeArrowTableCSVOptions(options);
  const csvOptions = createArrowTableCSVOptions(normalizedOptions);
  if (csvOptions.detectGeometryColumns) {
    const rowTable = await CSVLoaderWithParser.parseText(csvText, {
      ...normalizedOptions,
      csv: {
        ...normalizedOptions.csv,
        shape: 'object-row-table',
        dynamicTyping: csvOptions.dynamicTyping
      }
    });
    return convertCSVRowTableToArrowTable(rowTable as ObjectRowTable, csvOptions.viewTypes);
  }
  const rawArrowCSVOptions = createRawArrowTableCSVOptions(normalizedOptions);

  if (shouldTryTypedUnquotedCSVText(csvText, csvOptions)) {
    const directlyTypedTable = tryParseTypedUnquotedCSVBytes(
      UTF8_ENCODER.encode(csvText),
      csvOptions
    );
    if (directlyTypedTable) {
      return directlyTypedTable;
    }
  }

  const rawArrowTable = await parseRawArrowCSVText(csvText, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(csvOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable, {
    viewTypes: csvOptions.viewTypes
  }).typedArrowTable;
}

/** Parses batch CSV input into Arrow table batches. */
export function parseCSVInArrowBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ArrowTableCSVParseOptions
): AsyncIterable<ArrowTableBatch> {
  const normalizedOptions = normalizeArrowTableCSVOptions(options);
  const csvOptions = createArrowTableCSVOptions(normalizedOptions);
  if (csvOptions.detectGeometryColumns) {
    return convertCSVRowBatchesToArrowBatches(
      CSVLoaderWithParser.parseInBatches(asyncIterator, {
        ...normalizedOptions,
        csv: {
          ...normalizedOptions.csv,
          shape: 'object-row-table',
          dynamicTyping: csvOptions.dynamicTyping
        }
      }),
      csvOptions.viewTypes
    );
  }
  const rawArrowCSVOptions = createRawArrowTableCSVOptions(normalizedOptions);

  const rawArrowBatchIterator = parseRawArrowCSVInBatches(asyncIterator, rawArrowCSVOptions);

  return makeTypedArrowBatchIterator(rawArrowBatchIterator, csvOptions);
}

/** Converts CSV row-table output to an Arrow table using the supplied CSV schema. */
function convertCSVRowTableToArrowTable(
  table: ObjectRowTable | ArrayRowTable,
  viewTypes?: ArrowViewTypeMode
): ArrowTable {
  const arrowTableBuilder = new ArrowTableBuilder(table.schema!, {viewTypes});
  for (const row of table.data) {
    if (table.shape === 'object-row-table') {
      arrowTableBuilder.addObjectRow(row as {[columnName: string]: unknown});
    } else {
      arrowTableBuilder.addArrayRow(row as unknown[]);
    }
  }
  return arrowTableBuilder.finishTable();
}

/** Converts CSV row batches to Arrow batches while preserving the CSV-derived schema. */
async function* convertCSVRowBatchesToArrowBatches(
  rowBatchIterator: AsyncIterable<TableBatch>,
  viewTypes?: ArrowViewTypeMode
): AsyncIterable<ArrowTableBatch> {
  for await (const rowBatch of rowBatchIterator) {
    if (
      (rowBatch.shape !== 'array-row-table' && rowBatch.shape !== 'object-row-table') ||
      !rowBatch.schema
    ) {
      continue;
    }

    const arrowTableBuilder = new ArrowTableBuilder(rowBatch.schema, {viewTypes});
    for (const row of rowBatch.data) {
      if (rowBatch.shape === 'object-row-table') {
        arrowTableBuilder.addObjectRow(row as {[columnName: string]: unknown});
      } else {
        arrowTableBuilder.addArrayRow(row as unknown[]);
      }
    }
    const arrowTable = arrowTableBuilder.finishTable();
    yield {
      ...rowBatch,
      shape: 'arrow-table',
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: arrowTable.data.numRows
    };
  }
}

/** Converts an async iterator of raw Utf8 Arrow batches to typed Arrow batches. */
async function* makeTypedArrowBatchIterator(
  rawArrowBatchIterator: AsyncIterable<ArrowTableBatch>,
  csvOptions: ArrowTableCSVOptions
): AsyncIterable<ArrowTableBatch> {
  let frozenColumnDataTypes: TypedColumnDataType[] | null = null;

  for await (const rawArrowBatch of rawArrowBatchIterator) {
    if (!shouldApplyDynamicTyping(csvOptions)) {
      yield rawArrowBatch;
      continue;
    }

    const rawArrowTable: ArrowTable = {
      shape: 'arrow-table',
      schema: rawArrowBatch.schema,
      data: rawArrowBatch.data
    };

    const conversionResult = convertRawArrowTableToTypedArrowTable(rawArrowTable, {
      frozenColumnDataTypes,
      viewTypes: csvOptions.viewTypes
    });

    if (!frozenColumnDataTypes && conversionResult.typedColumnDataTypes.length > 0) {
      frozenColumnDataTypes = conversionResult.typedColumnDataTypes;
    }

    yield {
      ...rawArrowBatch,
      schema: conversionResult.typedArrowTable.schema,
      data: conversionResult.typedArrowTable.data,
      length: conversionResult.typedArrowTable.data.numRows
    };
  }
}

/** Merges caller options with Arrow CSV defaults. */
function createArrowTableCSVOptions(options?: ArrowTableCSVParseOptions): ArrowTableCSVOptions {
  return {
    ...ARROW_TABLE_CSV_DEFAULT_OPTIONS,
    ...options?.csv
  };
}

/** Creates raw Arrow options by stripping the typed conversion flag. */
function createRawArrowTableCSVOptions(
  options?: ArrowTableCSVParseOptions
): CSVRawArrowParseOptions {
  const csvOptions = createArrowTableCSVOptions(options);
  const {dynamicTyping, ...rawArrowCSVOptions} = csvOptions;

  return {
    ...options,
    csv: {
      ...rawArrowCSVOptions,
      dynamicTyping
    }
  };
}

/** Returns whether typed Arrow conversion should be applied. */
function shouldApplyDynamicTyping(csvOptions: ArrowTableCSVOptions): boolean {
  return csvOptions.dynamicTyping !== false;
}

/** Column values and source byte ranges collected by the direct typed parser. */
type DirectTypedColumn = {
  /** Dynamically typed values or raw UTF-8 sentinels. */
  values: DynamicColumnValue[];
  /** Inclusive source offsets, allocated only after a raw UTF-8 value is observed. */
  valueStarts: number[] | null;
  /** Exclusive source offsets, allocated only after a raw UTF-8 value is observed. */
  valueEnds: number[] | null;
};

/** Checks whether string input can enter the direct typed unquoted parser. */
function shouldTryTypedUnquotedCSVText(csvText: string, csvOptions: ArrowTableCSVOptions): boolean {
  const quoteChar = csvOptions.quoteChar || '"';
  return canUseDirectTypedUnquotedParser(csvOptions) && !csvText.includes(quoteChar);
}

/** Parses common unquoted typed CSV directly into final Arrow columns when options are compatible. */
function tryParseTypedUnquotedCSVBytes(
  bytes: Uint8Array,
  csvOptions: ArrowTableCSVOptions
): ArrowTable | null {
  if (!canUseDirectTypedUnquotedParser(csvOptions) || bytes.length === 0) {
    return null;
  }

  const quoteByte = (csvOptions.quoteChar || '"').charCodeAt(0);
  if (bytes.indexOf(quoteByte) !== -1) {
    return null;
  }

  const delimiterByte = getDirectDelimiterByte(bytes, csvOptions);
  if (delimiterByte === null) {
    return null;
  }
  const headerEnd = findDirectRowEnd(bytes, 0);
  const headerRow = decodeDirectHeaderRow(bytes, 0, headerEnd.end, delimiterByte);
  const columns: DirectTypedColumn[] = headerRow.map(() => ({
    values: [],
    valueStarts: null,
    valueEnds: null
  }));

  let rowCount = 0;
  let fieldStart = headerEnd.nextStart;
  let columnIndex = 0;

  if (fieldStart < bytes.length) {
    for (let byteIndex = fieldStart; byteIndex <= bytes.length; byteIndex++) {
      const byte = bytes[byteIndex];
      if (byte !== delimiterByte && byte !== 10 && byte !== 13 && byteIndex !== bytes.length) {
        continue;
      }

      appendDirectTypedField(columns[columnIndex], bytes, fieldStart, byteIndex);
      columnIndex++;

      if (byte === delimiterByte) {
        fieldStart = byteIndex + 1;
        continue;
      }

      for (; columnIndex < columns.length; columnIndex++) {
        appendDirectTypedField(columns[columnIndex], bytes, 0, 0);
      }
      rowCount++;
      columnIndex = 0;

      if (byte === 13 && bytes[byteIndex + 1] === 10) {
        byteIndex++;
      }
      fieldStart = byteIndex + 1;
      if (fieldStart >= bytes.length) {
        break;
      }
    }
  }

  return buildDirectTypedArrowTable(bytes, headerRow, columns, rowCount);
}

/** Checks the conservative option set supported by the direct unquoted typed parser. */
function canUseDirectTypedUnquotedParser(csvOptions: ArrowTableCSVOptions): boolean {
  const delimiter = (csvOptions as ArrowTableCSVOptions & {delimiter?: string}).delimiter;
  const quoteChar = csvOptions.quoteChar || '"';
  const escapeChar = csvOptions.escapeChar || '"';
  return (
    csvOptions.dynamicTyping !== false &&
    csvOptions.header === true &&
    !csvOptions.comments &&
    !csvOptions.skipEmptyLines &&
    !csvOptions.optimizeMemoryUsage &&
    csvOptions.viewTypes === 'never' &&
    quoteChar.length === 1 &&
    escapeChar === quoteChar &&
    (delimiter
      ? delimiter.length === 1 && delimiter.charCodeAt(0) < 128
      : Boolean(csvOptions.delimitersToGuess?.some(candidate => candidate.length === 1)))
  );
}

/** Selects an explicit or first-row-inferred ASCII delimiter for direct parsing. */
function getDirectDelimiterByte(
  bytes: Uint8Array,
  csvOptions: ArrowTableCSVOptions
): number | null {
  const configuredDelimiter = (csvOptions as ArrowTableCSVOptions & {delimiter?: string}).delimiter;
  if (configuredDelimiter) {
    return configuredDelimiter.length === 1 && configuredDelimiter.charCodeAt(0) < 128
      ? configuredDelimiter.charCodeAt(0)
      : null;
  }

  const headerEnd = findDirectRowEnd(bytes, 0).end;
  let selectedDelimiter: number | null = null;
  let selectedCount = -1;
  for (const candidate of csvOptions.delimitersToGuess || [',', '\t', '|', ';']) {
    if (candidate.length !== 1 || candidate.charCodeAt(0) >= 128) {
      continue;
    }
    const candidateByte = candidate.charCodeAt(0);
    let candidateCount = 0;
    for (let byteIndex = 0; byteIndex < headerEnd; byteIndex++) {
      if (bytes[byteIndex] === candidateByte) {
        candidateCount++;
      }
    }
    if (candidateCount > selectedCount) {
      selectedDelimiter = candidateByte;
      selectedCount = candidateCount;
    }
  }
  return selectedDelimiter;
}

/** Finds the end and following start offsets of one unquoted CSV row. */
function findDirectRowEnd(bytes: Uint8Array, rowStart: number): {end: number; nextStart: number} {
  for (let byteIndex = rowStart; byteIndex < bytes.length; byteIndex++) {
    const byte = bytes[byteIndex];
    if (byte === 10 || byte === 13) {
      return {
        end: byteIndex,
        nextStart: byte === 13 && bytes[byteIndex + 1] === 10 ? byteIndex + 2 : byteIndex + 1
      };
    }
  }
  return {end: bytes.length, nextStart: bytes.length};
}

/** Decodes and deduplicates a direct-parser header row. */
function decodeDirectHeaderRow(
  bytes: Uint8Array,
  rowStart: number,
  rowEnd: number,
  delimiter: number
): string[] {
  const headerRow: string[] = [];
  const observedColumnNames = new Set<string>();
  let fieldStart = rowStart;

  for (let byteIndex = rowStart; byteIndex <= rowEnd; byteIndex++) {
    if (byteIndex !== rowEnd && bytes[byteIndex] !== delimiter) {
      continue;
    }
    const originalColumnName = UTF8_DECODER.decode(bytes.subarray(fieldStart, byteIndex));
    let columnName = originalColumnName;
    let duplicateIndex = 1;
    while (observedColumnNames.has(columnName)) {
      columnName = `${originalColumnName}.${duplicateIndex}`;
      duplicateIndex++;
    }
    observedColumnNames.add(columnName);
    headerRow.push(columnName);
    fieldStart = byteIndex + 1;
  }
  return headerRow;
}

/** Appends one source field to a direct typed column. */
function appendDirectTypedField(
  column: DirectTypedColumn | undefined,
  bytes: Uint8Array,
  valueStart: number,
  valueEnd: number
): void {
  if (!column) {
    return;
  }
  const dynamicValue = parseRawUtf8ValueWithDynamicTyping(bytes, valueStart, valueEnd);
  column.values.push(dynamicValue);

  if (dynamicValue === RAW_UTF8_VALUE && !column.valueStarts) {
    column.valueStarts = new Array(column.values.length - 1).fill(0);
    column.valueEnds = new Array(column.values.length - 1).fill(0);
  }
  if (column.valueStarts && column.valueEnds) {
    column.valueStarts.push(dynamicValue === RAW_UTF8_VALUE ? valueStart : 0);
    column.valueEnds.push(dynamicValue === RAW_UTF8_VALUE ? valueEnd : 0);
  }
}

/** Builds a final typed Arrow table from direct-parser columns. */
function buildDirectTypedArrowTable(
  bytes: Uint8Array,
  headerRow: string[],
  columns: DirectTypedColumn[],
  rowCount: number
): ArrowTable {
  const typedColumnDataTypes = columns.map(column => deduceTypedColumnDataType(column.values));
  const typedSchema: Schema = {
    fields: headerRow.map((name, columnIndex) => ({
      name,
      type: typedColumnDataTypes[columnIndex],
      nullable: true
    })),
    metadata: {
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVLoader'
    }
  };
  const typedArrowSchema = convertSchemaToArrow(typedSchema, {viewTypes: 'never'});
  const typedArrowColumns = columns.map((column, columnIndex) => {
    const typedColumnDataType = typedColumnDataTypes[columnIndex];
    if (
      typedColumnDataType === 'utf8' &&
      column.values.every(value => value === null || value === RAW_UTF8_VALUE)
    ) {
      return createDirectUtf8Column(bytes, column);
    }

    const typedValues = column.values.map((value, rowIndex) =>
      value === RAW_UTF8_VALUE
        ? UTF8_DECODER.decode(
            bytes.subarray(column.valueStarts![rowIndex], column.valueEnds![rowIndex])
          )
        : convertDynamicValueToTypedColumnValue(value, typedColumnDataType)
    );
    return createTypedArrowColumn(
      typedValues,
      typedColumnDataType,
      typedArrowSchema.fields[columnIndex].type,
      null
    );
  });

  const typedArrowData = new arrow.Table([
    new arrow.RecordBatch(
      typedArrowSchema,
      new arrow.Data(
        new arrow.Struct(typedArrowSchema.fields),
        0,
        rowCount,
        0,
        undefined,
        typedArrowColumns.map(column => column.data[0])
      )
    )
  ]);

  return {
    shape: 'arrow-table',
    schema: typedSchema,
    data: typedArrowData
  };
}

/** Creates one Utf8 Arrow vector directly from retained source byte ranges. */
function createDirectUtf8Column(bytes: Uint8Array, column: DirectTypedColumn): arrow.Vector {
  const valueOffsets = new Int32Array(column.values.length + 1);
  let dataLength = 0;
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < column.values.length; rowIndex++) {
    if (column.values[rowIndex] === null) {
      nullCount++;
    } else {
      dataLength += column.valueEnds![rowIndex] - column.valueStarts![rowIndex];
    }
    valueOffsets[rowIndex + 1] = dataLength;
  }

  const data = new Uint8Array(dataLength);
  const nullBitmap =
    nullCount > 0 ? new Uint8Array(Math.ceil(column.values.length / 8)) : undefined;
  let dataOffset = 0;
  for (let rowIndex = 0; rowIndex < column.values.length; rowIndex++) {
    if (column.values[rowIndex] === null) {
      continue;
    }
    const valueStart = column.valueStarts![rowIndex];
    const valueEnd = column.valueEnds![rowIndex];
    data.set(bytes.subarray(valueStart, valueEnd), dataOffset);
    dataOffset += valueEnd - valueStart;
    if (nullBitmap) {
      nullBitmap[rowIndex >> 3] |= 1 << (rowIndex % 8);
    }
  }

  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Utf8(),
      length: column.values.length,
      valueOffsets,
      data,
      nullBitmap,
      nullCount
    })
  ]);
}

/** Converts an Arrow table of Utf8 columns to inferred typed Arrow columns. */
function convertRawArrowTableToTypedArrowTable(
  rawArrowTable: ArrowTable,
  options?: {
    frozenColumnDataTypes?: TypedColumnDataType[] | null;
    viewTypes?: ArrowViewTypeMode;
  }
): TypedArrowConversionResult {
  const rawArrowSchemaFields = rawArrowTable.data.schema.fields;
  const rowCount = rawArrowTable.data.numRows;

  if (rawArrowSchemaFields.length === 0) {
    return {
      typedArrowTable: {
        shape: 'arrow-table',
        schema: {
          fields: [],
          metadata: {
            ...rawArrowTable.schema?.metadata,
            'loaders.gl#format': 'csv',
            'loaders.gl#loader': 'CSVLoader'
          }
        },
        data: rawArrowTable.data
      },
      typedColumnDataTypes: []
    };
  }

  const typedSchemaFields: Schema['fields'] = [];
  const typedColumnValues: unknown[][] = [];
  const typedColumnDataTypes: TypedColumnDataType[] = [];

  for (let columnIndex = 0; columnIndex < rawArrowSchemaFields.length; columnIndex++) {
    const rawArrowSchemaField = rawArrowSchemaFields[columnIndex];
    const rawArrowColumn = rawArrowTable.data.getChildAt(columnIndex);

    if (rawArrowSchemaField.type instanceof arrow.List) {
      typedSchemaFields.push(
        rawArrowTable.schema?.fields[columnIndex] || {
          name: rawArrowSchemaField.name,
          type: 'utf8',
          nullable: true
        }
      );
      typedColumnDataTypes.push('utf8');
      typedColumnValues.push(
        rawArrowColumn
          ? readRawArrowListValues(rawArrowColumn, rowCount)
          : new Array(rowCount).fill(null)
      );
      continue;
    }

    const dynamicValues = readRawArrowDynamicValues(rawArrowColumn, rowCount);

    const typedColumnDataType =
      options?.frozenColumnDataTypes?.[columnIndex] ?? deduceTypedColumnDataType(dynamicValues);

    typedSchemaFields.push({
      name: rawArrowSchemaField.name,
      type: typedColumnDataType,
      nullable: true
    });

    typedColumnDataTypes.push(typedColumnDataType);
    typedColumnValues.push(dynamicValues);
  }

  const typedSchema: Schema = {
    fields: typedSchemaFields,
    metadata: {
      ...rawArrowTable.schema?.metadata,
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVLoader'
    }
  };

  const typedArrowTable = buildTypedArrowTable(
    rawArrowTable,
    typedSchema,
    rawArrowSchemaFields,
    typedColumnValues,
    typedColumnDataTypes,
    rowCount,
    options
  );

  return {
    typedArrowTable,
    typedColumnDataTypes
  };
}

/** Reads and dynamically types one raw Arrow UTF-8 column. */
function readRawArrowDynamicValues(
  rawArrowColumn: arrow.Vector | null,
  rowCount: number
): DynamicColumnValue[] {
  if (!rawArrowColumn) {
    return new Array(rowCount).fill(null);
  }

  const rawArrowData = rawArrowColumn.data[0];
  if (
    rawArrowColumn.data.length === 1 &&
    rawArrowData?.type instanceof arrow.Utf8 &&
    rawArrowData.valueOffsets &&
    rawArrowData.values
  ) {
    const dynamicValues = new Array<DynamicColumnValue>(rowCount);
    const valueOffsets = rawArrowData.valueOffsets;
    const valueBytes = rawArrowData.values;

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      if (!rawArrowData.getValid(rowIndex)) {
        dynamicValues[rowIndex] = null;
        continue;
      }

      const valueStart = Number(valueOffsets[rowIndex]);
      const valueEnd = Number(valueOffsets[rowIndex + 1]);
      dynamicValues[rowIndex] = parseRawUtf8ValueWithDynamicTyping(
        valueBytes,
        valueStart,
        valueEnd
      );
    }
    return dynamicValues;
  }

  const dynamicValues = new Array<DynamicColumnValue>(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    dynamicValues[rowIndex] = parseValueWithDynamicTyping(
      readRawArrowStringValue(rawArrowColumn.get(rowIndex))
    );
  }
  return dynamicValues;
}

/** Applies dynamic typing directly to one raw UTF-8 byte range when possible. */
function parseRawUtf8ValueWithDynamicTyping(
  valueBytes: Uint8Array,
  valueStart: number,
  valueEnd: number
): DynamicColumnValue {
  if (valueStart === valueEnd) {
    return null;
  }

  const byteLength = valueEnd - valueStart;
  const firstByte = valueBytes[valueStart];
  const mightBeBoolean =
    (byteLength === 4 && (firstByte === 84 || firstByte === 116)) ||
    (byteLength === 5 && (firstByte === 70 || firstByte === 102));
  if (mightBeBoolean) {
    const booleanValue = parseUTF8Boolean(valueBytes, valueStart, valueEnd);
    if (
      booleanValue !== undefined &&
      hasCSVBooleanCapitalization(valueBytes, valueStart, valueEnd)
    ) {
      return booleanValue;
    }
  }

  const firstNonWhitespaceByte = findFirstNonWhitespaceByte(valueBytes, valueStart, valueEnd);
  const firstNonWhitespaceValue = valueBytes[firstNonWhitespaceByte];
  const mightBeNumber =
    firstNonWhitespaceValue === 45 ||
    firstNonWhitespaceValue === 46 ||
    (firstNonWhitespaceValue >= 48 && firstNonWhitespaceValue <= 57);
  if (mightBeNumber) {
    const numberValue = parseUTF8Number(valueBytes, valueStart, valueEnd);
    if (numberValue !== undefined) {
      return numberValue;
    }
  }

  if (!mightRequireDynamicStringParsing(valueBytes, valueStart, valueEnd)) {
    return RAW_UTF8_VALUE;
  }

  return parseValueWithDynamicTyping(
    UTF8_DECODER.decode(valueBytes.subarray(valueStart, valueEnd))
  );
}

/** Checks the all-lowercase or all-uppercase boolean spelling accepted by PapaParse. */
function hasCSVBooleanCapitalization(
  valueBytes: Uint8Array,
  valueStart: number,
  valueEnd: number
): boolean {
  const firstByteIsUppercase = valueBytes[valueStart] >= 65 && valueBytes[valueStart] <= 90;
  for (let byteIndex = valueStart + 1; byteIndex < valueEnd; byteIndex++) {
    const byte = valueBytes[byteIndex];
    const byteIsUppercase = byte >= 65 && byte <= 90;
    if (byteIsUppercase !== firstByteIsUppercase) {
      return false;
    }
  }
  return true;
}

/** Finds the first byte not treated as surrounding numeric whitespace. */
function findFirstNonWhitespaceByte(
  valueBytes: Uint8Array,
  valueStart: number,
  valueEnd: number
): number {
  let byteIndex = valueStart;
  while (byteIndex < valueEnd) {
    const byte = valueBytes[byteIndex];
    if (byte !== 32 && (byte < 9 || byte > 13)) {
      break;
    }
    byteIndex++;
  }
  return byteIndex;
}

/** Returns whether a byte range needs full string parsing for number or date detection. */
function mightRequireDynamicStringParsing(
  valueBytes: Uint8Array,
  valueStart: number,
  valueEnd: number
): boolean {
  let byteIndex = findFirstNonWhitespaceByte(valueBytes, valueStart, valueEnd);

  const firstByte = valueBytes[byteIndex];
  if (firstByte === 45 || firstByte === 46 || (firstByte >= 48 && firstByte <= 57)) {
    return true;
  }
  if (firstByte >= 128 && startsWithJavaScriptWhitespace(valueBytes, byteIndex, valueEnd)) {
    return true;
  }

  if (valueEnd - valueStart >= 19) {
    for (byteIndex = valueStart; byteIndex < valueEnd; byteIndex++) {
      if (valueBytes[byteIndex] === 84) {
        return true;
      }
    }
  }
  return false;
}

/** Checks for a non-ASCII whitespace code point matched by JavaScript string trimming. */
function startsWithJavaScriptWhitespace(
  valueBytes: Uint8Array,
  valueStart: number,
  valueEnd: number
): boolean {
  const firstByte = valueBytes[valueStart];
  const secondByte = valueBytes[valueStart + 1];
  const thirdByte = valueBytes[valueStart + 2];

  if (valueStart + 1 < valueEnd && firstByte === 0xc2 && secondByte === 0xa0) {
    return true;
  }
  if (valueStart + 2 >= valueEnd) {
    return false;
  }
  if (firstByte === 0xe1 && secondByte === 0x9a && thirdByte === 0x80) {
    return true;
  }
  if (firstByte === 0xe2 && secondByte === 0x80) {
    return (
      (thirdByte >= 0x80 && thirdByte <= 0x8a) ||
      thirdByte === 0xa8 ||
      thirdByte === 0xa9 ||
      thirdByte === 0xaf
    );
  }
  return (
    (firstByte === 0xe2 && secondByte === 0x81 && thirdByte === 0x9f) ||
    (firstByte === 0xe3 && secondByte === 0x80 && thirdByte === 0x80) ||
    (firstByte === 0xef && secondByte === 0xbb && thirdByte === 0xbf)
  );
}

/** Builds typed Arrow output directly from per-column Arrow buffers. */
function buildTypedArrowTable(
  rawArrowTable: ArrowTable,
  typedSchema: Schema,
  rawArrowSchemaFields: arrow.Field[],
  typedColumnValues: unknown[][],
  typedColumnDataTypes: TypedColumnDataType[],
  rowCount: number,
  options?: {viewTypes?: ArrowViewTypeMode}
): ArrowTable {
  const typedArrowSchema = convertSchemaToArrow(typedSchema, {
    viewTypes: options?.viewTypes
  });
  const typedArrowColumns = [] as arrow.Vector[];

  for (let columnIndex = 0; columnIndex < typedColumnValues.length; columnIndex++) {
    const typedValues = getTypedColumnValues(
      typedColumnValues[columnIndex],
      rawArrowSchemaFields[columnIndex],
      typedColumnDataTypes[columnIndex],
      rawArrowTable.data.getChildAt(columnIndex)
    );
    typedArrowColumns.push(
      createTypedArrowColumn(
        typedValues,
        typedColumnDataTypes[columnIndex],
        typedArrowSchema.fields[columnIndex].type,
        rawArrowTable.data.getChildAt(columnIndex)
      )
    );
  }

  const typedArrowData = new arrow.Table([
    new arrow.RecordBatch(
      typedArrowSchema,
      new arrow.Data(
        new arrow.Struct(typedArrowSchema.fields),
        0,
        rowCount,
        0,
        undefined,
        typedArrowColumns.map(column => column.data[0])
      )
    )
  ]);

  return {
    shape: 'arrow-table',
    schema:
      options?.viewTypes && options.viewTypes !== 'never'
        ? convertArrowToSchema(typedArrowSchema)
        : typedSchema,
    data: typedArrowData
  };
}

/** Converts one parsed column to values compatible with its Arrow type. */
function getTypedColumnValues(
  columnValues: unknown[],
  rawArrowSchemaField: arrow.Field,
  typedColumnDataType: TypedColumnDataType,
  rawArrowColumn: arrow.Vector | null
): unknown[] {
  if (rawArrowSchemaField.type instanceof arrow.List) {
    return columnValues;
  }

  if (
    typedColumnDataType === 'utf8' &&
    columnValues.every(
      columnValue =>
        columnValue === null || columnValue === RAW_UTF8_VALUE || typeof columnValue === 'string'
    )
  ) {
    return columnValues;
  }

  return columnValues.map((columnValue, rowIndex) => {
    const resolvedColumnValue =
      columnValue === RAW_UTF8_VALUE
        ? readRawArrowStringAtIndex(rawArrowColumn, rowIndex)
        : (columnValue as DynamicColumnValue);
    return convertDynamicValueToTypedColumnValue(resolvedColumnValue, typedColumnDataType);
  });
}

/** Creates one typed Arrow vector without routing primitive values through Arrow builders. */
function createTypedArrowColumn(
  typedValues: unknown[],
  typedColumnDataType: TypedColumnDataType,
  typedArrowType: arrow.DataType,
  rawArrowColumn: arrow.Vector | null
): arrow.Vector {
  if (
    typedColumnDataType === 'utf8' &&
    typedArrowType instanceof arrow.Utf8 &&
    typedValues.every(
      typedValue =>
        typedValue === null || typedValue === RAW_UTF8_VALUE || typeof typedValue === 'string'
    ) &&
    rawArrowColumn
  ) {
    return createTypedUtf8Column(typedValues, rawArrowColumn);
  }

  switch (typedColumnDataType) {
    case 'bool':
      return createTypedBooleanColumn(typedValues);
    case 'float64':
      return createTypedFloatColumn(typedValues);
    case 'date-millisecond':
      return createTypedDateColumn(typedValues);
    default:
      return arrow.vectorFromArray(typedValues, typedArrowType);
  }
}

/** Reuses raw UTF-8 buffers while applying dynamic-typing null semantics. */
function createTypedUtf8Column(typedValues: unknown[], rawArrowColumn: arrow.Vector): arrow.Vector {
  const rawArrowData = rawArrowColumn.data[0];
  if (!rawArrowData) {
    return arrow.vectorFromArray(typedValues, new arrow.Utf8());
  }

  let nullCount = 0;
  const nullBitmap = new Uint8Array(Math.ceil(typedValues.length / 8));
  for (let rowIndex = 0; rowIndex < typedValues.length; rowIndex++) {
    if (typedValues[rowIndex] === null) {
      nullCount++;
    } else {
      nullBitmap[rowIndex >> 3] |= 1 << (rowIndex % 8);
    }
  }

  if (nullCount === 0 && !rawArrowData.nullBitmap) {
    return rawArrowColumn;
  }

  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Utf8(),
      length: typedValues.length,
      valueOffsets: rawArrowData.valueOffsets,
      data: rawArrowData.values,
      nullBitmap: nullCount > 0 ? nullBitmap : rawArrowData.nullBitmap,
      nullCount
    })
  ]);
}

/** Creates a directly populated Arrow boolean vector. */
function createTypedBooleanColumn(typedValues: unknown[]): arrow.Vector {
  const data = new Uint8Array(Math.ceil(typedValues.length / 8));
  const {nullBitmap, nullCount} = createTypedNullBitmap(typedValues);
  for (let rowIndex = 0; rowIndex < typedValues.length; rowIndex++) {
    if (typedValues[rowIndex] === true) {
      data[rowIndex >> 3] |= 1 << (rowIndex % 8);
    }
  }

  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Bool(),
      data,
      length: typedValues.length,
      nullBitmap,
      nullCount
    })
  ]);
}

/** Creates a directly populated Arrow floating-point vector. */
function createTypedFloatColumn(typedValues: unknown[]): arrow.Vector {
  const data = new Float64Array(typedValues.length);
  const {nullBitmap, nullCount} = createTypedNullBitmap(typedValues);
  for (let rowIndex = 0; rowIndex < typedValues.length; rowIndex++) {
    const typedValue = typedValues[rowIndex];
    if (typeof typedValue === 'number') {
      data[rowIndex] = typedValue;
    }
  }

  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.Float64(),
      data,
      length: typedValues.length,
      nullBitmap,
      nullCount
    })
  ]);
}

/** Creates a directly populated Arrow millisecond-date vector. */
function createTypedDateColumn(typedValues: unknown[]): arrow.Vector {
  const data = new BigInt64Array(typedValues.length);
  const {nullBitmap, nullCount} = createTypedNullBitmap(typedValues);
  for (let rowIndex = 0; rowIndex < typedValues.length; rowIndex++) {
    const typedValue = typedValues[rowIndex];
    if (typedValue instanceof Date) {
      data[rowIndex] = BigInt(typedValue.valueOf());
    }
  }

  return new arrow.Vector([
    arrow.makeData({
      type: new arrow.DateMillisecond(),
      data,
      length: typedValues.length,
      nullBitmap,
      nullCount
    })
  ]);
}

/** Creates the validity bitmap needed by a typed primitive Arrow column. */
function createTypedNullBitmap(typedValues: unknown[]): {
  nullBitmap: Uint8Array | undefined;
  nullCount: number;
} {
  let nullCount = 0;
  const nullBitmap = new Uint8Array(Math.ceil(typedValues.length / 8));
  for (let rowIndex = 0; rowIndex < typedValues.length; rowIndex++) {
    if (typedValues[rowIndex] === null) {
      nullCount++;
    } else {
      nullBitmap[rowIndex >> 3] |= 1 << (rowIndex % 8);
    }
  }
  return {nullBitmap: nullCount > 0 ? nullBitmap : undefined, nullCount};
}

/** Reads an Arrow list column back to nullable JS arrays for table rebuilding. */
function readRawArrowListValues(rawArrowColumn: arrow.Vector, rowCount: number): unknown[] {
  const values: unknown[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rawArrowValue = rawArrowColumn.get(rowIndex);
    values.push(
      rawArrowValue === null || rawArrowValue === undefined ? null : Array.from(rawArrowValue)
    );
  }
  return values;
}

/** Converts an Arrow cell value to a nullable string value. */
function readRawArrowStringValue(rawArrowValue: unknown): string | null {
  if (rawArrowValue === null || rawArrowValue === undefined) {
    return null;
  }

  return String(rawArrowValue);
}

/** Reads one UTF-8 value from a raw Arrow column for mixed-type string conversion. */
function readRawArrowStringAtIndex(
  rawArrowColumn: arrow.Vector | null,
  rowIndex: number
): string | null {
  const rawArrowData = rawArrowColumn?.data[0];
  if (
    rawArrowColumn?.data.length === 1 &&
    rawArrowData?.type instanceof arrow.Utf8 &&
    rawArrowData.valueOffsets &&
    rawArrowData.values &&
    rawArrowData.getValid(rowIndex)
  ) {
    const valueStart = Number(rawArrowData.valueOffsets[rowIndex]);
    const valueEnd = Number(rawArrowData.valueOffsets[rowIndex + 1]);
    return UTF8_DECODER.decode(rawArrowData.values.subarray(valueStart, valueEnd));
  }
  return readRawArrowStringValue(rawArrowColumn?.get(rowIndex));
}

/** Applies Papa-compatible dynamic typing to one nullable CSV string value. */
function parseValueWithDynamicTyping(rawStringValue: string | null): DynamicColumnValue {
  if (rawStringValue === null) {
    return null;
  }

  if (rawStringValue === 'true' || rawStringValue === 'TRUE') {
    return true;
  }

  if (rawStringValue === 'false' || rawStringValue === 'FALSE') {
    return false;
  }

  if (rawStringValue === '') {
    return null;
  }

  if (isNumericString(rawStringValue)) {
    return Number.parseFloat(rawStringValue);
  }

  if (
    rawStringValue.length >= 19 &&
    rawStringValue.includes('T') &&
    ISO_DATE.test(rawStringValue)
  ) {
    return new Date(rawStringValue);
  }

  return rawStringValue;
}

/** Returns whether a string matches PapaParse's dynamic-number grammar. */
function isNumericString(value: string): boolean {
  const trimmedValue = value.trim();
  const length = trimmedValue.length;
  if (length === 0) {
    return false;
  }

  let characterIndex = trimmedValue.charCodeAt(0) === 45 ? 1 : 0;
  let digitCount = 0;
  while (characterIndex < length) {
    const character = trimmedValue.charCodeAt(characterIndex);
    if (character < 48 || character > 57) {
      break;
    }
    digitCount++;
    characterIndex++;
  }

  if (trimmedValue.charCodeAt(characterIndex) === 46) {
    characterIndex++;
    while (characterIndex < length) {
      const character = trimmedValue.charCodeAt(characterIndex);
      if (character < 48 || character > 57) {
        break;
      }
      digitCount++;
      characterIndex++;
    }
  }

  if (digitCount === 0) {
    return false;
  }

  const exponentCharacter = trimmedValue.charCodeAt(characterIndex);
  if (exponentCharacter === 69 || exponentCharacter === 101) {
    characterIndex++;
    const exponentSign = trimmedValue.charCodeAt(characterIndex);
    if (exponentSign === 43 || exponentSign === 45) {
      characterIndex++;
    }

    const exponentStart = characterIndex;
    while (characterIndex < length) {
      const character = trimmedValue.charCodeAt(characterIndex);
      if (character < 48 || character > 57) {
        return false;
      }
      characterIndex++;
    }
    return characterIndex > exponentStart;
  }

  return characterIndex === length;
}

/** Deduces the narrowest supported Arrow type for one column. */
function deduceTypedColumnDataType(dynamicValues: DynamicColumnValue[]): TypedColumnDataType {
  let inferredColumnDataType: TypedColumnDataType | null = null;

  for (const dynamicValue of dynamicValues) {
    if (dynamicValue === null) {
      continue;
    }

    const currentValueDataType = getTypedColumnDataType(dynamicValue);

    if (currentValueDataType === 'utf8') {
      return 'utf8';
    }

    if (inferredColumnDataType === null) {
      inferredColumnDataType = currentValueDataType;
      continue;
    }

    if (inferredColumnDataType !== currentValueDataType) {
      return 'utf8';
    }
  }

  return inferredColumnDataType ?? 'utf8';
}

/** Returns the typed Arrow column type for a non-null dynamically typed value. */
function getTypedColumnDataType(
  dynamicValue: Exclude<DynamicColumnValue, null>
): TypedColumnDataType {
  if (typeof dynamicValue === 'boolean') {
    return 'bool';
  }

  if (typeof dynamicValue === 'number') {
    return 'float64';
  }

  if (dynamicValue instanceof Date) {
    return 'date-millisecond';
  }

  return 'utf8';
}

/** Coerces one dynamically typed value to the selected Arrow column type. */
function convertDynamicValueToTypedColumnValue(
  dynamicValue: DynamicColumnValue,
  typedColumnDataType: TypedColumnDataType
): DynamicColumnValue {
  switch (typedColumnDataType) {
    case 'bool':
      return typeof dynamicValue === 'boolean' ? dynamicValue : null;
    case 'float64':
      return typeof dynamicValue === 'number' ? dynamicValue : null;
    case 'date-millisecond':
      return dynamicValue instanceof Date ? dynamicValue : null;
    case 'utf8':
    default:
      return dynamicValue === null ? null : String(dynamicValue);
  }
}
