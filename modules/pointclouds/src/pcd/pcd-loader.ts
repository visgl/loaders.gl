// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {refineArrowTableBatches, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {Table, RecordBatch} from 'apache-arrow';
import type {PCDLoaderOptions} from './pcd-loader-types';

import {concatenateArrayBuffersAsync, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {
  deserializeNativeArrowWorkerResult,
  serializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import {
  convertMeshToArrowTable,
  convertTableToMesh,
  isArrowTable
} from '@loaders.gl/core/schema-utils';
import type {PCDHeader, PCDMesh} from './lib/pcd-types';
import {parsePCD, parsePCDHeader} from './lib/parse-pcd';
import {PCDLoader as PCDLoaderMetadata} from './pcd-loader-types';

const {preload: _PCDLoaderPreload, ...PCDLoaderMetadataWithoutPreload} = PCDLoaderMetadata;

const PCD_HEADER_KEY = 'loaders.gl.pcd.header';

/** Builds native Arrow and stores the parsed PCD header in the schema and every batch. */
function convertPCDMesh(mesh: PCDMesh): Table {
  const table = convertMeshToArrowTable(mesh);
  const header = JSON.stringify(mesh.loaderData);
  table.schema.metadata.set(PCD_HEADER_KEY, header);
  for (const batch of table.batches) batch.schema.metadata.set(PCD_HEADER_KEY, header);
  return table;
}

/** Loader for PCD point clouds. */
export const PCDLoaderWithParser = {
  ...PCDLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => parsePCDOutput(arrayBuffer, options),
  parseSync: parsePCDOutput,
  async *parseInBatches(input, options) {
    for await (const chunk of refineArrowTableBatches(
      parsePCDWithMetadataInBatches(input, options)
    )) {
      if (options?.pcd?.shape === 'mesh') yield convertPCDTableToMesh(chunk);
      else if (chunk.batches.length) yield* chunk.batches;
      else yield makeArrowMetadataBatch(chunk.schema);
    }
  },
  serializeWorkerResult: result => serializeNativeArrowWorkerResult(result as Table),
  deserializeWorkerResult: deserializePCDWorkerResult,
  serializeWorkerBatch: batch => serializeNativeArrowWorkerResult(batch as RecordBatch),
  deserializeWorkerBatch: deserializePCDWorkerBatch
} as const satisfies LoaderWithParser<PCDMesh | Table, PCDMesh | RecordBatch, PCDLoaderOptions>;

/** Parses one PCD file and returns the requested native Arrow or mesh representation. */
function parsePCDOutput(arrayBuffer: ArrayBuffer, options?: PCDLoaderOptions): Table | PCDMesh {
  const table = convertPCDMesh(parsePCD(arrayBuffer, options));
  return options?.pcd?.shape === 'mesh' ? convertPCDTableToMesh(table) : table;
}

/** Returns a numeric batch size when batching has an explicit row count. */
function getNumericBatchSize(options?: PCDLoaderOptions): number | undefined {
  const batchSize = options?.core?.batchSize;
  return typeof batchSize === 'number' ? batchSize : undefined;
}

function* parsePCDASCIIInBatches(
  data: ArrayBuffer,
  options?: PCDLoaderOptions,
  batchSize?: number
): Iterable<Table> {
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);
  const lines = textData
    .slice(pcdHeader.headerLen)
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);
  if (!lines.length) {
    yield convertPCDMesh(parsePCD(data, options));
    return;
  }
  const normalizedBatchSize = batchSize || lines.length;

  for (let rowIndex = 0; rowIndex < lines.length; rowIndex += normalizedBatchSize) {
    const batchLines = lines.slice(rowIndex, rowIndex + normalizedBatchSize);
    const batchText = `${makePCDHeaderText(pcdHeader, batchLines.length)}${batchLines.join('\n')}\n`;
    yield convertPCDMesh(parsePCD(new TextEncoder().encode(batchText).buffer, options));
  }
}

