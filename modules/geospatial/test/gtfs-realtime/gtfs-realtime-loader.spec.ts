// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table} from 'apache-arrow';
import {parseSync, selectLoader} from '@loaders.gl/core';
import {GTFSRealtimeLoader} from '@loaders.gl/geospatial/gtfs-realtime/bundled';
import {expect, test} from 'vitest';
import {
  encodeFeed,
  encodeFloat,
  encodeGroup,
  encodeInteger,
  encodeMessage,
  encodeString,
  encodeVarint
} from './encode-gtfs-realtime';

/** A feed exercising vehicle positions, trip predictions, service alerts and unknown fields. */
const feed = encodeFeed(
  [encodeInteger(2, 1), encodeInteger(3, 4_300_000_001), encodeString(4, 'fall')],
  encodeMessage(
    2,
    encodeString(1, 'bus-1'),
    encodeMessage(
      4,
      encodeMessage(
        1,
        encodeString(1, 'trip'),
        encodeString(2, '25:10:00'),
        encodeString(3, '20261125'),
        encodeInteger(4, 6),
        encodeString(5, 'route'),
        encodeInteger(6, 0),
        encodeMessage(7, encodeString(1, 'modification'))
      ),
      encodeMessage(
        2,
        encodeFloat(1, 42.5),
        encodeFloat(2, -71.125),
        encodeFloat(3, 270),
        encodeFloat(4, 1234.5, true),
        encodeFloat(5, 12.5)
      ),
      encodeInteger(3, 7),
      encodeInteger(4, 1),
      encodeInteger(5, 4_300_000_000),
      encodeInteger(6, 2),
      encodeString(7, 'stop'),
      encodeMessage(
        8,
        encodeString(1, '42'),
        encodeString(2, 'Shuttle'),
        encodeString(3, 'plate'),
        encodeInteger(4, 2)
      ),
      encodeInteger(9, 0),
      encodeInteger(10, 0),
      encodeMessage(
        11,
        encodeString(1, 'car'),
        encodeString(2, 'Quiet'),
        encodeInteger(3, 5),
        encodeInteger(4, -1),
        encodeInteger(5, 1)
      ),
      encodeInteger(9000, (1n << 64n) - 1n),
      encodeGroup(1000, encodeGroup(1, encodeFloat(2, 0, true)), encodeString(2, 'extension'))
    )
  ),
  encodeMessage(
    2,
    encodeString(1, 'bus-2'),
    encodeMessage(
      4,
      encodeMessage(2, encodeFloat(1, 0), encodeFloat(2, 0), encodeFloat(33, 5)),
      encodeInteger(4, 900),
      encodeInteger(9, 900)
    )
  ),
  encodeMessage(2, encodeString(1, 'no-position'), encodeMessage(4)),
  encodeMessage(2, encodeString(1, 'deleted'), encodeInteger(2, 1)),
  encodeMessage(
    2,
    encodeString(1, 'prediction'),
    encodeMessage(
      3,
      encodeMessage(1, encodeString(1, 'trip')),
      encodeMessage(
        2,
        encodeInteger(1, 8),
        encodeMessage(
          2,
          encodeInteger(1, -15),
          encodeInteger(2, 4_300_000_100),
          encodeInteger(3, 0)
        ),
        encodeMessage(
          3,
          encodeInteger(1, -10),
          encodeInteger(2, 4_300_000_105),
          encodeInteger(3, 5)
        ),
        encodeString(4, 'stop'),
        encodeInteger(5, 0),
        encodeInteger(7, 2)
      ),
      encodeMessage(2, encodeInteger(1, 9), encodeInteger(5, 1)),
      encodeMessage(3, encodeString(1, '42')),
      encodeInteger(4, 4_300_000_000),
      encodeInteger(5, -15)
    )
  ),
  encodeMessage(
    2,
    encodeString(1, 'alert'),
    encodeMessage(
      5,
      encodeMessage(1, encodeInteger(1, 4_300_000_000)),
      encodeMessage(1, encodeInteger(2, 4_300_000_100)),
      encodeMessage(
        5,
        encodeString(1, 'agency'),
        encodeString(2, 'route'),
        encodeInteger(3, 3),
        encodeMessage(4, encodeString(1, 'trip')),
        encodeString(5, 'stop'),
        encodeInteger(6, 1)
      ),
      encodeInteger(6, 9),
      encodeInteger(7, 4),
      encodeMessage(8, encodeMessage(1, encodeString(1, 'https://example.com/alert'))),
      encodeMessage(
        10,
        encodeMessage(1, encodeString(1, 'Detour'), encodeString(2, 'en')),
        encodeMessage(1, encodeString(1, 'Déviation'), encodeString(2, 'fr'))
      ),
      encodeMessage(11, encodeMessage(1, encodeString(1, 'Use the next stop.')))
    )
  )
);

