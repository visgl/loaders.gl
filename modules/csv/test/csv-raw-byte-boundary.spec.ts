// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  parseRawArrowCSVASCIIText,
  parseRawArrowCSVBytes
} from '../src/lib/parsers/parse-raw-arrow-csv-bytes';

const textEncoder = new TextEncoder();

describe('raw Arrow CSV byte parser boundaries', () => {
  test('rejects option combinations outside the direct scanner contract', () => {
    const source = textEncoder.encode('a,b\n1,2').buffer;
    const invalidOptions = [
      {comments: '#'},
      {quoteChar: 'xx'},
      {quoteChar: '"', escapeChar: '\\'},
      {delimiter: '||'},
      {delimiter: 'é'},
      {viewTypes: 'require'}
    ];

    for (const options of invalidOptions) {
      expect(parseRawArrowCSVBytes(source, options as any)).toBeNull();
    }
    expect(
      parseRawArrowCSVASCIIText('a,b\n1,2', {delimiter: ',', comments: '#'} as any)
    ).toBeNull();
    expect(
      parseRawArrowCSVASCIIText('a,b\n1,2', {delimiter: ',', skipEmptyLines: true} as any)
    ).toBeNull();
    expect(parseRawArrowCSVASCIIText('a,b\n1,2', {delimiter: '||'} as any)).toBeNull();
    expect(parseRawArrowCSVASCIIText('a,b\n1,2', {delimiter: 'é'} as any)).toBeNull();
  });

  test('guesses delimiters around quoted spans and handles every line ending', () => {
    const cases = [
      ['name|note\r\nAda|"x,y"\rBob|plain\n', '|', 2],
      ['name;note\nAda;"x|y"', ';', 1],
      ['name\tnote\nAda\tplain', '\t', 1]
    ] as const;

    for (const [csvText, expectedDelimiter, expectedRowCount] of cases) {
      const table = parseRawArrowCSVBytes(textEncoder.encode(csvText).buffer, {
        header: true,
        delimitersToGuess: [',', '\t', '|', ';'],
        dynamicTyping: false,
        skipEmptyLines: false
      } as any)!;
      expect(table.data.numRows).toBe(expectedRowCount);
      expect(table.data.schema.fields.map(field => field.name)).toEqual(['name', 'note']);
      expect(csvText.includes(expectedDelimiter)).toBe(true);
    }
  });

  test('grows value, offset, escape, and null buffers without changing cells', () => {
    const longValue = 'x'.repeat(5000);
    const rows = Array.from({length: 1100}, (_, index) =>
      index === 2 ? `${index}` : `${index},${index === 3 ? longValue : `value-${index}`}`
    );
    const table = parseRawArrowCSVASCIIText(`id,value\r\n${rows.join('\n')}`, {
      delimiter: ',',
      header: true,
      dynamicTyping: false,
      skipEmptyLines: false
    } as any)!;

    expect(table.data.numRows).toBe(1100);
    expect(table.data.getChild('value')!.get(2)).toBeNull();
    expect(table.data.getChild('value')!.get(3)).toBe(longValue);
    expect(table.data.getChild('value')!.get(1099)).toBe('value-1099');
  });

  test('handles escaped, multiline, empty, extra, and late UTF-8 fields', () => {
    const padding = 'a'.repeat(300);
    const csvText = `a,a,c\n"${padding}""quoted","line\none",x\nshort,,extra,ignored\nlate,é,z\n`;
    const table = parseRawArrowCSVBytes(textEncoder.encode(csvText).buffer, {
      delimiter: ',',
      header: true,
      dynamicTyping: false,
      skipEmptyLines: false
    } as any)!;

    expect(table.data.schema.fields.map(field => field.name)).toEqual(['a', 'a.1', 'c']);
    expect(table.data.numRows).toBe(3);
    expect(table.data.getChild('a')!.get(0)).toBe(`${padding}"quoted`);
    expect(table.data.getChild('a.1')!.get(0)).toBe('line\none');
    expect(table.data.getChild('a.1')!.get(1)).toBe('');
    expect(table.data.getChild('a.1')!.get(2)).toBe('é');
  });

  test('covers empty/header-only tables and automatic header decisions', () => {
    const empty = parseRawArrowCSVBytes(new ArrayBuffer(0), {
      delimiter: ',',
      header: false
    } as any)!;
    expect(empty.data.numRows).toBe(0);

    const headerOnly = parseRawArrowCSVASCIIText('left,right', {
      delimiter: ',',
      header: true
    } as any)!;
    expect(headerOnly.data.numRows).toBe(0);
    expect(headerOnly.data.numCols).toBe(2);

    const automaticHeader = parseRawArrowCSVASCIIText('left,right\n1,2', {
      delimiter: ',',
      header: 'auto',
      dynamicTyping: true
    } as any)!;
    const automaticData = parseRawArrowCSVASCIIText('1,2\n3,4', {
      delimiter: ',',
      header: 'auto',
      dynamicTyping: true,
      columnPrefix: 'field'
    } as any)!;
    expect(automaticHeader.data.schema.fields.map(field => field.name)).toEqual(['left', 'right']);
    expect(automaticData.data.schema.fields.map(field => field.name)).toEqual(['field1', 'field2']);
    expect(automaticData.data.numRows).toBe(2);
  });

  test('classifies every automatic-header value family and skip-empty mode', () => {
    const headerValues = ['true', 'FALSE', '  null ', '1', '-2.5e+3', '2024-01-02T03:04:05Z'];
    const header = parseRawArrowCSVASCIIText(
      `${headerValues.join(',')}\n${headerValues.map((_, index) => `name${index}`).join(',')}`,
      {delimiter: ',', header: 'auto', dynamicTyping: true} as any
    )!;
    expect(header.data.numRows).toBe(2);

    const names = ['enabled', 'disabled', 'empty', 'integer', 'float', 'date'];
    const named = parseRawArrowCSVBytes(
      textEncoder.encode(`${names.join(',')}\n${headerValues.join(',')}`).buffer,
      {delimiter: ',', header: 'auto', dynamicTyping: true, skipEmptyLines: false} as any
    )!;
    expect(named.data.schema.fields.map(field => field.name)).toEqual(names);
    expect(named.data.numRows).toBe(1);

    const rows = 'a,b\n,\n   ,\t\n1,2\n\n3,4\n';
    const strict = parseRawArrowCSVBytes(textEncoder.encode(rows).buffer, {
      delimiter: ',',
      header: true,
      skipEmptyLines: true
    } as any)!;
    const greedy = parseRawArrowCSVBytes(textEncoder.encode(rows).buffer, {
      delimiter: ',',
      header: true,
      skipEmptyLines: 'greedy'
    } as any)!;
    expect(strict.data.numRows).toBe(4);
    expect(greedy.data.numRows).toBe(2);
  });

  test('rejects late text-path quotes and UTF-8 while byte parsing them', () => {
    const prefix = 'x'.repeat(300);
    expect(
      parseRawArrowCSVASCIIText(`a,b\n${prefix},late"quote`, {
        delimiter: ',',
        header: true
      } as any)
    ).toBeNull();
    expect(
      parseRawArrowCSVASCIIText(`a,b\n${prefix},é`, {delimiter: ',', header: true} as any)
    ).toBeNull();

    const table = parseRawArrowCSVBytes(textEncoder.encode(`a,b\n${prefix},é`).buffer, {
      delimiter: ',',
      header: true,
      quoteChar: "'",
      escapeChar: "'"
    } as any)!;
    expect(table.data.getChild('b')!.get(0)).toBe('é');
  });
});
