// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  concatenateArrayBuffersAsync,
  makeLineIterator,
  makeTextDecoderIterator,
  makeTableScanBatch,
  type Loader,
  type LoaderOptions,
  type LoaderWithParser
} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh, getMeshBoundingBox} from '@loaders.gl/schema-utils';
import {getOBJSchema} from './lib/get-obj-schema';
import {parseOBJ} from './lib/parse-obj';
import {OBJWorkerLoader as OBJWorkerLoaderMetadata} from './obj-loader';
import {OBJLoader as OBJLoaderMetadata} from './obj-loader';

const {preload: _OBJWorkerLoaderPreload, ...OBJWorkerLoaderMetadataWithoutPreload} =
  OBJWorkerLoaderMetadata;
const {preload: _OBJLoaderPreload, ...OBJLoaderMetadataWithoutPreload} = OBJLoaderMetadata;

export type OBJLoaderOptions = LoaderOptions & {
  obj?: {
    /** Output shape. Defaults to a legacy Mesh object. */
    shape?: 'mesh' | 'arrow-table';
    /** Treat OBJ vertex records as a point cloud and stream `v` rows in batches. */
    pointCloud?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

type OBJMeshBatch = {
  /** Batch shape for legacy Mesh output. */
  shape: 'mesh';
  /** Indicates a parsed data batch. */
  batchType: 'data';
  /** Parsed OBJ mesh. */
  data: Mesh;
  /** Number of vertices in the batch. */
  length: number;
};

type OBJParsedBatch = OBJMeshBatch | ArrowTableBatch;

function convertOBJMesh(mesh: Mesh, options?: OBJLoaderOptions): Mesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  return options?.obj?.shape === 'arrow-table' ? table : convertTableToMesh(table);
}

/**
 * Worker loader for the OBJ geometry format
 */
export const OBJWorkerLoaderWithParser = {
  ...OBJWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<Mesh | MeshArrowTable, never, OBJLoaderOptions>;

// OBJLoaderWithParser

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoaderWithParser = {
  ...OBJLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(new TextDecoder().decode(arrayBuffer), options), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(text, options), options),
  parseInBatches: async function* (
    arrayBuffer:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ): AsyncIterable<OBJParsedBatch> {
    const batchSize = getNumericBatchSize(options);
    if (options?.obj?.pointCloud) {
      const textIterator = makeTextDecoderIterator(arrayBuffer as AsyncIterable<ArrayBuffer>);
      const lineIterator = makeLineIterator(textIterator);
      yield* parseOBJPointCloudLinesInBatches(lineIterator, options, batchSize);
      return;
    }

    const data = await concatenateArrayBuffersAsync(arrayBuffer);
    const text = new TextDecoder().decode(data);
    if (hasOBJGeometryRecords(text)) {
      yield makeOBJBatch(parseOBJ(text, options), options);
      return;
    }

    yield* parseOBJPointCloudInBatches(text, options, batchSize);
  }
} as const satisfies LoaderWithParser<Mesh | MeshArrowTable, OBJParsedBatch, OBJLoaderOptions>;

/** Returns a numeric batch size when batching has an explicit row count. */
function getNumericBatchSize(options?: OBJLoaderOptions): number | undefined {
  const batchSize = options?.batchSize ?? options?.core?.batchSize;
  return typeof batchSize === 'number' ? batchSize : undefined;
}

function hasOBJGeometryRecords(text: string): boolean {
  return text.split(/\r?\n/).some(line => {
    const trimmedLine = line.trimStart();
    return trimmedLine.startsWith('f ') || trimmedLine.startsWith('l ');
  });
}

function* parseOBJPointCloudInBatches(
  text: string,
  options?: OBJLoaderOptions,
  batchSize?: number
): Iterable<OBJParsedBatch> {
  const vertexLines = text.split(/\r?\n/).filter(line => line.trimStart().startsWith('v '));
  yield* makeOBJPointCloudBatches(vertexLines, options, batchSize);
}

async function* parseOBJPointCloudLinesInBatches(
  lines: AsyncIterable<string>,
  options?: OBJLoaderOptions,
  batchSize?: number
): AsyncIterable<OBJParsedBatch> {
  const normalizedBatchSize = batchSize || 1000;
  let vertexLines: string[] = [];

  for await (const line of lines) {
    if (!line.trimStart().startsWith('v ')) {
      continue;
    }
    vertexLines.push(line);
    if (vertexLines.length >= normalizedBatchSize) {
      yield makeOBJBatch(parseOBJPointCloudMesh(vertexLines), options);
      vertexLines = [];
    }
  }

  if (vertexLines.length > 0) {
    yield makeOBJBatch(parseOBJPointCloudMesh(vertexLines), options);
  }
}

function* makeOBJPointCloudBatches(
  vertexLines: string[],
  options?: OBJLoaderOptions,
  batchSize?: number
): Iterable<OBJParsedBatch> {
  const normalizedBatchSize = batchSize || vertexLines.length || 1;

  for (let rowIndex = 0; rowIndex < vertexLines.length; rowIndex += normalizedBatchSize) {
    const mesh = parseOBJPointCloudMesh(
      vertexLines.slice(rowIndex, rowIndex + normalizedBatchSize)
    );
    yield makeOBJBatch(mesh, options);
  }
}

/** Builds a point-list mesh directly from OBJ `v` records. */
function parseOBJPointCloudMesh(vertexLines: string[]): Mesh {
  const positions = new Float32Array(vertexLines.length * 3);

  for (let vertexIndex = 0; vertexIndex < vertexLines.length; vertexIndex++) {
    const values = vertexLines[vertexIndex].trim().split(/\s+/);
    positions[vertexIndex * 3 + 0] = Number(values[1]);
    positions[vertexIndex * 3 + 1] = Number(values[2]);
    positions[vertexIndex * 3 + 2] = Number(values[3]);
  }

  const attributes = {
    POSITION: {
      value: positions,
      size: 3
    }
  };
  const boundingBox = getMeshBoundingBox(attributes);

  return {
    loaderData: {
      header: {}
    },
    schema: getOBJSchema(attributes, {
      mode: 0,
      boundingBox
    }),
    header: {
      vertexCount: vertexLines.length,
      boundingBox
    },
    mode: 0,
    topology: 'point-list',
    attributes
  };
}

function makeOBJBatch(mesh: Mesh, options?: OBJLoaderOptions): OBJParsedBatch {
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.obj?.shape !== 'arrow-table') {
    const convertedMesh = convertTableToMesh(table);
    return {
      shape: 'mesh',
      batchType: 'data',
      data: convertedMesh,
      length: convertedMesh.header?.vertexCount || 0
    };
  }

  return makeTableScanBatch(table);
}
