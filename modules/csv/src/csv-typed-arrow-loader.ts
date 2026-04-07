// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';

import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';
import {
  parseRawArrowCSVInBatches,
  parseRawArrowCSVTable,
  parseRawArrowCSVText
} from './csv-raw-arrow-loader';
import type {CSVRawArrowParseOptions} from './csv-raw-arrow-loader';

/** CSV options accepted by the internal typed Arrow parser. */
type CSVTypedArrowOptions = Omit<NonNullable<CSVLoaderOptions['csv']>, 'shape'>;

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

/** Options for the internal typed Arrow CSV loader. */
export type CSVTypedArrowLoaderOptions = LoaderOptions & {
  csv?: CSVTypedArrowOptions;
};

/** Internal CSV loader that preserves the previous typed Arrow implementation. */
export const CSVTypedArrowLoader = {
  ...CSVLoader,

  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,

  options: {
    ...CSVLoader.options,
    csv: {
      ...CSVLoader.options.csv,
      dynamicTyping: true
    }
  },

  parse: async (arrayBuffer: ArrayBuffer, options?: CSVTypedArrowLoaderOptions) =>
    parseCSVArrayBufferToTypedArrow(arrayBuffer, options),

  parseText: (text: string, options?: CSVTypedArrowLoaderOptions) =>
    parseCSVToTypedArrow(text, options),

  parseInBatches: parseCSVToTypedArrowBatches
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, CSVTypedArrowLoaderOptions>;

/** Parses ArrayBuffer CSV input and optionally converts Utf8 Arrow columns to typed columns. */
async function parseCSVArrayBufferToTypedArrow(
  arrayBuffer: ArrayBuffer,
  options?: CSVTypedArrowLoaderOptions
): Promise<ArrowTable> {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowTable = await parseRawArrowCSVTable(arrayBuffer, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(typedArrowCSVOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
}

/** Parses string CSV input and optionally converts Utf8 Arrow columns to typed columns. */
async function parseCSVToTypedArrow(
  csvText: string,
  options?: CSVTypedArrowLoaderOptions
): Promise<ArrowTable> {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowTable = await parseRawArrowCSVText(csvText, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(typedArrowCSVOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
}

/** Parses batch CSV input and optionally converts Utf8 Arrow batches to typed batches. */
function parseCSVToTypedArrowBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVTypedArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowBatchIterator = parseRawArrowCSVInBatches(asyncIterator, rawArrowCSVOptions);

  return makeTypedArrowBatchIterator(rawArrowBatchIterator, typedArrowCSVOptions);
}

/** Converts an async iterator of raw Utf8 Arrow batches to typed Arrow batches. */
async function* makeTypedArrowBatchIterator(
  rawArrowBatchIterator: AsyncIterable<ArrowTableBatch>,
  typedArrowCSVOptions: CSVTypedArrowOptions
): AsyncIterable<ArrowTableBatch> {
  let frozenColumnDataTypes: TypedColumnDataType[] | null = null;

  for await (const rawArrowBatch of rawArrowBatchIterator) {
    if (!shouldApplyDynamicTyping(typedArrowCSVOptions)) {
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

/** Merges caller options with typed Arrow CSV defaults. */
function createTypedArrowCSVOptions(options?: CSVTypedArrowLoaderOptions): CSVTypedArrowOptions {
  return {
    ...CSVTypedArrowLoader.options.csv,
    ...options?.csv
  };
}

/** Creates raw Arrow options by stripping the typed conversion flag. */
function createRawArrowCSVOptions(options?: CSVTypedArrowLoaderOptions): CSVRawArrowParseOptions {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const {dynamicTyping, ...rawArrowCSVOptions} = typedArrowCSVOptions;
  void dynamicTyping;

  return {
    ...options,
    csv: rawArrowCSVOptions
  };
}

/** Returns whether typed Arrow conversion should be applied. */
function shouldApplyDynamicTyping(typedArrowCSVOptions: CSVTypedArrowOptions): boolean {
  return typedArrowCSVOptions.dynamicTyping !== false;
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
  const typedColumnValues: DynamicColumnValue[][] = [];
  const typedColumnDataTypes: TypedColumnDataType[] = [];

  for (let columnIndex = 0; columnIndex < rawArrowSchemaFields.length; columnIndex++) {
    const rawArrowSchemaField = rawArrowSchemaFields[columnIndex];
    const rawArrowColumn = rawArrowTable.data.getChildAt(columnIndex);

    const rawStringValues: (string | null)[] = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const rawArrowValue = rawArrowColumn?.get(rowIndex);
      rawStringValues.push(readRawArrowStringValue(rawArrowValue));
    }

    const dynamicValues = rawStringValues.map((rawStringValue) =>
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
    const rowValues = typedColumnValues.map((typedColumnValue) => typedColumnValue[rowIndex]);
    typedArrowTableBuilder.addArrayRow(rowValues);
  }

  return {
    typedArrowTable: typedArrowTableBuilder.finishTable(),
    typedColumnDataTypes
  };
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
      return dynamicValues.map((dynamicValue) =>
        typeof dynamicValue === 'boolean' ? dynamicValue : null
      );
    case 'float64':
      return dynamicValues.map((dynamicValue) =>
        typeof dynamicValue === 'number' ? dynamicValue : null
      );
    case 'date-millisecond':
      return dynamicValues.map((dynamicValue) =>
        dynamicValue instanceof Date ? dynamicValue : null
      );
    case 'utf8':
    default:
      return dynamicValues.map((dynamicValue) =>
        dynamicValue === null ? null : String(dynamicValue)
      );
  }
}
