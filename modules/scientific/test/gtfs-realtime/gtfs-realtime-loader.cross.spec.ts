// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table} from 'apache-arrow';
import {parse} from '@loaders.gl/core';
import {GTFSRealtimeLoader} from '@loaders.gl/scientific/gtfs-realtime';
import {expect, test} from 'vitest';
import {
  encodeFeed,
  encodeFloat,
  encodeInteger,
  encodeMessage,
  encodeString
} from './encode-gtfs-realtime';

test('GTFS Realtime metadata preloads the default Arrow vehicle parser', async () => {
  const bytes = encodeFeed(
    [encodeInteger(3, 1_760_000_002), encodeString(4, 'fall')],
    encodeMessage(
      2,
      encodeString(1, 'bus'),
      encodeMessage(
        4,
        encodeMessage(2, encodeFloat(1, 42.5), encodeFloat(2, -71.125)),
        encodeInteger(5, 1_760_000_000)
      )
    )
  );

  const result = await parse(bytes, GTFSRealtimeLoader);
  expect(result).toBeInstanceOf(Table);
  const table = result as Table;
  expect(table.numRows).toBe(1);
  expect(table.getChild('id')?.get(0)).toBe('bus');
  expect(table.getChild('timestamp')?.get(0)).toBe(1_760_000_000);
  expect(table.getChild('tripId')?.get(0)).toBeNull();
  expect(table.schema.fields[0].metadata.get('unit')).toBe('s');
  expect(Object.fromEntries(table.schema.metadata)).toEqual({
    gtfsRealtimeVersion: '2.0',
    incrementality: 'FULL_DATASET',
    timestamp: '1760000002',
    feedVersion: 'fall'
  });
});

test('GTFS Realtime preserves the duplicate trip ID for joining and the assigned platform', async () => {
  const bytes = encodeFeed(
    [],
    encodeMessage(
      2,
      encodeString(1, 'trip-update'),
      encodeMessage(
        3,
        encodeMessage(1, encodeString(1, 'scheduled-trip'), encodeInteger(4, 6)),
        encodeMessage(
          2,
          encodeInteger(1, 8),
          encodeInteger(5, 2),
          encodeMessage(6, encodeString(1, 'platform-2'))
        ),
        encodeMessage(
          2,
          encodeInteger(1, 9),
          encodeMessage(2, encodeInteger(2, 1_795_632_900)),
          encodeMessage(6, encodeString(2, 'Airport'), encodeInteger(3, 2), encodeInteger(4, 3))
        ),
        encodeMessage(
          6,
          encodeString(1, 'duplicate-trip'),
          encodeString(2, '20261125'),
          encodeString(3, '10:30:00'),
          encodeString(4, 'airport-shape'),
          encodeString(5, 'Airport Express'),
          encodeString(6, 'AX')
        )
      )
    ),
    encodeMessage(
      2,
      encodeString(1, 'vehicle-position'),
      encodeMessage(
        4,
        encodeMessage(1, encodeString(1, 'duplicate-trip'), encodeInteger(4, 6)),
        encodeMessage(8, encodeString(1, 'bus-42')),
        encodeString(7, 'platform-2')
      )
    )
  );

  const result = await parse(bytes, GTFSRealtimeLoader, {
    gtfsRealtime: {shape: 'gtfs-realtime-feed'}
  });
  if (!('shape' in result) || result.shape !== 'gtfs-realtime-feed') {
    throw new Error('Expected a decoded GTFS Realtime feed');
  }
  const [{tripUpdate}, {vehicle}] = result.entity;
  expect(tripUpdate?.trip).toEqual({tripId: 'scheduled-trip', scheduleRelationship: 'DUPLICATED'});
  expect(vehicle?.trip).toEqual({tripId: 'duplicate-trip', scheduleRelationship: 'DUPLICATED'});
  expect(tripUpdate?.tripProperties?.tripId).toBe(vehicle?.trip?.tripId);
  expect(tripUpdate?.tripProperties).toEqual({
    tripId: 'duplicate-trip',
    startDate: '20261125',
    startTime: '10:30:00',
    shapeId: 'airport-shape',
    tripHeadsign: 'Airport Express',
    tripShortName: 'AX'
  });
  expect(tripUpdate?.stopTimeUpdate).toEqual([
    {
      stopSequence: 8,
      scheduleRelationship: 'NO_DATA',
      stopTimeProperties: {assignedStopId: 'platform-2'}
    },
    {
      stopSequence: 9,
      scheduleRelationship: 'SCHEDULED',
      arrival: {time: 1_795_632_900},
      stopTimeProperties: {
        stopHeadsign: 'Airport',
        pickupType: 'PHONE_AGENCY',
        dropOffType: 'COORDINATE_WITH_DRIVER'
      }
    }
  ]);
});
