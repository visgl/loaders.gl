// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** GTFS Schedule text tables packaged in a ZIP archive. */
export const GTFSFormat = {
  name: 'GTFS Schedule',
  id: 'gtfs',
  module: 'geospatial',
  category: 'table',
  encoding: 'zip',
  format: 'gtfs',
  extensions: ['gtfs'],
  mimeTypes: [],
  binary: true
} as const satisfies Format;
