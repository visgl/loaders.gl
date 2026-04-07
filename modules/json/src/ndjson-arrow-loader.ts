// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  DataType,
  Field,
  ObjectRowTable,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';
import {NDJSONLoader} from './ndjson-loader';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';

/**
 * Options for parsing NDJSON input into Apache Arrow tables.
 *
 * The Arrow variant supports the same core loader options as `NDJSONLoader`,
 * including streaming batch options such as `batchSize`.
 */
export type NDJSONArrowLoaderOptions = LoaderOptions;

/**
 * Loader for NDJSON text that returns Apache Arrow tables.
 *
 * `NDJSONArrowLoader` supports both full-file parsing and streaming batch
 * parsing. Streaming batches are yielded as `ArrowTableBatch` objects.
 */
export const NDJSONArrowLoader = {
  ...NDJSONLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,

  parse: async (arrayBuffer: ArrayBuffer, options?: NDJSONArrowLoaderOptions) =>
    parseNDJSONArrowText(new TextDecoder().decode(arrayBuffer), options),

  parseTextSync: parseNDJSONArrowText,

  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: NDJSONArrowLoaderOptions
  ) => makeNDJSONArrowBatchIterator(parseNDJSONInBatches(asyncIterator, options))
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, NDJSONArrowLoaderOptions>;

/**
 * Parses NDJSON text and converts the parsed row table to Apache Arrow.
 *
 * @param text - NDJSON text to parse.
 * @param options - NDJSON parsing options.
 * @returns A loaders.gl Arrow table wrapping an Apache Arrow table.
 */
function parseNDJSONArrowText(text: string, options?: NDJSONArrowLoaderOptions): ArrowTable {
  const table = parseNDJSONSync(text);
  return convertRowTableToArrowTable(table);
}

/**
 * Converts NDJSON row batches to Apache Arrow table batches.
 *
 * @param batches - Row-table batches emitted by the classic NDJSON parser.
 * @returns Async iterable of Arrow table batches with matching batch metadata.
 */
async function* makeNDJSONArrowBatchIterator(
  batches: AsyncIterable<TableBatch>
): AsyncIterable<ArrowTableBatch> {
  for await (const batch of batches) {
    const arrowTable = convertRowTableToArrowTable(batch as ObjectRowTable | ArrayRowTable);
    yield {
      ...batch,
      shape: 'arrow-table',
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: arrowTable.data.numRows
    };
  }
}

/**
 * Converts an NDJSON row table or batch to an Apache Arrow table.
 *
 * @param table - Object-row or array-row table produced by the classic NDJSON parser.
 * @returns A loaders.gl Arrow table containing the same row values.
 */
function convertRowTableToArrowTable(table: ObjectRowTable | ArrayRowTable): ArrowTable {
  const schema = deducePrimitiveAwareSchema(table);
  const arrowTableBuilder = new ArrowTableBuilder(schema);

  switch (table.shape) {
    case 'array-row-table':
      for (const row of table.data) {
        arrowTableBuilder.addArrayRow(row);
      }
      break;
    case 'object-row-table':
      for (const row of table.data) {
        arrowTableBuilder.addObjectRow(row);
      }
      break;
    default:
      throw new Error('invalid row table shape');
  }

  return arrowTableBuilder.finishTable();
}

/**
 * Deduces a schema that handles primitive numbers and booleans in NDJSON rows.
 *
 * @param table - Row table produced from parsed NDJSON objects.
 * @returns A schema with primitive values promoted from `null` to Arrow-compatible types.
 */
function deducePrimitiveAwareSchema(table: ObjectRowTable | ArrayRowTable): Schema {
  const fields = table.schema!.fields.map((field, fieldIndex): Field => {
    if (field.type !== 'null') {
      return field;
    }

    for (const row of table.data) {
      const value = table.shape === 'array-row-table' ? row[fieldIndex] : row[field.name];
      const type = getDataTypeFromPrimitive(value);
      if (type !== 'null') {
        return {...field, type};
      }
    }

    return field;
  });

  return {...table.schema!, fields};
}

/**
 * Deduces a loaders.gl data type from primitive NDJSON property values.
 *
 * @param value - NDJSON property value.
 * @returns The matching loaders.gl data type, or `null` for unsupported values.
 */
function getDataTypeFromPrimitive(value: unknown): DataType {
  switch (typeof value) {
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'string':
      return 'utf8';
    default:
      return value instanceof Date ? 'date-millisecond' : 'null';
  }
}
