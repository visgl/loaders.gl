// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table} from 'apache-arrow';
import {parse} from '@loaders.gl/core';
import {ADSBLoader} from '@loaders.gl/scientific/adsb';

test('ADS-B metadata preloads an Arrow parser and preserves its schema for empty data', async () => {
  const table = (await parse(
    '{"now":1760000000,"aircraft":[{"hex":"abc123","alt_baro":"ground"}]}',
    [ADSBLoader]
  )) as Table;
  const emptyTable = (await parse('{"time":1760000000,"states":null}', [ADSBLoader])) as Table;
  expect(table).toBeInstanceOf(Table);
  expect(table.getChild('icao24')?.get(0)).toBe('abc123');
  expect(table.getChild('altitudeBaro')?.get(0)).toBeNull();
  expect(table.getChild('onGround')?.get(0)).toBe(true);
  expect(emptyTable.numRows).toBe(0);
  expect(emptyTable.schema).toEqual(table.schema);
});
