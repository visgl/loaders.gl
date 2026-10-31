// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/**
 * Draco3D compressed geometries
 */
export const DracoFormat = {
  name: 'Draco',
  id: 'draco',
  module: 'scene',
  encoding: 'binary',
  format: 'draco',
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO']
} as const satisfies Format;
