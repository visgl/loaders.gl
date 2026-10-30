// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** TOML document format. */
export const TOMLFormat = {
  name: 'TOML',
  id: 'toml',
  module: 'documents',
  format: 'toml',
  extensions: ['toml'],
  mimeTypes: ['application/toml'],
  category: 'table',
  text: true
} as const satisfies Format;
