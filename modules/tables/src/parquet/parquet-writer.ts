// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table as ArrowTable, tableToIPC} from 'apache-arrow';
import {encodeArrayBufferToBase64} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {isNativeWriterTable} from '../arrow/table-writer-input';
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema, convertTable, deduceTableSchema} from '@loaders.gl/core/schema-utils';

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
export type ParquetWriterEncoding =
  | 'PLAIN'
  | 'PLAIN_DICTIONARY'
  | 'BYTE_STREAM_SPLIT'
  | 'DELTA_BINARY_PACKED'
  | 'DELTA_LENGTH_BYTE_ARRAY'
  | 'DELTA_BYTE_ARRAY';

/** Encoder-specific options for the TypeScript writer. */
type ParquetWriterEncoderOptions = {
  /** Value encoding overrides keyed by top-level column name. */
  columnEncodings?: Record<string, ParquetWriterEncoding>;
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
  /** Maximum rows in each encoded row group. */
  rowGroupSize?: number;
  /** Maximum rows in each encoded data page. */
  pageSize?: number;
  /** Writes version 2 data pages when enabled. */
  useDataPageV2?: boolean;
};

/** Public options for the TypeScript-backed plain-table writer. */
export type ParquetWriterOptions = WriterOptions & {
  parquet?: {
    [Key in keyof ParquetWriterEncoderOptions]?: ParquetWriterEncoderOptions[Key];
  };
};

/** Default option bag for the TypeScript writer. */
const DEFAULT_PARQUET_WRITER_OPTIONS = {};

/** Plain-row Parquet writer backed by the TypeScript implementation. */
export const ParquetWriter = {
  ...ParquetFormat,
  id: 'parquet',
  module: 'tables',
  version: VERSION,
  options: {
    parquet: DEFAULT_PARQUET_WRITER_OPTIONS
  },
  /** Encodes a native Arrow table or a schema-bearing row table as Parquet. */
  async encode(input: TableWriterInput, options?: ParquetWriterOptions) {
    const objectRowTable = isNativeWriterTable(input)
      ? {
          shape: 'object-row-table' as const,
          schema: convertArrowToSchema(input.schema),
          data: Array.from(input, row => row.toJSON())
        }
      : (convertTable(
          {...input, schema: input.schema || deduceTableSchema(input)},
          'object-row-table'
        ) as ObjectRowTable);
    const table = {
      ...objectRowTable,
      schema: {...objectRowTable.schema!, metadata: {...objectRowTable.schema?.metadata}}
    };
    if (isNativeWriterTable(input)) {
      const schemaBytes = tableToIPC(new ArrowTable(input.schema), 'stream');
      table.schema.metadata['ARROW:schema'] = encodeArrayBufferToBase64(schemaBytes.slice().buffer);
    }
    return await encodeTableToParquetJs(
      table,
      objectRowTable,
      normalizeParquetOptions(options, DEFAULT_PARQUET_WRITER_OPTIONS)
    );
  }
} as const satisfies WriterWithEncoder<TableWriterInput, TableWriterBatch, ParquetWriterOptions>;
