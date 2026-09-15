// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import {formatLASMeshColors, LAS_LOADER_METADATA, type LASLoaderOptions} from './las-loader-shared';
import type {LASMesh} from './lib/las-types';
import {
  decodeLAZChunkToArrowTable,
  parseLAS,
  parseLASInBatches,
  type LASArrowTable,
  type LAZChunkArrowTableMetadata
} from './lib/typescript/parse-las';

type LASWorkerChunkRequest = {
  metadata: LAZChunkArrowTableMetadata;
};

type LASWorkerOptions = LASLoaderOptions & {
  las?: LASLoaderOptions['las'] & {
    _chunk?: LASWorkerChunkRequest;
  };
};

/** Parser-bearing TypeScript-only LAS loader implementation. */
export const LASLoaderWithParser = {
  ...LAS_LOADER_METADATA,
  worker: true,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLASTable(arrayBuffer, options), options),
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) =>
    convertLASMesh(parseLASTable(arrayBuffer, options), options),
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    yield* convertLASMeshBatches(parseLASInBatches(arrayBufferIterator, options), options);
  }
} as const satisfies LoaderWithParser<
  LASMesh | MeshArrowTable,
  LASMesh | MeshArrowTable,
  LASLoaderOptions
>;

/** Parse a complete LAS file or an internal standalone worker chunk request. */
function parseLASTable(arrayBuffer: ArrayBuffer, options?: LASLoaderOptions): LASArrowTable {
  const chunkRequest = (options as LASWorkerOptions | undefined)?.las?._chunk;
  return chunkRequest
    ? decodeLAZChunkToArrowTable(arrayBuffer, chunkRequest.metadata, options || {})
    : parseLAS(arrayBuffer, options);
}

function convertLASMesh(
  table: LASArrowTable,
  options?: LASLoaderOptions
): LASMesh | MeshArrowTable {
  const formattedTable =
    options?.las?.colorFormat === undefined || options.las.colorFormat === 'uint8norm'
      ? table
      : {
          ...convertMeshToTable(
            formatLASMeshColors(convertTableToMesh(table) as LASMesh, options.las.colorFormat),
            'arrow-table'
          ),
          loader: table.loader,
          loaderData: table.loaderData,
          progress: table.progress
        };
  if (options?.las?.shape === 'arrow-table') {
    return formattedTable;
  }
  return {
    ...(convertTableToMesh(formattedTable) as LASMesh),
    loader: formattedTable.loader,
    loaderData: formattedTable.loaderData,
    progress: formattedTable.progress
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
