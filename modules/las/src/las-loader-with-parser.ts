// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseLAS, parseLASInBatches, type LASArrowTable} from './lib/typescript/parse-las';
import {LASLoader as LASLoaderMetadata} from './las-loader';

const {preload: _LASLoaderPreload, ...LASLoaderMetadataWithoutPreload} = LASLoaderMetadata;

/** Parser-bearing TypeScript-only LAS loader implementation. */
export const LASLoaderWithParser = {
  ...LASLoaderMetadataWithoutPreload,
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

function convertLASMesh(
  table: LASArrowTable,
  options?: LASLoaderOptions
): LASMesh | MeshArrowTable {
  if (options?.las?.shape === 'arrow-table') {
    return table;
  }
  return {
    ...(convertTableToMesh(table) as LASMesh),
    loader: table.loader,
    loaderData: table.loaderData,
    progress: table.progress
  } as LASMesh & {progress?: number};
}

async function* convertLASMeshBatches(
  tableBatches: AsyncIterable<LASArrowTable>,
  options?: LASLoaderOptions
): AsyncIterable<LASMesh | MeshArrowTable> {
  for await (const table of tableBatches) {
    yield convertLASMesh(table, options);
  }
}
