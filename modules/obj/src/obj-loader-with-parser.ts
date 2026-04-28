// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parseOBJ} from './lib/parse-obj';
import {OBJWorkerLoader as OBJWorkerLoaderMetadata} from './obj-loader';
import {OBJLoader as OBJLoaderMetadata} from './obj-loader';

const {preload: _OBJWorkerLoaderPreload, ...OBJWorkerLoaderMetadataWithoutPreload} =
  OBJWorkerLoaderMetadata;
const {preload: _OBJLoaderPreload, ...OBJLoaderMetadataWithoutPreload} = OBJLoaderMetadata;

export type OBJLoaderOptions = LoaderOptions & {
  obj?: {
    /** Output shape. Defaults to a legacy Mesh object. */
    shape?: 'mesh' | 'arrow-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

function convertOBJMesh(mesh: Mesh, options?: OBJLoaderOptions): Mesh | MeshArrowTable {
  return options?.obj?.shape === 'arrow-table' ? convertMeshToTable(mesh, 'arrow-table') : mesh;
}

/**
 * Worker loader for the OBJ geometry format
 */
export const OBJWorkerLoaderWithParser = {
  ...OBJWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<Mesh | MeshArrowTable, never, OBJLoaderOptions>;

// OBJLoaderWithParser

/**
 * Loader for the OBJ geometry format
 */
export const OBJLoaderWithParser = {
  ...OBJLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(new TextDecoder().decode(arrayBuffer), options), options),
  parseTextSync: (text: string, options?: OBJLoaderOptions) =>
    convertOBJMesh(parseOBJ(text, options), options)
} as const satisfies LoaderWithParser<Mesh | MeshArrowTable, never, OBJLoaderOptions>;
