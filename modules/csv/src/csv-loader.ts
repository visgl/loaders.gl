// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  Schema,
  ArrayRowTable,
  ColumnarTable,
  ColumnarTableBatch,
  ObjectRowTable,
  TableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';

import {toArrayBufferIterator} from '@loaders.gl/loader-utils';
import {
  AsyncQueue,
  TableBatchBuilder,
  convertToArrayRow,
  convertToObjectRow
} from '@loaders.gl/schema-utils';
import Papa from './papaparse/papaparse';
import AsyncIteratorStreamer from './papaparse/async-iterator-streamer';
import {CSVFormat} from './csv-format';
import {DEFAULT_CSV_OPTIONS, DEFAULT_CSV_SHAPE} from './lib/csv-default-options';
import {
  parseCSVArrayBufferAsArrow,
  parseCSVInArrowBatches,
  parseCSVTextAsArrow
} from './csv-arrow-loader';
import {
  deduceCSVSchemaFromRows,
  detectGeometryColumns,
  MAX_GEOMETRY_SNIFF_ROWS,
  normalizeGeometryArrayRow,
  normalizeGeometryObjectRow,
  shouldFinalizeGeometryDetection
} from './lib/csv-geometry';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for parsing CSV input into row tables or Arrow tables. */
export type CSVLoaderOptions = LoaderOptions & {
  csv?: {
    /** Selects row-table output or Arrow columnar output. */
    shape?: 'array-row-table' | 'object-row-table' | 'columnar-table' | 'arrow-table';
    /** Optimizes memory usage but increases parsing time. */
    optimizeMemoryUsage?: boolean;
    /** Prefix for generated column names when headers are absent. */
    columnPrefix?: string;
    /** Controls whether the first row is treated as headers. */
    header?: boolean | 'auto';

    // CSV options (papaparse)
    // delimiter: auto
    // newline: auto
    /** Character used to quote CSV fields. */
    quoteChar?: string;
    /** Character used to escape quoted CSV fields. */
    escapeChar?: string;
    /** Converts numbers and booleans and, for Arrow output, can infer dates. */
    dynamicTyping?: boolean;
    /** Enables comment line parsing. */
    comments?: boolean;
    /** Skips empty rows. */
    skipEmptyLines?: boolean | 'greedy';
    // transform: null?
    /** Candidate delimiters for automatic detection. */
    delimitersToGuess?: string[];
    detectGeometryColumns?: boolean;
    // fastMode: auto
  };
};

