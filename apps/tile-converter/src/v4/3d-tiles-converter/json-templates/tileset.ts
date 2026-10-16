// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

/** Tile asset metadata used by the legacy writer. */
export type TilesetAsset = {
  /** Target version. */
  version?: string;
};
/** Selected legacy tileset fields. */
export type TilesetTile = {
  /** Bounding volume. */
  boundingVolume?: unknown;
  /** Geometric error. */
  geometricError?: number;
  /** Refinement policy. */
  refine?: string;
  /** Content link. */
  content?: unknown;
  /** Child tiles. */
  children: TilesetTile[];
};
/** Input to the legacy tileset writer. */
export type TilesetInput = {
  /** Asset metadata. */
  asset: TilesetAsset;
  /** Root tile. */
  root: TilesetTile;
};

/** Builds asset with the legacy field selection and defaults. */
function createAsset(input: BuilderInput<TilesetAsset> | null | undefined) {
  const source = input ?? {};
  return {
    version: source.version ?? '1.0'
  };
}

/** Builds tile with the legacy field selection and defaults. */
function createTile(input: BuilderInput<TilesetTile> | null | undefined): TilesetTile {
  const source = input ?? {};
  return {
    boundingVolume: source.boundingVolume ?? undefined,
    geometricError: source.geometricError ?? undefined,
    refine: source.refine ?? undefined,
    content: source.content ?? undefined,
    children: source.children!.map(tile => createTile(tile))
  };
}

/** Builds tileset with the legacy field selection and defaults. */
export function createTileset(input: BuilderInput<TilesetInput> | null | undefined) {
  const source = input ?? {};
  return {
    asset: createAsset(source.asset),
    geometricError: source.root!.geometricError,
    root: createTile(source.root)
  };
}