test('GTFS Realtime decodes supported messages, translations, enums and deletion markers', () => {
  const result = parseSync(feed, GTFSRealtimeLoader, {gtfsRealtime: {shape: 'gtfs-realtime-feed'}});
  expect(result).toEqual({
    shape: 'gtfs-realtime-feed',
    header: {
      gtfsRealtimeVersion: '2.0',
      incrementality: 'DIFFERENTIAL',
      timestamp: 4_300_000_001,
      feedVersion: 'fall'
    },
    entity: [
      {
        id: 'bus-1',
        isDeleted: false,
        vehicle: {
          trip: {
            tripId: 'trip',
            startTime: '25:10:00',
            startDate: '20261125',
            scheduleRelationship: 'DUPLICATED',
            routeId: 'route',
            directionId: 0,
            modifiedTrip: {modificationsId: 'modification'}
          },
          vehicle: {
            id: '42',
            label: 'Shuttle',
            licensePlate: 'plate',
            wheelchairAccessible: 'WHEELCHAIR_ACCESSIBLE'
          },
          position: {
            latitude: 42.5,
            longitude: -71.125,
            bearing: 270,
            odometer: 1234.5,
            speed: 12.5
          },
          currentStopSequence: 7,
          currentStatus: 'STOPPED_AT',
          timestamp: 4_300_000_000,
          congestionLevel: 'STOP_AND_GO',
          stopId: 'stop',
          occupancyStatus: 'EMPTY',
          occupancyPercentage: 0,
          multiCarriageDetails: [
            {
              id: 'car',
              label: 'Quiet',
              occupancyStatus: 'FULL',
              occupancyPercentage: -1,
              carriageSequence: 1
            }
          ]
        }
      },
      {
        id: 'bus-2',
        isDeleted: false,
        vehicle: {
          position: {latitude: 0, longitude: 0},
          currentStatus: 'IN_TRANSIT_TO',
          multiCarriageDetails: []
        }
      },
      {
        id: 'no-position',
        isDeleted: false,
        vehicle: {currentStatus: 'IN_TRANSIT_TO', multiCarriageDetails: []}
      },
      {id: 'deleted', isDeleted: true},
      {
        id: 'prediction',
        isDeleted: false,
        tripUpdate: {
          trip: {tripId: 'trip'},
          vehicle: {id: '42', wheelchairAccessible: 'NO_VALUE'},
          timestamp: 4_300_000_000,
          delay: -15,
          stopTimeUpdate: [
            {
              stopSequence: 8,
              stopId: 'stop',
              scheduleRelationship: 'SCHEDULED',
              departureOccupancyStatus: 'FEW_SEATS_AVAILABLE',
              arrival: {delay: -15, time: 4_300_000_100, uncertainty: 0},
              departure: {delay: -10, time: 4_300_000_105, uncertainty: 5}
            },
            {stopSequence: 9, scheduleRelationship: 'SKIPPED'}
          ]
        }
      },
      {
        id: 'alert',
        isDeleted: false,
        alert: {
          activePeriod: [{start: 4_300_000_000}, {end: 4_300_000_100}],
          communicationPeriod: [],
          impactPeriod: [],
          informedEntity: [
            {
              agencyId: 'agency',
              routeId: 'route',
              routeType: 3,
              trip: {tripId: 'trip'},
              stopId: 'stop',
              directionId: 1
            }
          ],
          cause: 'MAINTENANCE',
          effect: 'DETOUR',
          severityLevel: 'UNKNOWN_SEVERITY',
          url: {translation: [{text: 'https://example.com/alert'}]},
          headerText: {
            translation: [
              {text: 'Detour', language: 'en'},
              {text: 'Déviation', language: 'fr'}
            ]
          },
          descriptionText: {translation: [{text: 'Use the next stop.'}]}
        }
      }
    ]
  });
});

