// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {
  encodeAvro,
  type AvroSchema,
  type AvroWriterOptions as AvroEncoderOptions
} from './lib/encoders/encode-avro';
import {AvroFormat} from './avro-format';

/** Public options for the Apache Avro writer. */
export type AvroWriterOptions = WriterOptions & AvroEncoderOptions;

// __VERSION__ is injected by the build tooling.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Writer for Arrow tables in Avro Object Container File format. */
export const AvroWriter = {
  ...AvroFormat,
  version: VERSION,
  options: {avro: {}},
  async encode(table: ArrowTable, options?: AvroWriterOptions) {
    return encodeAvro(table, options);
  }
} as const satisfies WriterWithEncoder<ArrowTable, ArrowTableBatch, AvroWriterOptions>;

export type {AvroSchema};
