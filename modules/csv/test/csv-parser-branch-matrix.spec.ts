// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  parseRawArrowCSVASCIIText,
  parseRawArrowCSVBytes
} from '../src/lib/parsers/parse-raw-arrow-csv-bytes';

const textEncoder = new TextEncoder();

/** Encodes a string into an exact ArrayBuffer. */
function encode(text: string): ArrayBuffer {
  return textEncoder.encode(text).buffer;
}

/** Returns plain rows from a loaders.gl Arrow table. */
function getRows(table: any): Record<string, unknown>[] {
  return table.data.toArray().map((row: any) => row.toJSON());
}

test.each([
  [',', 'a,b\n1,2', {header: true}, [{a: '1', b: '2'}]],
  [';', 'a;b\r1;2', {header: true}, [{a: '1', b: '2'}]],
  ['\t', 'a\tb\r\n1\t2\r\n', {header: true}, [{a: '1', b: '2'}]],
  [
    '|',
    '1|2\n3|4',
    {header: false, columnPrefix: 'field'},
    [
      {field1: '1', field2: '2'},
      {field1: '3', field2: '4'}
    ]
  ],
  [
    ',',
    'name,value\nalpha,1',
    {header: 'auto', dynamicTyping: true},
    [{name: 'alpha', value: '1'}]
  ],
  [
    ',',
    '1,2\n3,4',
    {header: 'auto', dynamicTyping: true, columnPrefix: 'c'},
    [
      {c1: '1', c2: '2'},
      {c1: '3', c2: '4'}
    ]
  ],
  [',', 'a,a,a\n1,2,3', {header: true}, [{a: '1', 'a.1': '2', 'a.2': '3'}]],
  [
    ',',
    'a,b,c\n1\n2,3\n4,5,6,7',
    {header: true},
    [
      {a: '1', b: null, c: null},
      {a: '2', b: '3', c: null},
      {a: '4', b: '5', c: '6'}
    ]
  ],
  [
    ',',
    'a,b\n,\n1,2',
    {header: true, skipEmptyLines: false},
    [
      {a: '', b: ''},
      {a: '1', b: '2'}
    ]
  ],
  [
    ',',
    'a,b\n,\n  ,\t\n1,2',
    {header: true, skipEmptyLines: true},
    [
      {a: '', b: ''},
      {a: '  ', b: '\t'},
      {a: '1', b: '2'}
    ]
  ],
  [',', 'a,b\n,\n  ,\t\n1,2', {header: true, skipEmptyLines: 'greedy'}, [{a: '1', b: '2'}]]
] as const)('raw byte parser covers delimiter %s and row policy %#', (delimiter, text, options, expectedRows) => {
  const table = parseRawArrowCSVBytes(encode(text), {delimiter, ...options} as any);
  expect(table).not.toBeNull();
  expect(getRows(table)).toEqual(expectedRows);
});

test.each([
  ['a,b\n"one","two"', [{a: 'one', b: 'two'}]],
  ['a,b\n"one,inside",two', [{a: 'one,inside', b: 'two'}]],
  ['a,b\n"one\ninside",two', [{a: 'one\ninside', b: 'two'}]],
  ['a,b\n"one""quoted""",two', [{a: 'one"quoted"', b: 'two'}]],
  ['a,b\n"",two', [{a: '', b: 'two'}]],
  ['a,b\n"unterminated,two', [{a: 'unterminated,two', b: null}]],
  ['a,b\nplain,"tail""quote"', [{a: 'plain', b: 'tail"quote'}]],
  [
    'a,b\r\n"one",two\rthree,four',
    [
      {a: 'one', b: 'two'},
      {a: 'three', b: 'four'}
    ]
  ]
] as const)('raw byte parser covers quoted state %#', (text, expectedRows) => {
  const table = parseRawArrowCSVBytes(encode(text), {
    delimiter: ',',
    header: true,
    skipEmptyLines: true
  });
  expect(getRows(table!)).toEqual(expectedRows);
});

test('raw byte parser guesses delimiters while ignoring quoted candidates', () => {
  const semicolon = parseRawArrowCSVBytes(encode('left;right\n"a,b";c'), {
    header: true,
    delimitersToGuess: ['xx', 'é', ',', ';']
  });
  expect(getRows(semicolon!)).toEqual([{left: 'a,b', right: 'c'}]);

  const pipe = parseRawArrowCSVBytes(encode('left|right\r\na|b'), {
    header: true,
    delimitersToGuess: ['\t', '|']
  });
  expect(getRows(pipe!)).toEqual([{left: 'a', right: 'b'}]);
});

test.each([
  [{comments: '#'}, 'comments'],
  [{quoteChar: '##'}, 'long quote'],
  [{quoteChar: 'é'}, 'non-ASCII quote'],
  [{escapeChar: '\\'}, 'different escape'],
  [{delimiter: '||'}, 'long delimiter'],
  [{delimiter: 'é'}, 'non-ASCII delimiter'],
  [{delimitersToGuess: ['xx', 'é']}, 'no usable delimiter'],
  [{viewTypes: 'require'}, 'required view type']
] as const)('raw byte parser rejects unsupported %s options', (options, _label) => {
  expect(parseRawArrowCSVBytes(encode('a,b\n1,2'), options as any)).toBeNull();
});

test('ASCII scanner covers empty input, terminal delimiters, CR variants, and late validation', () => {
  const options = {delimiter: ',', header: false, columnPrefix: 'column'} as const;
  expect(parseRawArrowCSVASCIIText('', options)?.data.numRows).toBe(0);
  expect(getRows(parseRawArrowCSVASCIIText('a,', options)!)).toEqual([{column1: 'a', column2: ''}]);
  expect(getRows(parseRawArrowCSVASCIIText('a,b\r\nc,d\re,f\n', options)!)).toEqual([
    {column1: 'a', column2: 'b'},
    {column1: 'c', column2: 'd'},
    {column1: 'e', column2: 'f'}
  ]);
  const prefix = 'x'.repeat(300);
  expect(parseRawArrowCSVASCIIText(`${prefix},late"quote`, options)).toBeNull();
  expect(parseRawArrowCSVASCIIText(`${prefix},café`, options)).toBeNull();
});

test.each([
  {comments: '#'},
  {skipEmptyLines: true},
  {viewTypes: 'require'},
  {quoteChar: ''},
  {quoteChar: 'é'},
  {escapeChar: '\\'},
  {delimiter: ''},
  {delimiter: '||'},
  {delimiter: 'é'}
])('ASCII scanner rejects unsupported option bag %#', options => {
  expect(parseRawArrowCSVASCIIText('a,b\n1,2', {header: true, ...options} as any)).toBeNull();
});

test('raw builders grow value, offset, escaped, and null buffers together', () => {
  const rows = ['name,name,value'];
  for (let index = 0; index < 1100; index++) {
    const escaped = `${'x'.repeat(8)}"${'y'.repeat(8)}`.replace('"', '""');
    rows.push(index % 3 === 0 ? `"${escaped}",duplicate` : `row-${index},duplicate,${index}`);
  }
  const table = parseRawArrowCSVBytes(encode(rows.join('\n')), {
    delimiter: ',',
    header: true,
    skipEmptyLines: true
  });
  expect(table?.data.numRows).toBe(1100);
  expect(table?.schema.fields.map(field => field.name)).toEqual(['name', 'name.1', 'value']);
  expect(table?.data.getChild('value')?.nullCount).toBeGreaterThan(0);
});
