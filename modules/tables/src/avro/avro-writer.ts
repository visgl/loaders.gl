// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowJSTable} from 'apache-arrow';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {
  encodeAvro,
  type AvroSchema,
  type AvroWriterOptions as AvroEncoderOptions
} from './lib/encoders/encode-avro';
import {AVRO_WRITER_METADATA} from './avro-writer-types';

/** Public options for the Apache Avro writer. */
export type AvroWriterOptions = WriterOptions & AvroEncoderOptions;

/** Writer for Arrow tables in Avro Object Container File format. */
export const AvroWriter = {
  ...AVRO_WRITER_METADATA,
  async encode(table: ArrowJSTable, options?: AvroWriterOptions) {
    return encodeAvro(table, options);
  }
} as const satisfies WriterWithEncoder<ArrowJSTable, never, AvroWriterOptions>;

export type {AvroSchema};
