// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {JSONTableLoaderDefinition} from './json-table-loader-definition';
import {loadJSONWorker} from './load-json-worker';
import type {JSONTableSource, JSONTableSourceOptions} from './json-table-source';
import type {CoreAPI} from '@loaders.gl/core/loader-utils';

export type {JSONTableLoaderOptions} from './json-table-loader-definition';

/**
 * Preloads the parser-bearing JSON table loader implementation.
 *
 * @returns The parser-bearing `JSONTableLoaderWithParser` implementation.
 */
async function preload() {
  const {JSONTableLoaderWithParser} = await import('@loaders.gl/tables/json');
  return JSONTableLoaderWithParser;
}

/** Metadata-only JSONTable loader with an on-demand browser worker. */
export const JSONTableLoader = {
  ...JSONTableLoaderDefinition,
  loadWorker: loadJSONWorker,
  preload,
  createDataSourceSync(
    _data: string | Blob,
    _options: JSONTableSourceOptions,
    _coreApi?: CoreAPI
  ): JSONTableSource {
    throw new Error('Call preload(JSONTableLoader) before creating a source synchronously.');
  }
} as const;
