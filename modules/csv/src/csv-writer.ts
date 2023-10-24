// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

/* global TextEncoder */
import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {encodeTableAsCSV} from './lib/encoders/encode-csv';

export type CSVWriterOptions = WriterOptions & {
  csv?: {
    useDisplayNames?: boolean;
  };
  /** @deprecated */
  useDisplayNames?: never;
};

export const CSVWriter: Writer<Table, TableBatch, CSVWriterOptions> = {
  id: 'csv',
  version: 'latest',
  module: 'csv',
  name: 'CSV',
  extensions: ['csv'],
  mimeTypes: ['text/csv'],
  options: {
    csv: {
      useDisplayNames: false
    }
  },
  text: true,
  encode: async (table, options) =>
    new TextEncoder().encode(encodeTableAsCSV(table, options)).buffer,
  encodeTextSync: (table, options) => encodeTableAsCSV(table, options)
};
