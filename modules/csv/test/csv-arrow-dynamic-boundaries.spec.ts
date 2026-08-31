// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parseCSVArrayBufferAsArrow, parseCSVTextAsArrow} from '../src/csv-arrow-table-parser';

const encoder = new TextEncoder();

/** Returns one Arrow column as ordinary values. */
function values(table: any, name: string): unknown[] {
  const column = table.data.getChild(name);
  return Array.from({length: table.data.numRows}, (_, index) => column.get(index));
}

test('ArrayBuffer Arrow parsing covers geometry and untyped fallback paths', async () => {
  const geometry = await parseCSVArrayBufferAsArrow(
    encoder.encode('name,geometry\npoint,POINT (1 2)').buffer,
    {csv: {header: true, detectGeometryColumns: true}}
  );
  expect(geometry.data.getChild('geometry')!.get(0)).toBeInstanceOf(Uint8Array);

  const untyped = await parseCSVArrayBufferAsArrow(encoder.encode('a,b\n1,2').buffer, {
    csv: {header: true, dynamicTyping: false}
  });
  expect(values(untyped, 'a')).toEqual(['1']);

  const typedQuoted = await parseCSVArrayBufferAsArrow(
    encoder.encode('number,boolean\n"1.5","false"').buffer,
    {csv: {header: true, dynamicTyping: true}}
  );
  expect(values(typedQuoted, 'number')).toEqual([1.5]);
  expect(values(typedQuoted, 'boolean')).toEqual([false]);
});

test('quoted dynamic conversion covers nullable booleans, numbers, and dates', async () => {
  const table = await parseCSVTextAsArrow(
    [
      'boolean,number,date',
      '"true"," -1.25e+3 ","2025-01-02T03:04:05Z"',
      ',,"2026-02-03T04:05:06Z"',
      '"FALSE",".5",'
    ].join('\n'),
    {csv: {header: true, dynamicTyping: true}}
  );
  expect(values(table, 'boolean')).toEqual([true, null, false]);
  expect(values(table, 'number')).toEqual([-1250, null, 0.5]);
  expect(values(table, 'date')).toEqual([
    Date.parse('2025-01-02T03:04:05Z'),
    Date.parse('2026-02-03T04:05:06Z'),
    null
  ]);
});

test.each([
  ['1e', '1e'],
  ['1e+', '1e+'],
  ['1e-x', '1e-x'],
  ['-.', '-.'],
  ['1.2.3', '1.2.3'],
  ['   ', '   ']
])('quoted dynamic conversion preserves invalid numeric grammar %s', async (input, output) => {
  const table = await parseCSVTextAsArrow(`value\n"${input}"`, {
    csv: {header: true, dynamicTyping: true}
  });
  expect(values(table, 'value')).toEqual([output]);
});

test('direct numeric parser covers duplicate headers and malformed speculative rows', async () => {
  const duplicate = await parseCSVTextAsArrow('value,value\n1,2\n3,4', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(duplicate.schema.fields.map(field => field.name)).toEqual(['value', 'value.1']);
  expect(values(duplicate, 'value.1')).toEqual([2, 4]);

  const malformedWidth = await parseCSVTextAsArrow('a,b\n1\n2,3', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(malformedWidth.data.numRows).toBe(2);

  const headerOnly = await parseCSVTextAsArrow('a,b', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(headerOnly.data.numRows).toBe(0);
});

test('direct parser rejects incompatible delimiter candidates before safe fallback', async () => {
  const table = await parseCSVTextAsArrow('a§b\n1§2', {
    csv: {
      header: true,
      dynamicTyping: true,
      delimiter: '§'
    }
  });
  expect(values(table, 'a')).toEqual([1]);

  const guessed = await parseCSVTextAsArrow('a|b\n1|2', {
    csv: {
      header: true,
      dynamicTyping: true,
      delimitersToGuess: ['§', '||', '|']
    }
  });
  expect(values(guessed, 'b')).toEqual([2]);
});
