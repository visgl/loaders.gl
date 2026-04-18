// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {convertTable, deduceTableSchema} from '@loaders.gl/schema-utils';

import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetFormat} from './parquet-format';
import {ParquetArrowWriter, type ParquetArrowWriterOptions} from './parquet-arrow-writer';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type ParquetWriterOptions = ParquetArrowWriterOptions;

/** Plain-row Parquet writer that converts tables to Arrow before wasm encoding. */
export const ParquetWriter = {
  ...ParquetFormat,
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  options: ParquetArrowWriter.options,
  encode(table: Table, options?: ParquetWriterOptions) {
    const schema = table.schema || deduceTableSchema(table);
    const arrowTable = convertTable({...table, schema}, 'arrow-table');
    return ParquetArrowWriter.encode(
      arrowTable,
      normalizeParquetOptions(options, ParquetArrowWriter.options.parquet)
    );
  }
} as const satisfies WriterWithEncoder<Table, TableBatch, ParquetWriterOptions>;
