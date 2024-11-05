// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * PMTiles
 */
export const PMTilesFormat = {
  name: 'PMTiles',
  id: 'pmtiles',
  module: 'pmtiles',
  extensions: ['pmtiles'],
  mimeTypes: ['application/octet-stream'],
  tests: ['PMTiles'],
} as const satisfies Format;
