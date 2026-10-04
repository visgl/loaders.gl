// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/schema';
import {
  parseRawArrowCSVASCIIText,
  parseRawArrowCSVBytes
} from '../src/lib/parsers/parse-raw-arrow-csv-bytes';
import type {CSVRawArrowOptions} from '../src/lib/parsers/parse-csv-to-arrow';

/** Parses a tiny byte fixture and verifies that the raw scanner accepted it. */
function parseBytes(csvText: string, options: CSVRawArrowOptions = {}): ArrowTable {
  const bytes = new TextEncoder().encode(csvText);
  expect(bytes.byteLength).toBeLessThan(1024);
  const table = parseRawArrowCSVBytes(bytes.buffer, options);
  expect(table).not.toBeNull();
  return table!;
}

/** Materializes Arrow rows for exact field, escape, and null assertions. */
function getRows(table: ArrowTable): Record<string, unknown>[] {
  return table.data.toArray().map(row => row.toJSON());
}

test('raw CSV delimiter inference ignores escaped quotes in the header', () => {
  const table = parseBytes('"na""me,part";value\nAda;2', {
    header: true,
    delimitersToGuess: [',', ';']
  });
  expect(table.schema.fields.map(field => field.name)).toEqual(['na"me,part', 'value']);
  expect(getRows(table)).toEqual([{'na"me,part': 'Ada', value: '2'}]);
});

test('raw CSV general scanner writes escaped fields directly after the first data row', () => {
  // A quoted header selects the general scanner; subsequent rows write directly to columns.
  const table = parseBytes('"name",note\nfirst,plain\n"a""b""c","tail""quote"\nlast', {
    header: true,
    delimiter: ',',
    skipEmptyLines: false
  });
  expect(getRows(table)).toEqual([
    {name: 'first', note: 'plain'},
    {name: 'a"b"c', note: 'tail"quote'},
    {name: 'last', note: null}
  ]);
});

test('raw CSV general scanner ignores extra escaped columns', () => {
  const table = parseBytes('"name"\nfirst\nsecond,"ignored""value"\n"third""value"', {
    header: true,
    delimiter: ',',
    skipEmptyLines: false
  });
  expect(getRows(table)).toEqual([{name: 'first'}, {name: 'second'}, {name: 'third"value'}]);
});

test('raw CSV data-first escaped fields preserve generated names and final empty cells', () => {
  const table = parseBytes('"a""b",x\n"c""d",', {delimiter: ',', columnPrefix: 'field'});
  expect(getRows(table)).toEqual([
    {field1: 'a"b', field2: 'x'},
    {field1: 'c"d', field2: ''}
  ]);
});

test('raw CSV greedy empty detection retains escaped quote content', () => {
  const table = parseBytes('value\n"   "\n""\n""""\n" x""y "', {
    header: true,
    delimiter: ',',
    skipEmptyLines: 'greedy'
  });
  expect(getRows(table)).toEqual([{value: '"'}, {value: ' x"y '}]);
});

test('raw CSV auto-header inference decodes escaped header values', () => {
  const table = parseBytes('"na""me",value\nAda,2', {
    header: 'auto',
    dynamicTyping: true,
    delimiter: ',',
    skipEmptyLines: true
  });
  expect(getRows(table)).toEqual([{'na"me': 'Ada', value: '2'}]);
});

test.each([
  '"',
  'é'
])('raw ASCII scanner rejects late invalid header characters %s', invalidCharacter => {
  const header = 'a'.repeat(257) + invalidCharacter;
  expect(
    parseRawArrowCSVASCIIText(`${header},value\nx,y`, {
      delimiter: ',',
      header: true
    })
  ).toBeNull();
  expect(
    parseRawArrowCSVASCIIText(`${header},value\nx,y`, {
      delimiter: ',',
      header: 'auto',
      dynamicTyping: true
    })
  ).toBeNull();
});
