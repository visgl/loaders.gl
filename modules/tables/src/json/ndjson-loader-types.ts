// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NDJSONLoaderDefinition} from './ndjson-loader-definition';
import {loadJSONWorker} from './load-json-worker';
import type {NDJSONTableSource, NDJSONSourceOptions} from './ndjson-source';
import type {CoreAPI} from '@loaders.gl/core/loader-utils';

export type {NDJSONShape, NDJSONLoaderOptions} from './ndjson-loader-definition';

/** Preloads the parser-bearing NDJSON loader implementation. */
async function preload() {
  const {NDJSONLoaderWithParser} = await import('@loaders.gl/tables/json/bundled');
  return NDJSONLoaderWithParser;
}

/** Metadata-only NDJSON loader with an on-demand browser worker. */
export const NDJSONLoader = {
  ...NDJSONLoaderDefinition,
  loadWorker: loadJSONWorker,
  preload,
  createDataSourceSync(
    _data: string | Blob,
    _options: NDJSONSourceOptions,
    _coreApi?: CoreAPI
  ): NDJSONTableSource {
    throw new Error('Call preload(NDJSONLoader) before creating a source synchronously.');
  }
} as const;
