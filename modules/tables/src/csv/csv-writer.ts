// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global TextEncoder */
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import {encodeTableAsCSV} from './lib/encoders/encode-csv';
import {CSVFormat} from './csv-format';

/** Options for encoding loaders.gl tables as CSV text. */
export type CSVWriterOptions = WriterOptions & {
  csv?: {
    /** Use field metadata display names as CSV column names when available. */
    useDisplayNames?: boolean;
  };
};

/** CSV writer for loaders.gl tables. */
export const CSVWriter = {
  ...CSVFormat,
  version: 'latest',
  options: {
    csv: {
      useDisplayNames: false
    }
  },
  text: true,
  encode: async (table, options) =>
    new TextEncoder().encode(encodeTableAsCSV(table, options)).buffer,
  encodeTextSync: (table, options) => encodeTableAsCSV(table, options)
} as const satisfies WriterWithEncoder<TableWriterInput, TableWriterBatch, CSVWriterOptions>;
