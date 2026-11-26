// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowJSTable} from 'apache-arrow';
import {AvroFormat} from './avro-format';
import type {AvroWriterOptions} from './avro-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by the build tooling.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared AvroWriter metadata and defaults. */
export const AVRO_WRITER_METADATA = {
  ...AvroFormat,
  version: VERSION,
  options: {avro: {}}
} as const satisfies Writer<ArrowJSTable, never, AvroWriterOptions>;

/** Metadata for encoding with AvroWriter through the core APIs. */
export const AvroWriter = {
  ...AVRO_WRITER_METADATA,
  dataType: null as unknown as ArrowJSTable,
  batchType: null as never,
  options: AVRO_WRITER_METADATA.options as AvroWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {AvroWriter} = await import('./avro-writer.js');
    return AvroWriter;
  }
} as const satisfies Writer<ArrowJSTable, never, AvroWriterOptions>;
