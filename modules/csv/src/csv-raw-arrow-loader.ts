// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffersAsync, toArrayBufferIterator} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {AsyncQueue, ArrowTableBuilder} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';
import Papa from './papaparse/papaparse';
import AsyncIteratorStreamer from './papaparse/async-iterator-streamer';
import {parseRawArrowCSVBytes} from './lib/parsers/parse-raw-arrow-csv-bytes';

/** CSV options accepted by the internal raw Arrow parser. */
export type CSVRawArrowOptions = Omit<
  NonNullable<CSVLoaderOptions['csv']>,
  'shape' | 'dynamicTyping' | 'header'
> & {
  header?: boolean | 'auto';
  dynamicTyping?: false;
};

/** Loader options accepted by the internal raw Arrow parser. */
export type CSVRawArrowParseOptions = LoaderOptions & {
  csv?: CSVRawArrowOptions;
};

/** Default batch size used when callers request automatic Arrow CSV batching. */
const DEFAULT_BATCH_SIZE = 4000;

/** Default CSV options for raw Arrow parsing. */
const DEFAULT_RAW_ARROW_CSV_OPTIONS: CSVRawArrowOptions = {
  ...CSVLoader.options.csv,
  header: false,
  dynamicTyping: false
};

/** Encodes string input so parseText can reuse the raw Arrow byte parser. */
const textEncoder = new TextEncoder();

/** Parses an ArrayBuffer into an Arrow table with Utf8 columns. */
export function parseRawArrowCSVTable(
  arrayBuffer: ArrayBuffer,
  options?: CSVRawArrowParseOptions
): Promise<ArrowTable> {
  const csvOptions = createRawArrowCSVOptions(options);
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

      if (csvOptions.skipEmptyLines) {
        const collapsedRow = row.flat().join('').trim();
        if (collapsedRow === '') {
          return;
        }
      }

      if (isFirstRow && !headerRow) {
        const isHeader =
          csvOptions.header === 'auto' ? isHeaderRow(row) : Boolean(csvOptions.header);
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

/** Parses batch input into Arrow batches with Utf8 columns. */
export function parseRawArrowCSVInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVRawArrowParseOptions
): AsyncIterable<ArrowTableBatch> {
  options = {...options};

  if (options.core?.batchSize === 'auto') {
    options.core.batchSize = DEFAULT_BATCH_SIZE;
  }

  const csvOptions = createRawArrowCSVOptions(options);

  if (typeof options.core?.batchSize !== 'number') {
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

      if (csvOptions.skipEmptyLines) {
        const collapsedRow = row.flat().join('').trim();
        if (collapsedRow === '') {
          return;
        }
      }

      if (isFirstRow && !headerRow) {
        const isHeader =
          csvOptions.header === 'auto' ? isHeaderRow(row) : Boolean(csvOptions.header);
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

      const batchSize = options?.core?.batchSize;
      if (typeof batchSize === 'number' && rowCountInCurrentBatch >= batchSize) {
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
  const arrowTable =
    parseRawArrowCSVBytes(arrayBuffer, csvOptions) ||
    (await parseRawArrowCSVText(new TextDecoder().decode(arrayBuffer), options));

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

/** Merges caller options with raw Arrow CSV defaults. */
function createRawArrowCSVOptions(options?: CSVRawArrowParseOptions): CSVRawArrowOptions {
  return {
    ...DEFAULT_RAW_ARROW_CSV_OPTIONS,
    ...options?.csv,
    header: options?.csv?.header ?? false,
    dynamicTyping: false
  };
}

/** Returns whether a Papa-parsed first row looks like a header row. */
function isHeaderRow(row: string[]): boolean {
  return row && row.every((value) => typeof value === 'string');
}

/** Creates a transformer that appends suffixes to repeated column names. */
function createDuplicateColumnTransformer(): (column: string) => string {
  const observedColumns = new Set<string>();
  return (columnName) => {
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
    fields: headerRow.map((columnName) => ({name: columnName, type: 'utf8', nullable: true})),
    metadata: {
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVArrowLoader'
    }
  };
}
