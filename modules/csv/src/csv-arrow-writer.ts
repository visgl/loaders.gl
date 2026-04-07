// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global TextEncoder */
import type {WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';

import {CSVFormat} from './csv-format';
import type {CSVWriterOptions} from './csv-writer';
import {CSVWriter} from './csv-writer';
import {encodeTableAsCSV} from './lib/encoders/encode-csv';

/** Options for encoding Apache Arrow tables as CSV text. */
export type CSVArrowWriterOptions = CSVWriterOptions;

/** Encodes CSV text produced by CSVArrowWriter. */
const textEncoder = new TextEncoder();

/**
 * CSV writer for Apache Arrow tables.
 *
 * The writer reuses the table CSV encoder and accepts the same CSV writer
 * options as `CSVWriter`.
 */
export const CSVArrowWriter = {
  ...CSVFormat,
  version: 'latest',
  options: CSVWriter.options,
  text: true,
  encode: async (table, options) => textEncoder.encode(encodeTableAsCSV(table, options)).buffer,
  encodeTextSync: (table, options) => encodeTableAsCSV(table, options)
} as const satisfies WriterWithEncoder<ArrowTable, ArrowTableBatch, CSVArrowWriterOptions>;
