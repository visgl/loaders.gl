// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseFromContext} from '@loaders.gl/loader-utils';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import {TerrainOptions, makeTerrainMeshFromImage} from './lib/parse-terrain';

import {TerrainLoader as TerrainWorkerLoader, TerrainLoaderOptions} from './terrain-loader';
import {
  QuantizedMeshLoader as QuantizedMeshWorkerLoader,
  QuantizedMeshLoaderOptions
} from './quantized-mesh-loader';

// TerrainLoader

export {TerrainWorkerLoader};

export const TerrainLoader = {
  ...TerrainWorkerLoader,
  parse: parseTerrain
} as const satisfies LoaderWithParser<any, never, TerrainLoaderOptions>;

export async function parseTerrain(
  arrayBuffer: ArrayBuffer,
  options?: TerrainLoaderOptions,
  context?: LoaderContext
) {
  const loadImageOptions = {
    ...options,
    mimeType: 'application/x.image',
    image: {...options?.image, type: 'data'}
  };
  const image = await parseFromContext(arrayBuffer, [], loadImageOptions, context!);
  // Extend function to support additional mesh generation options (square grid or delatin)
  const terrainOptions = {...TerrainLoader.options.terrain, ...options?.terrain} as TerrainOptions;
  // @ts-expect-error sort out image typing asap
  return makeTerrainMeshFromImage(image, terrainOptions);
}

// QuantizedMeshLoader

export {QuantizedMeshWorkerLoader};

/**
 * Loader for quantized meshes
 */
export const QuantizedMeshLoader = {
  ...QuantizedMeshWorkerLoader,
  parseSync: (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']),
  parse: async (arrayBuffer, options) =>
    parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh'])
} as const satisfies LoaderWithParser<any, never, QuantizedMeshLoaderOptions>;
