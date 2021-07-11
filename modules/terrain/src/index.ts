import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import parseQuantizedMesh from './lib/parse-quantized-mesh';
import loadTerrain from './lib/parse-terrain';

import {TerrainLoader as TerrainWorkerLoader} from './terrain-loader';
import {QuantizedMeshLoader as QuantizedMeshWorkerLoader} from './quantized-mesh-loader';

// TerrainLoader

export {TerrainWorkerLoader};

export const TerrainLoader = {
  ...TerrainWorkerLoader,
  parse: loadTerrain
};

export const _typecheckTerrainLoader: LoaderWithParser = TerrainLoader; // eslint-disable-line

// QuantizedMeshLoader

export {QuantizedMeshWorkerLoader};

/**
 * Loader for quantized meshes
 */
export const QuantizedMeshLoader = {
  ...QuantizedMeshWorkerLoader,
  parseSync: parseQuantizedMesh,
  parse: async (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options)
};

export const _typecheckQuantizedMeshLoader: LoaderWithParser = QuantizedMeshLoader;
