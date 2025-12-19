// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global TextEncoder */
import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsCSV} from './lib/encoders/encode-csv';
import {CSVFormat} from './csv-format';

export type CSVWriterOptions = WriterOptions & {
  csv?: {
    useDisplayNames?: boolean;
  };
};

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
