// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * The MTL material format
 * A Wavefront .mtl file specifying materials
 */
export const MTLFormat = {
  name: 'MTL',
  id: 'mtl',
  module: 'mtl',
  extensions: ['mtl'],
  mimeTypes: ['text/plain']
} as const satisfies Format;
