// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';
import {
  parseRawArrowCSVInBatches,
  parseRawArrowCSVTable,
  parseRawArrowCSVText
} from './lib/parsers/parse-csv-to-arrow';
import type {CSVRawArrowParseOptions} from './lib/parsers/parse-csv-to-arrow';
import type {ArrayRowTable, ObjectRowTable, TableBatch} from '@loaders.gl/schema';

/** CSV options accepted by the Arrow CSV loader. */
type CSVArrowOptions = Omit<NonNullable<CSVLoaderOptions['csv']>, 'shape'> & {
  /** @internal Whether the caller explicitly supplied `skipEmptyLines`. */
  skipEmptyLinesIsExplicit?: boolean;
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

/** Default CSV options for CSVArrowLoader. */
const CSV_ARROW_DEFAULT_OPTIONS: CSVArrowOptions = {
  optimizeMemoryUsage: CSVLoader.options.csv.optimizeMemoryUsage,
  header: CSVLoader.options.csv.header,
  columnPrefix: CSVLoader.options.csv.columnPrefix,
  quoteChar: CSVLoader.options.csv.quoteChar,
  escapeChar: CSVLoader.options.csv.escapeChar,
  dynamicTyping: false,
  comments: CSVLoader.options.csv.comments,
  skipEmptyLines: false,
  delimitersToGuess: CSVLoader.options.csv.delimitersToGuess
};

/** Options for parsing CSV input into Apache Arrow tables. */
export type CSVArrowLoaderOptions = LoaderOptions & {
  csv?: CSVArrowOptions;
};

/**
 * CSV loader that returns Apache Arrow tables.
 *
 * The default `csv.dynamicTyping: false` path emits Arrow Utf8 columns and uses
 * the byte-oriented parser when the supplied options are supported. Set
 * `csv.dynamicTyping: true` to opt into typed Arrow columns.
 */
export const CSVArrowLoader = {
  ...CSVLoader,

  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,

  options: {
    ...CSVLoader.options,
    csv: CSV_ARROW_DEFAULT_OPTIONS
  },

  parse: async (arrayBuffer: ArrayBuffer, options?: CSVArrowLoaderOptions) =>
    parseCSVArrayBufferToArrow(arrayBuffer, createCSVArrowLoaderOptions(options)),

  parseText: (text: string, options?: CSVArrowLoaderOptions) =>
    parseCSVTextToArrow(text, createCSVArrowLoaderOptions(options)),

  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: CSVArrowLoaderOptions
  ) => parseCSVToArrowBatches(asyncIterator, createCSVArrowLoaderOptions(options))
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, CSVArrowLoaderOptions>;

/** Applies CSVArrowLoader defaults before delegating to Arrow CSV parsing helpers. */
function createCSVArrowLoaderOptions(options?: CSVArrowLoaderOptions): CSVArrowLoaderOptions {
  const skipEmptyLinesIsExplicit =
    (options?.csv && Object.prototype.hasOwnProperty.call(options.csv, 'skipEmptyLinesIsExplicit')
      ? Boolean(options.csv.skipEmptyLinesIsExplicit)
      : undefined) ?? Boolean(options?.csv && options.csv.skipEmptyLines === true);

  return {
    ...options,
    csv: {
      ...CSVArrowLoader.options.csv,
      ...options?.csv,
      skipEmptyLinesIsExplicit
    }
  };
}

/** Parses ArrayBuffer CSV input and optionally converts Utf8 Arrow columns to typed columns. */
async function parseCSVArrayBufferToArrow(
  arrayBuffer: ArrayBuffer,
  options?: CSVArrowLoaderOptions
): Promise<ArrowTable> {
  const csvOptions = createCSVArrowOptions(options);
  if (csvOptions.detectGeometryColumns) {
    const rowTable = await CSVLoader.parse(arrayBuffer, {
      ...options,
      csv: {
        ...options?.csv,
        shape: 'object-row-table',
        dynamicTyping: csvOptions.dynamicTyping
      }
    });
    return convertCSVRowTableToArrowTable(rowTable as ObjectRowTable);
  }
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowTable = await parseRawArrowCSVTable(arrayBuffer, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(csvOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
}

/** Parses string CSV input and optionally converts Utf8 Arrow columns to typed columns. */
async function parseCSVTextToArrow(
  csvText: string,
  options?: CSVArrowLoaderOptions
): Promise<ArrowTable> {
  const csvOptions = createCSVArrowOptions(options);
  if (csvOptions.detectGeometryColumns) {
    const rowTable = await CSVLoader.parseText(csvText, {
      ...options,
      csv: {
        ...options?.csv,
        shape: 'object-row-table',
        dynamicTyping: csvOptions.dynamicTyping
      }
    });
    return convertCSVRowTableToArrowTable(rowTable as ObjectRowTable);
  }
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowTable = await parseRawArrowCSVText(csvText, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(csvOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
}

/** Parses batch CSV input and optionally converts Utf8 Arrow batches to typed batches. */
function parseCSVToArrowBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  const csvOptions = createCSVArrowOptions(options);
  if (csvOptions.detectGeometryColumns) {
    return convertCSVRowBatchesToArrowBatches(
      CSVLoader.parseInBatches(asyncIterator, {
        ...options,
        csv: {
          ...options?.csv,
          shape: 'object-row-table',
          dynamicTyping: csvOptions.dynamicTyping
        }
      })
    );
  }
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

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
  csvOptions: CSVArrowOptions
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
function createCSVArrowOptions(options?: CSVArrowLoaderOptions): CSVArrowOptions {
  return {
    ...CSVArrowLoader.options.csv,
    ...options?.csv
  };
}

/** Creates raw Arrow options by stripping the typed conversion flag. */
function createRawArrowCSVOptions(options?: CSVArrowLoaderOptions): CSVRawArrowParseOptions {
  const csvOptions = createCSVArrowOptions(options);
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
function shouldApplyDynamicTyping(csvOptions: CSVArrowOptions): boolean {
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
            'loaders.gl#loader': 'CSVArrowLoader'
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
      'loaders.gl#loader': 'CSVArrowLoader'
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
