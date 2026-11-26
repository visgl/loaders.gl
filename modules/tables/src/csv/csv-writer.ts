// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global TextEncoder */
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {encodeTableAsCSV} from './lib/encoders/encode-csv';
import {CSV_WRITER_METADATA, type CSVWriterOptions} from './csv-writer-types';

/** CSV writer with its encoder loaded. */
export const CSVWriterWithEncoder = {
  ...CSV_WRITER_METADATA,
  encode: async (table, options) =>
    new TextEncoder().encode(encodeTableAsCSV(table, options)).buffer,
  encodeTextSync: (table, options) => encodeTableAsCSV(table, options)
} as const satisfies WriterWithEncoder<TableWriterInput, TableWriterBatch, CSVWriterOptions>;
