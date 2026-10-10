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
