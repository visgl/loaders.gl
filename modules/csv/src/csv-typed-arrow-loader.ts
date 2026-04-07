// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';

import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';
import {CSVRawArrowLoader} from './csv-raw-arrow-loader';
import type {CSVRawArrowLoaderOptions} from './csv-raw-arrow-loader';

type CSVTypedArrowOptions = Omit<NonNullable<CSVLoaderOptions['csv']>, 'shape'>;

type DynamicColumnValue = string | number | boolean | Date | null;
type TypedColumnDataType = 'utf8' | 'float64' | 'bool' | 'date-millisecond';
type TypedArrowConversionResult = {
  typedArrowTable: ArrowTable;
  typedColumnDataTypes: TypedColumnDataType[];
};

const FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
const ISO_DATE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

export type CSVTypedArrowLoaderOptions = LoaderOptions & {
  csv?: CSVTypedArrowOptions;
};

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
    parseCSVToTypedArrow(new TextDecoder().decode(arrayBuffer), options),

  parseText: (text: string, options?: CSVTypedArrowLoaderOptions) =>
    parseCSVToTypedArrow(text, options),

  parseInBatches: parseCSVToTypedArrowBatches
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, CSVTypedArrowLoaderOptions>;

async function parseCSVToTypedArrow(
  csvText: string,
  options?: CSVTypedArrowLoaderOptions
): Promise<ArrowTable> {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowTable = await CSVRawArrowLoader.parseText(csvText, rawArrowCSVOptions);

  if (!shouldApplyDynamicTyping(typedArrowCSVOptions)) {
    return rawArrowTable;
  }

  return convertRawArrowTableToTypedArrowTable(rawArrowTable).typedArrowTable;
}

function parseCSVToTypedArrowBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVTypedArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const rawArrowCSVOptions = createRawArrowCSVOptions(options);

  const rawArrowBatchIterator = CSVRawArrowLoader.parseInBatches(asyncIterator, rawArrowCSVOptions);

  return makeTypedArrowBatchIterator(rawArrowBatchIterator, typedArrowCSVOptions);
}

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

function createTypedArrowCSVOptions(options?: CSVTypedArrowLoaderOptions): CSVTypedArrowOptions {
  return {
    ...CSVTypedArrowLoader.options.csv,
    ...options?.csv
  };
}

function createRawArrowCSVOptions(options?: CSVTypedArrowLoaderOptions): CSVRawArrowLoaderOptions {
  const typedArrowCSVOptions = createTypedArrowCSVOptions(options);
  const {dynamicTyping, ...rawArrowCSVOptions} = typedArrowCSVOptions;
  void dynamicTyping;

  return {
    ...options,
    csv: rawArrowCSVOptions
  };
}

function shouldApplyDynamicTyping(typedArrowCSVOptions: CSVTypedArrowOptions): boolean {
  return typedArrowCSVOptions.dynamicTyping !== false;
}

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
            'loaders.gl#loader': 'CSVTypedArrowLoader'
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
    typedColumnValues.push(convertDynamicValuesToTypedColumnValues(dynamicValues, typedColumnDataType));
  }

  const typedSchema: Schema = {
    fields: typedSchemaFields,
    metadata: {
      ...rawArrowTable.schema?.metadata,
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVTypedArrowLoader'
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

function readRawArrowStringValue(rawArrowValue: unknown): string | null {
  if (rawArrowValue === null || rawArrowValue === undefined) {
    return null;
  }

  return String(rawArrowValue);
}

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

function getTypedColumnDataType(dynamicValue: Exclude<DynamicColumnValue, null>): TypedColumnDataType {
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
      return dynamicValues.map((dynamicValue) => (dynamicValue === null ? null : String(dynamicValue)));
  }
}
