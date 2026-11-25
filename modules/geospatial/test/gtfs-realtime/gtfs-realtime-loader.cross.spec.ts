// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table} from 'apache-arrow';
import {parse} from '@loaders.gl/core';
import {GTFSRealtimeLoader} from '@loaders.gl/geospatial/gtfs-realtime';
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
