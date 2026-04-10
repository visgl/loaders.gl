// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * LAS (LASer) point cloud format
 */
export const LASFormat = {
  name: 'LAS',
  id: 'las',
  module: 'las',
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeTypes: ['application/octet-stream'], // TODO - text version?
  text: false,
  binary: true,
  tests: ['LASF']
} as const satisfies Format;
