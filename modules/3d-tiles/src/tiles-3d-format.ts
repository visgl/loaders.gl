// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** 3D Tiles tile content format. */
export const Tiles3DFormat = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  encoding: 'binary',
  format: '3d-tiles',
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['cmpt', 'pnts', 'b3dm', 'i3dm']
} as const satisfies Format;

/** 3D Tiles subtree format. */
export const Tile3DSubtreeFormat = {
  id: '3d-tiles-subtree',
  name: '3D Tiles Subtree',
  module: '3d-tiles',
  encoding: 'binary',
  format: '3d-tiles-subtree',
  extensions: ['subtree'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;

/** 3D Tiles archive format. */
export const ThreeTZFormat = {
  id: '3tz',
  name: '3D Tiles Archive',
  module: '3d-tiles',
  encoding: 'zip',
  format: '3tz',
  extensions: ['3tz'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;
