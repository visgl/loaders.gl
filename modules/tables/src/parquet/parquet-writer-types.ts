// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {Writer, WriterOptions} from '@loaders.gl/core/loader-utils';
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
  /** Omit the GeoParquet footer when writing native geospatial columns. */
  nativeGeospatialOnly?: boolean;
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
export const DEFAULT_PARQUET_WRITER_OPTIONS = {};

/** Plain-row Parquet writer backed by the TypeScript implementation. */
export const PARQUET_WRITER_METADATA = {
  ...ParquetFormat,
  id: 'parquet',
  module: 'tables',
  version: VERSION,
  options: {
    parquet: DEFAULT_PARQUET_WRITER_OPTIONS
  } as ParquetWriterOptions,
  dataType: null as unknown as TableWriterInput,
  batchType: null as unknown as TableWriterBatch
} as const;

/** Loads the Parquet encoder on demand. */
async function preloadParquetWriter() {
  const {ParquetWriterWithEncoder} = await import('./parquet-writer.js');
  return ParquetWriterWithEncoder;
}

/** Metadata for encoding Parquet through the core encoding APIs. */
export const ParquetWriter = {
  ...PARQUET_WRITER_METADATA,
  preload: preloadParquetWriter
} as const satisfies Writer<TableWriterInput, TableWriterBatch, ParquetWriterOptions>;
