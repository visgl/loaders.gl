// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseLAS, parseLASInBatches} from './lib/typescript/parse-las';
import {TypeScriptLASLoader as TypeScriptLASLoaderMetadata} from './typescript-loader';

const {preload: _TypeScriptLASLoaderPreload, ...TypeScriptLASLoaderMetadataWithoutPreload} =
  TypeScriptLASLoaderMetadata;

/** Parser-bearing TypeScript-only LAS loader implementation. */
export const TypeScriptLASLoaderWithParser = {
  ...TypeScriptLASLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLAS(arrayBuffer, options), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLAS(arrayBuffer, options), options),
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    yield* convertLASMeshBatches(parseLASInBatches(arrayBufferIterator, options), options);
  }
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

async function* convertLASMeshBatches(
  meshBatches: AsyncIterable<LASMesh>,
  options?: LASLoaderOptions
): AsyncIterable<LASMesh | MeshArrowTable> {
  for await (const mesh of meshBatches) {
    yield convertLASMesh(mesh, options);
  }
}
