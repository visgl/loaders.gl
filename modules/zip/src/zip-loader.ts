// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {ZipFormat} from './zip-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type FileMap = Record<string, ArrayBuffer>;

/** Preloads the parser-bearing ZIP loader implementation. */
async function preload() {
  const {ZipLoaderWithParser} = await import('./zip-loader-with-parser');
  return ZipLoaderWithParser;
}

/** Metadata-only loader for ZIP archives. */
export const ZipLoader = {
  dataType: null as unknown as FileMap,
  batchType: null as unknown as never,

  ...ZipFormat,
  version: VERSION,
  options: {},
  preload
} as const satisfies Loader<FileMap, never, LoaderOptions>;
