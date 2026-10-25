// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ZipArchiveOptions} from './zip-archive-types';
import {ZipFormat} from './zip-format';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Complete decoded files, excluding directory entries. */
export type ZipFileMap = Record<string, ArrayBuffer>;

/** Native ZIP validation and complete file-map allocation controls. */
export type ZipLoaderOptions = LoaderOptions & {
  /** Container limits and cancellation, shared with openZipArchive. */
  zip?: ZipArchiveOptions & {
    /** Maximum sum of decoded file bytes retained in the map; default 64 MiB. */
    readonly maxTotalDecodedBytes?: bigint;
  };
};

/** Metadata-only ZIP loader; complete reads validate sizes and CRCs. */
export const ZipLoader = {
  ...ZipFormat,
  version: VERSION,
  dataType: null as unknown as ZipFileMap,
  batchType: null as unknown as never,
  options: {zip: {maxTotalDecodedBytes: 64n * 1024n * 1024n}},
  /** Loads the parser implementation through its installed package subpath. */
  async preload() {
    const {ZipLoaderWithParser} = await import('@loaders.gl/archives/zip/zip-loader');
    return ZipLoaderWithParser;
  }
} as const satisfies Loader<ZipFileMap, never, ZipLoaderOptions>;
