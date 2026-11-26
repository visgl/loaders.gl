// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {SchemaMetadata} from '@loaders.gl/core/schema';
import {makeMovingObjectTable} from '../moving-objects/moving-object-table';
import {
  GTFSRealtimeLoader as GTFSRealtimeLoaderMetadata,
  type GTFSRealtimeLoaderOptions
} from './gtfs-realtime-loader-types';
import {parseGTFSRealtime} from './gtfs-realtime-parser';
import {GTFS_REALTIME_COLUMNS, type GTFSRealtimeRow} from './gtfs-realtime-schema';

/** Loader metadata for the parser-bearing entrypoint. */
const {preload: _GTFSRealtimeLoaderPreload, ...GTFSRealtimeLoaderMetadataWithoutPreload} =
  GTFSRealtimeLoaderMetadata;

/** Loader for binary GTFS Realtime snapshots. */
export const GTFSRealtimeLoaderWithParser = {
  ...GTFSRealtimeLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: GTFSRealtimeLoaderOptions) =>
    parseGTFSRealtimeSync(arrayBuffer, options),
  parseSync: parseGTFSRealtimeSync
} as const satisfies LoaderWithParser<
  typeof GTFSRealtimeLoaderMetadata.dataType,
  never,
  GTFSRealtimeLoaderOptions
>;

/** Parses a binary feed and projects positioned vehicles into the requested table shape. */
function parseGTFSRealtimeSync(arrayBuffer: ArrayBuffer, options?: GTFSRealtimeLoaderOptions) {
  const shape =
    options?.gtfsRealtime?.shape ?? GTFSRealtimeLoaderMetadata.options.gtfsRealtime.shape;
  const feed = parseGTFSRealtime(arrayBuffer);
  if (shape === 'gtfs-realtime-feed') return feed;

  const {gtfsRealtimeVersion, incrementality, timestamp, feedVersion} = feed.header;
  const metadata: SchemaMetadata = {gtfsRealtimeVersion, incrementality};
  if (timestamp !== undefined) metadata.timestamp = String(timestamp);
  if (feedVersion !== undefined) metadata.feedVersion = feedVersion;

  const rows: GTFSRealtimeRow[] = [];
  for (const {id, isDeleted, vehicle} of feed.entity) {
    if (isDeleted || !vehicle?.position) continue;
    const {trip, position} = vehicle;
    rows.push({
      id,
      timestamp: vehicle.timestamp ?? null,
      vehicleId: vehicle.vehicle?.id ?? null,
      vehicleLabel: vehicle.vehicle?.label ?? null,
      tripId: trip?.tripId ?? null,
      routeId: trip?.routeId ?? null,
      directionId: trip?.directionId ?? null,
      startDate: trip?.startDate ?? null,
      startTime: trip?.startTime ?? null,
      latitude: position.latitude,
      longitude: position.longitude,
      bearing: position.bearing ?? null,
      speed: position.speed ?? null,
      currentStatus: vehicle.currentStatus,
      stopId: vehicle.stopId ?? null,
      occupancyStatus: vehicle.occupancyStatus ?? null,
      occupancyPercentage: vehicle.occupancyPercentage ?? null
    });
  }
  return makeMovingObjectTable(rows, GTFS_REALTIME_COLUMNS, shape, metadata);
}
