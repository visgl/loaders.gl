// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {parseTerrain} from './terrain-loader';
export type {TerrainLoaderOptions} from './terrain-loader-types';
export type {QuantizedMeshLoaderOptions} from './quantized-mesh-loader-types';
export type {
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
export type {QuantizedMeshWriterOptions} from './quantized-mesh-writer';
