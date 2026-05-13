// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ArrowTable, Table, TableBatch} from '@loaders.gl/schema';
import {convertTable, deduceTableSchema} from '@loaders.gl/schema-utils';

import {encodeArrowToParquet} from './lib/encoders/encode-arrow-to-parquet';
import {ensureGeoParquetMetadataOnArrowTable} from './lib/geo/geospatial-metadata';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetFormat} from './parquet-format';
import {VERSION, PARQUET_WASM_URL} from './lib/constants';

/** Public options for the wasm-backed Parquet writer. */
export type ParquetWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/** Plain-row Parquet writer that converts tables to Arrow before wasm encoding. */
export const ParquetWriter = {
  ...ParquetFormat,
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  options: {
    parquet: {
      wasmUrl: PARQUET_WASM_URL
    }
  },
  encode(table: Table, options?: ParquetWriterOptions) {
    const arrowTable =
      table.shape === 'arrow-table'
        ? (table as ArrowTable)
        : (convertTable(
            {...table, schema: table.schema || deduceTableSchema(table)},
            'arrow-table'
          ) as ArrowTable);
    const parquetOptions = normalizeParquetOptions(options, ParquetWriter.options.parquet);
    return encodeArrowToParquet(ensureGeoParquetMetadataOnArrowTable(arrowTable), parquetOptions);
  }
} as const satisfies WriterWithEncoder<Table, TableBatch, ParquetWriterOptions>;
