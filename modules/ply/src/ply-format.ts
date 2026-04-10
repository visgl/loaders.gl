// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * PLY - Polygon File Format (aka Stanford Triangle Format)
 * @see http://paulbourke.net/dataformats/ply/,
 * @see https://en.wikipedia.org/wiki/PLY_(file_format)
 */
export const PLYFormat = {
  name: 'PLY',
  id: 'ply',
  module: 'ply',
  // shapes: ['mesh', 'gltf', 'columnar-table'],
  extensions: ['ply'],
  mimeTypes: ['text/plain', 'application/octet-stream'],
  text: true,
  binary: true,
  tests: ['ply']
} as const satisfies Format;
