// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {ADSBLoader} from '@loaders.gl/geospatial/adsb';
import {ADSBLoader as BundledADSBLoader} from '@loaders.gl/geospatial/adsb/bundled';
import {testADSBText} from '../../src/adsb/adsb-format';

test('ADS-B named-field snapshots convert aviation units and retain aircraft without positions', async () => {
  const snapshot = {
    now: 1760000000.5,
    messages: 123,
    aircraft: [
      {
        hex: 'abc123',
        flight: '  TEST1 ',
        lat: 51.25,
        lon: -0.5,
        alt_baro: 1000,
        alt_geom: 1500,
        gs: 180,
        track: 260,
        baro_rate: -600,
        squawk: '0021',
        category: 'A3',
        seen: 0.1,
        seen_pos: 1.25
      },
      {hex: 'abc124', lat: 3, lon: 0, alt_baro: 'ground', seen_pos: 0, gs: 0},
      {hex: 'abc125', flight: ' ', lat: 40, seen: 0.1}
    ]
  };
  const table = (await parse(JSON.stringify(snapshot), [ADSBLoader], {
    adsb: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  expect(table.data).toEqual([
    {
      timestamp: 1759999999.25,
      icao24: 'abc123',
      callsign: 'TEST1',
      longitude: -0.5,
      latitude: 51.25,
      altitudeBaro: 304.8,
      altitudeGeom: expect.closeTo(457.2),
      onGround: false,
      groundSpeed: expect.closeTo(92.6),
      track: 260,
      verticalRate: -3.048,
      squawk: '0021',
      category: 'A3'
    },
    {
      timestamp: 1760000000.5,
      icao24: 'abc124',
      callsign: null,
      longitude: 0,
      latitude: 3,
      altitudeBaro: null,
      altitudeGeom: null,
      onGround: true,
      groundSpeed: 0,
      track: null,
      verticalRate: null,
      squawk: null,
      category: null
    },
    {
      timestamp: null,
      icao24: 'abc125',
      callsign: null,
      longitude: null,
      latitude: null,
      altitudeBaro: null,
      altitudeGeom: null,
      onGround: null,
      groundSpeed: null,
      track: null,
      verticalRate: null,
      squawk: null,
      category: null
    }
  ]);
});

test('ADS-B state vectors preserve SI units and use the position update time', async () => {
  const snapshot = {
    time: 1760000000,
    states: [
      [
        'abc123',
        ' TEST1 ',
        'Example',
        1759999995,
        1759999998,
        -3,
        45,
        2000,
        false,
        130,
        275,
        2.5,
        null,
        2030,
        '0101',
        false,
        0,
        3
      ],
      [
        'abc124',
        null,
        'Example',
        null,
        1759999999,
        null,
        null,
        0,
        true,
        0,
        null,
        null,
        null,
        null,
        null,
        false,
        0
      ]
    ]
  };
  const table = (await parse(new TextEncoder().encode(JSON.stringify(snapshot)), [ADSBLoader], {
    adsb: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  expect(table.data).toEqual([
    {
      timestamp: 1759999995,
      icao24: 'abc123',
      callsign: 'TEST1',
      longitude: -3,
      latitude: 45,
      altitudeBaro: 2000,
      altitudeGeom: 2030,
      onGround: false,
      groundSpeed: 130,
      track: 275,
      verticalRate: 2.5,
      squawk: '0101',
      category: '3'
    },
    {
      timestamp: null,
      icao24: 'abc124',
      callsign: null,
      longitude: null,
      latitude: null,
      altitudeBaro: 0,
      altitudeGeom: null,
      onGround: true,
      groundSpeed: 0,
      track: null,
      verticalRate: null,
      squawk: null,
      category: null
    }
  ]);
});

test('ADS-B reads the v2 layout with ac records and now in milliseconds', async () => {
  const text = `{"ac":[{"hex":"a1b2c3","flight":"TEST2 ","lat":41.25,"lon":-71.5,"alt_baro":"ground","gs":10,"track":90,"seen_pos":2}],"msg":"No error","now":1760000000500,"total":1}`;
  const table = (await parse(text, ADSBLoader, {
    adsb: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  expect(table.data).toHaveLength(1);
  expect(table.data[0]).toMatchObject({
    icao24: 'a1b2c3',
    callsign: 'TEST2',
    longitude: -71.5,
    latitude: 41.25,
    onGround: true,
    timestamp: 1759999998.5
  });
});

test.each([
  '{"time":1760000000,"states":null}',
  '{"now":1760000000,"aircraft":[]}',
  '{"ac":[],"now":1760000000000}'
])('ADS-B recognizes an empty snapshot %s', text => {
  const table = parseSync(text, BundledADSBLoader, {
    adsb: {shape: 'object-row-table'}
  }) as ObjectRowTable;
  expect(table.data).toEqual([]);
});

test.each([
  '{"ac":[{"hex":"abc123","lat":41}],"now":1760000000500}',
  '{"msg":"ok","ac":[{"lat":41,"hex":"abc123"}],"now":1760000000500}',
  '{"now":1760000000500,"total":1,"ac":[{"flight":"TEST1 ","hex":"abc123"}]}',
  '{"msg":"No error","ac":[],"now":1760000000500,"total":0}'
])('ADS-B detects the v2 layout with any key order: %s', text => {
  expect(testADSBText(text)).toBe(true);
});

test.each([
  '{"ac":[{"id":1}]}',
  '{"items":[{"hex":"abc123"}]}'
])('ADS-B detection rejects JSON without aircraft snapshot fields: %s', text => {
  expect(testADSBText(text)).toBe(false);
});

test('ADS-B rejects JSON with an unrecognized snapshot envelope', () => {
  expect(() => parseSync('{"time":1760000000,"other":[]}', BundledADSBLoader)).toThrow(
    /expected an aircraft, ac or states snapshot/
  );
});
