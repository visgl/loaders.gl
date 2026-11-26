// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ZipFormat} from './zip-format';
import type {ZipWriterFiles, ZipWriterOptions} from './zip-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared ZipWriter metadata and defaults. */
export const ZIP_WRITER_METADATA = {
  ...ZipFormat,
  version: VERSION,
  options: {zip: {createFolders: false}}
} as const satisfies Writer<ZipWriterFiles, never, ZipWriterOptions>;

/** Metadata for encoding with ZipWriter through the core APIs. */
export const ZipWriter = {
  ...ZIP_WRITER_METADATA,
  dataType: null as unknown as ZipWriterFiles,
  batchType: null as never,
  options: ZIP_WRITER_METADATA.options as ZipWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {ZipWriter} = await import('./zip-writer.js');
    return ZipWriter;
  }
} as const satisfies Writer<ZipWriterFiles, never, ZipWriterOptions>;
