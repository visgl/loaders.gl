import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseQuantizedMesh} from './lib/parse-quantized-mesh';
import {TerrainOptions, makeTerrainMeshFromImage} from './lib/parse-terrain';

import {TerrainLoader as TerrainWorkerLoader, TerrainLoaderOptions} from './terrain-loader';
import {
  QuantizedMeshLoader as QuantizedMeshWorkerLoader,
  QuantizedMeshLoaderOptions
} from './quantized-mesh-loader';

// TerrainLoader

export {TerrainWorkerLoader};

export const TerrainLoader: LoaderWithParser<any, never, TerrainLoaderOptions> = {
  ...TerrainWorkerLoader,
  parse: parseTerrain
};

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
  const image = await context?.parse(arrayBuffer, loadImageOptions);
  // Extend function to support additional mesh generation options (square grid or delatin)
  const terrainOptions = {...TerrainLoader.options.terrain, ...options?.terrain} as TerrainOptions;
  return makeTerrainMeshFromImage(image, terrainOptions);
}

// QuantizedMeshLoader

export {QuantizedMeshWorkerLoader};

/**
 * Loader for quantized meshes
 */
export const QuantizedMeshLoader: LoaderWithParser<any, never, QuantizedMeshLoaderOptions> = {
  ...QuantizedMeshWorkerLoader,
  parseSync: (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh']),
  parse: async (arrayBuffer, options) =>
    parseQuantizedMesh(arrayBuffer, options?.['quantized-mesh'])
};
