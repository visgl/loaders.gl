// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASER (LAS) FILE FORMAT
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable, convertTableToMesh} from '@loaders.gl/schema-utils';
import type {LASLoaderOptions} from './las-loader';
import type {LASMesh} from './lib/las-types';
import {
  parseLAS,
  parseLASInBatches,
  parseLASPackedArrowTable,
  parseLASPackedArrowTableInBatches
} from './lib/laz-perf/parse-las';
import {LAZPerfLoader as LAZPerfLoaderMetadata} from './lazperf-loader';

const {preload: _LAZPerfLoaderPreload, ...LAZPerfLoaderMetadataWithoutPreload} =
  LAZPerfLoaderMetadata;

/**
 * Loader for the LAS (LASer) point cloud format
 * @note Does not support LAS v1.4
 */
export const LAZPerfLoaderWithParser = {
  ...LAZPerfLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) => {
    validateLASInterleavedOptions(options);
    const backendLoader = await getLASBackendLoader(options);
    return backendLoader === LAZPerfLoaderWithParser
      ? options?.las?.interleaved
        ? parseLASPackedArrowTable(arrayBuffer, options)
        : convertLASMesh(parseLAS(arrayBuffer, options), options)
      : backendLoader.parse(arrayBuffer, options);
  },
  parseSync: (arrayBuffer: ArrayBuffer, options?: LASLoaderOptions) => {
    validateLASInterleavedOptions(options);
    const backend = getLASBackend(options);
    if (backend !== 'laz-perf') {
      throw new Error(`LASLoader: backend "${backend}" does not support parseSync`);
    }
    return options?.las?.interleaved
      ? parseLASPackedArrowTable(arrayBuffer, options)
      : convertLASMesh(parseLAS(arrayBuffer, options), options);
  },
  parseInBatches: async function* (arrayBufferIterator, options?: LASLoaderOptions) {
    validateLASInterleavedOptions(options);
    const backendLoader = await getLASBackendLoader(options);
    if (backendLoader === LAZPerfLoaderWithParser) {
      if (options?.las?.interleaved) {
        yield* parseLASPackedArrowTableInBatches(arrayBufferIterator, options);
      } else {
        yield* convertLASMeshBatches(parseLASInBatches(arrayBufferIterator, options), options);
      }
      return;
    }
    yield* backendLoader.parseInBatches!(arrayBufferIterator, options);
  }
} as const satisfies LoaderWithParser<
  LASMesh | MeshArrowTable,
  LASMesh | MeshArrowTable,
  LASLoaderOptions
>;

/**
 * Resolve the selected LAS decoder backend.
 * @param options LAS loader options
 * @returns Selected backend id
 */
function getLASBackend(options?: LASLoaderOptions): 'laz-perf' | 'copc' | 'laz-rs' {
  return options?.las?.backend || 'laz-perf';
}

/**
 * Resolve the parser-bearing loader for the selected backend.
 * @param options LAS loader options
 * @returns Parser-bearing LAS loader
 */
async function getLASBackendLoader(
  options?: LASLoaderOptions
): Promise<LoaderWithParser<LASMesh | MeshArrowTable, LASMesh | MeshArrowTable, LASLoaderOptions>> {
  switch (getLASBackend(options)) {
    case 'laz-perf':
      return LAZPerfLoaderWithParser;
    case 'copc': {
      const {COPCLoaderWithParser} = await import('./copc-loader-with-parser');
      return COPCLoaderWithParser;
    }
    case 'laz-rs': {
      const {LAZRsLoaderWithParser} = await import('./laz-rs-loader-with-parser');
      return LAZRsLoaderWithParser;
    }
    default:
      throw new Error(`LASLoader: unsupported backend "${options?.las?.backend}"`);
  }
}

function convertLASMesh(mesh: LASMesh, options?: LASLoaderOptions): LASMesh | MeshArrowTable {
  const table = convertMeshToTable(mesh, 'arrow-table');
  if (options?.las?.shape === 'arrow-table') {
    return table;
  }
  return {
    ...(convertTableToMesh(table) as LASMesh),
    loader: mesh.loader,
    loaderData: mesh.loaderData,
    progress: (mesh as LASMesh & {progress?: number}).progress
  } as LASMesh & {progress?: number};
}

/** Validate the explicit packed LAS Arrow mode before dispatching any backend work. */
function validateLASInterleavedOptions(options?: LASLoaderOptions): void {
  if (!options?.las?.interleaved) {
    return;
  }
  if (options.las.shape !== 'arrow-table') {
    throw new Error('LASLoader: las.interleaved requires las.shape="arrow-table"');
  }
  if (options.las.fp64) {
    throw new Error('LASLoader: las.interleaved does not support las.fp64=true');
  }
  const backend = getLASBackend(options);
  if (backend !== 'laz-perf') {
    throw new Error(
      `LASLoader: las.interleaved is only supported by backend "laz-perf", not "${backend}"`
    );
  }
}

/**
 * Convert LAS mesh batches to the requested output shape.
 * @param meshBatches Decoded LAS mesh batches
 * @param options LAS loader options
 * @returns Converted LAS batches
 */
async function* convertLASMeshBatches(
  meshBatches: AsyncIterable<LASMesh>,
  options?: LASLoaderOptions
): AsyncIterable<LASMesh | MeshArrowTable> {
  for await (const mesh of meshBatches) {
    yield convertLASMesh(mesh, options);
  }
}
