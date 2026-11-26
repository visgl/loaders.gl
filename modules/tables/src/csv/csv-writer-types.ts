// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {Writer, WriterOptions} from '@loaders.gl/core/loader-utils';
import {CSVFormat} from './csv-format';

/** Options for encoding loaders.gl tables as CSV text. */
export type CSVWriterOptions = WriterOptions & {
  csv?: {
    /** Use field metadata display names as CSV column names when available. */
    useDisplayNames?: boolean;
  };
};

/** CSV writer for loaders.gl tables. */
export const CSV_WRITER_METADATA = {
  ...CSVFormat,
  version: 'latest',
  options: {
    csv: {
      useDisplayNames: false
    }
  } as CSVWriterOptions,
  text: true,
  dataType: null as unknown as TableWriterInput,
  batchType: null as unknown as TableWriterBatch
} as const;

/** Loads the CSV encoder on demand. */
async function preloadCSVWriter() {
  const {CSVWriterWithEncoder} = await import('./csv-writer.js');
  return CSVWriterWithEncoder;
}

/** Metadata for encoding CSV through the core encoding APIs. */
export const CSVWriter = {
  ...CSV_WRITER_METADATA,
  preload: preloadCSVWriter
} as const satisfies Writer<TableWriterInput, TableWriterBatch, CSVWriterOptions>;
