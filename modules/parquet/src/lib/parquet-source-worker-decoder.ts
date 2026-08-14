// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dehydrateArrowTable} from '@loaders.gl/arrow/transport';
import type {ArrayType} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import {preloadCompressions} from '../parquetjs/compression';
import type {RowGroup} from '../parquetjs/parquet-thrift/index';
import {ParquetReader} from '../parquetjs/parser/parquet-reader';
import {ParquetSchema} from '../parquetjs/schema/schema';
import {ParquetSourceWorkerFile} from './parquet-source-worker-file';
import type {
  ParquetSourceWorkerBatch,
  ParquetSourceWorkerInput,
  ParquetSourceWorkerResult
} from './parquet-source-worker-types';

/** Decodes one transferred row group entirely inside the worker. */
export async function decodeParquetSourceWorkerInput(
  input: ParquetSourceWorkerInput
): Promise<ParquetSourceWorkerResult> {
  await preloadCompressions();
  const file = new ParquetSourceWorkerFile(input.fileByteLength, input.ranges);
  const schema = new ParquetSchema(input.schemaDefinition);
  const reader = new ParquetReader(file, {preserveBinary: input.preserveBinary});
  const rowGroup = createWorkerRowGroup(input);

  const decodeStartTime = getCurrentTime();
  const decodedRowGroup = await reader.readRowGroup(schema, rowGroup, []);
  const columns = schema.materializeColumns(decodedRowGroup);
  const decodeDurationMs = getCurrentTime() - decodeStartTime;

  const conversionStartTime = getCurrentTime();
  const batches: ParquetSourceWorkerBatch[] = [];
  for (
    let rowGroupRowOffset = 0;
    rowGroupRowOffset < input.rowCount;
    rowGroupRowOffset += input.batchSize
  ) {
    const rowCount = Math.min(input.batchSize, input.rowCount - rowGroupRowOffset);
    const batchColumns = sliceColumns(columns, rowGroupRowOffset, rowGroupRowOffset + rowCount);
    const arrowTable = convertTable(
      {
        shape: 'columnar-table',
        schema: input.projectedSchema,
        data: batchColumns
      },
      'arrow-table'
    );
    batches.push({
      rowGroupRowOffset,
      rowCount,
      arrowTable: dehydrateArrowTable(arrowTable.data)
    });
  }
  const arrowConversionDurationMs = getCurrentTime() - conversionStartTime;
  return {rowCount: input.rowCount, batches, decodeDurationMs, arrowConversionDurationMs};
}

/** Reconstructs the minimal Thrift-compatible row-group object used by the decoder. */
function createWorkerRowGroup(input: ParquetSourceWorkerInput): RowGroup {
  return {
    num_rows: input.rowCount,
    total_byte_size: input.uncompressedByteLength,
    columns: input.columnChunks.map(columnChunk => ({
      file_path: columnChunk.filePath,
      meta_data: {
        type: columnChunk.physicalType,
        codec: columnChunk.compressionCodec,
        path_in_schema: columnChunk.path,
        num_values: columnChunk.valueCount,
        total_compressed_size: columnChunk.compressedByteLength,
        total_uncompressed_size: columnChunk.uncompressedByteLength,
        data_page_offset: columnChunk.dataPageOffset,
        dictionary_page_offset: columnChunk.dictionaryPageOffset,
        encodings: []
      }
    }))
  } as unknown as RowGroup;
}

/** Returns a row slice of every decoded column without constructing row objects. */
function sliceColumns(
  columns: Record<string, ArrayType>,
  start: number,
  end: number
): Record<string, ArrayType> {
  const slicedColumns: Record<string, ArrayType> = {};
  for (const [name, column] of Object.entries(columns)) {
    const slice = (column as ArrayType & {slice?: (start: number, end: number) => ArrayType}).slice;
    slicedColumns[name] = slice
      ? slice.call(column, start, end)
      : Array.prototype.slice.call(column, start, end);
  }
  return slicedColumns;
}

/** Returns a monotonic timestamp when available and falls back to wall-clock time. */
function getCurrentTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}
