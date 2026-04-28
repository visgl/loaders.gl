// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {PLYMesh} from './lib/ply-types';
import type {ParsePLYOptions} from './lib/parse-ply';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parsePLY} from './lib/parse-ply';
import {parsePLYInBatches} from './lib/parse-ply-in-batches';
import {PLYWorkerLoader as PLYWorkerLoaderMetadata} from './ply-loader';
import {PLYLoader as PLYLoaderMetadata} from './ply-loader';

const {preload: _PLYWorkerLoaderPreload, ...PLYWorkerLoaderMetadataWithoutPreload} =
  PLYWorkerLoaderMetadata;
const {preload: _PLYLoaderPreload, ...PLYLoaderMetadataWithoutPreload} = PLYLoaderMetadata;

export type PLYLoaderOptions = LoaderOptions & {
  ply?: ParsePLYOptions & {
    /** Output shape. Defaults to a legacy Mesh object. */
    shape?: 'mesh' | 'arrow-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

function convertPLYMesh(mesh: PLYMesh, options?: PLYLoaderOptions): PLYMesh | MeshArrowTable {
  return options?.ply?.shape === 'arrow-table' ? convertMeshToTable(mesh, 'arrow-table') : mesh;
}

/**
 * Worker loader for PLY - Polygon File Format (aka Stanford Triangle Format)'
 * links: ['http://paulbourke.net/dataformats/ply/',
 * 'https://en.wikipedia.org/wiki/PLY_(file_format)']
 */
export const PLYWorkerLoaderWithParser = {
  ...PLYWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<PLYMesh | MeshArrowTable, never, LoaderOptions>;

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoaderWithParser = {
  ...PLYLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) =>
    convertPLYMesh(parsePLY(arrayBuffer, options?.ply), options),
  parseTextSync: (arrayBuffer, options) =>
    convertPLYMesh(parsePLY(arrayBuffer, options?.ply), options),
  parseSync: (arrayBuffer, options) => convertPLYMesh(parsePLY(arrayBuffer, options?.ply), options),
  parseInBatches: async function* (
    arrayBuffer:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) {
    for await (const mesh of parsePLYInBatches(arrayBuffer, options?.ply)) {
      yield convertPLYMesh(mesh, options);
    }
  }
} as const satisfies LoaderWithParser<PLYMesh | MeshArrowTable, any, PLYLoaderOptions>;
