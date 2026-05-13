// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global TextEncoder */
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
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
} as const satisfies WriterWithEncoder<Table, TableBatch, CSVWriterOptions>;
