// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {ColorLUT} from './lut-types';

/** Reusable RGB sampler; inputs use the authored domain and outputs retain signed/HDR values. */
export type ColorLUTSampler = (
  red: number,
  green: number,
  blue: number
) => [number, number, number];

/** Options for interleaved floating-point RGB or RGBA buffers. */
export type ApplyColorLUTOptions = {
  /** Number of interleaved components; default 3. Alpha is copied at float32 precision. */
  components?: 3 | 4;
};

/** Creates a snapshot sampler with per-channel 1D linear or red-fastest 3D trilinear interpolation. */
export function createColorLUTSampler(lut: ColorLUT): ColorLUTSampler {
  const {dimension, size} = lut;
  if (
    ![1, 3].includes(dimension) ||
    !Number.isSafeInteger(size) ||
    size < 2 ||
    !Number.isSafeInteger(size ** dimension * 3) ||
    lut.data.length !== size ** dimension * 3 ||
    lut.domainMinimum.length !== 3 ||
    lut.domainMaximum.length !== 3
  ) {
    throw new Error('LUT: invalid calculation table');
  }
  const minimum = Array.from(lut.domainMinimum);
  const maximum = Array.from(lut.domainMaximum);
  for (let channel = 0; channel < 3; channel++) {
    if (
      !Number.isFinite(minimum[channel]) ||
      !Number.isFinite(maximum[channel]) ||
      !Number.isFinite(maximum[channel] - minimum[channel]) ||
      maximum[channel] <= minimum[channel]
    )
      throw new Error('LUT: invalid calculation domain');
  }
  if (!lut.data.every(Number.isFinite)) throw new Error('LUT: invalid calculation samples');
  const data = lut.data.slice();
  const grid = lut.inputGrid?.slice();
  if (
    grid &&
    (grid.length !== size ||
      grid[0] !== 0 ||
      grid[size - 1] !== 1 ||
      grid.some(
        (value, index) => !Number.isFinite(value) || (index > 0 && value <= grid[index - 1])
      ))
  ) {
    throw new Error('LUT: invalid nonuniform input grid');
  }
  return (red, green, blue) => {
    const coordinates = [red, green, blue];
    const indices: number[] = [];
    const weights: number[] = [];
    for (let channel = 0; channel < 3; channel++) {
      const value = coordinates[channel];
      if (!Number.isFinite(value)) throw new Error('LUT: input colors must be finite');
      const normalized =
        value <= minimum[channel]
          ? 0
          : value >= maximum[channel]
            ? 1
            : (value - minimum[channel]) / (maximum[channel] - minimum[channel]);
      const [index, weight] = findLUTInterval(normalized, size, grid);
      indices.push(index);
      weights.push(weight);
    }
    const result: [number, number, number] = [0, 0, 0];
    if (dimension === 1) {
      for (let channel = 0; channel < 3; channel++) {
        const offset = indices[channel] * 3 + channel;
        result[channel] =
          data[offset] * (1 - weights[channel]) + data[offset + 3] * weights[channel];
      }
    } else {
      for (let blueCorner = 0; blueCorner < 2; blueCorner++) {
        for (let greenCorner = 0; greenCorner < 2; greenCorner++) {
          for (let redCorner = 0; redCorner < 2; redCorner++) {
            const weight =
              (redCorner ? weights[0] : 1 - weights[0]) *
              (greenCorner ? weights[1] : 1 - weights[1]) *
              (blueCorner ? weights[2] : 1 - weights[2]);
            const offset =
              (((indices[2] + blueCorner) * size + indices[1] + greenCorner) * size +
                indices[0] +
                redCorner) *
              3;
            for (let channel = 0; channel < 3; channel++)
              result[channel] += data[offset + channel] * weight;
          }
        }
      }
    }
    return result;
  };
}

/** Applies a LUT to floating-point pixels without changing the source or applying transfer functions. */
export function applyColorLUT(
  lut: ColorLUT,
  colors: Float32Array | Float64Array,
  options: ApplyColorLUTOptions = {}
): Float32Array {
  const {components = 3} = options;
  if (![3, 4].includes(components) || colors.length % components !== 0)
    throw new Error('LUT: invalid pixel component count');
  const sample = createColorLUTSampler(lut);
  const result = new Float32Array(colors.length);
  for (let offset = 0; offset < colors.length; offset += components) {
    result.set(sample(colors[offset], colors[offset + 1], colors[offset + 2]), offset);
    if (components === 4) {
      const alpha = colors[offset + 3];
      result[offset + 3] = alpha;
      if (!Number.isFinite(alpha) || !Number.isFinite(result[offset + 3]))
        throw new Error('LUT: alpha cannot be represented as float32');
    }
  }
  return result;
}

/** Finds normalized uniform/nonuniform knots, retaining the final endpoint in the last interval. */
function findLUTInterval(value: number, size: number, grid?: Float64Array): [number, number] {
  if (!grid) {
    const coordinate = value * (size - 1);
    const lower = Math.min(Math.floor(coordinate), size - 2);
    return [lower, coordinate - lower];
  }
  let lower = 0;
  let upper = size - 1;
  while (upper - lower > 1) {
    const midpoint = Math.floor((lower + upper) / 2);
    if (value < grid[midpoint]) upper = midpoint;
    else lower = midpoint;
  }
  lower = Math.min(lower, size - 2);
  return [lower, (value - grid[lower]) / (grid[lower + 1] - grid[lower])];
}
