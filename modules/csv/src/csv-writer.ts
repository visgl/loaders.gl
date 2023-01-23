// loaders.gl, MIT license

/* global TextEncoder */
import type {DataWriter} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import type {CSVWriterOptions} from './lib/encoders/encode-csv';
import {encodeTableAsCSV} from './lib/encoders/encode-csv';

export type {CSVWriterOptions};

const DEFAULT_WRITER_OPTIONS: Required<CSVWriterOptions> = {
  csv: {
    useDisplayNames: false
  },
  useDisplayNames: false
}

export const CSVWriter: DataWriter<Table, TableBatch, CSVWriterOptions> = {
  id: 'csv',
  version: 'latest',
  module: 'csv',
  name: 'CSV',
  extensions: ['csv'],
  mimeType: 'text/csv',
  options: DEFAULT_WRITER_OPTIONS,
  text: true,
  encode: async (table, options) =>
    new TextEncoder().encode(encodeTableAsCSV(table, options)).buffer,
  encodeText: (table, options) => encodeTableAsCSV(table, options)
};
