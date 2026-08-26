// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SourceLoader} from '@loaders.gl/loader-utils';
import {DeltaFormat} from './delta-format';
import type {DeltaSourceOptions} from './delta-types';
import type {DeltaTableSource} from './delta-source';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Metadata-only Delta source loader options. */
export type DeltaSourceLoaderOptions = DeltaSourceOptions;

/** Loads the parser-bearing Delta source implementation on demand. */
async function preloadDeltaSourceLoader(): Promise<SourceLoader<DeltaTableSource>> {
  const {DeltaSourceLoaderWithParser} = await import('@loaders.gl/parquet/delta-source');
  return DeltaSourceLoaderWithParser;
}

/** Metadata-only Delta source loader; runtime code is available through `preload()`. */
export const DeltaSourceLoader = {
  ...DeltaFormat,
  dataType: null as unknown as DeltaTableSource,
  batchType: null as never,
  name: 'DeltaSourceLoader',
  version: VERSION,
  type: 'delta',
  fromUrl: true,
  fromBlob: true,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean =>
    /\/_delta_log\/(?:\d{20}\.json|_last_checkpoint)(?:$|[?#])/i.test(url),
  preload: preloadDeltaSourceLoader
} as const satisfies Omit<SourceLoader<DeltaTableSource>, 'createDataSource'> & {
  preload: () => Promise<SourceLoader<DeltaTableSource>>;
};
