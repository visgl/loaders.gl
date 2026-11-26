// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseSync} from '@loaders.gl/core';
import {type AISLoaderOptions, type AISRow} from '@loaders.gl/scientific/ais';
import {AISLoader} from '@loaders.gl/scientific/ais/bundled';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {corruptChecksum, encodeAISPayload, encodeAIVDM, encodeTagBlock} from './encode-aivdm';

/** Encodes a complete message as one NMEA sentence. */
function encodeSingleMessage(...fields: Parameters<typeof encodeAISPayload>): string {
  const {payload, fillBits} = encodeAISPayload(...fields);
  return encodeAIVDM(payload, fillBits);
}

/** Parses an AIS log into typed rows and exposes its metadata for error-count assertions. */
function parseAISLog(lines: string[], options?: AISLoaderOptions['ais']) {
  const table = parseSync(lines.join('\r\n'), AISLoader, {
    ais: {...options, shape: 'object-row-table'}
  }) as ObjectRowTable;
  return {rows: table.data as AISRow[], metadata: table.schema?.metadata};
}

test.each([1, 2, 3])('AIS decodes Class A position type %i', messageType => {
  const {rows} = parseAISLog([
    encodeSingleMessage(messageType, 168, [
      [38, 4, 5],
      [42, 8, -47],
      [50, 10, 126],
      [60, 1, 1],
      [61, 28, -73.5 * 600_000],
      [89, 27, -12.25 * 600_000],
      [116, 12, 1234],
      [128, 9, 125]
    ])
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    timestamp: null,
    mmsi: 234567890,
    messageType,
    longitude: -73.5,
    latitude: -12.25,
    speedOverGround: 12.6,
    courseOverGround: 123.4,
    heading: 125,
    navigationStatus: 5,
    positionAccuracy: true,
    channel: 'A'
  });
  expect(rows[0].rateOfTurn).toBeCloseTo(-98.61, 2);
});

test.each([-128, -127, 127])('AIS maps unavailable Class A measurements to null (ROT %i)', turn => {
  const {rows} = parseAISLog([
    encodeSingleMessage(1, 168, [
      [38, 4, 15],
      [42, 8, turn],
      [50, 10, 1023],
      [61, 28, 181 * 600_000],
      [89, 27, 91 * 600_000],
      [116, 12, 3600],
      [128, 9, 511]
    ])
  ]);
  expect(rows[0]).toMatchObject({
    longitude: null,
    latitude: null,
    speedOverGround: null,
    courseOverGround: null,
    heading: null,
    rateOfTurn: null,
    navigationStatus: null,
    positionAccuracy: false
  });
});

test('AIS validates checksums and records the discard count in table metadata', () => {
  const sentence = encodeSingleMessage(1, 168);
  const invalidSentence = corruptChecksum(sentence);
  const invalidTag = encodeTagBlock('c:1760000000').replace(/\*[0-9A-F]{2}/, '*FF');
  expect(parseAISLog([invalidSentence, invalidTag + sentence, sentence]).rows).toHaveLength(1);
  expect(parseAISLog([invalidSentence, invalidTag + sentence, sentence]).metadata).toEqual({
    invalidRecordCount: '2'
  });
  expect(parseAISLog([invalidSentence], {skipInvalidRecords: false}).rows).toEqual([]);
  expect(
    parseAISLog([invalidSentence, invalidTag + sentence], {validateChecksum: false}).rows
  ).toHaveLength(2);
  expect(() => parseAISLog(['invalid'], {skipInvalidRecords: false})).toThrow(/line 1: malformed/);
});

test('AIS reads seconds and milliseconds from tag blocks and tolerates log suffixes', () => {
  const {payload, fillBits} = encodeAISPayload(1, 168);
  const sentence = encodeAIVDM(payload, fillBits, {type: 'AIVDO', channel: ''});
  const {rows} = parseAISLog([
    encodeTagBlock('s:station,c:1760000000') + sentence + ',1760000001',
    encodeTagBlock('n:3') + encodeTagBlock('c:1760000000250') + sentence,
    sentence + ' 2025-10-09T00:00:01Z'
  ]);
  expect(rows.map(row => row.timestamp)).toEqual([1760000000, 1760000000.25, null]);
  expect(rows[0].channel).toBeNull();
});

