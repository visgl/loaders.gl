// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Schema as ArrowSchema, Table as ArrowTable, tableToIPC} from 'apache-arrow';
import {encodeArrayBufferToBase64} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {isNativeWriterTable} from '../arrow/table-writer-input';
import type {TableWriterInput, TableWriterBatch} from '../arrow/table-writer-input';
import type {WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema, convertTable, deduceTableSchema} from '@loaders.gl/core/schema-utils';

import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {encodeTableToParquetJs} from './lib/encoders/encode-table-to-parquet-js';
import {
  DEFAULT_PARQUET_WRITER_OPTIONS,
  PARQUET_WRITER_METADATA,
  type ParquetWriterOptions
} from './parquet-writer-types';

/** Parquet writer with its encoder loaded. */
export const ParquetWriterWithEncoder = {
  ...PARQUET_WRITER_METADATA,
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
      // Avoid nesting an earlier Parquet footer schema during repeated read/write cycles.
      const metadata = new Map(input.schema.metadata);
      metadata.delete('ARROW:schema');
      const schema = new ArrowSchema(
        input.schema.fields,
        metadata,
        input.schema.dictionaries,
        input.schema.metadataVersion
      );
      const schemaBytes = tableToIPC(new ArrowTable(schema), 'stream');
      table.schema.metadata['ARROW:schema'] = encodeArrayBufferToBase64(schemaBytes.slice().buffer);
    }
    return await encodeTableToParquetJs(
      table,
      objectRowTable,
      normalizeParquetOptions(options, DEFAULT_PARQUET_WRITER_OPTIONS)
    );
  }
} as const satisfies WriterWithEncoder<TableWriterInput, TableWriterBatch, ParquetWriterOptions>;
