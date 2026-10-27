// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Inclusive minimum and maximum elevation bounds used during tile selection. */
export type ZRange = [minZ: number, maxZ: number];

/** Axis-aligned bounding box represented as `[minX, minY, maxX, maxY]`. */
export type Bounds = [minX: number, minY: number, maxX: number, maxY: number];

/** Geographic tile bounds in longitude/latitude coordinates. */
export type GeoBoundingBox = {west: number; north: number; east: number; south: number};

/** Cartesian tile bounds in layer/world coordinates. */
export type NonGeoBoundingBox = {left: number; top: number; right: number; bottom: number};

/** Tile bounds for either geospatial or cartesian views. */
export type TileBoundingBox = NonGeoBoundingBox | GeoBoundingBox;

/** Tile coordinate in an x/y/z pyramid. */
export type TileIndex = {
  /** Native column. */
  x: number;
  /** Native row. */
  y: number;
  /** Compatibility level index. */
  z: number;
  /** Opaque native matrix identifier, when the source uses TileMatrix geometry. */
  tileMatrix?: string;
};

/** Information passed to a tile loader for fetching tile content. */
export type TileLoadProps = {
  /** x/y/z tile coordinate. */
  index: TileIndex;
  /** Native matrix identifier, when available. */
  tileMatrix?: string;
  /** Native coordinate reference system, when available. */
  crs?: string;
  /** Logical width and height of the tile in pixels, when available. */
  tileSize?: readonly [number, number];
  /** Stable cache identifier for the tile. */
  id: string;
  /** Bounds covered by the tile in the active coordinate system. */
  bbox: TileBoundingBox;
  /** URL derived from a URL template, if applicable. */
  url?: string | null;
  /** Abort signal for cancelling an in-flight tile request. */
  signal?: AbortSignal;
  /** Optional application metadata associated with the tile. */
  userData?: Record<string, any>;
  /** Resolved zoom level used to request this tile. */
  zoom?: number;
};
