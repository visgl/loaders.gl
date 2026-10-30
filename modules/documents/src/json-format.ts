// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Generic JSON document format, without table extraction or streaming semantics. */
export const JSONFormat = {
  name: 'JSON',
  id: 'json',
  module: 'documents',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  encoding: 'json',
  category: 'json',
  text: true
} as const satisfies Format;
