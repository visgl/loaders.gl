// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * Draco3D compressed geometries
 */
export const DracoFormat = {
  name: 'Draco',
  id: 'draco',
  module: 'draco',
  extensions: ['drc'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['DRACO']
} as const satisfies Format;
