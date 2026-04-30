// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import type {PCDMesh} from './lib/pcd-types';
import {parsePCD} from './lib/parse-pcd';
import {PCDWorkerLoader as PCDWorkerLoaderMetadata} from './pcd-loader';
import {PCDLoader as PCDLoaderMetadata} from './pcd-loader';

const {preload: _PCDWorkerLoaderPreload, ...PCDWorkerLoaderMetadataWithoutPreload} =
  PCDWorkerLoaderMetadata;
const {preload: _PCDLoaderPreload, ...PCDLoaderMetadataWithoutPreload} = PCDLoaderMetadata;

export type PCDLoaderOptions = LoaderOptions & {
  pcd?: {
    /** Output shape. Defaults to a legacy PointCloud object. */
    shape?: 'mesh' | 'arrow-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

function convertPCDMesh(mesh: PCDMesh, options?: PCDLoaderOptions): PCDMesh | MeshArrowTable {
  return options?.pcd?.shape === 'arrow-table' ? convertMeshToTable(mesh, 'arrow-table') : mesh;
}

/**
 * Worker loader for PCD - Point Cloud Data
 */
export const PCDWorkerLoaderWithParser = {
  ...PCDWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<PCDMesh | MeshArrowTable, never, PCDLoaderOptions>;

/**
 * Loader for PCD - Point Cloud Data
 */
export const PCDLoaderWithParser = {
  ...PCDLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => convertPCDMesh(parsePCD(arrayBuffer), options),
  parseSync: (arrayBuffer, options) => convertPCDMesh(parsePCD(arrayBuffer), options)
} as const satisfies LoaderWithParser<PCDMesh | MeshArrowTable, never, PCDLoaderOptions>;