test('AIS reassembles interleaved type 5 fragments by channel and sequence ID', () => {
  /** Encodes one type 5 voyage report in two sentences with nonzero fill bits. */
  function encodeVoyage(name: string, sequence: string, channel: string) {
    const {payload, fillBits} = encodeAISPayload(5, 424, [
      [40, 30, 1234567],
      [70, 42, 'V7TEST'],
      [112, 120, name],
      [232, 8, 70],
      [240, 9, 61],
      [249, 9, 20],
      [258, 6, 8],
      [264, 6, 9],
      [294, 8, 73],
      [302, 120, 'PORT TEST']
    ]);
    expect(fillBits).toBe(2);
    return [
      encodeAIVDM(payload.slice(0, 50), 0, {count: 2, sequence, channel}),
      encodeAIVDM(payload.slice(50), fillBits, {count: 2, number: 2, sequence, channel})
    ];
  }

  const [first, second] = encodeVoyage('TEST ONE', '1', 'A');
  const [firstOtherChannel, secondOtherChannel] = encodeVoyage('TEST TWO', '1', 'B');
  const [firstOtherSequence, secondOtherSequence] = encodeVoyage('TEST THREE', '2', 'A');
  const {rows, metadata} = parseAISLog([
    encodeTagBlock('c:1760000000') + first,
    firstOtherChannel,
    firstOtherSequence,
    secondOtherChannel,
    encodeTagBlock('c:1760000001') + secondOtherSequence,
    second
  ]);
  expect(metadata).toEqual({invalidRecordCount: '0'});
  expect(rows.map(({name, channel, timestamp}) => ({name, channel, timestamp}))).toEqual([
    {name: 'TEST TWO', channel: 'B', timestamp: null},
    {name: 'TEST THREE', channel: 'A', timestamp: 1760000001},
    {name: 'TEST ONE', channel: 'A', timestamp: 1760000000}
  ]);
  expect(rows[2]).toMatchObject({
    messageType: 5,
    mmsi: 234567890,
    longitude: null,
    latitude: null,
    callSign: 'V7TEST',
    imo: 1234567,
    shipType: 70,
    draught: 7.3,
    destination: 'PORT TEST',
    dimensionToBow: 61,
    dimensionToStern: 20,
    dimensionToPort: 8,
    dimensionToStarboard: 9
  });
  expect(parseAISLog([first, corruptChecksum(second)])).toEqual({
    rows: [],
    metadata: {invalidRecordCount: '1'}
  });
  expect(parseAISLog([first]).metadata).toEqual({invalidRecordCount: '1'});
  expect(parseAISLog([second, first, second]).rows).toHaveLength(1);
});

test('AIS type 4 exposes broadcast UTC independently of the tag timestamp', () => {
  const {rows} = parseAISLog([
    encodeTagBlock('c:1760000000') +
      encodeSingleMessage(4, 168, [
        [38, 14, 2024],
        [52, 4, 2],
        [56, 5, 29],
        [61, 5, 12],
        [66, 6, 34],
        [72, 6, 56],
        [78, 1, 1],
        [79, 28, 12 * 600_000],
        [107, 27, -34 * 600_000]
      ]),
    encodeSingleMessage(4, 168, [
      [38, 14, 2023],
      [52, 4, 2],
      [56, 5, 29]
    ])
  ]);
  expect(rows[0]).toMatchObject({
    timestamp: 1760000000,
    baseStationTimestamp: Date.UTC(2024, 1, 29, 12, 34, 56) / 1000,
    positionAccuracy: true,
    longitude: 12,
    latitude: -34
  });
  expect(rows[1]).toMatchObject({timestamp: null, baseStationTimestamp: null});
});

