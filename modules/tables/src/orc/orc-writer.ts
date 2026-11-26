// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {encodeORC, type ORCWriterOptions} from './lib/encoders/encode-orc';
import {ORC_WRITER_METADATA} from './orc-writer-types';

/** Writer for Apache ORC files. */
export const ORCWriter = {
  ...ORC_WRITER_METADATA,
  async encode(table: TableWriterInput, options?: ORCWriterOptions) {
    return encodeORC(table, options);
  }
} as const satisfies WriterWithEncoder<TableWriterInput, TableWriterBatch, ORCWriterOptions>;

export type {ORCWriterOptions} from './lib/encoders/encode-orc';
