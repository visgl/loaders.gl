// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseSync} from '@loaders.gl/core';
import type {GTFSRealtimeFeed} from '@loaders.gl/scientific/gtfs-realtime';
import {GTFSRealtimeLoader} from '@loaders.gl/scientific/gtfs-realtime/bundled';
import {expect, test} from 'vitest';
import {
  encodeFeed,
  encodeFloat,
  encodeInteger,
  encodeMessage,
  encodeString
} from './encode-gtfs-realtime';

/** Parses encoded entities through the bundled loader's feed output. */
function decodeEntities(...entities: number[][]): GTFSRealtimeFeed['entity'] {
  const feed = parseSync(encodeFeed([], ...entities), GTFSRealtimeLoader, {
    gtfsRealtime: {shape: 'gtfs-realtime-feed'}
  }) as GTFSRealtimeFeed;
  return feed.entity;
}

/** Encodes one translated string with an English language tag. */
function encodeTranslatedString(field: number, text: string): number[] {
  return encodeMessage(field, encodeMessage(1, encodeString(1, text), encodeString(2, 'en')));
}

test('GTFS Realtime decodes alert accessibility and localized images', () => {
  const [{alert}] = decodeEntities(
    encodeMessage(
      2,
      encodeString(1, 'alert'),
      encodeMessage(
        5,
        encodeInteger(6, 9),
        encodeInteger(7, 4),
        encodeTranslatedString(12, 'Detour on route 12'),
        encodeTranslatedString(13, 'Board at the next stop'),
        encodeInteger(14, 3),
        encodeMessage(
          15,
          encodeMessage(
            1,
            encodeString(1, 'https://example.com/detour-en.png'),
            encodeString(2, 'image/png'),
            encodeString(3, 'en')
          ),
          encodeMessage(
            1,
            encodeString(1, 'https://example.com/detour.webp'),
            encodeString(2, 'image/webp')
          )
        ),
        encodeTranslatedString(16, 'Map of the route detour'),
        encodeTranslatedString(17, 'Track maintenance'),
        encodeTranslatedString(18, 'Two stops bypassed')
      )
    )
  );

  expect(alert).toMatchObject({
    ttsHeaderText: {translation: [{text: 'Detour on route 12', language: 'en'}]},
    ttsDescriptionText: {translation: [{text: 'Board at the next stop', language: 'en'}]},
    severityLevel: 'WARNING',
    imageAlternativeText: {translation: [{text: 'Map of the route detour', language: 'en'}]},
    causeDetail: {translation: [{text: 'Track maintenance', language: 'en'}]},
    effectDetail: {translation: [{text: 'Two stops bypassed', language: 'en'}]}
  });
  expect(alert?.image).toEqual({
    localizedImage: [
      {url: 'https://example.com/detour-en.png', mediaType: 'image/png', language: 'en'},
      {url: 'https://example.com/detour.webp', mediaType: 'image/webp'}
    ]
  });
});

test.each([
  ['url', encodeString(2, 'image/png')],
  ['mediaType', encodeString(1, 'https://example.com/detour.png')]
])('GTFS Realtime rejects a localized image missing %s', (field, imageField) => {
  const entity = encodeMessage(
    2,
    encodeString(1, 'alert'),
    encodeMessage(5, encodeMessage(15, encodeMessage(1, imageField)))
  );
  expect(() => decodeEntities(entity)).toThrow(`Missing GTFS Realtime protobuf field: ${field}`);
});