test.each([18, 19])('AIS decodes Class B type %i with static fields when included', messageType => {
  /** Standard Class B position payload fields shared by types 18 and 19. */
  const fields: Parameters<typeof encodeAISPayload>[2] = [
    [46, 10, 124],
    [56, 1, 1],
    [57, 28, 4.75 * 600_000],
    [85, 27, 52.25 * 600_000],
    [112, 12, 1312],
    [124, 9, 133]
  ];
  const sentence =
    messageType === 19
      ? encodeSingleMessage(19, 312, [
          ...fields,
          [143, 120, 'CLASS B'],
          [263, 8, 36],
          [271, 9, 11],
          [280, 9, 3],
          [289, 6, 1],
          [295, 6, 2]
        ])
      : encodeSingleMessage(18, 168, fields);
  const {rows} = parseAISLog([sentence]);
  expect(rows[0]).toMatchObject({
    messageType,
    speedOverGround: 12.4,
    courseOverGround: 131.2,
    heading: 133,
    longitude: 4.75,
    latitude: 52.25,
    positionAccuracy: true,
    navigationStatus: null,
    rateOfTurn: null
  });
  expect(rows[0].name).toBe(messageType === 19 ? 'CLASS B' : null);
  if (messageType === 19) {
    expect(rows[0]).toMatchObject({
      shipType: 36,
      dimensionToBow: 11,
      dimensionToStern: 3,
      dimensionToPort: 1,
      dimensionToStarboard: 2
    });
  }
});

test('AIS keeps the two type 24 static data reports as separate rows', () => {
  const {rows} = parseAISLog([
    encodeSingleMessage(24, 160, [[40, 120, 'STATIC TEST']]),
    encodeSingleMessage(24, 168, [
      [38, 2, 1],
      [40, 8, 37],
      [90, 42, 'TEST24'],
      [132, 9, 9],
      [141, 9, 3],
      [150, 6, 2],
      [156, 6, 4]
    ])
  ]);
  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({messageType: 24, name: 'STATIC TEST', callSign: null});
  expect(rows[1]).toMatchObject({
    messageType: 24,
    name: null,
    callSign: 'TEST24',
    shipType: 37,
    dimensionToBow: 9,
    dimensionToStern: 3,
    dimensionToPort: 2,
    dimensionToStarboard: 4
  });
  expect(rows[0].mmsi).toBe(rows[1].mmsi);
});

test('AIS type 21 combines the aid name and its extension', () => {
  const {rows} = parseAISLog([
    encodeSingleMessage(21, 296, [
      [43, 120, 'AID TO NAVIGATION 1 '],
      [163, 1, 1],
      [164, 28, -600_000],
      [192, 27, 1_200_000],
      [219, 9, 7],
      [228, 9, 7],
      [237, 6, 7],
      [243, 6, 7],
      [272, 24, 'WEST']
    ])
  ]);
  expect(rows[0]).toMatchObject({
    name: 'AID TO NAVIGATION 1 WEST',
    longitude: -1,
    latitude: 2,
    positionAccuracy: true,
    dimensionToBow: 7,
    dimensionToStarboard: 7
  });
});

test('AIS type 27 uses long-range scaling and its own unavailable codes', () => {
  const {rows} = parseAISLog([
    encodeSingleMessage(27, 96, [
      [38, 1, 1],
      [40, 4, 8],
      [44, 18, -120.75 * 600],
      [62, 17, 49.5 * 600],
      [79, 6, 17],
      [85, 9, 241]
    ]),
    encodeSingleMessage(27, 96, [
      [44, 18, 181 * 600],
      [62, 17, 91 * 600],
      [79, 6, 63],
      [85, 9, 511]
    ])
  ]);
  expect(rows[0]).toMatchObject({
    longitude: -120.75,
    latitude: 49.5,
    speedOverGround: 17,
    courseOverGround: 241,
    navigationStatus: 8,
    positionAccuracy: true,
    heading: null
  });
  expect(rows[1]).toMatchObject({
    longitude: null,
    latitude: null,
    speedOverGround: null,
    courseOverGround: null
  });
});

test('AIS skips unsupported message types and counts malformed supported payloads', () => {
  const {rows, metadata} = parseAISLog([encodeSingleMessage(14, 64), encodeSingleMessage(18, 162)]);
  expect(rows).toEqual([]);
  expect(metadata).toEqual({invalidRecordCount: '1'});
});
