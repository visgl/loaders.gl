// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Table as ArrowTable, type RecordBatch as ArrowTableBatch} from 'apache-arrow';
import {JSONTableSource, type JSONTableSourceOptions} from './json-table-source';
import {getLoaderLog} from '@loaders.gl/core/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/core/schema';
import {convertTable} from '@loaders.gl/core/schema-utils';
import {
  parseDirectJSONArrowInBatches,
  parseDirectJSONArrowText
} from './lib/parsers/parse-direct-json-arrow';

import {
  serializeJSONWorkerOptions,
  serializeJSONWorkerBatch,
  deserializeJSONWorkerResult
} from './lib/json-worker-transport';
import type {CoreAPI, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {getJSONRowTable} from './lib/parsers/convert-json-to-arrow';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {normalizeJSONArrowSchema} from './lib/parsers/convert-row-table-to-arrow';
import type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader-types';
import {
  JSONTableLoaderDefinition,
  type JSONTableLoaderOptions
} from './json-table-loader-definition';

/**
 * Parser-bearing loader for JSON documents that must resolve to loaders.gl table output.
 */
export const JSONTableLoaderWithParser = {
  ...JSONTableLoaderDefinition,
  serializeWorkerOptions: serializeJSONWorkerOptions,
  serializeWorkerResult: serializeJSONWorkerBatch,
  deserializeWorkerResult: deserializeJSONWorkerResult,
  serializeWorkerBatch: serializeJSONWorkerBatch,
  deserializeWorkerBatch: deserializeJSONWorkerResult,
  parse,
  parseTextSync,
  parseInBatches,
  createDataSourceSync: (data: string | Blob, options: JSONTableSourceOptions, coreApi?: CoreAPI) =>
    new JSONTableSource(data, options, coreApi)
} as const satisfies LoaderWithParser<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONTableLoaderOptions,
  JSONTableSource
>;

/**
 * Parses UTF-8 JSON bytes into row tables or native Arrow tables.
 *
 * @param arrayBuffer - UTF-8 encoded JSON payload.
 * @param options - JSON table loader options.
 * @returns Parsed table output.
 */
async function parse(arrayBuffer: ArrayBuffer, options?: JSONTableLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/**
 * Parses JSON text into row tables or native Arrow tables.
 *
 * @param text - JSON text to parse.
 * @param options - JSON table loader options.
 * @returns Parsed table output.
 * @throws If the payload does not contain row-array data.
 */
function parseTextSync(text: string, options?: JSONTableLoaderOptions) {
  const jsonOptions = normalizeJSONTableLoaderOptions(options);
  validateJSONTableArrowOptions(jsonOptions);

  const json = jsonOptions.json;
  if (json?.shape === 'arrow') {
    return parseDirectJSONArrowText(
      text,
      json.schema ? normalizeJSONArrowSchema(json.schema) : undefined,
      {
        arrowConversion: json.arrowConversion,
        log: getLoaderLog(jsonOptions),
        jsonpaths: json.jsonpaths,
        schemaInference: json.schemaInference,
        batchSize: jsonOptions.core?.batchSize
      }
    );
  }
  const table = getJSONRowTable(parseJSONSync(text, getRawJSONOptions(jsonOptions)));
  if (!table) {
    throw new Error(
      'JSONTableLoader: expected a JSON row array or an object containing a JSON row array'
    );
  }
  return json?.shape === 'array-row-table'
    ? convertTable(table, 'array-row-table')
    : convertTable(table, 'object-row-table');
}

/**
 * Parses streamed JSON row arrays into row-table batches or native Arrow record batches.
 *
 * @param asyncIterator - UTF-8 JSON byte chunks.
 * @param options - JSON table loader options.
 * @returns Table batches, native Arrow record batches, or JSON parser envelopes, depending on the output shape.
 */
function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONTableLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = normalizeJSONTableLoaderOptions(options);
  validateJSONTableArrowOptions(jsonOptions);
  const json = jsonOptions.json;
  if (json?.shape === 'arrow') {
    return parseDirectJSONArrowInBatches(
      asyncIterator,
      json.schema ? normalizeJSONArrowSchema(json.schema) : undefined,
      json.jsonpaths,
      jsonOptions.core?.batchSize ?? 'auto',
      {arrowConversion: json.arrowConversion, log: getLoaderLog(jsonOptions)},
      undefined,
      json.schemaInference
    );
  }

  return parseJSONInBatches(asyncIterator, getRowBatchJSONOptions(jsonOptions));
}

/**
 * Applies JSON table loader default options for direct parser calls.
 *
 * @param options - User-supplied JSON table loader options.
 * @returns Options merged with loader defaults.
 */
function normalizeJSONTableLoaderOptions(options?: JSONTableLoaderOptions): JSONTableLoaderOptions {
  return {
    ...options,
    json: {
      ...JSONTableLoaderWithParser.options.json,
      ...options?.json
    }
  };
}

/**
 * Requests raw JSON from the shared document parser before table conversion.
 *
 * @param options - Normalized JSON table loader options.
 * @returns JSON document parser options that preserve the raw parsed payload.
 */
function getRawJSONOptions(options: JSONTableLoaderOptions): JSONLoaderOptions {
  return {
    ...options,
    json: {
      shape: undefined,
      table: false,
      jsonpaths: options.json?.jsonpaths
    }
  };
}

/**
 * Requests row batches from the shared streaming JSON parser before optional Arrow conversion.
 *
 * @param options - Normalized JSON table loader options.
 * @returns JSON document parser options that emit row-table batches.
 */
function getRowBatchJSONOptions(options: JSONTableLoaderOptions): JSONLoaderOptions {
  return {
    ...options,
    core: {
      ...options.core,
      metadata: options.json?.shape === 'arrow' || options.core?.metadata
    },
    json: {
      shape: options.json?.shape === 'array-row-table' ? 'array-row-table' : 'object-row-table',
      table: true,
      jsonpaths: options.json?.jsonpaths
    }
  };
}

/**
 * Ensures Arrow-only options are used only with `shape: 'arrow'`.
 *
 * @param options - Normalized JSON table loader options.
 * @throws If Arrow conversion options are supplied without `json.shape: 'arrow'`.
 */
function validateJSONTableArrowOptions(options: JSONTableLoaderOptions): void {
  if (
    options.json?.shape &&
    !['arrow', 'object-row-table', 'array-row-table'].includes(options.json.shape)
  ) {
    throw new Error('This loader uses shape: "arrow" for native Arrow output');
  }
  const hasArrowOnlyOptions = Boolean(options.json?.schema || options.json?.arrowConversion);
  if (hasArrowOnlyOptions && options.json?.shape !== 'arrow') {
    throw new Error(
      'JSONTableLoader: json.schema and json.arrowConversion require json.shape to be "arrow"'
    );
  }
}

export type {JSONTableLoaderOptions} from './json-table-loader-definition';
