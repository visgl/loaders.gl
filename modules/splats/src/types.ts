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
  format: 'splat' | 'ksplat';
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
  /** Linear opacity values in the `[0, 1]` range. */
  opacities: Float32Array;
  /** Optional spherical harmonic rest coefficients. */
  sphericalHarmonics?: Float32Array;
  /** Number of SH rest coefficients per splat. */
  sphericalHarmonicsComponentCount?: number;
  /** Source-specific metadata. */
  loaderData?: Record<string, unknown>;
};
