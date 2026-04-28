// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {parseLAS} from './lib/laz-perf/parse-las';
import {LAZPerfLoader as LAZPerfLoaderMetadata} from './lazperf-loader';

const {preload: _LAZPerfLoaderPreload, ...LAZPerfLoaderMetadataWithoutPreload} =
  LAZPerfLoaderMetadata;

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LAZPerfLoaderWithParser = {
  ...LAZPerfLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLAS(arrayBuffer, options), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLAS(arrayBuffer, options), options)
} as const satisfies LoaderWithParser<LASMesh | MeshArrowTable, never, LASLoaderOptions>;

function convertLASMesh(mesh: LASMesh, options?: LASLoaderOptions): LASMesh | MeshArrowTable {
  return options?.las?.shape === 'arrow-table' ? convertMeshToTable(mesh, 'arrow-table') : mesh;
}
