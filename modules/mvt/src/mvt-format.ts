// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/**
 * Worker loader for the Mapbox Vector Tile format
 */
export const MVTFormat = {
  name: 'Mapbox Vector Tile',
  id: 'mvt',
  module: 'mvt',
  // Note: ArcGIS uses '.pbf' extension and 'application/octet-stream'
  extensions: ['mvt', 'pbf'],
  mimeTypes: [
    // https://www.iana.org/assignments/media-types/application/vnd.mapbox-vector-tile
    'application/vnd.mapbox-vector-tile',
    'application/x-protobuf'
    // 'application/octet-stream'
  ],
  category: 'geometry'
} as const satisfies Format;
