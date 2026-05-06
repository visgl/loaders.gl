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

/** SPZ - Niantic Spatial compressed Gaussian splat format. */
export const SPZFormat = {
  name: 'SPZ',
  id: 'spz',
  module: 'splats',
  format: 'spz',
  extensions: ['spz'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: [new Uint8Array([0x4e, 0x47, 0x53, 0x50]).buffer]
} as const satisfies Format;
