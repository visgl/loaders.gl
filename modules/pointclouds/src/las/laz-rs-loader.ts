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
import {parseLAS, parseLASInBatches} from './lib/laz-rs-wasm/parse-las';
import initLazRsWasm from './libs/laz-rs-wasm/laz_rs_wasm';

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LAZRsLoaderWithParser = {
  ...LAS_LOADER_METADATA,
  name: 'LAS (laz-rs)',
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) => {
    await initLazRsWasm();
    return toPublicLASResult(convertLASMesh(parseLAS(arrayBuffer, {...options}), options));
  },
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    await initLazRsWasm();
    for await (const mesh of parseLASInBatches(arrayBufferIterator, options)) {
      const result = convertLASMesh(mesh, options);
      if ('shape' in result) yield* getLASRecordBatches(result);
      else yield result;
    }
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
