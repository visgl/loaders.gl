// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SLPKFormat} from './i3s-format';
import type {SLPKWriterFiles, SLPKWriterOptions} from './i3s-slpk-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** SLPK requires ZIP64 above 2 GiB; the default output budget retains the original 2 GiB bound. */
export const MAX_ARCHIVE_BYTES = 0x7fffffff;

/** Shared SLPKWriter metadata and defaults. */
export const SLPK_WRITER_METADATA = {
  ...SLPKFormat,
  version: VERSION,
  options: {slpk: {maxArchiveBytes: MAX_ARCHIVE_BYTES}}
} as const satisfies Writer<SLPKWriterFiles, never, SLPKWriterOptions>;

/** Metadata for encoding with SLPKWriter through the core APIs. */
export const SLPKWriter = {
  ...SLPK_WRITER_METADATA,
  dataType: null as unknown as SLPKWriterFiles,
  batchType: null as never,
  options: SLPK_WRITER_METADATA.options as SLPKWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {SLPKWriter} = await import('./i3s-slpk-writer.js');
    return SLPKWriter;
  }
} as const satisfies Writer<SLPKWriterFiles, never, SLPKWriterOptions>;