test('GTFS Realtime decodes shape and stop entities', () => {
  const [{shape}, {stop}, {stop: stopWithoutBoarding}] = decodeEntities(
    encodeMessage(
      2,
      encodeString(1, 'detour-shape'),
      encodeMessage(6, encodeString(1, 'detour'), encodeString(2, '???gE'))
    ),
    encodeMessage(
      2,
      encodeString(1, 'detour-stop'),
      encodeMessage(
        7,
        encodeString(1, 'temporary-stop'),
        encodeTranslatedString(2, 'T01'),
        encodeTranslatedString(3, 'Temporary stop'),
        encodeTranslatedString(4, 'Temporary shuttle stop'),
        encodeTranslatedString(5, 'Outside the station'),
        encodeFloat(6, 42.5),
        encodeFloat(7, -71.125),
        encodeString(8, 'central'),
        encodeTranslatedString(9, 'https://example.com/stops/T01'),
        encodeString(11, 'station'),
        encodeString(12, 'America/New_York'),
        encodeInteger(13, 1),
        encodeString(14, 'ground'),
        encodeTranslatedString(15, 'B')
      )
    ),
    encodeMessage(2, encodeString(1, 'other-stop'), encodeMessage(7, encodeString(1, 'other')))
  );

  expect(shape).toEqual({shapeId: 'detour', encodedPolyline: '???gE'});
  expect(stop).toEqual({
    stopId: 'temporary-stop',
    stopCode: {translation: [{text: 'T01', language: 'en'}]},
    stopName: {translation: [{text: 'Temporary stop', language: 'en'}]},
    ttsStopName: {translation: [{text: 'Temporary shuttle stop', language: 'en'}]},
    stopDesc: {translation: [{text: 'Outside the station', language: 'en'}]},
    stopLat: 42.5,
    stopLon: -71.125,
    zoneId: 'central',
    stopUrl: {translation: [{text: 'https://example.com/stops/T01', language: 'en'}]},
    parentStation: 'station',
    stopTimezone: 'America/New_York',
    wheelchairBoarding: 'AVAILABLE',
    levelId: 'ground',
    platformCode: {translation: [{text: 'B', language: 'en'}]}
  });
  expect(stopWithoutBoarding).toEqual({stopId: 'other', wheelchairBoarding: 'UNKNOWN'});
});

test('GTFS Realtime decodes trip modifications and ordered replacement stops', () => {
  const [{tripModifications}] = decodeEntities(
    encodeMessage(
      2,
      encodeString(1, 'detour-modification'),
      encodeMessage(
        8,
        encodeMessage(
          1,
          encodeString(1, 'trip-a'),
          encodeString(1, 'trip-b'),
          encodeString(2, 'detour')
        ),
        encodeString(2, '10:00:00'),
        encodeString(2, '12:00:00'),
        encodeString(3, '20261125'),
        encodeString(3, '20261126'),
        encodeMessage(
          4,
          encodeMessage(1, encodeInteger(1, 1)),
          encodeMessage(2, encodeString(2, 'original-stop')),
          encodeInteger(3, 30),
          encodeMessage(4, encodeInteger(1, -20), encodeString(2, 'temporary-stop')),
          encodeMessage(4, encodeInteger(1, 40), encodeString(2, 'next-stop')),
          encodeString(5, 'alert'),
          encodeInteger(6, 4_300_000_000)
        ),
        encodeMessage(
          4,
          encodeMessage(1, encodeInteger(1, 8)),
          encodeMessage(2, encodeInteger(1, 9))
        )
      )
    )
  );

  expect(tripModifications).toEqual({
    selectedTrips: [{tripIds: ['trip-a', 'trip-b'], shapeId: 'detour'}],
    startTimes: ['10:00:00', '12:00:00'],
    serviceDates: ['20261125', '20261126'],
    modifications: [
      {
        startStopSelector: {stopSequence: 1},
        endStopSelector: {stopId: 'original-stop'},
        propagatedModificationDelay: 30,
        replacementStops: [
          {travelTimeToStop: -20, stopId: 'temporary-stop'},
          {travelTimeToStop: 40, stopId: 'next-stop'}
        ],
        serviceAlertId: 'alert',
        lastModifiedTime: 4_300_000_000
      },
      {
        startStopSelector: {stopSequence: 8},
        endStopSelector: {stopSequence: 9},
        propagatedModificationDelay: 0,
        replacementStops: []
      }
    ]
  });
});
