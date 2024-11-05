// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * The OBJ geometry format
 */
export const OBJFormat = {
  name: 'OBJ',
  id: 'obj',
  module: 'obj',
  extensions: ['obj'],
  mimeTypes: ['text/plain']
} as const satisfies Format;
