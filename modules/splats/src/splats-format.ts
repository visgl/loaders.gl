// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** SPLAT - raw binary Gaussian splat format. */
export const SPLATFormat = {
  name: 'SPLAT',
  id: 'splat',
  module: 'splats',
  extensions: ['splat'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;

/** KSPLAT - GaussianSplats3D optimized Gaussian splat format. */
export const KSPLATFormat = {
  name: 'KSPLAT',
  id: 'ksplat',
  module: 'splats',
  extensions: ['ksplat'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;

/** SPZ - Niantic Spatial compressed Gaussian splat format. */
export const SPZFormat = {
  name: 'SPZ',
  id: 'spz',
  module: 'splats',
  extensions: ['spz'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: [new Uint8Array([0x4e, 0x47, 0x53, 0x50]).buffer]
} as const satisfies Format;

/** RAD - Spark paged level-of-detail Gaussian splat container. */
export const RADFormat = {
  name: 'RAD',
  id: 'rad',
  module: 'splats',
  extensions: ['rad'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: [new Uint8Array([0x52, 0x41, 0x44, 0x30]).buffer]
} as const satisfies Format;
