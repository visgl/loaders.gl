// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {ColorLUT} from './lut-types';

/** Layout of blue slices in an RGB/RGBA LUT image; red runs right, green runs down. */
export type ImageLUTLayout = {
  /** Cube edge length. */
  size: number;
  /** Number of blue-slice tiles per row. */
  tilesPerRow: number;
};

/** Converts explicitly arranged, decoded opaque 8-bit pixels to a red-fastest LUT. */
export function parseImageLUT(
  pixels: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  layout: ImageLUTLayout
): ColorLUT {
  validateImageLUTLayout(width, height, layout);
  const {size, tilesPerRow} = layout;
  const channels = pixels.length / (width * height);
  if (channels !== 3 && channels !== 4) throw new Error('LUT: expected RGB or RGBA pixels');
  const data = new Float32Array(size ** 3 * 3);
  for (let blue = 0; blue < size; blue++)
    for (let green = 0; green < size; green++)
      for (let red = 0; red < size; red++) {
        const x = (blue % tilesPerRow) * size + red;
        const y = Math.floor(blue / tilesPerRow) * size + green;
        const source = (y * width + x) * channels;
        if (channels === 4 && pixels[source + 3] !== 255)
          throw new Error('LUT: transparent samples are unsupported');
        const target = ((blue * size + green) * size + red) * 3;
        for (let channel = 0; channel < 3; channel++)
          data[target + channel] = pixels[source + channel] / 255;
      }
  return {
    dimension: 3,
    size,
    data,
    domainMinimum: [0, 0, 0],
    domainMaximum: [1, 1, 1],
    sourceOutputBitDepth: 8
  };
}

/** Checks dimensions and limits before image decoding or sample allocation. */
export function validateImageLUTLayout(
  width: number,
  height: number,
  layout: ImageLUTLayout
): void {
  const {size, tilesPerRow} = layout;
  if (
    !Number.isSafeInteger(size) ||
    size < 2 ||
    size > 256 ||
    !Number.isSafeInteger(tilesPerRow) ||
    tilesPerRow < 1 ||
    tilesPerRow > size ||
    size % tilesPerRow ||
    width !== size * tilesPerRow ||
    height !== size * (size / tilesPerRow)
  )
    throw new Error('LUT: invalid image layout');
}
