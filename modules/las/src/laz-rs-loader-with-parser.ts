// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseLAS, parseLASInBatches} from './lib/laz-rs-wasm/parse-las';
import initLazRsWasm from './libs/laz-rs-wasm/laz_rs_wasm';
import {LAZRsLoader as LAZRsLoaderMetadata} from './laz-rs-loader';

const {preload: _LAZRsLoaderPreload, ...LAZRsLoaderMetadataWithoutPreload} = LAZRsLoaderMetadata;

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LAZRsLoaderWithParser = {
  ...LAZRsLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) => {
    await initLazRsWasm();
    return convertLASMesh(parseLAS(arrayBuffer, {...options}), options);
  },
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    await initLazRsWasm();
    for await (const mesh of parseLASInBatches(arrayBufferIterator, options)) {
      yield convertLASMesh(mesh, options);
    }
  }
} as const satisfies LoaderWithParser<
  LASMesh | MeshArrowTable,
  LASMesh | MeshArrowTable,
  LASLoaderOptions
>;

function convertLASMesh(mesh: LASMesh, options?: LASLoaderOptions): LASMesh | MeshArrowTable {
  return options?.las?.shape === 'arrow-table' ? convertMeshToTable(mesh, 'arrow-table') : mesh;
}
