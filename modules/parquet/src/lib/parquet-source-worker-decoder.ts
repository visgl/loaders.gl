// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {dehydrateArrowTable} from '@loaders.gl/arrow/transport';
import type {ArrayType} from '@loaders.gl/schema';
import {convertTable} from '@loaders.gl/schema-utils';

import {preloadCompressions} from '../parquetjs/compression';
import {filterParquetRowIndices, gatherParquetColumns} from './parquet-predicate';
import type {RowGroup} from '../parquetjs/parquet-thrift/index';
import {ParquetReader} from '../parquetjs/parser/parquet-reader';
import {ParquetSchema} from '../parquetjs/schema/schema';
import {ParquetSourceWorkerFile} from './parquet-source-worker-file';
import type {ParquetKeyRetriever} from './parquet-encryption';
import type {
  ParquetSourceWorkerBatch,
  ParquetSourceWorkerColumnChunk,
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
  const keyRetriever = input.encryption
    ? createWorkerKeyRetriever(
        input.columnChunks,
        input.encryption.aadPrefix?.byteLength ?? 0,
        input.encryption.fileUnique.byteLength
      )
    : undefined;
  const reader = new ParquetReader(file, {
    preserveBinary: input.preserveBinary,
    verifyPageChecksums: input.verifyPageChecksums,
    encryptionContext: input.encryption
      ? {
          algorithm: input.encryption.algorithm,
          aadPrefix: input.encryption.aadPrefix
            ? new Uint8Array(input.encryption.aadPrefix)
            : undefined,
          fileUnique: new Uint8Array(input.encryption.fileUnique)
        }
      : undefined,
    keyRetriever
  });
  const rowGroup = createWorkerRowGroup(input);

  const decodeStartTime = getCurrentTime();
  let decodedRowGroups;
  try {
    decodedRowGroups = input.pagePlan
      ? await Promise.all(
          input.pagePlan.rowRanges.map(rowRange =>
            reader.readRowGroupRange(schema, rowGroup, [], rowRange, input.pagePlan!.pageLocations)
          )
        )
      : [await reader.readRowGroup(schema, rowGroup, [])];
  } catch (error) {
    throw new Error(
      `Parquet worker decode failed: ${
        error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      }`
    );
  }
  const columns = concatenateMaterializedColumns(
    decodedRowGroups.map(decodedRowGroup => schema.materializeColumns(decodedRowGroup))
  );
  const sourceRowIndices = input.pagePlan
    ? input.pagePlan.rowRanges.flatMap(rowRange =>
        Array.from({length: rowRange.end - rowRange.start}, (_, index) => rowRange.start + index)
      )
    : undefined;
  const sourceRowCount = sourceRowIndices?.length ?? input.rowCount;
  const localRowIndices = input.predicate
    ? filterParquetRowIndices(input.predicate, columns, sourceRowCount)
    : undefined;
  const rowIndices = localRowIndices?.map(rowIndex => sourceRowIndices?.[rowIndex] ?? rowIndex);
  const decodeDurationMs = getCurrentTime() - decodeStartTime;

  const conversionStartTime = getCurrentTime();
  const batches: ParquetSourceWorkerBatch[] = [];
  const outputColumns = new Set(input.projectedSchema.fields.map(field => field.name));
  const outputRowCount = rowIndices?.length ?? sourceRowCount;
  for (
    let outputRowOffset = 0;
    outputRowOffset < outputRowCount;
    outputRowOffset += input.batchSize
  ) {
    const rowCount = Math.min(input.batchSize, outputRowCount - outputRowOffset);
    const batchRowIndices = rowIndices?.slice(outputRowOffset, outputRowOffset + rowCount);
    const batchLocalRowIndices = localRowIndices?.slice(
      outputRowOffset,
      outputRowOffset + rowCount
    );
    const rowGroupRowOffset = batchRowIndices?.[0] ?? outputRowOffset;
    const batchColumns = batchLocalRowIndices
      ? gatherParquetColumns(columns, batchLocalRowIndices, outputColumns)
      : sliceColumns(columns, outputRowOffset, outputRowOffset + rowCount);
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
      rowGroupRowIndices: batchRowIndices,
      arrowTable: dehydrateArrowTable(arrowTable.data)
    });
  }
  const arrowConversionDurationMs = getCurrentTime() - conversionStartTime;
  return {
    sourceRowCount,
    rowCount: outputRowCount,
    batches,
    decodeDurationMs,
    arrowConversionDurationMs
  };
}

