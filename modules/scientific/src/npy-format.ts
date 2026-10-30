// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** NumPy binary array format. */
export const NPYFormat = {
  name: 'NPY',
  id: 'npy',
  module: 'scientific',
  encoding: 'binary',
  format: 'npy',
  extensions: ['npy'],
  mimeTypes: [],
  binary: true
} as const satisfies Format;
