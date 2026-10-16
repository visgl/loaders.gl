// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ElevationDecoder,
  TerrainHeightmap,
  TerrainHeightmapImage
} from './terrain-heightmap-types';

/** Terrarium RGB coefficients: R × 256 + G + B / 256 − 32768, in meters. */
export const TERRARIUM_ELEVATION_DECODER: ElevationDecoder = Object.freeze({
  rScaler: 256,
  gScaler: 1,
  bScaler: 1 / 256,
  offset: -32768
});

/**
 * Decodes already unpacked RGBA bytes without image loading or mesh reconstruction.
 * Preserves input row order and ignores alpha; does not add borders, interpolate,
 * infer no-data values, or convert horizontal or vertical coordinate systems.
 */
export function decodeTerrainHeightmap(
  image: TerrainHeightmapImage,
  elevationDecoder: ElevationDecoder
): TerrainHeightmap {
  const {width, height, data} = image;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError('Terrain heightmap dimensions must be positive safe integers');
  }
  const sampleCount = width * height;
  if (!Number.isSafeInteger(sampleCount * 4) || data.length !== sampleCount * 4) {
    throw new RangeError('Terrain heightmap requires exactly four RGBA bytes per pixel');
  }
  const {rScaler, gScaler, bScaler, offset} = elevationDecoder;
  if (![rScaler, gScaler, bScaler, offset].every(Number.isFinite)) {
    throw new RangeError('Terrain elevation decoder coefficients must be finite numbers');
  }
  const heights = new Float32Array(sampleCount);
  decodeTerrainHeightmapInto(image, elevationDecoder, heights, width);
  return {width, height, heights};
}

/**
 * Fills a preallocated grid using its host-supplied row stride.
 * Internal mesh reconstruction retains its existing padded allocation and border policy;
 * this primitive does not validate input or allocate another full-size height grid.
 */
export function decodeTerrainHeightmapInto(
  image: TerrainHeightmapImage,
  elevationDecoder: ElevationDecoder,
  heights: Float32Array,
  rowStride: number
): void {
  const {data, width, height} = image;
  const {rScaler, gScaler, bScaler, offset} = elevationDecoder;
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const pixelOffset = (row * width + column) * 4;
      heights[row * rowStride + column] =
        data[pixelOffset] * rScaler +
        data[pixelOffset + 1] * gScaler +
        data[pixelOffset + 2] * bScaler +
        offset;
    }
  }
}
