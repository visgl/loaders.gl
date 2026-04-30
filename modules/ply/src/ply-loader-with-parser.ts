// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {PLYMesh} from './lib/ply-types';
import type {ParsePLYOptions} from './lib/parse-ply';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
import {parsePLY, parsePLYToArrowTable} from './lib/parse-ply';
import {
  convertPLYElementTablesToMesh,
  convertPLYElementTablesToMeshArrowTable,
  parsePLYToElementTables
} from './lib/parse-ply-arrow';
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

/** Parse PLY data using a direct Arrow path when requested and supported. */
function parsePLYData(
  data: ArrayBuffer | string,
  options?: PLYLoaderOptions
): PLYMesh | MeshArrowTable {
  if (options?.ply?._useLegacyParser) {
    return convertPLYMesh(parsePLY(data, options?.ply), options);
  }

  if (options?.ply?.shape === 'arrow-table') {
    const arrowTable = parsePLYToArrowTable(data, options.ply);
    if (arrowTable) {
      return arrowTable;
    }
  }

  const elementTables = parsePLYToElementTables(data, options?.ply);
  return options?.ply?.shape === 'arrow-table'
    ? convertPLYElementTablesToMeshArrowTable(elementTables)
    : convertPLYElementTablesToMesh(elementTables);
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
  parse: async (arrayBuffer, options) => parsePLYData(arrayBuffer, options),
  parseTextSync: (arrayBuffer, options) => parsePLYData(arrayBuffer, options),
  parseSync: (arrayBuffer, options) => parsePLYData(arrayBuffer, options),
  parseInBatches: async function* (
    arrayBuffer:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) {
    const plyOptions = {
      ...options?.ply,
      batchSize: options?.batchSize ?? options?.core?.batchSize
    };
    for await (const meshOrTable of parsePLYInBatches(arrayBuffer, plyOptions)) {
      yield isMeshArrowTable(meshOrTable) ? meshOrTable : convertPLYMesh(meshOrTable, options);
    }
  }
} as const satisfies LoaderWithParser<PLYMesh | MeshArrowTable, any, PLYLoaderOptions>;

/** Return true if a parsed PLY batch is already a Mesh Arrow table. */
function isMeshArrowTable(data: PLYMesh | MeshArrowTable): data is MeshArrowTable {
  return 'shape' in data && data.shape === 'arrow-table';
}
