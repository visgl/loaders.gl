// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/loader-utils';
import type {LanceSource, LanceSourceLoaderOptions} from './lance-source-loader';
import {LanceFormat} from './lance-format';

// @ts-ignore __VERSION__ is injected during publication.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only entrypoint for loading a Lance dataset source asynchronously. */
export const LanceSourceLoader = {
  ...LanceFormat,
  dataType: null as unknown as LanceSource,
  batchType: null as never,
  name: 'LanceSourceLoader',
  id: 'lance-source',
  module: 'tables',
  version: VERSION,
  type: 'lance',
  fromUrl: true,
  fromBlob: true,
  options: {
    lance: {
      columns: undefined,
      limit: undefined,
      batchSize: undefined,
      version: undefined,
      columnTypes: undefined,
      columnNames: undefined
    }
  },
  defaultOptions: {
    lance: {
      columns: undefined!,
      limit: undefined!,
      batchSize: undefined!,
      version: undefined!,
      columnTypes: undefined!,
      columnNames: undefined!
    }
  },
  /** Identifies Lance files and dataset roots. */
  testURL: (url: string): boolean => /(?:\.lance|\.lance\/)(?:$|[?#/])/i.test(url),
  /** Loads the source constructor only when asynchronous loading needs it. */
  preload: async (): Promise<SourceLoader<LanceSource, LanceSourceLoaderOptions>> =>
    (await import('@loaders.gl/tables/lance/lance-source-loader')).LanceSourceLoader,
  /** Requires the parser-bearing source entrypoint for synchronous construction. */
  createDataSource(
    _data: string | Blob,
    _options: LanceSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): LanceSource {
    throw new Error(
      'LanceSourceLoader requires async load() or an explicit @loaders.gl/tables/lance/lance-source-loader import'
    );
  }
} as const satisfies SourceLoader<LanceSource, LanceSourceLoaderOptions>;
