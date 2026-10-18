// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RasterBoundingBox} from './raster-source';

/** Validates canonical region geometry and bounds the estimated decoded allocation. */
export function validateRasterRegion(
  bounds: RasterBoundingBox,
  width: number,
  height: number,
  bytesPerPixel: number,
  maxPixels = 16_000_000,
  maxDecodedBytes = 256 * 1024 * 1024
): number {
  if (
    !bounds.flat().every(Number.isFinite) ||
    bounds[0][0] >= bounds[1][0] ||
    bounds[0][1] >= bounds[1][1]
  )
    throw new Error('Raster bounds must be finite, ordered and non-wrapped');
  if (![maxPixels, maxDecodedBytes].every(value => Number.isSafeInteger(value) && value > 0))
    throw new Error('Raster budgets must be positive finite integers');
  const pixels = width * height;
  if (
    ![width, height].every(value => Number.isSafeInteger(value) && value > 0) ||
    !Number.isFinite(bytesPerPixel) ||
    bytesPerPixel <= 0 ||
    !Number.isSafeInteger(pixels) ||
    pixels > maxPixels ||
    pixels * bytesPerPixel > maxDecodedBytes
  )
    throw new Error('Raster dimensions exceed pixel or decoded-byte budget');
  return pixels;
}
