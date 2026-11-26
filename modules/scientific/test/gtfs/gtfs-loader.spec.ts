// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ZipWriter} from '@loaders.gl/archives/zip/bundled';
import {parse, selectLoader} from '@loaders.gl/core';
import {GTFSLoader, type GTFSData} from '@loaders.gl/scientific/gtfs/bundled';
import {beforeAll, expect, test} from 'vitest';
import {readGTFSCSVRecords} from '../../src/gtfs/parse-gtfs-csv';

/** Small Schedule archive with quoted CSV, service-day times and interleaved shape points. */
let archive: ArrayBuffer;
/** Parsed fixture shared by read-only assertions. */
let feed: GTFSData;

beforeAll(async () => {
  archive = await ZipWriter.encode(
    {
      'agency.txt': 'agency_id,agency_name,cemv_support\n0007,"City, Transit",1',
      'stops.txt':
        '\uFEFFstop_id,stop_name,stop_lat,stop_lon,stop_desc\r\n' +
        '001,"Gare ""Centrale"", Nord",42.5,-71.25,"Ligne 1\r\nEntrée 2"\r\n\r\n' +
        '002,Station,,,',
      'routes.txt': 'route_id,route_type,route_sort_order\n007,3,12',
      'trips.txt': 'trip_id,route_id,direction_id\n0003,007,0',
      'stop_times.txt':
        'trip_id,stop_id,stop_sequence,arrival_time,departure_time,shape_dist_traveled\n' +
        '0003,001,7,25:10:01,25:10:30,2.75\n0003,002,8,,,',
      'calendar.txt': 'service_id,monday,start_date,end_date\n01,1,20261101,20261130',
      'calendar_dates.txt': 'service_id,date,exception_type\n01,20261125,2',
      'shapes.txt':
        'shape_id,shape_pt_sequence,shape_pt_lat,shape_pt_lon,shape_dist_traveled\n' +
        's1,21,44,-73,2.5\ns2,8,10,20,1.2\ns1,10,42,-71,0\ns2,3,12,21,0\ns3,1,0,0,0',
      'frequencies.txt':
        'trip_id,start_time,end_time,headway_secs,exact_times\n0003,9:00:00,26:00:00,600,1',
      'feed_info.txt': 'feed_publisher_name,feed_version\nCity Transit,0009',
      'custom.txt': 'route_type,code,__proto__,constructor,prototype\n3,001,proto,ctor,prototype',
      'nested/stops.txt': 'should,be,ignored',
      'README.md': 'example'
    },
    {zip: {compression: 'deflate'}}
  );
  feed = await GTFSLoader.parse(archive);
});

test('GTFS Schedule types numeric columns and keeps identifiers, dates and custom rows as text', () => {
  const {tables} = feed;
  expect(Object.keys(tables).sort()).toEqual([
    'agency',
    'calendar',
    'calendar_dates',
    'custom',
    'feed_info',
    'frequencies',
    'routes',
    'shapes',
    'stops',
    'trips'
  ]);
  expect(tables.agency?.data).toEqual([
    {agency_id: '0007', agency_name: 'City, Transit', cemv_support: 1}
  ]);
  expect(tables.stops?.data).toEqual([
    {
      stop_id: '001',
      stop_name: 'Gare "Centrale", Nord',
      stop_lat: 42.5,
      stop_lon: -71.25,
      stop_desc: 'Ligne 1\r\nEntrée 2'
    },
    {stop_id: '002', stop_name: 'Station', stop_lat: null, stop_lon: null, stop_desc: ''}
  ]);
  expect(tables.routes?.data).toEqual([{route_id: '007', route_type: 3, route_sort_order: 12}]);
  expect(tables.trips?.data).toEqual([{trip_id: '0003', route_id: '007', direction_id: 0}]);
  expect(tables.calendar?.data).toEqual([
    {service_id: '01', monday: 1, start_date: '20261101', end_date: '20261130'}
  ]);
  expect(tables.calendar_dates?.data).toEqual([
    {service_id: '01', date: '20261125', exception_type: 2}
  ]);
  expect(tables.feed_info?.data[0].feed_version).toBe('0009');
  expect(tables.custom?.data[0].route_type).toBe('3');
  expect(tables.custom?.data[0].code).toBe('001');
  expect(feed.warnings).toEqual({});
});

test('GTFS Schedule retains prototype-related columns as own properties of plain rows', () => {
  const row = feed.tables.custom!.data[0];
  expect(Object.getPrototypeOf(row)).toBe(Object.prototype);
  expect(Object.keys(row)).toEqual(['route_type', 'code', '__proto__', 'constructor', 'prototype']);
  expect(row.__proto__).toBe('proto');
  expect(row.constructor).toBe('ctor');
  expect(row.prototype).toBe('prototype');
});

