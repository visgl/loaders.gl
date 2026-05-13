// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * Loader format descriptor for the MapLibre Tile (MLT) format
 */
export const MLTFormat = {
  name: 'MapLibre Tile',
  id: 'mlt',
  module: 'mlt',
  encoding: 'binary',
  format: 'mlt',
  extensions: ['mlt'],
  mimeTypes: ['application/vnd.maplibre-tile'],
  category: 'geometry'
} as const satisfies Format;