test('GTFS Realtime tables contain only positioned vehicles and preserve seconds and m/s', () => {
  const table = parseSync(feed, GTFSRealtimeLoader) as Table;
  expect(table.numRows).toBe(2);
  expect(table.getChild('timestamp')?.toArray()).toEqual(Float64Array.of(4_300_000_000, 0));
  expect(table.getChild('timestamp')?.get(1)).toBeNull();
  expect(table.getChild('speed')?.get(0)).toBe(12.5);
  expect(table.schema.fields.find(field => field.name === 'speed')?.metadata.get('unit')).toBe(
    'm/s'
  );
  expect(table.getChild('currentStatus')?.get(1)).toBe('IN_TRANSIT_TO');
  const rows = parseSync(feed, GTFSRealtimeLoader, {gtfsRealtime: {shape: 'object-row-table'}});
  expect(rows).toMatchObject({
    shape: 'object-row-table',
    schema: {metadata: {feedVersion: 'fall', incrementality: 'DIFFERENTIAL'}},
    data: [
      {
        id: 'bus-1',
        vehicleId: '42',
        vehicleLabel: 'Shuttle',
        tripId: 'trip',
        routeId: 'route',
        directionId: 0,
        startDate: '20261125',
        startTime: '25:10:00',
        longitude: -71.125,
        latitude: 42.5,
        bearing: 270,
        speed: 12.5,
        timestamp: 4_300_000_000,
        currentStatus: 'STOPPED_AT',
        stopId: 'stop',
        occupancyStatus: 'EMPTY',
        occupancyPercentage: 0
      },
      {
        id: 'bus-2',
        vehicleId: null,
        tripId: null,
        latitude: 0,
        longitude: 0,
        bearing: null,
        speed: null,
        occupancyStatus: null
      }
    ]
  });
  const empty = parseSync(encodeFeed([]), GTFSRealtimeLoader) as Table;
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields.map(field => field.name)).toEqual(
    table.schema.fields.map(field => field.name)
  );
});

test.each([
  ['missing header', new ArrayBuffer(0), /Missing.*header/],
  ['truncated child field', encodeFeed([], encodeMessage(2, [0x0a, 0x09])), /Truncated/],
  ['unmatched group', encodeFeed([], encodeVarint(12)), /Unmatched/],
  ['invalid tag', encodeFeed([], [0x00]), /Invalid.*tag/],
  ['oversized varint', encodeFeed([], [0x38, ...Array(10).fill(0x80)]), /Invalid.*varint/],
  ['unsafe timestamp', encodeFeed([encodeInteger(3, 1n << 53n)]), /safe integer/]
] as const)('GTFS Realtime rejects %s', (_name, bytes, error) => {
  expect(() => parseSync(bytes, GTFSRealtimeLoader)).toThrow(error);
});

test('GTFS Realtime automatic selection requires a specific suffix', async () => {
  const candidates = [GTFSRealtimeLoader];
  const options = {core: {nothrow: true, ignoreRegisteredLoaders: true}};
  const generic = new File([feed], 'vehicles.pb', {type: 'application/x-protobuf'});
  const specific = new File([feed], 'vehicles.gtfs-realtime');
  expect(await selectLoader(generic, candidates, options)).toBeNull();
  expect(await selectLoader(specific, candidates, options)).toBe(GTFSRealtimeLoader);
  expect(await selectLoader(generic, GTFSRealtimeLoader, options)).toBe(GTFSRealtimeLoader);
});
