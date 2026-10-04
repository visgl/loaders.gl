// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {ArrowTable, ArrowTableBatch, ArrayRowTable, ObjectRowTable} from '@loaders.gl/schema';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {
  convertCSVRowTableToArrowTable,
  parseCSVArrayBufferAsArrow,
  parseCSVInArrowBatches,
  parseCSVTextAsArrow
} from '../src/csv-arrow-table-parser';

/** Reads a column without conflating missing columns and null cells. */
function getColumnValues(table: ArrowTable, columnName: string): unknown[] {
  const column = table.data.getChild(columnName);
  expect(column).not.toBeNull();
  return Array.from({length: table.data.numRows}, (_, rowIndex) => column!.get(rowIndex));
}

test('CSV Arrow conversion preserves array row order and nullable values', () => {
  const table: ArrayRowTable = {
    shape: 'array-row-table',
    schema: {
      fields: [
        {name: 'name', type: 'utf8', nullable: true},
        {name: 'count', type: 'float64', nullable: true}
      ],
      metadata: {}
    },
    data: [
      ['Ada', 2],
      [null, 0],
      ['Bob', null]
    ]
  };
  const converted = convertCSVRowTableToArrowTable(table);
  expect(getColumnValues(converted, 'name')).toEqual(['Ada', null, 'Bob']);
  expect(getColumnValues(converted, 'count')).toEqual([2, 0, null]);
});

test.each([
  'geoarrow.wkb',
  'geoarrow.wkt'
] as const)('CSV Arrow conversion honors geometry metadata %s and retains null geometries', extensionName => {
  const point = {type: 'Point' as const, coordinates: [1, 2]};
  const geometry =
    extensionName === 'geoarrow.wkb' ? new Uint8Array(convertGeometryToWKB(point)) : 'POINT (1 2)';
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'geometry',
          type: extensionName === 'geoarrow.wkb' ? 'binary' : 'utf8',
          nullable: true,
          metadata: {'ARROW:extension:name': extensionName}
        },
        {name: 'name', type: 'utf8', nullable: false}
      ],
      metadata: {}
    },
    data: [
      {geometry, name: 'point'},
      {geometry: null, name: 'missing'}
    ]
  };
  const converted = convertCSVRowTableToArrowTable(table, 'never', 'optimized');
  expect(
    converted.schema.fields.find(field => field.name === 'geometry')?.metadata?.[
      'ARROW:extension:name'
    ]
  ).toBe('geoarrow.point');
  expect(getColumnValues(converted, 'name')).toEqual(['point', 'missing']);
  const geometryColumn = converted.data.getChild('geometry')!;
  expect(Array.from(geometryColumn.get(0))).toEqual([1, 2]);
  expect(geometryColumn.get(1)).toBeNull();
  expect(table.data[0].geometry).toBe(geometry);
});

test('CSV Arrow conversion falls back when no geometry column is declared', () => {
  const converted = convertCSVRowTableToArrowTable(
    {
      shape: 'object-row-table',
      schema: {fields: [{name: 'name', type: 'utf8', nullable: false}], metadata: {}},
      data: [{name: 'Ada'}]
    },
    'never',
    'optimized'
  );
  expect(getColumnValues(converted, 'name')).toEqual(['Ada']);
});

test('CSV typed bytes guess an ASCII delimiter after ignoring invalid candidates', async () => {
  const converted = await parseCSVArrayBufferAsArrow(
    new TextEncoder().encode('name|count\nAda|2\nBob|').buffer,
    {csv: {header: true, dynamicTyping: true, delimitersToGuess: ['||', 'é', '|']}}
  );
  expect(getColumnValues(converted, 'name')).toEqual(['Ada', 'Bob']);
  expect(getColumnValues(converted, 'count')).toEqual([2, null]);
});

test('CSV typed columns retain raw text while promoting boolean and date storage', async () => {
  const converted = await parseCSVArrayBufferAsArrow(
    new TextEncoder().encode('boolean,date\ntrue,2025-01-02T03:04:05Z\n,\nplain,other').buffer,
    {csv: {header: true, dynamicTyping: true}}
  );
  expect(getColumnValues(converted, 'boolean')).toEqual(['true', null, 'plain']);
  expect(getColumnValues(converted, 'date')).toEqual([
    String(new Date('2025-01-02T03:04:05Z')),
    null,
    'other'
  ]);
});

test.each([
  '\u1680',
  '\u2028',
  '\u2029',
  '\u202f',
  '\u205f',
  '\u3000',
  '\ufeff'
])('CSV quoted dynamic numbers accept JavaScript whitespace %j', async whitespace => {
  const converted = await parseCSVTextAsArrow(`value\n"${whitespace}-1.25${whitespace}"`, {
    csv: {header: true, dynamicTyping: true}
  });
  expect(getColumnValues(converted, 'value')).toEqual([-1.25]);
});

test('CSV quoted dynamic strings retain short non-ASCII and non-whitespace prefixes', async () => {
  const converted = await parseCSVTextAsArrow('value\n"é"\n"\u200b1"\n"\u20601"', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(getColumnValues(converted, 'value')).toEqual(['é', '\u200b1', '\u20601']);
});

test('CSV geometry streaming skips metadata batches and retains missing geometries', async () => {
  const bytes = new TextEncoder().encode('geometry,name\nPOINT (1 2),point\n,missing');
  const batches: ArrowTableBatch[] = [];
  for await (const batch of parseCSVInArrowBatches([bytes.subarray(0, 26), bytes.subarray(26)], {
    core: {worker: false, metadata: true, batchSize: 1},
    csv: {header: true, detectGeometryColumns: true, geometryEncoding: 'source'},
    geoarrow: {encodingPreference: 'optimized'}
  })) {
    batches.push(batch);
  }
  expect(batches.length).toBeGreaterThan(0);
  expect(batches.every(batch => batch.batchType === 'data')).toBe(true);
  expect(batches.flatMap(batch => getColumnValues(batch, 'name'))).toEqual(['point', 'missing']);
  expect(batches.flatMap(batch => getColumnValues(batch, 'geometry'))[1]).toBeNull();
});
