// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import {ORCFormat} from './orc-format';
import type {ORCWriterOptions} from './lib/encoders/encode-orc';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared ORCWriter metadata and defaults. */
export const ORC_WRITER_METADATA = {
  ...ORCFormat,
  version: VERSION,
  options: {orc: {}}
} as const satisfies Writer<TableWriterInput, TableWriterBatch, ORCWriterOptions>;

/** Metadata for encoding with ORCWriter through the core APIs. */
export const ORCWriter = {
  ...ORC_WRITER_METADATA,
  dataType: null as unknown as TableWriterInput,
  batchType: null as unknown as TableWriterBatch,
  options: ORC_WRITER_METADATA.options as ORCWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {ORCWriter} = await import('./orc-writer.js');
    return ORCWriter;
  }
} as const satisfies Writer<TableWriterInput, TableWriterBatch, ORCWriterOptions>;
