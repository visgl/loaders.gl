// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, Writer} from '@loaders.gl/core/loader-utils';
import {TarFormat} from './tar-format';
import type {TarWriterFiles} from './tar-writer';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared TarWriter metadata and defaults. */
export const TAR_WRITER_METADATA = {
  ...TarFormat,
  version: VERSION,
  options: {}
} as const satisfies Writer<TarWriterFiles, never, WriterOptions>;

/** Metadata for encoding with TarWriter through the core APIs. */
export const TarWriter = {
  ...TAR_WRITER_METADATA,
  dataType: null as unknown as TarWriterFiles,
  batchType: null as never,
  options: TAR_WRITER_METADATA.options as WriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {TarWriter} = await import('./tar-writer.js');
    return TarWriter;
  }
} as const satisfies Writer<TarWriterFiles, never, WriterOptions>;
