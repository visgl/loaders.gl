// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  parseCSVArrayBufferAsArrow,
  parseCSVInArrowBatches,
  parseCSVTextAsArrow
} from '../src/csv-arrow-table-parser';
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

  test('handles empty and header-only byte inputs without fabricating rows', async () => {
    const emptyTable = parseRawArrowCSVBytes(encode(''), {header: true});
    expect(emptyTable?.schema.fields).toEqual([]);
    expect(emptyTable?.data.numRows).toBe(0);

    const headerOnlyTable = await parseRawArrowCSVText('first,second', {
      csv: {header: true}
    });
    expect(headerOnlyTable.schema.fields.map(field => field.name)).toEqual(['first', 'second']);
    expect(headerOnlyTable.data.numRows).toBe(0);

    const carriageReturnTable = await parseRawArrowCSVTable(encode('first,second\r1,2\r'), {
      csv: {header: true}
    });
    expect(toRows(carriageReturnTable)).toEqual([{first: '1', second: '2'}]);
  });

  test('keeps quoted headers and duplicate names stable across parser paths', async () => {
    const table = await parseRawArrowCSVTable(
      encode('"name","name","comment"\n"Ada","Grace","hello, world"'),
      {csv: {header: true}}
    );
    expect(table.schema.fields.map(field => field.name)).toEqual(['name', 'name.1', 'comment']);
    expect(toRows(table)).toEqual([{name: 'Ada', 'name.1': 'Grace', comment: 'hello, world'}]);
  });

  test('uses the direct typed path for raw UTF-8 values and nulls', async () => {
    const table = await parseCSVTextAsArrow('label,count\nalpha,1\n,2\nbeta,3', {
      csv: {header: true, dynamicTyping: true}
    });
    expect(table.schema.fields.map(field => field.type)).toEqual(['utf8', 'float64']);
    expect(getArrowColumnValues(table, 'label')).toEqual(['alpha', null, 'beta']);
    expect(getArrowColumnValues(table, 'count')).toEqual([1, 2, 3]);

    const arrayBufferTable = await parseCSVArrayBufferAsArrow(
      encode('label,count\nalpha,1\n,2\nbeta,3'),
      {csv: {header: true, dynamicTyping: true}}
    );
    expect(getArrowColumnValues(arrayBufferTable, 'label')).toEqual(['alpha', null, 'beta']);
  });

  test('freezes inferred types across Arrow batches', async () => {
    const chunks = [encode('value,name\n1,first\n'), encode('text,second\n3,third\n')];
    const batches = parseCSVInArrowBatches(chunks, {
      csv: {header: true, dynamicTyping: true},
      core: {batchSize: 1}
    });
    const values: unknown[] = [];
    const types: string[] = [];
    for await (const batch of batches) {
      values.push(...getArrowColumnValues(batch, 'value'));
      types.push(batch.schema.fields[0].type);
    }
    expect(values).toEqual([1, null, 3]);
    expect(types).toEqual(['float64', 'float64', 'float64']);
  });

  test('converts detected WKT geometry through the Arrow public parser', async () => {
    const table = await parseCSVTextAsArrow('name,geometry\npoint,POINT (1 2)', {
      csv: {header: true, detectGeometryColumns: true}
    });
    expect(table.data.numRows).toBe(1);
    expect(table.schema.fields.map(field => field.name)).toEqual(['name', 'geometry']);
    expect(table.data.getChild('geometry')?.get(0)).toBeInstanceOf(Uint8Array);
  });

  test('uses the Papa fallback for memory-optimized and skipped-line input', async () => {
    const table = await parseRawArrowCSVText('name,value\nalpha,1,extra\n\n', {
      csv: {header: true, optimizeMemoryUsage: true, skipEmptyLines: true}
    });
    expect(table.data.numRows).toBe(1);
    expect(table.schema.fields.map(field => field.name)).toEqual(['name', 'value']);
    expect(toRows(table)).toEqual([{name: 'alpha', value: '1'}]);
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

/** Reads one Arrow column into ordinary JavaScript values for stable assertions. */
function getArrowColumnValues(table: any, columnName: string): unknown[] {
  const column = table.data.getChild(columnName);
  return column
    ? Array.from({length: table.data.numRows}, (_, rowIndex) => column.get(rowIndex))
    : [];
}

/** Converts Arrow struct rows to plain objects for stable assertions. */
function toRows(table: any): Record<string, unknown>[] {
  return table.data.toArray().map((row: any) => row.toJSON());
}
