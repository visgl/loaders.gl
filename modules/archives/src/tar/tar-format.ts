// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Uncompressed TAR archive format. */
export const TarFormat = {
  name: 'TAR Archive',
  id: 'tar',
  module: 'archives',
  format: 'tar',
  extensions: ['tar'],
  mimeTypes: ['application/x-tar'],
  category: 'archive',
  binary: true
} as const satisfies Format;
