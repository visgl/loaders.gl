// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, Table, TableBatch} from '@loaders.gl/schema';
import {convertTable, deduceTableSchema} from '@loaders.gl/schema-utils';

import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {encodeTableToParquetJs} from './lib/encoders/encode-table-to-parquet-js';
import {ParquetFormat} from './parquet-format';
import type {ParquetSortingColumnOption} from './parquetjs/encoder/parquet-encoder';
import type {
  ParquetWriterEncryptionOptions,
  ParquetWriterFooterSignatureOptions
} from './lib/parquet-encryption';

export type {ParquetSortingColumnOption} from './parquetjs/encoder/parquet-encoder';
export type {
  ParquetWriterEncryptionOptions,
  ParquetWriterFooterSignatureOptions
} from './lib/parquet-encryption';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Stable value encodings selectable by the TypeScript Parquet writer. */
export type ParquetJSWriterEncoding =
  | 'PLAIN'
  | 'PLAIN_DICTIONARY'
  | 'BYTE_STREAM_SPLIT'
  | 'DELTA_BINARY_PACKED'
  | 'DELTA_LENGTH_BYTE_ARRAY'
  | 'DELTA_BYTE_ARRAY';

/** Encoder-specific options for the experimental parquetjs writer. */
type ParquetJSWriterEncoderOptions = {
  /** Value encoding overrides keyed by top-level column name. */
  columnEncodings?: Record<string, ParquetJSWriterEncoding>;
  /** Enables dictionary pages globally when forced or size-beneficial. */
  dictionary?: boolean | 'auto';
  /** Dictionary policy overrides keyed by top-level column name. */
  columnDictionaries?: Record<string, boolean | 'auto'>;
  /** Maximum uncompressed PLAIN dictionary payload per column chunk. */
  dictionaryPageSizeLimit?: number;
  /** Emits Parquet split-block Bloom filters for selected columns. */
  bloomFilter?: boolean | Record<string, boolean>;
  /** Emits Parquet column and offset indexes for selected non-repeated columns. */
  pageIndex?: boolean | Record<string, boolean>;
  /** Emits CRC-32 checksums for every data and dictionary page. */
  writePageChecksums?: boolean;
  /** Emits optional SizeStatistics metadata for every column chunk. */
  writeSizeStatistics?: boolean;
  /** Emits min/max/null-count statistics for every column chunk. */
  writeStatistics?: boolean | Record<string, boolean>;
  /** Declares row-group sort keys using top-level or dotted nested leaf names. */
  sortingColumns?: readonly ParquetSortingColumnOption[];
  /** Encodes INT96 input values as epoch nanoseconds using the canonical Julian-day layout. */
  int96AsTimestamp?: boolean;
  /** Encrypt the footer using Parquet modular encryption. */
  encryption?: ParquetWriterEncryptionOptions;
  /** Authenticate a plaintext footer with a Parquet modular-encryption signature. */
  footerSignature?: ParquetWriterFooterSignatureOptions;
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
