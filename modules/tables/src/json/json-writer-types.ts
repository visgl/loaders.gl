// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import {JSONFormat} from './json-format';
import type {JSONWriterOptions} from './json-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared JSONWriter metadata and defaults. */
export const JSON_WRITER_METADATA = {
  ...JSONFormat,
  version: 'latest',
  options: {},
  text: true
} as const satisfies Writer<TableWriterInput, TableWriterBatch, JSONWriterOptions>;

/** Metadata for encoding with JSONWriter through the core APIs. */
export const JSONWriter = {
  ...JSON_WRITER_METADATA,
  dataType: null as unknown as TableWriterInput,
  batchType: null as unknown as TableWriterBatch,
  options: JSON_WRITER_METADATA.options as JSONWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {JSONWriter} = await import('./json-writer.js');
    return JSONWriter;
  }
} as const satisfies Writer<TableWriterInput, TableWriterBatch, JSONWriterOptions>;
