// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import {TarFormat} from './tar-format';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Decoded regular files keyed by archive path. */
export type TarFileMap = Record<string, ArrayBuffer>;

/** Limits for uncompressed TAR archives. */
export type TarLoaderOptions = LoaderOptions & {
  tar?: {
    /** Maximum number of entries; defaults to 100000. */
    maxEntries?: number;
    /** Maximum total retained file bytes; defaults to 64 MiB. */
    maxTotalDecodedBytes?: number;
  };
};

/** Metadata-only TAR loader. */
export const TarLoader = {
  ...TarFormat,
  version: VERSION,
  dataType: null as unknown as TarFileMap,
  batchType: null as unknown as never,
  options: {tar: {maxEntries: 100000, maxTotalDecodedBytes: 64 * 1024 * 1024}},
  /** Loads the parser through the installed package subpath. */
  async preload() {
    const {TarLoaderWithParser} = await import('@loaders.gl/archives/tar-loader');
    return TarLoaderWithParser;
  }
} as const satisfies Loader<TarFileMap, never, TarLoaderOptions>;
