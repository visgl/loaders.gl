// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table} from 'apache-arrow';
import {parse} from '@loaders.gl/core';
import {AISLoader} from '@loaders.gl/geospatial/ais';
import {corruptChecksum, encodeAISPayload, encodeAIVDM, encodeTagBlock} from './encode-aivdm';

test('AIS metadata preloads an Arrow parser for tagged NMEA with schema metadata', async () => {
  const {payload, fillBits} = encodeAISPayload(1, 168, [
    [60, 1, 1],
    [61, 28, -600_000]
  ]);
  const sentence = encodeAIVDM(payload, fillBits);
  const text = `${corruptChecksum(sentence)}\n${encodeTagBlock('c:1760000000')}${sentence}`;
  const table = (await parse(new TextEncoder().encode(text), [AISLoader])) as Table;
  expect(table).toBeInstanceOf(Table);
  expect(table.numRows).toBe(1);
  expect(table.getChild('timestamp')?.get(0)).toBe(1760000000);
  expect(table.getChild('longitude')?.get(0)).toBe(-1);
  expect(table.getChild('positionAccuracy')?.get(0)).toBe(true);
  expect(table.getChild('name')?.get(0)).toBeNull();
  expect(
    table.schema.fields.find(field => field.name === 'speedOverGround')?.metadata.get('unit')
  ).toBe('kn');
  expect(table.schema.metadata.get('invalidRecordCount')).toBe('1');
});