/** Concatenates materialized page-range fragments without constructing row objects. */
function concatenateMaterializedColumns(
  fragments: readonly Record<string, ArrayType>[]
): Record<string, ArrayType> {
  const columns: Record<string, unknown[]> = {};
  for (const fragment of fragments) {
    for (const [name, values] of Object.entries(fragment)) {
      columns[name] ||= [];
      const destination = columns[name];
      for (let index = 0; index < values.length; index++) {
        destination.push(values[index]);
      }
    }
  }
  return columns as Record<string, ArrayType>;
}

/** Returns a contiguous row slice of every decoded column without constructing row objects. */
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

/** Reconstructs the minimal Thrift-compatible row-group object used by the decoder. */
function createWorkerRowGroup(input: ParquetSourceWorkerInput): RowGroup {
  return {
    num_rows: input.rowCount,
    total_byte_size: input.uncompressedByteLength,
    columns: input.columnChunks.map((columnChunk, index) => {
      const result = {
        file_path: columnChunk.filePath,
        parquetColumnOrdinal: columnChunk.columnOrdinal ?? index,
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
      } as unknown as RowGroup['columns'][number];
      if (columnChunk.encrypted) {
        result.crypto_metadata = (columnChunk.keyMetadata
          ? {
              ENCRYPTION_WITH_COLUMN_KEY: {
                path_in_schema: columnChunk.path,
                key_metadata: new Uint8Array(columnChunk.keyMetadata)
              }
            }
          : {
              ENCRYPTION_WITH_FOOTER_KEY: {}
            }) as unknown as RowGroup['columns'][number]['crypto_metadata'];
      }
      return result;
    })
  } as unknown as RowGroup;
}

/** Creates a worker-local key retriever from caller-resolved transferable keys. */
export function createWorkerKeyRetriever(
  columnChunks: readonly ParquetSourceWorkerColumnChunk[],
  aadPrefixByteLength: number,
  fileUniqueByteLength: number
): ParquetKeyRetriever {
  return (keyMetadata, context) => {
    const columnOrdinal = getColumnOrdinalFromAad(
      context.aad,
      aadPrefixByteLength,
      fileUniqueByteLength
    );
    const metadataMatches = columnChunks.filter(columnChunk =>
      equalBytes(keyMetadata, columnChunk.keyMetadata && new Uint8Array(columnChunk.keyMetadata))
    );
    const matchingColumn =
      metadataMatches.find(columnChunk => columnChunk.columnOrdinal === columnOrdinal) ??
      (metadataMatches.length === 1 ? metadataMatches[0] : undefined);
    if (!matchingColumn?.keyMaterial) {
      throw new Error('Encrypted Parquet worker key was not transferred for the selected column');
    }
    return new Uint8Array(matchingColumn.keyMaterial);
  };
}

/** Extracts the physical column ordinal encoded in a page-module AAD suffix. */
function getColumnOrdinalFromAad(
  aad: Uint8Array,
  aadPrefixByteLength: number,
  fileUniqueByteLength: number
): number | undefined {
  const columnOrdinalOffset = aadPrefixByteLength + fileUniqueByteLength + 3;
  if (columnOrdinalOffset + 2 > aad.byteLength) return undefined;
  return new DataView(aad.buffer, aad.byteOffset + columnOrdinalOffset, 2).getInt16(0, true);
}

/** Compares optional key metadata without exposing key material in structured-clone state. */
function equalBytes(
  firstBytes: Uint8Array | undefined,
  secondBytes: Uint8Array | undefined
): boolean {
  if (!firstBytes || !secondBytes) return !firstBytes && !secondBytes;
  return (
    firstBytes.length === secondBytes.length &&
    firstBytes.every((value, index) => value === secondBytes[index])
  );
}

/** Returns a monotonic timestamp when available and falls back to wall-clock time. */
function getCurrentTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}
