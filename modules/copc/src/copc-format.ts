// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

export const COPCFormat = {
  name: 'COPC',
  id: 'copc',
  module: 'copc',
  encoding: 'binary',
  format: 'copc',
  extensions: ['laz'],
  mimeTypes: ['application/octet-stream'],
  binary: true
} as const satisfies Format;
