// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Number of depth bits stored in the v1 sortable key. */
export const SPLAT_DEPTH_KEY_BITS = 24;

/** Number of radix bits processed by each v1 sorting pass. */
export const SPLAT_RADIX_BITS_PER_PASS = 4;

/** Number of buckets used by each v1 radix sorting pass. */
export const SPLAT_RADIX_BUCKETS = 1 << SPLAT_RADIX_BITS_PER_PASS;

/** Number of passes required to sort a 32-bit key with the v1 radix width. */
export const SPLAT_RADIX_PASS_COUNT = 32 / SPLAT_RADIX_BITS_PER_PASS;

/** Default screen tile side length reserved for future tile-local sorting. */
export const SPLAT_TILE_SIZE_PIXELS = 16;

/** Default maximum splat references reserved for one tile-local radix workgroup. */
export const SPLAT_TILE_RADIX_MAX_SPLATS = 1024;

/** Default workgroup size reserved for tile-local radix kernels. */
export const SPLAT_TILE_RADIX_WORKGROUP_SIZE = 256;

const MAX_DEPTH_KEY = (1 << SPLAT_DEPTH_KEY_BITS) - 1;

/** Options controlling depth key quantization. */
export type SplatDepthKeyOptions = {
  /** Near depth used for quantization. */
  depthMin?: number;
  /** Far depth used for quantization. */
  depthMax?: number;
  /** Tile identifier reserved for future tile-local sorting. */
  tileId?: number;
};

/** Describes a screen-space tile grid for future tile binning. */
export type SplatTileGrid = {
  /** Number of horizontal tiles. */
  columns: number;
  /** Number of vertical tiles. */
  rows: number;
  /** Total tile count. */
  tileCount: number;
  /** Tile side length in pixels. */
  tileSizePixels: number;
};

/** Byte lengths for transient tile-binning buffers. */
export type SplatTileBufferByteLengths = {
  /** One count per tile. */
  tileCounts: number;
  /** Prefix offsets, including the sentinel offset at tileCount. */
  tileOffsets: number;
  /** Compacted splat references after scatter. */
  tileIndices: number;
  /** Number of splat references that exceeded fixed tile capacity. */
  overflowCount: number;
  /** Optional overflow splat references. */
  overflowIndices: number;
};

/** Pack a back-to-front sortable key from a positive view-space depth. */
export function packSplatDepthKey(depth: number, options: SplatDepthKeyOptions = {}): number {
  const depthMin = options.depthMin ?? 0;
  const depthMax = options.depthMax ?? 1;
  const depthRange = Math.max(depthMax - depthMin, Number.EPSILON);
  const normalizedDepth = Math.min(Math.max((depth - depthMin) / depthRange, 0), 1);
  const depthKey = Math.round(normalizedDepth * MAX_DEPTH_KEY);
  const tileId = (options.tileId ?? 0) & 0xff;

  return ((tileId << SPLAT_DEPTH_KEY_BITS) | (MAX_DEPTH_KEY - depthKey)) >>> 0;
}

/** Calculate the screen tile grid for a viewport. */
export function getSplatTileGrid(
  width: number,
  height: number,
  tileSizePixels: number = SPLAT_TILE_SIZE_PIXELS
): SplatTileGrid {
  const safeTileSizePixels = Math.max(Math.floor(tileSizePixels), 1);
  const columns = Math.max(Math.ceil(Math.max(width, 0) / safeTileSizePixels), 1);
  const rows = Math.max(Math.ceil(Math.max(height, 0) / safeTileSizePixels), 1);

  return {
    columns,
    rows,
    tileCount: columns * rows,
    tileSizePixels: safeTileSizePixels
  };
}

/** Calculate the byte lengths of transient sort buffers for a splat count. */
export function getSplatTransientBufferByteLengths(splatCount: number): Record<string, number> {
  const splatBytes = Math.max(splatCount, 1) * Uint32Array.BYTES_PER_ELEMENT;
  return {
    keys: splatBytes,
    indices: splatBytes,
    tempKeys: splatBytes,
    tempIndices: splatBytes,
    projected: Math.max(splatCount, 1) * 8 * Float32Array.BYTES_PER_ELEMENT
  };
}

/** Calculate byte lengths for future tile-binning buffers. */
export function getSplatTileBufferByteLengths(
  splatCount: number,
  tileGrid: SplatTileGrid,
  maxReferencesPerSplat: number = 1,
  overflowCapacity: number = 0
): SplatTileBufferByteLengths {
  const tileCount = Math.max(tileGrid.tileCount, 1);
  const referenceCount = Math.max(splatCount, 1) * Math.max(Math.floor(maxReferencesPerSplat), 1);
  const overflowReferenceCount = Math.max(Math.floor(overflowCapacity), 1);

  return {
    tileCounts: tileCount * Uint32Array.BYTES_PER_ELEMENT,
    tileOffsets: (tileCount + 1) * Uint32Array.BYTES_PER_ELEMENT,
    tileIndices: referenceCount * Uint32Array.BYTES_PER_ELEMENT,
    overflowCount: Uint32Array.BYTES_PER_ELEMENT,
    overflowIndices: overflowReferenceCount * Uint32Array.BYTES_PER_ELEMENT
  };
}

/** Return a sorted index indirection for tests and CPU fallback validation. */
export function getSortedSplatIndicesByDepth(depths: Float32Array): Uint32Array {
  const indices = Array.from({length: depths.length}, (_, index) => index);
  indices.sort((leftIndex, rightIndex) => depths[rightIndex] - depths[leftIndex]);
  return Uint32Array.from(indices);
}
