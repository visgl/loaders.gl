// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  ElevationDecoder,
  TerrainHeightmap,
  TerrainHeightmapImage
} from './lib/terrain-heightmap-types';
export {
  decodeTerrainHeightmap,
  TERRARIUM_ELEVATION_DECODER
} from './lib/decode-terrain-heightmap';

export type {
  TerrainGridMetadata,
  TerrainHeightGrid,
  TerrainRay,
  TerrainSurfaceHit,
  TerrainSurfaceBounds,
  TerrainSurface
} from './lib/terrain-contracts';
export {createTerrainHeightGrid, sampleTerrainHeightGrid} from './lib/terrain-height-grid';
