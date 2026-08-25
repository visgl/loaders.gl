// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Metadata describing the Lance dataset format. */
export const LanceFormat = {
  name: 'Lance',
  category: 'table',
  encoding: 'binary',
  format: 'lance',
  extensions: ['lance'],
  mimeTypes: ['application/vnd.lance', 'application/octet-stream'],
  binary: true
} as const satisfies Partial<Format>;
