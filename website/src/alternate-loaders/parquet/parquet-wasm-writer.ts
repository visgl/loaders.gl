// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  TableWriterInput,
  TableWriterBatch
} from '../../../../modules/tables/src/arrow/table-writer-input';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {convertTableToArrow, deduceTableSchema} from '@loaders.gl/core/schema-utils';
import {isNativeWriterTable} from '../../../../modules/tables/src/arrow/table-writer-input';

import {encodeArrowToParquet} from './encode-arrow-to-parquet';
import {ensureGeoParquetMetadataOnArrowTable} from '../../../../modules/tables/src/parquet/lib/geo/geospatial-metadata';
import {normalizeParquetOptions} from '../../../../modules/tables/src/parquet/lib/utils/normalize-parquet-options';
import {ParquetFormat} from '../../../../modules/tables/src/parquet/parquet-format';
import {VERSION} from '../../../../modules/tables/src/parquet/lib/constants';

/** Public options for the wasm-backed Parquet writer. */
export type ParquetWasmWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/** Plain-row Parquet writer that converts tables to Arrow before wasm encoding. */
export const ParquetWasmWriter = {
  ...ParquetFormat,
  id: 'parquet',
  module: 'tables',
  version: VERSION,
  options: {
    parquet: {}
  },
  encode(input: TableWriterInput, options?: ParquetWasmWriterOptions) {
    const arrowTable = isNativeWriterTable(input)
      ? input
      : convertTableToArrow({...input, schema: input.schema || deduceTableSchema(input)});
    const parquetOptions = normalizeParquetOptions(options, ParquetWasmWriter.options.parquet);
    return encodeArrowToParquet(ensureGeoParquetMetadataOnArrowTable(arrowTable), parquetOptions);
  }
} as const satisfies WriterWithEncoder<
  TableWriterInput,
  TableWriterBatch,
  ParquetWasmWriterOptions
>;
