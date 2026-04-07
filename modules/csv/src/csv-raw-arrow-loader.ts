// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {toArrayBufferIterator} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {AsyncQueue, ArrowTableBuilder} from '@loaders.gl/schema-utils';
import * as arrow from 'apache-arrow';

import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';
import Papa from './papaparse/papaparse';
import AsyncIteratorStreamer from './papaparse/async-iterator-streamer';

type CSVRawArrowOptions = Omit<
  NonNullable<CSVLoaderOptions['csv']>,
  'shape' | 'dynamicTyping' | 'header'
> & {
  header?: boolean | 'auto';
};

export type CSVRawArrowLoaderOptions = LoaderOptions & {
  csv?: CSVRawArrowOptions;
};

const DEFAULT_BATCH_SIZE = 4000;

export const CSVRawArrowLoader = {
  ...CSVLoader,

  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,

  options: {
    ...CSVLoader.options,
    csv: {
      ...CSVLoader.options.csv,
      header: false,
      dynamicTyping: false
    }
  },

  parse: async (arrayBuffer: ArrayBuffer, options?: CSVRawArrowLoaderOptions) =>
    parseTextToRawArrowCSVTable(new TextDecoder().decode(arrayBuffer), options),

  parseText: (text: string, options?: CSVRawArrowLoaderOptions) =>
    parseTextToRawArrowCSVTable(text, options),

  parseInBatches: parseRawArrowCSVInBatches
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, CSVRawArrowLoaderOptions>;

async function parseTextToRawArrowCSVTable(
  csvText: string,
  options?: CSVRawArrowLoaderOptions
): Promise<ArrowTable> {
  const csvOptions = createRawArrowCSVOptions(options);

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
        const isHeader = csvOptions.header === 'auto' ? isHeaderRow(row) : Boolean(csvOptions.header);
        if (isHeader) {
          headerRow = row.map(createDuplicateColumnTransformer());
          return;
        }
      }

      if (isFirstRow) {
        isFirstRow = false;
        if (!headerRow) {
          headerRow = generateHeader(csvOptions.columnPrefix, row.length);
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
    return arrowTableBuilder.finishTable();
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

function parseRawArrowCSVInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVRawArrowLoaderOptions
): AsyncIterable<ArrowTableBatch> {
  options = {...options};

  if (options.core?.batchSize === 'auto') {
    options.core.batchSize = DEFAULT_BATCH_SIZE;
  }

  const csvOptions = createRawArrowCSVOptions(options);
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
        const isHeader = csvOptions.header === 'auto' ? isHeaderRow(row) : Boolean(csvOptions.header);
        if (isHeader) {
          headerRow = row.map(createDuplicateColumnTransformer());
          return;
        }
      }

      if (isFirstRow) {
        isFirstRow = false;
        if (!headerRow) {
          headerRow = generateHeader(csvOptions.columnPrefix, row.length);
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

function createRawArrowCSVOptions(options?: CSVRawArrowLoaderOptions): CSVRawArrowOptions {
  return {
    ...CSVRawArrowLoader.options.csv,
    ...options?.csv,
    header: options?.csv?.header ?? false,
    dynamicTyping: false
  };
}

function isHeaderRow(row: string[]): boolean {
  return row && row.every((value) => typeof value === 'string');
}

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

function generateHeader(columnPrefix: string, count: number = 0): string[] {
  const headers: string[] = [];
  for (let columnIndex = 0; columnIndex < count; columnIndex++) {
    headers.push(`${columnPrefix}${columnIndex + 1}`);
  }
  return headers;
}

function createUtf8Schema(headerRow: string[]): Schema {
  return {
    fields: headerRow.map((columnName) => ({name: columnName, type: 'utf8', nullable: true})),
    metadata: {
      'loaders.gl#format': 'csv',
      'loaders.gl#loader': 'CSVRawArrowLoader'
    }
  };
}

