// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/core/loader-utils';

/** Public transit updates serialized as a GTFS Realtime protobuf FeedMessage. */
export const GTFSRealtimeFormat = {
  name: 'GTFS Realtime',
  id: 'gtfs-realtime',
  module: 'geospatial',
  category: 'table',
  encoding: 'protobuf',
  format: 'gtfs-realtime',
  extensions: ['gtfs-realtime'],
  mimeTypes: [],
  binary: true
} as const satisfies Format;
