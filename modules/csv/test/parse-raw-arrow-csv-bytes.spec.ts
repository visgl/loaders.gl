// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {parseRawArrowCSVTable, parseRawArrowCSVText} from '../src/lib/parsers/parse-csv-to-arrow';
import {parseRawArrowCSVBytes} from '../src/lib/parsers/parse-raw-arrow-csv-bytes';

/** Encodes a CSV fixture for the byte parser. */
function encode(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe('raw Arrow CSV parser', () => {
  test('parses unquoted rows, headers, guessed delimiters, and dynamic typing', async () => {
    const table = await parseRawArrowCSVTable(encode('name,value\nalpha,1\nbeta,2\n'), {
      csv: {header: true, dynamicTyping: false}
    });
    expect(toRows(table)).toEqual([
      {name: 'alpha', value: '1'},
      {name: 'beta', value: '2'}
    ]);

    const tabTable = await parseRawArrowCSVText('name\tvalue\nalpha\t1\nbeta\t2\n', {
      csv: {header: true, dynamicTyping: true}
    });
    expect(toRows(tabTable)).toEqual([
      {name: 'alpha', value: '1'},
      {name: 'beta', value: '2'}
    ]);
  });

  test('parses quoted fields, escaped quotes, multiline values, and empty rows', async () => {
    const table = await parseRawArrowCSVTable(
      encode('name,description\n"alpha","a ""quoted"" value"\n\n"beta","line\nwrapped"\n'),
      {csv: {header: true, skipEmptyLines: false}}
    );
    expect(toRows(table)).toEqual([
      {name: 'alpha', description: 'a "quoted" value'},
      {name: '', description: null},
      {name: 'beta', description: 'line\nwrapped'}
    ]);

    const skippedTable = await parseRawArrowCSVTable(encode('a,b\n, \n1,2\n'), {
      csv: {header: true, skipEmptyLines: 'greedy'}
    });
    expect(toRows(skippedTable)).toEqual([{a: '1', b: '2'}]);
  });

  test('supports explicit delimiters and column prefixes', async () => {
    const table = await parseRawArrowCSVTable(encode('1|2|3\n4|5|6\n'), {
      csv: {delimiter: '|', header: false, columnPrefix: 'field_'}
    });
    expect(toRows(table)).toEqual([
      {field_1: '1', field_2: '2', field_3: '3'},
      {field_1: '4', field_2: '5', field_3: '6'}
    ]);
  });

  test('handles generated and duplicate column names', async () => {
    const generatedTable = await parseRawArrowCSVTable(encode('1,2\n3\n'), {
      csv: {header: false, columnPrefix: 'value'}
    });
    expect(toRows(generatedTable)).toEqual([
      {value1: '1', value2: '2'},
      {value1: '3', value2: null}
    ]);

    const duplicateTable = await parseRawArrowCSVTable(encode('name,name,name\na,b,c\n'), {
      csv: {header: true}
    });
    expect(toRows(duplicateTable)).toEqual([{name: 'a', 'name.1': 'b', 'name.2': 'c'}]);
  });

  test('handles strict empty lines, carriage returns, and UTF-8 bytes', async () => {
    const table = await parseRawArrowCSVTable(encode('name,value\r\n\r\n,\r\n café,é\r\n'), {
      csv: {header: true, skipEmptyLines: true}
    });
    expect(toRows(table)).toEqual([
      {name: '', value: ''},
      {name: ' café', value: 'é'}
    ]);
  });

  test('falls back when options are outside the raw byte parser contract', async () => {
    const bytes = encode('a,b\n1,2\n');
    expect(parseRawArrowCSVBytes(bytes, {comments: '#'} as any)).toBeNull();
    expect(parseRawArrowCSVBytes(bytes, {quoteChar: '##'} as any)).toBeNull();
    expect(parseRawArrowCSVBytes(bytes, {escapeChar: '\\'} as any)).toBeNull();
    expect(parseRawArrowCSVBytes(bytes, {viewTypes: 'require'} as any)).toBeNull();

    const fallback = await parseRawArrowCSVTable(bytes, {
      csv: {header: true, comments: '#'}
    });
    expect(toRows(fallback)).toEqual([{a: '1', b: '2'}]);
  });
});

/** Converts Arrow struct rows to plain objects for stable assertions. */
function toRows(table: any): Record<string, unknown>[] {
  return table.data.toArray().map((row: any) => row.toJSON());
}
