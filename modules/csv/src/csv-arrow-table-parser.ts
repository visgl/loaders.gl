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
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
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
  comments: CSV_LOADER_OPTIONS.csv.comments,
  skipEmptyLines: false,
  detectGeometryColumns: CSV_LOADER_OPTIONS.csv.detectGeometryColumns,
  delimitersToGuess: CSV_LOADER_OPTIONS.csv.delimitersToGuess
};

/** Cell value after Papa-style dynamic typing has been applied. */
type DynamicColumnValue = string | number | boolean | Date | null;

/** Arrow data types inferred by the typed Arrow conversion pass. */
type TypedColumnDataType = 'utf8' | 'float64' | 'bool' | 'date-millisecond';

/** Result of converting a raw Utf8 Arrow table to typed Arrow columns. */
type TypedArrowConversionResult = {
  typedArrowTable: ArrowTable;
  typedColumnDataTypes: TypedColumnDataType[];
};

const FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
const ISO_DATE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

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
    return convertCSVRowTableToArrowTable(rowTable as ObjectRowTable);
  }
  const rawArrowCSVOptions = createRawArrowTableCSVOptions(normalizedOptions);

  const rawArrowTable = await parseRawArrowCSVTable(arrayBuffer, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(csvOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
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
    return convertCSVRowTableToArrowTable(rowTable as ObjectRowTable);
  }
  const rawArrowCSVOptions = createRawArrowTableCSVOptions(normalizedOptions);

  const rawArrowTable = await parseRawArrowCSVText(csvText, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(csvOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
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
      })
    );
  }
  const rawArrowCSVOptions = createRawArrowTableCSVOptions(normalizedOptions);

  const rawArrowBatchIterator = parseRawArrowCSVInBatches(asyncIterator, rawArrowCSVOptions);

  return makeTypedArrowBatchIterator(rawArrowBatchIterator, csvOptions);
}

/** Converts CSV row-table output to an Arrow table using the supplied CSV schema. */
function convertCSVRowTableToArrowTable(table: ObjectRowTable | ArrayRowTable): ArrowTable {
  const arrowTableBuilder = new ArrowTableBuilder(table.schema!);
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
  rowBatchIterator: AsyncIterable<TableBatch>
): AsyncIterable<ArrowTableBatch> {
  for await (const rowBatch of rowBatchIterator) {
    if (
      (rowBatch.shape !== 'array-row-table' && rowBatch.shape !== 'object-row-table') ||
      !rowBatch.schema
    ) {
      continue;
    }

    const arrowTableBuilder = new ArrowTableBuilder(rowBatch.schema);
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
      schema: rowBatch.schema,
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
      frozenColumnDataTypes
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

/** Converts an Arrow table of Utf8 columns to inferred typed Arrow columns. */
function convertRawArrowTableToTypedArrowTable(
  rawArrowTable: ArrowTable,
  options?: {frozenColumnDataTypes?: TypedColumnDataType[] | null}
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

    const rawStringValues: (string | null)[] = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const rawArrowValue = rawArrowColumn?.get(rowIndex);
      rawStringValues.push(readRawArrowStringValue(rawArrowValue));
    }

    const dynamicValues = rawStringValues.map(rawStringValue =>
      parseValueWithDynamicTyping(rawStringValue)
    );

    const typedColumnDataType =
      options?.frozenColumnDataTypes?.[columnIndex] ?? deduceTypedColumnDataType(dynamicValues);

    typedSchemaFields.push({
      name: rawArrowSchemaField.name,
      type: typedColumnDataType,
      nullable: true
    });

    typedColumnDataTypes.push(typedColumnDataType);
    typedColumnValues.push(
      convertDynamicValuesToTypedColumnValues(dynamicValues, typedColumnDataType)
    );
  }

  const typedSchema: Schema = {
    fields: typedSchemaFields,
    metadata: {
      ...rawArrowTable.schema?.metadata,
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVLoader'
    }
  };

  const typedArrowTableBuilder = new ArrowTableBuilder(typedSchema);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowValues = typedColumnValues.map(typedColumnValue => typedColumnValue[rowIndex]);
    typedArrowTableBuilder.addArrayRow(rowValues);
  }

  return {
    typedArrowTable: typedArrowTableBuilder.finishTable(),
    typedColumnDataTypes
  };
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

  if (FLOAT.test(rawStringValue)) {
    return Number.parseFloat(rawStringValue);
  }

  if (ISO_DATE.test(rawStringValue)) {
    return new Date(rawStringValue);
  }

  if (rawStringValue === '') {
    return null;
  }

  return rawStringValue;
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

/** Coerces dynamically typed values to values compatible with the selected Arrow type. */
function convertDynamicValuesToTypedColumnValues(
  dynamicValues: DynamicColumnValue[],
  typedColumnDataType: TypedColumnDataType
): DynamicColumnValue[] {
  switch (typedColumnDataType) {
    case 'bool':
      return dynamicValues.map(dynamicValue =>
        typeof dynamicValue === 'boolean' ? dynamicValue : null
      );
    case 'float64':
      return dynamicValues.map(dynamicValue =>
        typeof dynamicValue === 'number' ? dynamicValue : null
      );
    case 'date-millisecond':
      return dynamicValues.map(dynamicValue =>
        dynamicValue instanceof Date ? dynamicValue : null
      );
    case 'utf8':
    default:
      return dynamicValues.map(dynamicValue =>
        dynamicValue === null ? null : String(dynamicValue)
      );
  }
}
