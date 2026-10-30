// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, SourceLoader} from '@loaders.gl/core/loader-utils';
import type {ORCSource} from './orc-source-loader';
import {ORCFormat} from './orc-format';
import type {ORCSourceOptions} from './orc-source-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only ORC source loader options. */
export type ORCSourceLoaderOptions = ORCSourceOptions;

/** Loads the parser-bearing ORC source implementation on demand. */
async function preloadORCSourceLoader() {
  const {ORCSourceLoaderWithParser} = await import('@loaders.gl/tables/orc-source-loader');
  return ORCSourceLoaderWithParser;
}

/** Metadata-only ORC source loader; parser code is loaded through `preload()`. */
export const ORCSourceLoader = {
  /** Runtime source type returned by async load(). */
  dataType: null as unknown as ORCSource,
  /** Sources are constructed rather than emitted as parse batches. */
  batchType: null as never,
  ...ORCFormat,
  name: 'ORCSourceLoader',
  version: VERSION,
  type: 'orc-source',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\.orc(?:$|[?#])/i.test(url),
  preload: preloadORCSourceLoader,
  /** Requires the parser-bearing source entrypoint for synchronous construction. */
  createDataSource(
    _data: string | Blob,
    _options: ORCSourceLoaderOptions,
    _coreApi?: CoreAPI
  ): ORCSource {
    throw new Error(
      'ORCSourceLoader requires async load() or an explicit @loaders.gl/tables/orc-source-loader import'
    );
  }
} as const satisfies SourceLoader<ORCSource, ORCSourceLoaderOptions>;
