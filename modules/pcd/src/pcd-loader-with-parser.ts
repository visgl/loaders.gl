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
import {parsePCD, parsePCDHeader, parsePCDPackedArrowTable} from './lib/parse-pcd';
import {PCDWorkerLoader as PCDWorkerLoaderMetadata} from './pcd-loader';
import {PCDLoader as PCDLoaderMetadata} from './pcd-loader';

const {preload: _PCDWorkerLoaderPreload, ...PCDWorkerLoaderMetadataWithoutPreload} =
  PCDWorkerLoaderMetadata;
const {preload: _PCDLoaderPreload, ...PCDLoaderMetadataWithoutPreload} = PCDLoaderMetadata;

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Output shape. Defaults to a legacy PointCloud object. */
    shape?: 'mesh' | 'arrow-table';
    /** Return packed interleaved Arrow point records for GPU buffer upload. */
    interleaved?: boolean;
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
  parse: async (arrayBuffer, options) => parsePCDInRequestedShape(arrayBuffer, options),
  parseSync: (arrayBuffer, options) => parsePCDInRequestedShape(arrayBuffer, options),
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

    yield makePCDDataBatch(data, options);
  }
} as const satisfies LoaderWithParser<PCDMesh | MeshArrowTable, PCDParsedBatch, PCDLoaderOptions>;

/** Parse one PCD payload in the requested public output shape. */
function parsePCDInRequestedShape(
  arrayBuffer: ArrayBufferLike,
  options?: PCDLoaderOptions
): PCDMesh | MeshArrowTable {
  validatePCDInterleavedOptions(options);
  return options?.pcd?.interleaved
    ? parsePCDPackedArrowTable(arrayBuffer)
    : convertPCDMesh(parsePCD(arrayBuffer), options);
}

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
    yield makePCDDataBatch(new TextEncoder().encode(batchText).buffer, options);
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
    yield makePCDDataBatch(batchBytes.buffer, options);
  }
}

/** Parse one PCD batch payload in the requested shape and wrap Arrow output as a batch. */
function makePCDDataBatch(data: ArrayBufferLike, options?: PCDLoaderOptions): PCDParsedBatch {
  validatePCDInterleavedOptions(options);
  if (options?.pcd?.interleaved) {
    const table = parsePCDPackedArrowTable(data);
    return makePCDArrowBatch(table);
  }
  return makePCDBatch(parsePCD(data), options);
}

/** Wrap a parsed PCD mesh or Arrow table as the requested public batch shape. */
function makePCDBatch(mesh: PCDMesh, options?: PCDLoaderOptions): PCDParsedBatch {
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.pcd?.shape !== 'arrow-table') {
    return convertPCDTableToMesh(table, mesh);
  }

  return makePCDArrowBatch(table);
}

/** Wrap a PCD Arrow table as a loaders.gl Arrow table batch. */
function makePCDArrowBatch(table: MeshArrowTable): ArrowTableBatch {
  return {
    shape: 'arrow-table',
    batchType: 'data',
    schema: table.schema,
    data: table.data,
    length: table.data.numRows
  };
}

/** Validate PCD packed output options before parsing. */
function validatePCDInterleavedOptions(options?: PCDLoaderOptions): void {
  if (options?.pcd?.interleaved && options.pcd.shape !== 'arrow-table') {
    throw new Error('PCDLoader: pcd.interleaved requires pcd.shape="arrow-table"');
  }
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
