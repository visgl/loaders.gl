// SPDX-License-Identifier: MIT
/** Renderer-independent RGB lookup table. No color-space conversion is applied. */
export type ColorLUT = {
  /** Number of input dimensions. */
  dimension: 1 | 3;
  /** Samples along each axis. */
  size: number;
  /** Interleaved RGB samples; red input varies fastest, then green, then blue. */
  data: Float32Array;
  /** Minimum input coordinate per channel. */
  domainMinimum: number[];
  /** Maximum input coordinate per channel. */
  domainMaximum: number[];
  /** Optional authored title. */
  title?: string;
  /** Optional nonuniform input grid, normalized to [0, 1]. */
  inputGrid?: Float64Array;
  /** Original integer input knots for grid-first 3dl files. */
  sourceInputGrid?: Float64Array;
  /** Encoded RGB output bit depth, when specified by the source or loader options. */
  sourceOutputBitDepth?: number;
};
