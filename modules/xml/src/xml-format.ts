// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** XML document format. */
export const XMLFormat = {
  name: 'XML',
  id: 'xml',
  module: 'xml',
  encoding: 'xml',
  format: 'xml',
  extensions: ['xml'],
  mimeTypes: ['application/xml', 'text/xml'],
  category: 'table',
  text: true
} as const satisfies Format;

/** HTML document format. */
export const HTMLFormat = {
  name: 'HTML',
  id: 'html',
  module: 'xml',
  encoding: 'text',
  format: 'html',
  extensions: ['html', 'htm'],
  mimeTypes: ['text/html'],
  category: 'table',
  text: true
} as const satisfies Format;
