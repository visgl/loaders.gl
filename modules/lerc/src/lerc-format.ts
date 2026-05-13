// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const LERCFormat = {
  name: 'LERC',
  id: 'lerc',
  module: 'lerc',
  encoding: 'binary',
  format: 'lerc',
  extensions: ['lrc', 'lerc', 'lerc2', 'lerc1'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;
