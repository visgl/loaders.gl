// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  parseRawArrowCSVASCIIText,
  parseRawArrowCSVBytes
} from '../src/lib/parsers/parse-raw-arrow-csv-bytes';

/** Returns one Arrow column as ordinary JavaScript values. */
function getValues(table: any, columnName: string): unknown[] {
  const column = table.data.getChild(columnName);
  return Array.from({length: table.data.numRows}, (_, rowIndex) => column?.get(rowIndex));
}

/** Encodes and parses one CSV string through the raw-byte path. */
function parseBytes(csvText: string, options: Record<string, unknown> = {}): any {
  const encoded = new TextEncoder().encode(csvText);
  return parseRawArrowCSVBytes(encoded.buffer, {
    delimiter: ',',
    header: true,
    dynamicTyping: false,
    skipEmptyLines: false,
    ...options
  });
}

test('raw-byte CSV parses direct quoted, escaped, trailing, and ragged fields', () => {
  const table = parseBytes(
    'name,note,tail\r\n"alpha","a,\"\"b\"\"",x\r\n"beta","line one\nline two",\r\ngamma,plain\r\ndelta,last,',
    {header: 'auto'}
  );

  expect(table.data.numRows).toBe(4);
  expect(getValues(table, 'name')).toEqual(['alpha', 'beta', 'gamma', 'delta']);
  expect(getValues(table, 'note')).toEqual(['a,"b"', 'line one\nline two', 'plain', 'last']);
  expect(getValues(table, 'tail')).toEqual(['x', '', null, null]);
});

test.each([
  true,
  'greedy'
] as const)('raw-byte CSV handles empty rows with skipEmptyLines=%s', skipEmptyLines => {
  const table = parseBytes('a,b\n\n , \n1,2\r\n\r\n3,4\n', {skipEmptyLines});
  expect(getValues(table, 'a')).toEqual(skipEmptyLines === true ? [' ', '1', '3'] : ['1', '3']);
  expect(getValues(table, 'b')).toEqual(skipEmptyLines === true ? [' ', '2', '4'] : ['2', '4']);
});

test('raw-byte CSV infers headers and generates names for data-first input', () => {
  const inferredHeader = parseBytes('city,count\nParis,2\nTokyo,3', {header: 'auto'});
  expect(inferredHeader.schema.fields.map((field: any) => field.name)).toEqual(['city', 'count']);

  const generatedHeader = parseBytes('1,2\n3,4', {
    header: 'auto',
    dynamicTyping: true,
    columnPrefix: 'field'
  });
  expect(generatedHeader.schema.fields.map((field: any) => field.name)).toEqual([
    'field1',
    'field2'
  ]);
  expect(getValues(generatedHeader, 'field1')).toEqual(['1', '3']);

  const explicitData = parseBytes('left,right\nup,down', {header: false, columnPrefix: 'value'});
  expect(explicitData.schema.fields.map((field: any) => field.name)).toEqual(['value1', 'value2']);
  expect(getValues(explicitData, 'value1')).toEqual(['left', 'up']);
});

test('raw-byte CSV grows data, offsets, and null bitmaps without changing values', () => {
  const rows = ['value,optional'];
  for (let rowIndex = 0; rowIndex < 1100; rowIndex++) {
    rows.push(`${'x'.repeat(16 + (rowIndex % 17))},${rowIndex % 3 === 0 ? '' : rowIndex}`);
  }
  const table = parseBytes(rows.join('\n'));

  expect(table.data.numRows).toBe(1100);
  expect(getValues(table, 'value')[1099]).toBe('x'.repeat(16 + (1099 % 17)));
  expect(getValues(table, 'optional').slice(0, 5)).toEqual(['', '1', '2', '', '4']);
});

test('raw-byte CSV supports duplicate and empty headers across line endings', () => {
  for (const lineEnding of ['\n', '\r\n', '\r']) {
    const table = parseBytes(`name,name,,tail${lineEnding}a,b,c,d${lineEnding}`);
    expect(table.schema.fields.map((field: any) => field.name)).toEqual([
      'name',
      'name.1',
      '',
      'tail'
    ]);
    expect(getValues(table, 'name.1')).toEqual(['b']);
  }
});

test('raw-byte CSV exercises quoted fields after builders are initialized', () => {
  const table = parseBytes(
    'a,b\nplain,first\n"quoted","escaped \"\"quote\"\""\nlast,"unterminated tail'
  );
  expect(getValues(table, 'a')).toEqual(['plain', 'quoted', 'last']);
  expect(getValues(table, 'b')).toEqual(['first', 'escaped "quote"', 'unterminated tail']);
});

test('ASCII text fast path covers late admission failures and row boundaries', () => {
  const options = {
    delimiter: '|',
    header: true,
    dynamicTyping: false,
    skipEmptyLines: false
  } as any;
  const table = parseRawArrowCSVASCIIText('left|right\r\na|b\rc|d\ne|f', options)!;
  expect(getValues(table, 'left')).toEqual(['a', 'c', 'e']);
  expect(getValues(table, 'right')).toEqual(['b', 'd', 'f']);

  expect(parseRawArrowCSVASCIIText(`${'a'.repeat(300)}|b\nlate"quote|x`, options)).toBeNull();
  expect(parseRawArrowCSVASCIIText(`${'a'.repeat(300)}|b\nlate-é|x`, options)).toBeNull();
});

test('raw CSV parsers conservatively reject unsupported option combinations', () => {
  const encoded = new TextEncoder().encode('a,b\n1,2');
  const byteCases = [
    {comments: '#'},
    {quoteChar: '""'},
    {quoteChar: "'", escapeChar: '"'},
    {delimiter: '::'},
    {delimiter: '§'},
    {viewTypes: 'require'}
  ];
  for (const options of byteCases) {
    expect(
      parseRawArrowCSVBytes(encoded.buffer, {
        header: true,
        dynamicTyping: false,
        skipEmptyLines: false,
        ...options
      } as any)
    ).toBeNull();
  }

  const textCases = [
    {comments: '#'},
    {skipEmptyLines: true},
    {quoteChar: '""'},
    {quoteChar: "'", escapeChar: '"'},
    {delimiter: ''},
    {delimiter: '::'},
    {delimiter: '§'},
    {viewTypes: 'require'}
  ];
  for (const options of textCases) {
    expect(
      parseRawArrowCSVASCIIText('a,b\n1,2', {
        header: true,
        dynamicTyping: false,
        ...options
      } as any)
    ).toBeNull();
  }
});

test('raw-byte CSV returns structurally valid empty and header-only tables', () => {
  const empty = parseBytes('', {header: false, columnPrefix: 'column'});
  expect(empty.data.numRows).toBe(0);
  expect(empty.data.numCols).toBe(0);

  const headerOnly = parseBytes('a,b\n');
  expect(headerOnly.data.numRows).toBe(0);
  expect(headerOnly.schema.fields.map((field: any) => field.name)).toEqual(['a', 'b']);
});