test('GTFS Schedule retains times and derives typed service-day seconds past midnight', async () => {
  const {tables} = await GTFSLoader.parse(archive, {gtfs: {files: ['stop_times']}});
  expect(tables.stop_times?.data).toEqual([
    {
      trip_id: '0003',
      stop_id: '001',
      stop_sequence: 7,
      arrival_time: '25:10:01',
      arrival_time_seconds: 90601,
      departure_time: '25:10:30',
      departure_time_seconds: 90630,
      shape_dist_traveled: 2.75
    },
    {
      trip_id: '0003',
      stop_id: '002',
      stop_sequence: 8,
      arrival_time: '',
      arrival_time_seconds: null,
      departure_time: '',
      departure_time_seconds: null,
      shape_dist_traveled: null
    }
  ]);
  expect(tables.stop_times?.schema.fields).toContainEqual({
    name: 'arrival_time_seconds',
    type: 'float64',
    nullable: true,
    metadata: {unit: 's'}
  });
  expect(feed.tables.frequencies?.data).toEqual([
    {
      trip_id: '0003',
      start_time: '9:00:00',
      start_time_seconds: 32400,
      end_time: '26:00:00',
      end_time_seconds: 93600,
      headway_secs: 600,
      exact_times: 1
    }
  ]);
});

test('GTFS Schedule emits points and orders each LineString by shape sequence', () => {
  expect(feed.stops.features).toMatchObject([
    {geometry: {type: 'Point', coordinates: [-71.25, 42.5]}}
  ]);
  expect(feed.shapes.features).toEqual([
    {
      type: 'Feature',
      id: 's1',
      properties: {shape_id: 's1'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-71, 42],
          [-73, 44]
        ]
      }
    },
    {
      type: 'Feature',
      id: 's2',
      properties: {shape_id: 's2'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [21, 12],
          [20, 10]
        ]
      }
    }
  ]);
  expect(feed.tables.shapes?.data.map(row => row.shape_pt_sequence)).toEqual([21, 8, 10, 3, 1]);
  expect(feed.tables.shapes?.data[0].shape_dist_traveled).toBe(2.5);
});

test('GTFS Schedule selects entries and enforces per-file row and byte limits', async () => {
  expect(GTFSLoader.options.gtfs.maxRows).toBe(1_000_000);
  const selected = await parse(archive, GTFSLoader, {
    gtfs: {files: ['routes', 'stop_times.txt'], maxRows: 2}
  });
  expect(Object.keys(selected.tables)).toEqual(['routes', 'stop_times']);
  expect(selected.tables.routes?.data).toHaveLength(1);
  expect(selected.tables.stop_times?.data).toHaveLength(2);
  expect(selected.stops.features).toEqual([]);
  expect(selected.shapes.features).toEqual([]);
  await expect(
    GTFSLoader.parse(archive, {gtfs: {files: ['routes', 'stop_times'], maxRows: 1}})
  ).rejects.toMatchObject({
    name: 'RangeError',
    message: 'GTFS stop_times.txt exceeds the per-file row limit (1). Increase gtfs.maxRows.'
  });
  await expect(
    GTFSLoader.parse(archive, {gtfs: {files: ['stop_times'], maxEntryBytes: 10}})
  ).rejects.toThrow(
    'GTFS stop_times.txt is larger than gtfs.maxEntryBytes (10 bytes). Increase gtfs.maxEntryBytes to read it.'
  );
  await expect(GTFSLoader.parse(archive, {gtfs: {maxRows: -1}})).rejects.toThrow(/maxRows/);
});

test('GTFS Schedule limits the decoded bytes of all selected files together', async () => {
  const twoFileArchive = await ZipWriter.encode({
    'stops.txt': `stop_id\n${'1\n'.repeat(40)}`,
    'routes.txt': `route_id\n${'2\n'.repeat(40)}`
  });
  expect(GTFSLoader.options.gtfs.maxTotalBytes).toBe(256 * 1024 * 1024);
  await expect(GTFSLoader.parse(twoFileArchive, {gtfs: {maxTotalBytes: 100}})).rejects.toThrow(
    'GTFS selected files are larger than gtfs.maxTotalBytes (100 bytes). Increase gtfs.maxTotalBytes or select fewer files with gtfs.files.'
  );
  const oneFile = await GTFSLoader.parse(twoFileArchive, {
    gtfs: {files: ['stops'], maxTotalBytes: 100}
  });
  expect(oneFile.tables.stops?.data).toHaveLength(40);
  await expect(GTFSLoader.parse(twoFileArchive, {gtfs: {maxTotalBytes: 0}})).rejects.toThrow(
    /maxTotalBytes/
  );
});

test('GTFS Schedule leaves missing fields absent, drops extra fields, and counts warnings per file', async () => {
  const unevenArchive = await ZipWriter.encode({
    'stops.txt':
      'stop_id,stop_lat,stop_lon,stop_name\n001, 42.5 , -71.25 \n002, , ,  5" gauge  ,extra',
    'stop_times.txt':
      'trip_id,stop_id,stop_sequence,arrival_time,departure_time\n' +
      '0003,001, 7 , 25:10:01 ,   ,extra\n0003,002,8,25:20:00,25:21:00,extra'
  });
  const result = await GTFSLoader.parse(unevenArchive, {gtfs: {files: ['stops', 'stop_times']}});
  expect(result.tables.stops?.data).toEqual([
    {stop_id: '001', stop_lat: 42.5, stop_lon: -71.25},
    {stop_id: '002', stop_lat: null, stop_lon: null, stop_name: '  5" gauge  '}
  ]);
  expect(result.tables.stops?.data[0]).not.toHaveProperty('stop_name');
  expect(result.tables.stop_times?.data[0]).toEqual({
    trip_id: '0003',
    stop_id: '001',
    stop_sequence: 7,
    arrival_time: ' 25:10:01 ',
    arrival_time_seconds: 90601,
    departure_time: '   ',
    departure_time_seconds: null
  });
  expect(result.warnings).toEqual({
    stops: {shortRows: 1, longRows: 1},
    stop_times: {shortRows: 0, longRows: 2}
  });
});

