// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';

/** Options shared by Gaussian splat loaders. */
export type SplatsLoaderOptions = LoaderOptions & {
  splats?: {
    /** Output shape. V1 supports loaders.gl Mesh Arrow tables. */
    shape?: 'arrow-table';
  };
};

/** Linear Gaussian splat values before Arrow table construction. */
export type GaussianSplats = {
  /** Source format identifier. */
  format: 'splat' | 'ksplat' | 'spz' | 'rad';
  /** Number of decoded splats. */
  splatCount: number;
  /** Interleaved xyz positions. */
  positions: Float32Array;
  /** Interleaved xyz Gaussian scale standard deviations. */
  scales: Float32Array;
  /** Interleaved quaternions in `[w, x, y, z]` order. */
  rotations: Float32Array;
  /** Interleaved RGB colors as unorm8 values. */
  colors: Uint8Array;
  /** Minimum decoded RGB value represented by color byte 0. */
  colorMin?: number;
  /** Maximum decoded RGB value represented by color byte 255. */
  colorMax?: number;
  /** Optional interleaved RGB spherical harmonic DC coefficients. */
  sphericalHarmonicDcs?: Float32Array;
  /** Linear opacity values. Some LoD formats intentionally store values above 1. */
  opacities: Float32Array;
  /** Optional spherical harmonic rest coefficients. */
  sphericalHarmonics?: Float32Array;
  /** Number of SH rest coefficients per splat. */
  sphericalHarmonicsComponentCount?: number;
  /** Source-specific metadata. */
  loaderData?: Record<string, unknown>;
};
