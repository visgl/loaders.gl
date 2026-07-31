// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseCOPCLAS, parseCOPCLASInBatches} from './lib/copc/parse-las';
import {LASLoader as LASLoaderMetadata} from './las-loader';

const {preload: _LASLoaderPreload, ...LASLoaderMetadataWithoutPreload} = LASLoaderMetadata;

/**
 * Loader for LAS/LAZ using the laz-perf backend from the COPC package.
 */
export const LASCOPCLoaderWithParser = {
  ...LASLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(await parseCOPCLAS(arrayBuffer, options), options),
  parseInBatches: (arrayBufferIterator, options?: LASLoaderOptions) =>
    convertLASMeshBatches(parseCOPCLASInBatches(arrayBufferIterator, options), options)
} as const satisfies LoaderWithParser<
  LASMesh | MeshArrowTable,
  LASMesh | MeshArrowTable,
  LASLoaderOptions
>;

function convertLASMesh(mesh: LASMesh, options?: LASLoaderOptions): LASMesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.las?.shape === 'arrow-table') {
    return table;
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
): AsyncIterable<LASMesh | MeshArrowTable> {
  for await (const mesh of meshBatches) {
    yield convertLASMesh(mesh, options);
  }
}
