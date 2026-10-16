// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {TerrainLoaderOptions} from './terrain-loader-types';
export type {
  TerrainFieldBounds,
  TerrainHeightFieldOptions,
  TerrainHeightFieldStatistics
} from './lib/terrain-height-field';
export type {
  TerrainGridMetadata,
  TerrainHeightGrid,
  TerrainRay,
  TerrainSurfaceHit,
  TerrainSurfaceBounds,
  TerrainSurface
} from './lib/terrain-contracts';
export type {
  ElevationDecoder,
  TerrainHeightmap,
  TerrainHeightmapImage
} from './lib/terrain-heightmap-types';
export type {QuantizedMeshLoaderOptions} from './quantized-mesh-loader-types';

export {TerrainFormat, QuantizedMeshFormat} from './terrain-format';
export {TerrainLoader} from './terrain-loader-types';

export {parseTerrain} from './terrain-loader';
export {QuantizedMeshLoader} from './quantized-mesh-loader-types';

export type {QuantizedMeshWriterOptions} from './quantized-mesh-writer';
export {QuantizedMeshWriter} from './quantized-mesh-writer';

// DEPRECATED EXPORTS
/** @deprecated Use TerrainLoader. */
export {TerrainLoader as TerrainWorkerLoader} from './terrain-loader-types';
/** @deprecated Use QuantizedMeshLoader. */
export {QuantizedMeshLoader as QuantizedMeshWorkerLoader} from './quantized-mesh-loader-types';
