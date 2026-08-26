// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Decode color values
 * @param rgb565
 * @param target
 * @returns target
 */
export function decodeRGB565(rgb565: number, target: number[] = [0, 0, 0]): number[] {
  const r5 = (rgb565 >> 11) & 31;
  const g6 = (rgb565 >> 5) & 63;
  const b5 = rgb565 & 31;

  target[0] = r5 << 3;
  target[1] = g6 << 2;
  target[2] = b5 << 3;

  return target;
}

/**
 * Encode color values
 * @param rgb
 * @returns color
 */
export function encodeRGB565(rgb: number[]): number {
  const r5 = Math.round((rgb[0] / 255) * 31);
  const g6 = Math.round((rgb[1] / 255) * 63);
  const b5 = Math.round((rgb[2] / 255) * 31);
  return (r5 << 11) + (g6 << 5) + b5;
}
