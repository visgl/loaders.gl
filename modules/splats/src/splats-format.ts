// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** SPLAT - raw binary Gaussian splat format. */
export const SPLATFormat = {
  name: 'SPLAT',
  id: 'splat',
  module: 'splats',
  format: 'splat',
  extensions: ['splat'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;

/** KSPLAT - GaussianSplats3D optimized Gaussian splat format. */
export const KSPLATFormat = {
  name: 'KSPLAT',
  id: 'ksplat',
  module: 'splats',
  format: 'ksplat',
  extensions: ['ksplat'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;
