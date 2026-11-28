// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {JSONLoaderWithParser} from './json/json-loader';
import {JSONTableLoaderWithParser} from './json/json-table-loader';
import type {JSONTableLoaderOptions} from './json/json-table-loader-types';
import {parseJSONRowOffsetsInBatches} from './json/lib/json-row-offset-transport';
import {NDJSONLoaderWithParser} from './json/ndjson-loader';

/** Selects the requested JSON-family parser in the shared worker bundle. */
function selectLoader(options: Record<string, unknown>): LoaderWithParser {
  let loader: LoaderWithParser;
  switch (options._workerLoaderId) {
    case undefined:
    case 'json':
      loader = JSONLoaderWithParser;
      break;
    case 'json-table':
      loader = JSONTableLoaderWithParser;
      break;
    case 'ndjson':
      loader = NDJSONLoaderWithParser;
      break;
    default:
      throw new Error(`JSON worker does not support loader ${options._workerLoaderId}`);
  }
  return {
    ...loader,
    /** Reports decoded rows while the selected parser retains its incremental state. */
    async *parseInBatches(input, parserOptions, context) {
      let completed = 0;
      context?.reportProgress?.({phase: 'decode', completed, unit: 'rows'});
      const batches =
        loader.id === 'json-table' && canUseJSONRowOffsets(parserOptions)
          ? parseJSONRowOffsetsInBatches(input, parserOptions?.core?.batchSize)
          : loader.parseInBatches!(input, parserOptions, context);
      for await (const batch of batches) {
        const rowCount = batch.batchType === 'data' ? batch.length : batch.numRows;
        if (typeof rowCount === 'number') {
          completed += rowCount;
          context?.reportProgress?.({phase: 'decode', completed, unit: 'rows'});
        }
        yield batch;
      }
    }
  };
}

/** Limits the offset path to object-row streams with no container metadata or nested paths. */
function canUseJSONRowOffsets(options?: JSONTableLoaderOptions): boolean {
  const json = options?.json;
  return (
    json?.workerRowOffsets === true &&
    json.shape === 'object-row-table' &&
    !options?.core?.metadata &&
    !json.schema &&
    !json.arrowConversion &&
    !json.jsonpaths?.some(path => path !== '$')
  );
}

createLoaderWorker(JSONLoaderWithParser, selectLoader);
