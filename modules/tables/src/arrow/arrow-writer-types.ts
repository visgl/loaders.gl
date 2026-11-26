// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowJSTable} from 'apache-arrow';
import type {ColumnarTable} from './lib/encoders/encode-arrow';
import {ArrowFormat} from './exports/arrow-format';
import type {ArrowWriterOptions} from './arrow-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared ArrowWriter metadata and defaults. */
export const ARROW_WRITER_METADATA = {
  ...ArrowFormat,
  version: VERSION,
  options: {
    arrow: {
      container: 'stream',
      compression: null
    }
  }
} as const satisfies Writer<ColumnarTable | ArrowJSTable, never, ArrowWriterOptions>;

/** Metadata for encoding with ArrowWriter through the core APIs. */
export const ArrowWriter = {
  ...ARROW_WRITER_METADATA,
  dataType: null as unknown as ColumnarTable | ArrowJSTable,
  batchType: null as never,
  options: ARROW_WRITER_METADATA.options as ArrowWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {ArrowWriter} = await import('./arrow-writer.js');
    return ArrowWriter;
  }
} as const satisfies Writer<ColumnarTable | ArrowJSTable, never, ArrowWriterOptions>;
