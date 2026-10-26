// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {JSONTableLoaderWithParser} from '../json-table-loader';
import {NDJSONLoaderWithParser} from '../ndjson-loader';

/** Selects the requested JSON-family parser in the shared worker bundle. */
function selectLoader(options: Record<string, unknown>): LoaderWithParser {
  let loader: LoaderWithParser;
  switch (options._workerLoaderId) {
    case undefined:
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
      for await (const batch of loader.parseInBatches!(input, parserOptions, context)) {
        if (batch.batchType === 'data') {
          completed += batch.length;
          context?.reportProgress?.({phase: 'decode', completed, unit: 'rows'});
        }
        yield batch;
      }
    }
  };
}

createLoaderWorker(JSONTableLoaderWithParser, selectLoader);
