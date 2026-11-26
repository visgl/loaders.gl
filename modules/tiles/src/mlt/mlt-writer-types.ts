// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import {MLTFormat} from './mlt-format';
import type {MLTWriterOptions} from './mlt-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared MLTWriter metadata and defaults. */
export const MLT_WRITER_METADATA = {
  ...MLTFormat,
  name: 'MLT Writer',
  version: VERSION,
  binary: true,
  options: {mlt: {}}
} as const satisfies Writer<Table, never, MLTWriterOptions>;

/** Metadata for encoding with MLTWriter through the core APIs. */
export const MLTWriter = {
  ...MLT_WRITER_METADATA,
  dataType: null as unknown as Table,
  batchType: null as never,
  options: MLT_WRITER_METADATA.options as MLTWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {MLTWriter} = await import('./mlt-writer.js');
    return MLTWriter;
  }
} as const satisfies Writer<Table, never, MLTWriterOptions>;