/** Loader for CSV and other delimiter-separated tabular text formats. */
export const CSVLoader = {
  ...CSVFormat,

  dataType: null as unknown as ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  batchType: null as unknown as TableBatch | ColumnarTableBatch | ArrowTableBatch,
  version: VERSION,
  parse: async (arrayBuffer: ArrayBuffer, options?: CSVLoaderOptions) =>
    options?.csv?.shape === 'arrow-table'
      ? parseCSVArrayBufferAsArrow(arrayBuffer, options)
      : parseCSV(new TextDecoder().decode(arrayBuffer), options),
  parseText: (text: string, options?: CSVLoaderOptions) =>
    options?.csv?.shape === 'arrow-table'
      ? parseCSVTextAsArrow(text, options)
      : parseCSV(text, options),
  parseInBatches: (asyncIterator, options?: CSVLoaderOptions) =>
    options?.csv?.shape === 'arrow-table'
      ? parseCSVInArrowBatches(asyncIterator, options)
      : parseCSVInBatches(asyncIterator, options),
  // @ts-ignore
  // testText: null,
  options: {
    csv: DEFAULT_CSV_OPTIONS
  }
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrayRowTable | ColumnarTable | ArrowTable,
  TableBatch | ColumnarTableBatch | ArrowTableBatch,
  CSVLoaderOptions
>;

async function parseCSV(
  csvText: string,
  options?: CSVLoaderOptions
): Promise<ObjectRowTable | ArrayRowTable> {
  // Apps can call the parse method directly, so we apply default options here
  const csvOptions = {...CSVLoader.options.csv, ...options?.csv};

  const firstRow = readFirstRow(csvText);
  const header: boolean =
    csvOptions.header === 'auto' ? isHeaderRow(firstRow) : Boolean(csvOptions.header);

  const parseWithHeader = header;

  const papaparseConfig = {
    // dynamicTyping: true,
    ...csvOptions,
    header: parseWithHeader,
    download: false, // We handle loading, no need for papaparse to do it for us
    transformHeader: parseWithHeader ? duplicateColumnTransformer() : undefined,
    error: e => {
      throw new Error(e);
    }
  };

  const result = Papa.parse(csvText, papaparseConfig);
  const rows = result.data as any[];

  const headerRow = result.meta.fields || generateHeader(csvOptions.columnPrefix, firstRow.length);

  const shape = csvOptions.shape || DEFAULT_CSV_SHAPE;
  let table: ArrayRowTable | ObjectRowTable;
  switch (shape) {
    case 'object-row-table':
      table = {
        shape: 'object-row-table',
        data: rows.map(row => (Array.isArray(row) ? convertToObjectRow(row, headerRow) : row))
      };
      break;
    case 'array-row-table':
      table = {
        shape: 'array-row-table',
        data: rows.map(row => (Array.isArray(row) ? row : convertToArrayRow(row, headerRow)))
      };
      break;
    default:
      throw new Error(shape);
  }
  const detectedGeometryColumns = csvOptions.detectGeometryColumns
    ? detectGeometryColumns(
        headerRow,
        rows.map(row => (Array.isArray(row) ? row : convertToArrayRow(row, headerRow)))
      )
    : [];

  if (detectedGeometryColumns.length > 0) {
    table =
      table.shape === 'array-row-table'
        ? {
            ...table,
            data: table.data.map(row => normalizeGeometryArrayRow(row, detectedGeometryColumns))
          }
        : {
            ...table,
            data: table.data.map(row => normalizeGeometryObjectRow(row, detectedGeometryColumns))
          };
  }

  table.schema = deduceCSVSchemaFromRows(table.data, headerRow, detectedGeometryColumns);
  return table;
}

// TODO - support batch size 0 = no batching/single batch?
function parseCSVInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: CSVLoaderOptions
): AsyncIterable<TableBatch> {
  // Papaparse does not support standard batch size handling
  // TODO - investigate papaparse chunks mode
  options = {...options};
  if (options?.core?.batchSize === 'auto') {
    options.core.batchSize = 4000;
  }

  // Apps can call the parse method directly, we so apply default options here
  const csvOptions = {...CSVLoader.options.csv, ...options?.csv};

  const asyncQueue = new AsyncQueue<TableBatch>();

  let isFirstRow: boolean = true;
  let headerRow: string[] | null = null;
  let tableBatchBuilder: TableBatchBuilder | null = null;
  let schema: Schema | null = null;
  let sniffedRows: unknown[][] = [];
  let detectedGeometryColumns = [] as ReturnType<typeof detectGeometryColumns>;
  let geometryDetectionFinalized = !csvOptions.detectGeometryColumns;

  const config = {
    // dynamicTyping: true, // Convert numbers and boolean values in rows from strings,
    ...csvOptions,
    header: false, // Unfortunately, header detection is not automatic and does not infer shapes
    download: false, // We handle loading, no need for papaparse to do it for us
    // chunkSize is set to 5MB explicitly (same as Papaparse default) due to a bug where the
    // streaming parser gets stuck if skipEmptyLines and a step callback are both supplied.
    // See https://github.com/mholt/PapaParse/issues/465
    chunkSize: 1024 * 1024 * 5,
    // skipEmptyLines is set to a boolean value if supplied. Greedy is set to true
    // skipEmptyLines is handled manually given two bugs where the streaming parser gets stuck if
    // both of the skipEmptyLines and step callback options are provided:
    // - true doesn't work unless chunkSize is set: https://github.com/mholt/PapaParse/issues/465
    // - greedy doesn't work: https://github.com/mholt/PapaParse/issues/825
    skipEmptyLines: false,

    // step is called on every row
    // eslint-disable-next-line complexity, max-statements
    step(results) {
      let row = results.data;

      if (csvOptions.skipEmptyLines === 'greedy') {
        // Manually reject lines that are empty
        const collapsedRow = row.flat().join('').trim();
        if (collapsedRow === '') {
          return;
        }
      } else if (csvOptions.skipEmptyLines === true) {
        row = normalizePapaStreamingRow(row);
        if (row.length === 1 && row[0] === null) {
          return;
        }
      }
      const bytesUsed = results.meta.cursor;

      // Check if we need to save a header row
      if (isFirstRow && !headerRow) {
        // Auto detects or can be forced with csvOptions.header
        const header = csvOptions.header === 'auto' ? isHeaderRow(row) : Boolean(csvOptions.header);
        if (header) {
          headerRow = row.map(duplicateColumnTransformer());
          return;
        }
      }

      // If first data row, we can deduce the schema
      if (isFirstRow) {
        if (!headerRow) {
          headerRow = generateHeader(csvOptions.columnPrefix, row.length);
        }
      }

      if (csvOptions.optimizeMemoryUsage) {
        // A workaround to allocate new strings and don't retain pointers to original strings.
        // https://bugs.chromium.org/p/v8/issues/detail?id=2869
        row = JSON.parse(JSON.stringify(row));
      }

      const shape = getBatchShape();

      if (!geometryDetectionFinalized && headerRow) {
        sniffedRows.push(row);
        geometryDetectionFinalized = shouldFinalizeGeometryDetection(
          headerRow,
          sniffedRows,
          MAX_GEOMETRY_SNIFF_ROWS
        );
        if (geometryDetectionFinalized) {
          detectedGeometryColumns = detectGeometryColumns(headerRow, sniffedRows);
          const normalizedSniffedRows = sniffedRows.map(sniffedRow =>
            normalizeGeometryArrayRow(sniffedRow, detectedGeometryColumns)
          );
          schema = deduceCSVSchemaFromRows(
            normalizedSniffedRows,
            headerRow,
            detectedGeometryColumns
          );
          isFirstRow = false;
          for (const normalizedSniffedRow of normalizedSniffedRows) {
            addCSVBatchRow(normalizedSniffedRow, shape, bytesUsed);
          }
          sniffedRows = [];
        }
        return;
      }

      if (isFirstRow) {
        if (!headerRow) {
          return;
        }
        schema = deduceCSVSchemaFromRows(
          [normalizeGeometryArrayRow(row, detectedGeometryColumns)],
          headerRow,
          detectedGeometryColumns
        );
        isFirstRow = false;
      }

      const normalizedRow = normalizeGeometryArrayRow(row, detectedGeometryColumns);
      addCSVBatchRow(normalizedRow, shape, bytesUsed);
    },

    // complete is called when all rows have been read
    complete(results) {
      try {
        if (!geometryDetectionFinalized && headerRow) {
          detectedGeometryColumns = detectGeometryColumns(headerRow, sniffedRows);
          const normalizedSniffedRows = sniffedRows.map(row =>
            normalizeGeometryArrayRow(row, detectedGeometryColumns)
          );
          schema = deduceCSVSchemaFromRows(
            normalizedSniffedRows,
            headerRow,
            detectedGeometryColumns
          );
          const shape = getBatchShape();
          tableBatchBuilder =
            tableBatchBuilder ||
            new TableBatchBuilder(schema, {
              ...(options?.core || {}),
              shape
            });
          for (const normalizedSniffedRow of normalizedSniffedRows) {
            const batchRow =
              shape === 'object-row-table' && normalizedSniffedRow.length > headerRow.length
                ? convertToPapaObjectRow(normalizedSniffedRow, headerRow)
                : normalizedSniffedRow;
            tableBatchBuilder.addRow(batchRow);
          }
        }
        const bytesUsed = results.meta.cursor;
        // Ensure any final (partial) batch gets emitted
        const batch = tableBatchBuilder && tableBatchBuilder.getFinalBatch({bytesUsed});
        if (batch) {
          asyncQueue.enqueue(batch);
        }
      } catch (error) {
        asyncQueue.enqueue(error as Error);
      }

      asyncQueue.close();
    }
  };

  Papa.parse(toArrayBufferIterator(asyncIterator), config, AsyncIteratorStreamer);

  // TODO - Does it matter if we return asyncIterable or asyncIterator
  // return asyncQueue[Symbol.asyncIterator]();
  return asyncQueue;

  function addCSVBatchRow(rowToAdd: unknown[], shape: CSVBatchShape, bytesUsed: number): void {
    let batchRow: unknown[] | {[columnName: string]: unknown} = rowToAdd;
    if (shape === 'object-row-table' && headerRow && rowToAdd.length > headerRow.length) {
      batchRow = convertToPapaObjectRow(rowToAdd, headerRow);
    }

    tableBatchBuilder =
      tableBatchBuilder ||
      new TableBatchBuilder(schema!, {
        ...(options?.core || {}),
        shape
      });

    try {
      tableBatchBuilder.addRow(batchRow);
      const batch = tableBatchBuilder && tableBatchBuilder.getFullBatch({bytesUsed});
      if (batch) {
        asyncQueue.enqueue(batch);
      }
    } catch (error) {
      asyncQueue.enqueue(error as Error);
    }
  }

  function getBatchShape(): CSVBatchShape {
    const deprecatedShape = (options as {shape?: CSVBatchShape} | undefined)?.shape;
    const shape = deprecatedShape || csvOptions.shape || DEFAULT_CSV_SHAPE;
    switch (shape) {
      case 'array-row-table':
      case 'columnar-table':
        return shape;
      default:
        return DEFAULT_CSV_SHAPE;
    }
  }
}

