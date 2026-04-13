// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffersAsync, toArrayBufferIterator} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {AsyncQueue, ArrowTableBuilder, convertArrowToSchema} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

import type {CSVLoaderOptions} from '../../csv-loader';
import {CSVLoader} from '../../csv-loader';
import Papa from '../../papaparse/papaparse';
import AsyncIteratorStreamer from '../../papaparse/async-iterator-streamer';
import {parseRawArrowCSVBytes} from './parse-raw-arrow-csv-bytes';

/** CSV options accepted by the internal Arrow table parser. */
export type CSVRawArrowOptions = Omit<NonNullable<CSVLoaderOptions['csv']>, 'shape' | 'header'> & {
  header?: boolean | 'auto';
  /** Used for Papa-style header auto-detection; raw Arrow columns remain Utf8. */
  dynamicTyping?: boolean;
  /** @internal Whether the caller explicitly supplied `skipEmptyLines`. */
  skipEmptyLinesIsExplicit?: boolean;
};

/** Loader options accepted by the internal Arrow table parser. */
export type CSVRawArrowParseOptions = LoaderOptions & {
  csv?: CSVRawArrowOptions;
};

/** Default batch size used when callers request automatic Arrow CSV batching. */
const DEFAULT_BATCH_SIZE = 4000;

/** Default CSV options for internal Arrow table parsing. */
const DEFAULT_RAW_ARROW_CSV_OPTIONS: CSVRawArrowOptions = {
  ...CSVLoader.options.csv,
  header: false,
  dynamicTyping: false
};

const FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;
const ISO_DATE =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

/** Encodes string input so parseText can reuse the raw Arrow byte parser. */
const textEncoder = new TextEncoder();

/** Parses an ArrayBuffer into an Arrow table with Utf8 columns. */
export function parseRawArrowCSVTable(
  arrayBuffer: ArrayBuffer,
  options?: CSVRawArrowParseOptions
): Promise<ArrowTable> {
  const csvOptions = createRawArrowCSVOptions(options);
  if (shouldUsePapaCompatibleSkipEmptyLines(csvOptions)) {
    return parseRawArrowCSVTextWithPapa(new TextDecoder().decode(arrayBuffer), options, csvOptions);
  }

  const arrowTable = parseRawArrowCSVBytes(arrayBuffer, csvOptions);
  if (arrowTable) {
    return Promise.resolve(arrowTable);
  }

  return parseRawArrowCSVText(new TextDecoder().decode(arrayBuffer), options);
}

/** Parses CSV text into an Arrow table with Utf8 columns. */
export async function parseRawArrowCSVText(
  csvText: string,
  options?: CSVRawArrowParseOptions
): Promise<ArrowTable> {
  const csvOptions = createRawArrowCSVOptions(options);
  if (shouldUsePapaCompatibleSkipEmptyLines(csvOptions)) {
    return parseRawArrowCSVTextWithPapa(csvText, options, csvOptions);
  }

  const encodedCSVText = textEncoder.encode(csvText);
  const rawArrowTable = parseRawArrowCSVBytes(encodedCSVText.buffer, csvOptions);
  if (rawArrowTable) {
    return rawArrowTable;
  }

  let arrowTableBuilder: ArrowTableBuilder | null = null;
  let headerRow: string[] | null = null;
  let isFirstRow: boolean = true;
  let schema: Schema | null = null;

  const config = {
    ...csvOptions,
    header: false,
    dynamicTyping: false,
    download: false,
    skipEmptyLines: false,

    // eslint-disable-next-line complexity, max-statements
    step(results) {
      let row = results.data;

      if (!Array.isArray(row)) {
        return;
      }

      if (csvOptions.skipEmptyLines === 'greedy') {
        const collapsedRow = row.flat().join('').trim();
        if (collapsedRow === '') {
          return;
        }
      } else if (csvOptions.skipEmptyLines === true && row.length === 1 && row[0] === '') {
        return;
      }

      if (isFirstRow && !headerRow) {
        const isHeader =
          csvOptions.header === 'auto'
            ? isHeaderRow(row, Boolean(csvOptions.dynamicTyping))
            : Boolean(csvOptions.header);
        if (isHeader) {
          headerRow = row.map(createDuplicateColumnTransformer());
          return;
        }
      }

      if (isFirstRow) {
        isFirstRow = false;
        if (!headerRow) {
          headerRow = generateHeader(csvOptions.columnPrefix || 'column', row.length);
        }
        schema = createUtf8Schema(headerRow);
        arrowTableBuilder = new ArrowTableBuilder(schema);
      }

      if (csvOptions.optimizeMemoryUsage) {
        row = JSON.parse(JSON.stringify(row));
      }

      arrowTableBuilder?.addArrayRow(row);
    },

    error(error) {
      throw new Error(error);
    }
  };

  Papa.parse(csvText, config);

  if (arrowTableBuilder) {
    return (arrowTableBuilder as ArrowTableBuilder).finishTable();
  }

  if (headerRow) {
    const headerSchema = createUtf8Schema(headerRow);
    return new ArrowTableBuilder(headerSchema).finishTable();
  }

  return {
    shape: 'arrow-table',
    schema: schema || createUtf8Schema([]),
    data: new arrow.Table({})
  };
}

