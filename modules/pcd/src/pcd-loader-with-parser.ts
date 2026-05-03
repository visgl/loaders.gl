// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  concatenateArrayBuffersAsync,
  type Loader,
  type LoaderOptions,
  type LoaderWithParser
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import type {PCDMesh} from './lib/pcd-types';
import {parsePCD, parsePCDHeader} from './lib/parse-pcd';
import {PCDWorkerLoader as PCDWorkerLoaderMetadata} from './pcd-loader';
import {PCDLoader as PCDLoaderMetadata} from './pcd-loader';

const {preload: _PCDWorkerLoaderPreload, ...PCDWorkerLoaderMetadataWithoutPreload} =
  PCDWorkerLoaderMetadata;
const {preload: _PCDLoaderPreload, ...PCDLoaderMetadataWithoutPreload} = PCDLoaderMetadata;

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Output shape. Defaults to a legacy PointCloud object. */
    shape?: 'mesh' | 'arrow-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

type PCDParsedBatch = PCDMesh | ArrowTableBatch;

function convertPCDMesh(mesh: PCDMesh, options?: PCDLoaderOptions): PCDMesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  return options?.pcd?.shape === 'arrow-table' ? table : convertPCDTableToMesh(table, mesh);
}

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PCDWorkerLoaderWithParser = {
  ...PCDWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<PCDMesh | MeshArrowTable, never, PCDLoaderOptions>;

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoaderWithParser = {
  ...PCDLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => convertPCDMesh(parsePCD(arrayBuffer), options),
  parseSync: (arrayBuffer, options) => convertPCDMesh(parsePCD(arrayBuffer), options),
  parseInBatches: async function* (
    arrayBuffer:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ): AsyncIterable<PCDParsedBatch> {
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

    yield makePCDBatch(parsePCD(data), options);
  }
} as const satisfies LoaderWithParser<PCDMesh | MeshArrowTable, PCDParsedBatch, PCDLoaderOptions>;

/** Returns a numeric batch size when batching has an explicit row count. */
function getNumericBatchSize(options?: PCDLoaderOptions): number | undefined {
  const batchSize = options?.batchSize ?? options?.core?.batchSize;
  return typeof batchSize === 'number' ? batchSize : undefined;
}

function* parsePCDASCIIInBatches(
  data: ArrayBuffer,
  options?: PCDLoaderOptions,
  batchSize?: number
): Iterable<PCDParsedBatch> {
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);
  const lines = textData
    .slice(pcdHeader.headerLen)
    .split(/\r?\n/)
    .filter(line => line.trim().length > 0);
  const normalizedBatchSize = batchSize || lines.length || 1;

  for (let rowIndex = 0; rowIndex < lines.length; rowIndex += normalizedBatchSize) {
    const batchLines = lines.slice(rowIndex, rowIndex + normalizedBatchSize);
    const batchText = `${makePCDHeaderText(pcdHeader, batchLines.length)}${batchLines.join('\n')}\n`;
    yield makePCDBatch(parsePCD(new TextEncoder().encode(batchText).buffer), options);
  }
}

function* parsePCDBinaryInBatches(
  data: ArrayBuffer,
  options?: PCDLoaderOptions,
  batchSize?: number
): Iterable<PCDParsedBatch> {
  const textData = new TextDecoder().decode(data);
  const pcdHeader = parsePCDHeader(textData);
  const normalizedBatchSize = batchSize || pcdHeader.points || 1;
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
    yield makePCDBatch(parsePCD(batchBytes.buffer), options);
  }
}

function makePCDBatch(mesh: PCDMesh, options?: PCDLoaderOptions): PCDParsedBatch {
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.pcd?.shape !== 'arrow-table') {
    return convertPCDTableToMesh(table, mesh);
  }

  return {
    shape: 'arrow-table',
    batchType: 'data',
    schema: table.schema,
    data: table.data,
    length: table.data.numRows
  };
}

/** Convert the parser's Arrow table to legacy PCD mesh output. */
function convertPCDTableToMesh(table: MeshArrowTable, sourceMesh: PCDMesh): PCDMesh {
  return {
    ...(convertTableToMesh(table) as PCDMesh),
    loader: sourceMesh.loader,
    loaderData: sourceMesh.loaderData
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
