// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** ZIP archive format. */
export const ZipFormat = {
  name: 'Zip Archive',
  id: 'zip',
  module: 'zip',
  encoding: 'zip',
  format: 'zip',
  extensions: ['zip'],
  mimeTypes: ['application/zip'],
  category: 'archive',
  binary: true,
  tests: ['PK']
} as const satisfies Format;
