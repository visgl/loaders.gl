// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Map style JSON format. */
export const MapStyleFormat = {
  name: 'Map Style',
  id: 'map-style',
  module: 'mvt',
  encoding: 'json',
  format: 'map-style',
  extensions: ['json'],
  mimeTypes: ['application/json'],
  category: 'metadata',
  text: true
} as const satisfies Format;