/** Parses through CSVLoader when Papa-compatible edge semantics require row objects. */
async function parseRawArrowCSVTextWithPapa(
  csvText: string,
  options: CSVRawArrowParseOptions | undefined,
  csvOptions: CSVRawArrowOptions
): Promise<ArrowTable> {
  const rowTable = await CSVLoader.parseText(csvText, {
    ...options,
    csv: {
      ...options?.csv,
      shape: 'object-row-table'
    }
  } as any);

  const rows = rowTable.shape === 'object-row-table' ? rowTable.data : [];
  const columnNames = getPapaCompatibleColumnNames(rows, rowTable.schema?.fields || [], {
    includeParsedExtra: shouldIncludePapaParsedExtraColumn(csvOptions)
  });
  const columns: Record<string, arrow.Vector> = {};
  const listType = new arrow.List(new arrow.Field('item', new arrow.Utf8(), true));

  for (const columnName of columnNames) {
    const columnValues = rows.map(row => row[columnName]);
    const hasListValues = columnValues.some(value => Array.isArray(value));
    columns[columnName] = hasListValues
      ? arrow.vectorFromArray(columnValues.map(getRawArrowListValue), listType)
      : arrow.vectorFromArray(columnValues.map(getRawArrowStringValue), new arrow.Utf8());
  }

  const data = new arrow.Table(columns);
  return {
    shape: 'arrow-table',
    schema: convertArrowToSchema(data.schema),
    data
  };
}

/** Returns schema fields plus selected Papa dynamic keys when parser options require them. */
function getPapaCompatibleColumnNames(
  rows: Array<Record<string, unknown>>,
  fields: Schema['fields'],
  options: {
    includeParsedExtra: boolean;
  }
): string[] {
  const columnNames = fields.map(field => field.name);

  if (
    options.includeParsedExtra &&
    rows.some(row => Array.isArray(row.__parsed_extra)) &&
    !columnNames.includes('__parsed_extra')
  ) {
    columnNames.push('__parsed_extra');
  }

  return columnNames;
}

/** Returns whether Papa's extra-cell column is part of the requested parser semantics. */
function shouldIncludePapaParsedExtraColumn(csvOptions: CSVRawArrowOptions): boolean {
  return csvOptions.header !== false;
}

/** Converts a Papa cell value back to nullable raw CSV text for the raw Arrow table. */
function getRawArrowStringValue(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

/** Converts Papa's `__parsed_extra` arrays to nullable raw CSV text arrays. */
function getRawArrowListValue(value: unknown): Array<string | null> | null {
  return Array.isArray(value) ? value.map(getRawArrowStringValue) : null;
}

/** Parses batch input into Arrow batches with Utf8 columns. */
export function parseRawArrowCSVInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVRawArrowParseOptions
): AsyncIterable<ArrowTableBatch> {
  options = {...options};
  const batchSize = getBatchSize(options);

  const csvOptions = createRawArrowCSVOptions(options);

  if (shouldUsePapaCompatibleSkipEmptyLines(csvOptions)) {
    return parseRawArrowCSVInSingleBatch(asyncIterator, options, csvOptions);
  }

  if (typeof batchSize !== 'number') {
    return parseRawArrowCSVInSingleBatch(asyncIterator, options, csvOptions);
  }

  const asyncQueue = new AsyncQueue<ArrowTableBatch>();

  let arrowTableBuilder: ArrowTableBuilder | null = null;
  let headerRow: string[] | null = null;
  let isFirstRow: boolean = true;
  let rowCountInCurrentBatch: number = 0;
  let emittedBatchCount: number = 0;

  const config = {
    ...csvOptions,
    header: false,
    dynamicTyping: false,
    download: false,
    chunkSize: 1024 * 1024 * 5,
    skipEmptyLines: false,

    // eslint-disable-next-line complexity, max-statements
    step(results) {
      let row = results.data;

      if (!Array.isArray(row)) {
        return;
      }

      if (csvOptions.skipEmptyLines === 'greedy') {
        const collapsedRow = row.flat().join('').trim();
        if (collapsedRow === '') {
          return;
        }
      } else if (csvOptions.skipEmptyLines === true && row.length === 1 && row[0] === '') {
        return;
      }

      if (isFirstRow && !headerRow) {
        const isHeader =
          csvOptions.header === 'auto'
            ? isHeaderRow(row, Boolean(csvOptions.dynamicTyping))
            : Boolean(csvOptions.header);
        if (isHeader) {
          headerRow = row.map(createDuplicateColumnTransformer());
          return;
        }
      }

      if (isFirstRow) {
        isFirstRow = false;
        if (!headerRow) {
          headerRow = generateHeader(csvOptions.columnPrefix || 'column', row.length);
        }
        const schema = createUtf8Schema(headerRow);
        arrowTableBuilder = new ArrowTableBuilder(schema);
      }

      if (csvOptions.optimizeMemoryUsage) {
        row = JSON.parse(JSON.stringify(row));
      }

      arrowTableBuilder?.addArrayRow(row);
      rowCountInCurrentBatch++;

      if (rowCountInCurrentBatch >= batchSize) {
        const batch = arrowTableBuilder?.flushBatch();
        if (batch) {
          asyncQueue.enqueue({
            ...batch,
            count: emittedBatchCount,
            bytesUsed: results.meta.cursor
          });
          emittedBatchCount++;
          rowCountInCurrentBatch = 0;
        }
      }
    },

    complete(results) {
      try {
        const batch = rowCountInCurrentBatch > 0 ? arrowTableBuilder?.finishBatch() : null;
        if (batch) {
          asyncQueue.enqueue({
            ...batch,
            count: emittedBatchCount,
            bytesUsed: results.meta.cursor
          });
        }
      } catch (error) {
        asyncQueue.enqueue(error as Error);
      }

      asyncQueue.close();
    }
  };

  Papa.parse(toArrayBufferIterator(asyncIterator), config, AsyncIteratorStreamer);

  return asyncQueue;
}

