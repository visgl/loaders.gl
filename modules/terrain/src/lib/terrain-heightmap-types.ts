// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Linear RGB channel coefficients used to decode elevation samples. */
export type ElevationDecoder = {
  /** Multiplier for the unnormalized red byte (0–255). */
  readonly rScaler: number;
  /** Multiplier for the unnormalized green byte (0–255). */
  readonly gScaler: number;
  /** Multiplier for the unnormalized blue byte (0–255). */
  readonly bScaler: number;
  /** Offset added after summing scaled channels. */
  readonly offset: number;
};

/** Already decoded, interleaved RGBA image pixels. */
export type TerrainHeightmapImage = {
  /** Four bytes per pixel in input row order; alpha is ignored. */
  readonly data: Uint8Array | Uint8ClampedArray;
  /** Positive integer pixel width. */
  readonly width: number;
  /** Positive integer pixel height. */
  readonly height: number;
};

/** Unpadded elevation grid in the same row order as the input image. */
export type TerrainHeightmap = {
  /** Pixel width, also the number of samples per row. */
  readonly width: number;
  /** Pixel height, also the number of rows. */
  readonly height: number;
  /** Row-major samples; Terrarium coefficients produce meters. */
  readonly heights: Float32Array;
};
