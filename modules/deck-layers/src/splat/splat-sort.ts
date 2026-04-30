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

/** Calculate the byte lengths of transient sort buffers for a splat count. */
export function getSplatTransientBufferByteLengths(splatCount: number): Record<string, number> {
  const splatBytes = Math.max(splatCount, 1) * Uint32Array.BYTES_PER_ELEMENT;
  return {
    keys: splatBytes,
    indices: splatBytes,
    tempKeys: splatBytes,
    tempIndices: splatBytes,
    projected: Math.max(splatCount, 1) * 4 * Float32Array.BYTES_PER_ELEMENT
  };
}

/** Return a sorted index indirection for tests and CPU fallback validation. */
export function getSortedSplatIndicesByDepth(depths: Float32Array): Uint32Array {
  const indices = Array.from({length: depths.length}, (_, index) => index);
  indices.sort((leftIndex, rightIndex) => depths[rightIndex] - depths[leftIndex]);
  return Uint32Array.from(indices);
}
