// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** TileJSON metadata format. */
export const TileJSONFormat = {
  name: 'TileJSON',
  id: 'tilejson',
  module: 'mvt',
  encoding: 'json',
  format: 'tilejson',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  category: 'metadata',
  text: true
} as const satisfies Format;