type CSVBatchShape = 'array-row-table' | 'object-row-table' | 'columnar-table';

/**
 * Checks if a certain row is a header row
 * @param row the row to check
 * @returns true if the row looks like a header
 */
function isHeaderRow(row: string[]): boolean {
  return row && row.every(value => typeof value === 'string');
}

/**
 * Reads, parses, and returns the first row of a CSV text
 * @param csvText the csv text to parse
 * @returns the first row
 */
function readFirstRow(csvText: string): any[] {
  const result = Papa.parse(csvText, {
    dynamicTyping: true,
    preview: 1
  });
  return result.data[0];
}

/**
 * Creates a transformer that renames duplicate columns. This is needed as Papaparse doesn't handle
 * duplicate header columns and would use the latest occurrence by default.
 * See the header option in https://www.papaparse.com/docs#config
 * @returns a transform function that returns sanitized names for duplicate fields
 */
function duplicateColumnTransformer(): (column: string) => string {
  const observedColumns = new Set<string>();
  return col => {
    let colName = col;
    let counter = 1;
    while (observedColumns.has(colName)) {
      colName = `${col}.${counter}`;
      counter++;
    }
    observedColumns.add(colName);
    return colName;
  };
}

/**
 * Generates the header of a CSV given a prefix and a column count
 * @param columnPrefix the columnPrefix to use
 * @param count the count of column names to generate
 * @returns an array of column names
 */
function generateHeader(columnPrefix: string, count: number = 0): string[] {
  const headers: string[] = [];
  for (let i = 0; i < count; i++) {
    headers.push(`${columnPrefix}${i + 1}`);
  }
  return headers;
}

function normalizePapaStreamingRow(row: unknown[]): unknown[] {
  return row.map(value => (Array.isArray(value) && value.length === 0 ? null : value));
}

function convertToPapaObjectRow(
  row: unknown[],
  headerRow: string[]
): {[columnName: string]: unknown} {
  const objectRow = convertToObjectRow(row, headerRow);
  const parsedExtra = row.slice(headerRow.length);
  if (parsedExtra.length > 0) {
    objectRow.__parsed_extra = parsedExtra;
  }
  return objectRow;
}