/** Parses chunked input through the atomic byte path when the caller did not request batching. */
async function* parseRawArrowCSVInSingleBatch(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options: CSVRawArrowParseOptions,
  csvOptions: CSVRawArrowOptions
): AsyncIterable<ArrowTableBatch> {
  const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
  const csvText = shouldUsePapaCompatibleSkipEmptyLines(csvOptions)
    ? new TextDecoder().decode(arrayBuffer)
    : null;
  const arrowTable =
    (csvText ? null : parseRawArrowCSVBytes(arrayBuffer, csvOptions)) ||
    (await parseRawArrowCSVText(csvText || new TextDecoder().decode(arrayBuffer), options));

  yield {
    shape: 'arrow-table',
    batchType: 'data',
    schema: arrowTable.schema,
    data: arrowTable.data,
    length: arrowTable.data.numRows,
    count: 0,
    bytesUsed: arrayBuffer.byteLength
  };
}

/** Returns the normalized batch size from core options or legacy top-level options. */
function getBatchSize(options: CSVRawArrowParseOptions): number | undefined {
  const batchSize =
    options.core?.batchSize ??
    (options as CSVRawArrowParseOptions & {batchSize?: number | 'auto'}).batchSize;
  return batchSize === 'auto' ? DEFAULT_BATCH_SIZE : batchSize;
}

/** Merges caller options with raw Arrow CSV defaults. */
function createRawArrowCSVOptions(options?: CSVRawArrowParseOptions): CSVRawArrowOptions {
  return {
    ...DEFAULT_RAW_ARROW_CSV_OPTIONS,
    ...options?.csv,
    header: options?.csv?.header ?? false,
    dynamicTyping: Boolean(options?.csv?.dynamicTyping)
  };
}

/** Returns whether strict Papa empty-line semantics were explicitly requested by the caller. */
function shouldUsePapaCompatibleSkipEmptyLines(csvOptions: CSVRawArrowOptions): boolean {
  return csvOptions.skipEmptyLines === true && Boolean(csvOptions.skipEmptyLinesIsExplicit);
}

/** Returns whether a Papa-parsed first row looks like a header row. */
function isHeaderRow(row: string[], dynamicTyping: boolean): boolean {
  return row && row.every(value => isHeaderValue(value, dynamicTyping));
}

/** Returns whether a first-row value should be treated as a Papa-style header cell. */
function isHeaderValue(value: string, dynamicTyping: boolean): boolean {
  if (!dynamicTyping) {
    return typeof value === 'string';
  }

  const trimmedValue = value.trim();
  return (
    trimmedValue !== '' &&
    trimmedValue !== 'true' &&
    trimmedValue !== 'false' &&
    !FLOAT.test(trimmedValue) &&
    !ISO_DATE.test(trimmedValue)
  );
}

/** Creates a transformer that appends suffixes to repeated column names. */
function createDuplicateColumnTransformer(): (column: string) => string {
  const observedColumns = new Set<string>();
  return columnName => {
    let currentColumnName = columnName;
    let duplicateCounter = 1;
    while (observedColumns.has(currentColumnName)) {
      currentColumnName = `${columnName}.${duplicateCounter}`;
      duplicateCounter++;
    }
    observedColumns.add(currentColumnName);
    return currentColumnName;
  };
}

/** Generates default column names for CSV files without a header row. */
function generateHeader(columnPrefix: string, count: number = 0): string[] {
  const headers: string[] = [];
  for (let columnIndex = 0; columnIndex < count; columnIndex++) {
    headers.push(`${columnPrefix}${columnIndex + 1}`);
  }
  return headers;
}

/** Creates a loaders.gl schema with nullable Utf8 fields. */
function createUtf8Schema(headerRow: string[]): Schema {
  return {
    fields: headerRow.map(columnName => ({name: columnName, type: 'utf8', nullable: true})),
    metadata: {
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVArrowLoader'
    }
  };
}