test('GTFS Schedule uses a sole top-level folder as the feed root', async () => {
  const wrappedArchive = await ZipWriter.encode({
    'feed/stops.txt': 'stop_id,stop_lat,stop_lon\n001,42,-71',
    'feed/stop_times.txt': 'trip_id,stop_sequence\n0003,7',
    'feed/nested/stops.txt': 'stop_id\nignored',
    'README.md': 'example'
  });
  const wrapped = await GTFSLoader.parse(wrappedArchive);
  expect(Object.keys(wrapped.tables)).toEqual(['stops']);
  expect(wrapped.tables.stops?.data).toEqual([{stop_id: '001', stop_lat: 42, stop_lon: -71}]);
  const selected = await GTFSLoader.parse(wrappedArchive, {gtfs: {files: ['stop_times.txt']}});
  expect(Object.keys(selected.tables)).toEqual(['stop_times']);
  expect(selected.tables.stop_times?.data).toEqual([{trip_id: '0003', stop_sequence: 7}]);
});

test('GTFS Schedule does not choose a feed root from multiple top-level folders', async () => {
  const splitArchive = await ZipWriter.encode({
    'first/stops.txt': 'stop_id\n001',
    'second/routes.txt': 'route_id\n101'
  });
  const result = await GTFSLoader.parse(splitArchive);
  expect(result.tables).toEqual({});
});

test('GTFS Schedule automatic selection requires a specific suffix', async () => {
  const candidates = [GTFSLoader];
  const options = {core: {nothrow: true, ignoreRegisteredLoaders: true}};
  expect(
    await selectLoader(
      new File([archive], 'schedule.zip', {type: 'application/zip'}),
      candidates,
      options
    )
  ).toBeNull();
  expect(await selectLoader(new File([archive], 'schedule.gtfs'), candidates, options)).toBe(
    GTFSLoader
  );
});

test('GTFS CSV retains UTF-8 and quote state across ZIP chunks', async () => {
  /** Simulates a ZIP reader that yields one byte at a time. */
  async function* readBytes() {
    for (const byte of new TextEncoder().encode('\uFEFFa,b\r\n"é, ""oui""\r\nnon",0')) {
      yield Uint8Array.of(byte);
    }
  }
  expect(await Array.fromAsync(readGTFSCSVRecords(readBytes()))).toEqual([
    ['a', 'b'],
    ['é, "oui"\r\nnon', '0']
  ]);
});

test.each([
  {
    boundary: 'a doubled quote',
    chunks: ['a,b\n"say "', '"hello""",1'],
    secondRow: ['say "hello"', '1']
  },
  {boundary: 'a CRLF', chunks: ['a,b\r', '\nword,1'], secondRow: ['word', '1']},
  {
    boundary: 'a bare field before a literal quote',
    chunks: ['a,b\n5', '" gauge,1'],
    secondRow: ['5" gauge', '1']
  }
])('GTFS CSV handles a chunk boundary inside $boundary', async ({chunks, secondRow}) => {
  /** Encodes the prescribed chunks without joining across the boundary. */
  async function* readChunks() {
    const encoder = new TextEncoder();
    for (const chunk of chunks) yield encoder.encode(chunk);
  }
  expect(await Array.fromAsync(readGTFSCSVRecords(readChunks()))).toEqual([['a', 'b'], secondRow]);
});

test.each([
  ['trip_id,arrival_time\n001,25:70:00', /Invalid GTFS arrival_time/],
  ['trip_id,stop_sequence\n001,1.25', /Invalid GTFS stop_sequence/],
  [
    'trip_id,stop_sequence\n001, missing ',
    /Invalid GTFS stop_sequence in stop_times\.txt record 2/
  ],
  [
    'trip_id,arrival_time,arrival_time_seconds\n001,25:00:00,90000',
    /conflicts with derived column/
  ],
  ['trip_id,trip_id\n001,002', /duplicate GTFS CSV header/],
  ['trip_id\n001\n"002', /Unterminated quoted GTFS CSV field in stop_times\.txt record 3/],
  ['trip_id\n"001"002', /Unexpected character/]
] as const)('GTFS Schedule rejects malformed CSV or typed records (%s)', async (csv, error) => {
  const invalidArchive = await ZipWriter.encode({'stop_times.txt': csv});
  await expect(GTFSLoader.parse(invalidArchive, {gtfs: {files: ['stop_times']}})).rejects.toThrow(
    error
  );
});
