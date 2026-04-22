// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, Table, TableBatch} from '@loaders.gl/schema';
import {convertTable, deduceTableSchema} from '@loaders.gl/schema-utils';

import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {encodeTableToParquetJs} from './lib/encoders/encode-table-to-parquet-js';
import {ParquetFormat} from './parquet-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Encoder-specific options for the experimental parquetjs writer. */
type ParquetJSWriterEncoderOptions = {
  rowGroupSize?: number;
  pageSize?: number;
  useDataPageV2?: boolean;
};

/** Public options for the parquetjs-backed plain-table writer. */
export type ParquetJSWriterOptions = WriterOptions & {
  parquet?: {
    [Key in keyof ParquetJSWriterEncoderOptions]?: ParquetJSWriterEncoderOptions[Key];
  };
};

/** Default option bag for the experimental parquetjs writer. */
const DEFAULT_PARQUET_JS_OPTIONS = {};

/** Plain-row Parquet writer backed by the experimental parquetjs implementation. */
export const ParquetJSWriter = {
  ...ParquetFormat,
  id: 'parquet-js',
  module: 'parquet',
  version: VERSION,
  options: {
    parquet: DEFAULT_PARQUET_JS_OPTIONS
  },
  async encode(table: Table, options?: ParquetJSWriterOptions) {
    const schema = table.schema || deduceTableSchema(table);
    const objectRowTable = convertTable({...table, schema}, 'object-row-table') as ObjectRowTable;
    return await encodeTableToParquetJs(
      {...table, schema},
      objectRowTable,
      normalizeParquetOptions(options, DEFAULT_PARQUET_JS_OPTIONS)
    );
  }
} as const satisfies WriterWithEncoder<Table, TableBatch, ParquetJSWriterOptions>;