function* parsePCDBinaryInBatches(
  data: ArrayBuffer,
  options?: PCDLoaderOptions,
  batchSize?: number
): Iterable<Table> {
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);
  if (!pcdHeader.points) {
    yield convertPCDMesh(parsePCD(data, options));
    return;
  }
  const normalizedBatchSize = batchSize || pcdHeader.points;
  const dataBytes = new Uint8Array(data);

  for (let pointIndex = 0; pointIndex < pcdHeader.points; pointIndex += normalizedBatchSize) {
    const pointCount = Math.min(normalizedBatchSize, pcdHeader.points - pointIndex);
    const headerBytes = new TextEncoder().encode(makePCDHeaderText(pcdHeader, pointCount));
    const rowByteOffset = pcdHeader.headerLen + pointIndex * pcdHeader.rowSize;
    const rowByteLength = pointCount * pcdHeader.rowSize;
    const batchBytes = new Uint8Array(headerBytes.length + rowByteLength);
    batchBytes.set(headerBytes, 0);
    batchBytes.set(
      dataBytes.subarray(rowByteOffset, rowByteOffset + rowByteLength),
      headerBytes.length
    );
    yield convertPCDMesh(parsePCD(batchBytes.buffer, options));
  }
}

/** Reconstructs mesh data and its PCD header on the caller. */
function convertPCDTableToMesh(table: Table): PCDMesh {
  return {
    ...(convertTableToMesh(table) as PCDMesh),
    loader: 'pcd',
    loaderData: JSON.parse(table.schema.metadata.get(PCD_HEADER_KEY)!) as PCDHeader
  };
}

function makePCDHeaderText(pcdHeader: any, pointCount: number): string {
  const lines = pcdHeader.str
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0)
    .map(line => {
      if (/^WIDTH\s+/i.test(line)) {
        return `WIDTH ${pointCount}`;
      }
      if (/^HEIGHT\s+/i.test(line)) {
        return 'HEIGHT 1';
      }
      if (/^POINTS\s+/i.test(line)) {
        return `POINTS ${pointCount}`;
      }
      return line;
    });

  if (!lines.some(line => /^POINTS\s+/i.test(line))) {
    const dataLineIndex = lines.findIndex(line => /^DATA\s+/i.test(line));
    lines.splice(dataLineIndex >= 0 ? dataLineIndex : lines.length, 0, `POINTS ${pointCount}`);
  }

  return `${lines.join('\n')}\n`;
}

/** Hydrates a native worker table before optional mesh reconstruction. */
function deserializePCDWorkerResult(result: unknown, options?: PCDLoaderOptions): PCDMesh | Table {
  const table = deserializeNativeArrowWorkerResult(result);
  if (!isArrowTable(table)) throw new Error('PCD worker requires an Arrow table');
  return options?.pcd?.shape === 'mesh' ? convertPCDTableToMesh(table) : table;
}

/** Hydrates a worker batch and reconstructs the legacy mesh when requested. */
function deserializePCDWorkerBatch(
  result: unknown,
  options?: PCDLoaderOptions
): PCDMesh | RecordBatch {
  const chunk = deserializeNativeArrowWorkerResult(result);
  const batch = isArrowTable(chunk)
    ? (chunk.batches[0] ?? makeArrowMetadataBatch(chunk.schema))
    : chunk;
  return options?.pcd?.shape === 'mesh'
    ? convertPCDTableToMesh(new Table(batch.schema, [batch]))
    : batch;
}

/** Parses PCD batches before shared cumulative metadata refinement. */
async function* parsePCDWithMetadataInBatches(
  arrayBuffer:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: PCDLoaderOptions
): AsyncIterable<Table> {
  const batchSize = getNumericBatchSize(options);
  const data = await concatenateArrayBuffersAsync(arrayBuffer);
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);

  if (pcdHeader.data === 'ascii') {
    yield* parsePCDASCIIInBatches(data, options, batchSize);
    return;
  }

  if (pcdHeader.data === 'binary') {
    yield* parsePCDBinaryInBatches(data, options, batchSize);
    return;
  }

  yield convertPCDMesh(parsePCD(data, options));
}
