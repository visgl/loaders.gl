// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import type {Potree2Source} from './potree2-source';

/** Bounded Potree 2.0 range-source options. */
export type Potree2SourceOptions = DataSourceOptions & {
  /** Native-coordinate octree traversal and resource limits. */
  potree2?: {
    /** Maximum metadata document bytes; default 1 MiB. */
    maxMetadataBytes?: number;
    /** Aggregate hierarchy page bytes; default 16 MiB. */
    maxHierarchyBytes?: number;
    /** Compressed bytes and declared decoded bytes per tile; default 64 MiB each. */
    maxPointBytes?: number;
    /** Maximum discovered hierarchy entries; default 100000. */
    maxNodes?: number;
    /** Cancellation for the source lifetime. */
    signal?: AbortSignal;
  };
};

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Imports the optional Potree 2.0 traversal implementation. */
async function preload() {
  const {Potree2SourceLoaderWithParser} = await import('@loaders.gl/potree/potree2-source-loader');
  return Potree2SourceLoaderWithParser;
}

/** Metadata-only source loader for three-file Potree 2.0 datasets. */
export const Potree2SourceLoader = {
  name: 'Potree 2.0',
  id: 'potree2',
  module: 'potree',
  version: VERSION,
  dataType: null as unknown as Potree2Source,
  batchType: null as never,
  type: 'potree',
  fromUrl: true,
  fromBlob: false,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  options: {potree2: {}},
  defaultOptions: {potree2: {}},
  testURL: (url: string) => /\/metadata\.json(?:[?#]|$)/.test(url),
  preload,
  /** Direct construction requires a preloaded source implementation. */
  createDataSource(
    _input: string | Blob,
    _options: Potree2SourceOptions = {},
    _coreApi?: CoreAPI
  ): Potree2Source {
    throw new Error(
      'Potree2SourceLoader requires preload() or @loaders.gl/potree/potree2-source-loader'
    );
  }
} as const satisfies SourceLoader<Potree2Source>;
