// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import {getLASRecordBatches, toPublicLASResult} from './las-loader';
import type {MeshArrowTable} from '@loaders.gl/core/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/core/schema-utils';
import {
  formatLASMeshColors,
  getLASShape,
  LAS_LOADER_METADATA,
  type LASLoaderOptions
} from './las-loader-shared';
import type {LASMesh} from './lib/las-types';
import {parseLAS, parseLASInBatches} from './lib/laz-perf/parse-las';

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LAZPerfLoaderWithParser = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (laz-perf)',
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    toPublicLASResult(convertLASMesh(parseLAS(arrayBuffer, options), options)),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    toPublicLASResult(convertLASMesh(parseLAS(arrayBuffer, options), options)),
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    yield* convertLASMeshBatches(parseLASInBatches(arrayBufferIterator, options), options);
  }
} as const satisfies LoaderWithParser<LASMesh | Table, LASMesh | RecordBatch, LASLoaderOptions>;

function convertLASMesh(mesh: LASMesh, options?: LASLoaderOptions): LASMesh | MeshArrowTable {
  const formattedMesh = formatLASMeshColors(mesh, options?.las?.colorFormat || 'uint8norm');
  const table = convertMeshToTable(formattedMesh, 'arrow-table') as MeshArrowTable;
  if (getLASShape(options) === 'arrow') {
    return {...table, loaderData: mesh.loaderData};
  }
  return {
    ...(convertTableToMesh(table) as LASMesh),
    loader: mesh.loader,
    loaderData: mesh.loaderData,
    progress: (mesh as LASMesh & {progress?: number}).progress
  } as LASMesh & {progress?: number};
}

/**
 * Convert LAS mesh batches to the requested output shape.
 * @param meshBatches Decoded LAS mesh batches
 * @param options LAS loader options
 * @returns Converted LAS batches
 */
async function* convertLASMeshBatches(
  meshBatches: AsyncIterable<LASMesh>,
  options?: LASLoaderOptions
): AsyncIterable<LASMesh | RecordBatch> {
  for await (const mesh of meshBatches) {
    const result = convertLASMesh(mesh, options);
    if ('shape' in result) yield* getLASRecordBatches(result);
    else yield result;
  }
}
