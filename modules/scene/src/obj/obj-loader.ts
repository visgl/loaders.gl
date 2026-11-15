// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {refineArrowTableBatches, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import {Table, type RecordBatch} from 'apache-arrow';
import type {OBJLoaderOptions, OBJMeshBatch, OBJParsedBatch} from './obj-loader-types';

import {
  concatenateArrayBuffersAsync,
  makeLineIterator,
  makeTextDecoderIterator,
  type LoaderWithParser
} from '@loaders.gl/core/loader-utils';
import type {Mesh} from '@loaders.gl/core/schema';
import {
  deserializeNativeArrowWorkerResult,
  serializeNativeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';
import {
  convertMeshToArrowTable,
  convertTableToMesh,
  isNativeArrowTable,
  getMeshBoundingBox
} from '@loaders.gl/core/schema-utils';
import {getOBJSchema} from './lib/get-obj-schema';
import {parseOBJ} from './lib/parse-obj';
import {OBJLoader as OBJLoaderMetadata} from './obj-loader-types';

const {preload: _OBJLoaderPreload, ...OBJLoaderMetadataWithoutPreload} = OBJLoaderMetadata;

/** Converts an OBJ mesh through native Arrow and materializes the mesh layout on request. */
function convertOBJMesh(mesh: Mesh, options?: OBJLoaderOptions): Mesh | Table {
  const table = convertMeshToArrowTable(mesh);
  return options?.obj?.shape === 'mesh' ? convertTableToMesh(table) : table;
}

/** Loader for OBJ geometry. */
export const OBJLoaderWithParser = {
  ...OBJLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(new TextDecoder().decode(arrayBuffer), options), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(text, options), options),
  async *parseInBatches(input, options) {
    for await (const chunk of refineArrowTableBatches(
      parseOBJWithMetadataInBatches(input, options)
    )) {
      if (options?.obj?.shape === 'mesh') yield convertOBJBatchToMesh(chunk);
      else if (chunk.batches.length) yield* chunk.batches;
      else yield makeArrowMetadataBatch(chunk.schema);
    }
  },
  serializeWorkerResult: result => serializeNativeArrowWorkerResult(result as Table),
  deserializeWorkerResult: deserializeOBJWorkerResult,
  serializeWorkerBatch: batch => serializeNativeArrowWorkerResult(batch as RecordBatch),
  deserializeWorkerBatch: deserializeOBJWorkerBatch
} as const satisfies LoaderWithParser<Mesh | Table, OBJParsedBatch, OBJLoaderOptions>;

/** Returns a numeric batch size when batching has an explicit row count. */
function getNumericBatchSize(options?: OBJLoaderOptions): number | undefined {
  const batchSize = options?.core?.batchSize;
  return typeof batchSize === 'number' ? batchSize : undefined;
}

function hasOBJGeometryRecords(text: string): boolean {
  return text.split(/\r?\n/).some(line => {
    const trimmedLine = line.trimStart();
    return trimmedLine.startsWith('f ') || trimmedLine.startsWith('l ');
  });
}

function* parseOBJPointCloudInBatches(text: string, batchSize?: number): Iterable<Table> {
  const vertexLines = text.split(/\r?\n/).filter(line => line.trimStart().startsWith('v '));
  yield* makeOBJPointCloudBatches(vertexLines, batchSize);
}

async function* parseOBJPointCloudLinesInBatches(
  lines: AsyncIterable<string>,
  batchSize?: number
): AsyncIterable<Table> {
  const normalizedBatchSize = batchSize || 1000;
  let vertexLines: string[] = [];

  for await (const line of lines) {
    if (!line.trimStart().startsWith('v ')) {
      continue;
    }
    vertexLines.push(line);
    if (vertexLines.length >= normalizedBatchSize) {
      yield convertMeshToArrowTable(parseOBJPointCloudMesh(vertexLines));
      vertexLines = [];
    }
  }

  if (vertexLines.length > 0) {
    yield convertMeshToArrowTable(parseOBJPointCloudMesh(vertexLines));
  }
}

function* makeOBJPointCloudBatches(
  vertexLines: string[],
  options?: OBJLoaderOptions,
  batchSize?: number
): Iterable<Table> {
  const normalizedBatchSize = batchSize || vertexLines.length || 1;

  for (let rowIndex = 0; rowIndex < vertexLines.length; rowIndex += normalizedBatchSize) {
    const mesh = parseOBJPointCloudMesh(
      vertexLines.slice(rowIndex, rowIndex + normalizedBatchSize)
    );
    yield convertMeshToArrowTable(mesh);
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
      boundingBox: boundingBox ?? undefined
    }),
    header: {
      vertexCount: vertexLines.length,
      boundingBox: boundingBox ?? undefined
    },
    mode: 0,
    topology: 'point-list',
    attributes
  };
}

/** Creates the mesh batch envelope from decoded native columns. */
function convertOBJBatchToMesh(table: Table): OBJMeshBatch {
  return {shape: 'mesh', batchType: 'data', data: convertTableToMesh(table), length: table.numRows};
}

/** Hydrates a native worker table before optional mesh reconstruction. */
function deserializeOBJWorkerResult(result: unknown, options?: OBJLoaderOptions): Mesh | Table {
  const table = deserializeNativeArrowWorkerResult(result);
  if (!isNativeArrowTable(table)) throw new Error('OBJ worker requires an Arrow table');
  return options?.obj?.shape === 'mesh' ? convertTableToMesh(table) : table;
}

/** Hydrates a worker batch and reconstructs the mesh envelope when requested. */
function deserializeOBJWorkerBatch(result: unknown, options?: OBJLoaderOptions): OBJParsedBatch {
  const chunk = deserializeNativeArrowWorkerResult(result);
  const batch = isNativeArrowTable(chunk)
    ? (chunk.batches[0] ?? makeArrowMetadataBatch(chunk.schema))
    : chunk;
  return options?.obj?.shape === 'mesh'
    ? convertOBJBatchToMesh(new Table(batch.schema, [batch]))
    : batch;
}

/** Parses OBJ batches before shared cumulative metadata refinement. */
async function* parseOBJWithMetadataInBatches(
  arrayBuffer:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: OBJLoaderOptions
): AsyncIterable<Table> {
  const batchSize = getNumericBatchSize(options);
  if (options?.obj?.pointCloud) {
    const textIterator = makeTextDecoderIterator(arrayBuffer as AsyncIterable<ArrayBuffer>);
    const lineIterator = makeLineIterator(textIterator);
    yield* parseOBJPointCloudLinesInBatches(lineIterator, batchSize);
    return;
  }

  const data = await concatenateArrayBuffersAsync(arrayBuffer);
  const text = new TextDecoder().decode(data);
  if (hasOBJGeometryRecords(text)) {
    yield convertMeshToArrowTable(parseOBJ(text, options));
    return;
  }

  yield* parseOBJPointCloudInBatches(text, batchSize);
}
