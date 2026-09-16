// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  FrameState,
  Tile3D,
  Tile3DContent,
  Tile3DFeatureIdSet,
  Tile3DMetadataContext
} from '@loaders.gl/tiles';

/** Renderer-neutral adapter for consuming normalized 3D Tiles state. */
export type Tile3DRenderContract = {
  /** Returns ordered content descriptors for a tile. */
  getContentEntries(tile: Tile3D): readonly Tile3DContent[];
  /** Returns normalized feature identifiers for one content entry. */
  getFeatureIds(content: Tile3DContent): readonly Tile3DFeatureIdSet[];
  /** Returns raw metadata references inherited by the tile. */
  getMetadata(tile: Tile3D): Tile3DMetadataContext;
  /** Returns union or indexed render-content visibility. */
  getVisibility(\n    tile: Tile3D,\n    frameState: FrameState,\n    contentIndex?: number\n  ): ReturnType<Tile3D['contentVisibility']>;
};

/** Default pure adapter; it performs no renderer or GPU work. */
export const DEFAULT_TILE_3D_RENDER_CONTRACT: Tile3DRenderContract = {
  getContentEntries: tile => tile.contentEntries,
  getFeatureIds: content => content.featureIds,
  getMetadata: tile => tile.metadataContext,
  getVisibility: (tile, frameState, contentIndex) =>
    tile.contentVisibility(frameState, contentIndex)
};
