// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// PLY Loader
import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTableBatch, MeshArrowTable} from '@loaders.gl/schema';
import type {PLYHeader, PLYMesh} from './lib/ply-types';
import type {ParsePLYOptions} from './lib/parse-ply';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {parsePLY, parsePLYHeader, parsePLYToArrowTable} from './lib/parse-ply';
import {
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
    /** Treat PLY data as a point cloud by reading only the leading vertex element. */
    pointCloud?: boolean;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

function convertPLYMesh(mesh: PLYMesh, options?: PLYLoaderOptions): PLYMesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  return convertPLYTable(table, options, mesh.loaderData);
}

/** Parse PLY data using a direct Arrow path when requested and supported. */
function parsePLYData(
  data: ArrayBuffer | string,
  options?: PLYLoaderOptions
): PLYMesh | MeshArrowTable {
  if (options?.ply?._useLegacyParser) {
    return convertPLYMesh(parsePLY(data, options?.ply), options);
  }

  const arrowTable = parsePLYToArrowTable(data, options?.ply);
  if (arrowTable) {
    return convertPLYTable(arrowTable, options, parsePLYHeader(data, options?.ply));
  }

  const elementTables = parsePLYToElementTables(data, options?.ply);
  return convertPLYTable(
    convertPLYElementTablesToMeshArrowTable(elementTables),
    options,
    elementTables.header
  );
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
      const convertedData = isMeshArrowTable(meshOrTable)
        ? convertPLYTable(meshOrTable, options)
        : convertPLYMesh(meshOrTable, options);
      yield isMeshArrowTable(convertedData) ? makeArrowTableBatch(convertedData) : convertedData;
    }
  }
} as const satisfies LoaderWithParser<PLYMesh | MeshArrowTable, any, PLYLoaderOptions>;

/** Return requested public PLY shape from the parser's Arrow table. */
function convertPLYTable(
  table: MeshArrowTable,
  options?: PLYLoaderOptions,
  header?: PLYHeader
): PLYMesh | MeshArrowTable {
  if (options?.ply?.shape === 'arrow-table') {
    return table;
  }
  return {
    ...(convertTableToMesh(table) as PLYMesh),
    loader: 'ply',
    loaderData: header || {comments: [], elements: []}
  };
}

/** Wrap a Mesh Arrow table as a loaders.gl Arrow table batch. */
function makeArrowTableBatch(table: MeshArrowTable): ArrowTableBatch {
  return {
    shape: 'arrow-table',
    batchType: 'data',
    schema: table.schema,
    data: table.data,
    length: table.data.numRows
  };
}

/** Return true if a parsed PLY batch is already a Mesh Arrow table. */
function isMeshArrowTable(data: PLYMesh | MeshArrowTable): data is MeshArrowTable {
  return 'shape' in data && data.shape === 'arrow-table';
}
