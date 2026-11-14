// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {refineArrowTableBatches, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import type {Table} from 'apache-arrow';
import type {OBJLoaderOptions, OBJMeshBatch, OBJParsedBatch} from './obj-loader-types';

import {
  concatenateArrayBuffersAsync,
  makeLineIterator,
  makeTextDecoderIterator,
  makeTableScanBatch,
  type LoaderWithParser
} from '@loaders.gl/core/loader-utils';
import type {Mesh, MeshArrowTable, ArrowTableBatch} from '@loaders.gl/core/schema';
import {
  deserializeArrowWorkerTable,
  serializeArrowWorkerTable
} from '@loaders.gl/core/arrow-worker-transport';
import {
  convertMeshToTable,
  convertTableToMesh,
  getMeshBoundingBox
} from '@loaders.gl/core/schema-utils';
import {getOBJSchema} from './lib/get-obj-schema';
import {parseOBJ} from './lib/parse-obj';
import {OBJLoader as OBJLoaderMetadata} from './obj-loader-types';

const {preload: _OBJLoaderPreload, ...OBJLoaderMetadataWithoutPreload} = OBJLoaderMetadata;

function convertOBJMesh(mesh: Mesh, options?: OBJLoaderOptions): Mesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  return options?.obj?.shape === 'mesh' ? convertTableToMesh(table) : table;
}

// OBJLoaderWithParser

/**
 * Loader for the OBJ geometry format
 */
export const OBJColumnLoader = {
  ...OBJLoaderMetadataWithoutPreload,
  dataType: null as unknown as Mesh | MeshArrowTable,
  batchType: null as unknown as OBJMeshBatch | ArrowTableBatch,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(new TextDecoder().decode(arrayBuffer), options), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(text, options), options),
  parseInBatches: (input, options) =>
    refineArrowTableBatches(parseOBJWithMetadataInBatches(input, options)),
  serializeWorkerResult: serializeArrowWorkerTable,
  deserializeWorkerResult: deserializeOBJWorkerResult,
  serializeWorkerBatch: serializeArrowWorkerTable,
  deserializeWorkerBatch: deserializeOBJWorkerBatch
} as const satisfies LoaderWithParser<
  Mesh | MeshArrowTable,
  OBJMeshBatch | ArrowTableBatch,
  OBJLoaderOptions
>;

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

function* parseOBJPointCloudInBatches(
  text: string,
  options?: OBJLoaderOptions,
  batchSize?: number
): Iterable<OBJMeshBatch | ArrowTableBatch> {
  const vertexLines = text.split(/\r?\n/).filter(line => line.trimStart().startsWith('v '));
  yield* makeOBJPointCloudBatches(vertexLines, options, batchSize);
}

async function* parseOBJPointCloudLinesInBatches(
  lines: AsyncIterable<string>,
  options?: OBJLoaderOptions,
  batchSize?: number
): AsyncIterable<OBJMeshBatch | ArrowTableBatch> {
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
): Iterable<OBJMeshBatch | ArrowTableBatch> {
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

function makeOBJBatch(mesh: Mesh, options?: OBJLoaderOptions): OBJMeshBatch | ArrowTableBatch {
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.obj?.shape === 'mesh') {
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

/** Hydrates worker columns before applying the requested legacy mesh shape on the caller. */
function deserializeOBJWorkerResult(
  result: unknown,
  options?: OBJLoaderOptions
): Mesh | MeshArrowTable {
  const table = deserializeArrowWorkerTable(result);
  return options?.obj?.shape === 'mesh' ? convertTableToMesh(table) : table;
}

/** Restores the OBJ mesh batch envelope after caller-side conversion. */
function deserializeOBJWorkerBatch(
  result: unknown,
  options?: OBJLoaderOptions
): OBJMeshBatch | ArrowTableBatch {
  const table = deserializeArrowWorkerTable(result);
  if (options?.obj?.shape !== 'mesh') return table;
  const mesh = convertTableToMesh(table);
  return {shape: 'mesh', batchType: 'data', data: mesh, length: table.length};
}

/** Parses OBJ batches before shared cumulative metadata refinement. */
async function* parseOBJWithMetadataInBatches(
  arrayBuffer:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: OBJLoaderOptions
): AsyncIterable<OBJMeshBatch | ArrowTableBatch> {
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

/** Exposes native Arrow output while retaining the worker's column protocol. */
export const OBJLoaderWithParser = {
  ...OBJColumnLoader,
  dataType: OBJLoaderMetadata.dataType,
  batchType: OBJLoaderMetadata.batchType,
  parse: async (input: ArrayBuffer, options?: OBJLoaderOptions) =>
    unwrapOBJTable(await OBJColumnLoader.parse(input, options)),
  parseTextSync: (input: string, options?: OBJLoaderOptions) =>
    unwrapOBJTable(OBJColumnLoader.parseTextSync(input, options)),
  async *parseInBatches(input, options) {
    for await (const batch of OBJColumnLoader.parseInBatches(input, options)) {
      if ('shape' in batch && batch.shape === 'arrow-table') {
        if (batch.data.batches.length) yield* batch.data.batches;
        else yield makeArrowMetadataBatch(batch.data.schema);
      } else yield batch;
    }
  },
  deserializeWorkerResult: (result: unknown, options?: OBJLoaderOptions) =>
    unwrapOBJTable(OBJColumnLoader.deserializeWorkerResult(result, options)),
  deserializeWorkerBatch(result: unknown, options?: OBJLoaderOptions) {
    const batch = OBJColumnLoader.deserializeWorkerBatch(result, options);
    return 'shape' in batch && batch.shape === 'arrow-table'
      ? (batch.data.batches[0] ?? makeArrowMetadataBatch(batch.data.schema))
      : batch;
  }
} as const satisfies LoaderWithParser<Mesh | Table, OBJParsedBatch, OBJLoaderOptions>;

/** Returns the Arrow table with its file metadata or the requested mesh. */
function unwrapOBJTable(result: Mesh | MeshArrowTable): Mesh | Table {
  if ('shape' in result && result.shape === 'arrow-table') {
    return result.data;
  }
  return result as Mesh;
}
