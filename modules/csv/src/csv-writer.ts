// loaders.gl, MIT license

/* global TextEncoder */
import {DataWriter} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsCSV, CSVWriterOptions} from './lib/encoders/csv-encoder';

export const CSVWriter: DataWriter<Table, TableBatch, CSVWriterOptions> = {
  id: 'csv',
  version: 'latest',
  module: 'csv',
  name: 'CSV',
  extensions: ['csv'],
  mimeType: 'text/csv',
  options: {
    useDisplayNames: true
  },
  text: true,
  encode: async (table, options) =>
    new TextEncoder().encode(encodeTableAsCSV(table, options)).buffer,
  encodeText: (table, options) => encodeTableAsCSV(table, options)
};
