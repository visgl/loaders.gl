// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/bundled';
import {describe, expect, test} from 'vitest';
import {calculateInitialTypedColumnCapacity} from '../src/csv-arrow-table-parser';

/** Reads one Arrow column into ordinary JavaScript values for assertions. */
function getArrowColumnValues(table: any, columnName: string): unknown[] {
  const column = table.data.getChild(columnName);
  return column
    ? Array.from({length: table.data.numRows}, (_, rowIndex) => column.get(rowIndex))
    : [];
}

describe('CSV optimized parsing paths', () => {
  test('preserves quoted UTF-8 fields, embedded newlines, delimiters, and escaped quotes', async () => {
    const csvText = 'name,note,empty\r\nÅsa,"mañana,\"\"世界\"\"",x\r\n"Eve","hello\nthere",\r\n';
    const table = await CSVLoader.parseText(csvText, {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: false, skipEmptyLines: false}
    });

    expect(table.data.numRows).toBe(2);
    expect(getArrowColumnValues(table, 'name')).toEqual(['Åsa', 'Eve']);
    expect(getArrowColumnValues(table, 'note')).toEqual(['mañana,"世界"', 'hello\nthere']);
    expect(getArrowColumnValues(table, 'empty')).toEqual(['x', '']);
  });

  test.each([false, true])('matches row output for dynamicTyping=%s', async dynamicTyping => {
    const csvText = 'name,count,enabled\nitem,42,TRUE\nother,,false';
    const options = {header: true as const, dynamicTyping, skipEmptyLines: false as const};
    const rowTable = await CSVLoader.parseText(csvText, {
      csv: {...options, shape: 'array-row-table' as const}
    });
    const arrowTable = await CSVLoader.parseText(csvText, {
      csv: {...options, shape: 'arrow-table' as const}
    });

    const arrowRows = Array.from({length: arrowTable.data.numRows}, (_, rowIndex) =>
      Array.from({length: arrowTable.data.numCols}, (_, columnIndex) =>
        arrowTable.data.getChildAt(columnIndex)?.get(rowIndex)
      )
    );
    expect(arrowRows).toEqual(rowTable.data);
  });

  test('coerces mixed dynamically typed UTF-8 columns to strings', async () => {
    const table = await CSVLoader.parseText('value\n42\ntext\n001\n', {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true}
    });

    expect(getArrowColumnValues(table, 'value')).toEqual(['42', 'text', '1']);
  });

  test('continues dynamic typing after a column is promoted to UTF-8', async () => {
    const dateText = '2018-05-04T21:08:03.269Z';
    const table = await CSVLoader.parseText(`value\ntext\n001\nTRUE\n 7 \n${dateText}\n`, {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true}
    });

    expect(getArrowColumnValues(table, 'value')).toEqual([
      'text',
      '1',
      'true',
      '7',
      String(new Date(dateText))
    ]);
  });

  test('preserves Papa-compatible dynamic number and boolean grammar', async () => {
    const csvText =
      'integer,leadingDecimal,trailingDecimal,exponent,whitespace,unicodeWhitespace,plus,mixedBoolean,trimmedBoolean,upperBoolean,lowerBoolean\n' +
      '-42,-.25,1.,3.5e2, 7 ,\u00a08\u00a0,+1,True, true ,TRUE,false';
    const options = {header: true as const, dynamicTyping: true, skipEmptyLines: false as const};
    const rowTable = await CSVLoader.parseText(csvText, {
      csv: {...options, shape: 'array-row-table'}
    });
    const arrowTable = await CSVLoader.parseText(csvText, {
      csv: {...options, shape: 'arrow-table'}
    });

    const arrowRow = Array.from({length: arrowTable.data.numCols}, (_, columnIndex) =>
      arrowTable.data.getChildAt(columnIndex)?.get(0)
    );
    expect(arrowRow).toEqual(rowTable.data[0]);
    expect(arrowRow).toEqual([-42, -0.25, 1, 350, 7, 8, '+1', 'True', ' true ', true, false]);
  });

  test('parses typed unquoted ArrayBuffer input with CRLF, UTF-8, and empty cells', async () => {
    const csvText = 'city,count,enabled\r\nMünchen,42,TRUE\r\n東京,,false\r\n';
    const encodedCSV = new TextEncoder().encode(csvText);
    const table = await CSVLoader.parse(encodedCSV.buffer, {
      csv: {
        header: true,
        shape: 'arrow-table',
        dynamicTyping: true,
        skipEmptyLines: false
      }
    });

    expect(getArrowColumnValues(table, 'city')).toEqual(['München', '東京']);
    expect(getArrowColumnValues(table, 'count')).toEqual([42, null]);
    expect(getArrowColumnValues(table, 'enabled')).toEqual([true, false]);
  });

  test('parses an integer matrix directly into numeric Arrow columns', async () => {
    const table = await CSVLoader.parseText('a,b,c\r\n1,2,3\r\n4,5,6', {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true}
    });

    expect(table.schema?.fields.map(field => field.type)).toEqual([
      'float64',
      'float64',
      'float64'
    ]);
    expect(getArrowColumnValues(table, 'a')).toEqual([1, 4]);
    expect(getArrowColumnValues(table, 'b')).toEqual([2, 5]);
    expect(getArrowColumnValues(table, 'c')).toEqual([3, 6]);
  });

  test('parses a single integer column without a final newline', async () => {
    const table = await CSVLoader.parseText('value\r\n1\r\n2', {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true}
    });

    expect(table.schema?.fields.map(field => field.type)).toEqual(['float64']);
    expect(getArrowColumnValues(table, 'value')).toEqual([1, 2]);
  });

  test('bounds speculative typed storage for shallow high-cardinality input', async () => {
    const columnCount = 5000;
    const header = Array.from({length: columnCount}, (_, columnIndex) => `c${columnIndex}`);
    const values = Array.from({length: columnCount}, (_, columnIndex) => String(columnIndex));
    const csvBytes = new TextEncoder().encode(`${header.join(',')}\n${values.join(',')}\n`);

    expect(calculateInitialTypedColumnCapacity(csvBytes.length, columnCount)).toBeLessThan(4);

    const table = await CSVLoader.parse(csvBytes.buffer, {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true, skipEmptyLines: false}
    });
    expect(table.data.numCols).toBe(columnCount);
    expect(table.data.numRows).toBe(1);
    expect(table.data.getChildAt(columnCount - 1)?.get(0)).toBe(columnCount - 1);
  });

  test('preserves nulls and source strings in mixed typed columns', async () => {
    const table = await CSVLoader.parseText('id,label,optional\n1,item-1,\n2,item-2,+2\n', {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true}
    });

    expect(table.schema?.fields.map(field => field.type)).toEqual(['float64', 'utf8', 'utf8']);
    expect(getArrowColumnValues(table, 'id')).toEqual([1, 2]);
    expect(getArrowColumnValues(table, 'label')).toEqual(['item-1', 'item-2']);
    expect(getArrowColumnValues(table, 'optional')).toEqual([null, '+2']);
  });

  test('covers direct typed column growth, promotion, duplicate headers, and ragged rows', async () => {
    const rows = [
      'value|value|raw|boolean|date|missing',
      '||alpha|TRUE|2018-05-04T21:08:03.269Z|',
      '1|10||false|2019-06-05T01:02:03Z',
      '2|20|beta||2020-07-06T01:02:03+01:00|tail|ignored',
      '|30|gamma|TRUE||tail',
      'text|40|FALSE|false|not-a-date|tail',
      '3|50|delta|TRUE|2021-08-07T01:02:03.000Z|tail',
      '4|60|epsilon|FALSE|2022-09-08T01:02:03.000Z|tail',
      '5|70|zeta|TRUE|2023-10-09T01:02:03.000Z|tail'
    ];
    const csvBytes = new TextEncoder().encode(rows.join('\r\n'));
    const table = await CSVLoader.parse(csvBytes.buffer, {
      csv: {
        delimiter: '|',
        header: true,
        shape: 'arrow-table',
        dynamicTyping: true,
        skipEmptyLines: false
      }
    });

    expect(table.schema?.fields.map(field => field.name)).toEqual([
      'value',
      'value.1',
      'raw',
      'boolean',
      'date',
      'missing'
    ]);
    expect(getArrowColumnValues(table, 'value')).toEqual([
      null,
      '1',
      '2',
      null,
      'text',
      '3',
      '4',
      '5'
    ]);
    expect(getArrowColumnValues(table, 'value.1')).toEqual([null, 10, 20, 30, 40, 50, 60, 70]);
    expect(getArrowColumnValues(table, 'raw')).toEqual([
      'alpha',
      null,
      'beta',
      'gamma',
      'false',
      'delta',
      'epsilon',
      'zeta'
    ]);
    expect(getArrowColumnValues(table, 'boolean')).toEqual([
      true,
      false,
      null,
      true,
      false,
      true,
      false,
      true
    ]);
    expect(getArrowColumnValues(table, 'missing')).toEqual([
      null,
      null,
      'tail',
      'tail',
      'tail',
      'tail',
      'tail',
      'tail'
    ]);
  });

  test.each([
    ['empty input', '', {}],
    ['quoted header', '"a",b\n1,2', {}],
    ['multi-byte delimiter', 'a::b\n1::2', {delimiter: '::'}],
    ['non-ASCII delimiter', 'a§b\n1§2', {delimiter: '§'}],
    ['comments', 'a,b\n# ignored\n1,2', {comments: '#'}],
    ['greedy empty lines', 'a,b\n\n1,2', {skipEmptyLines: 'greedy' as const}],
    ['custom escaping', 'a,b\n1,2', {quoteChar: "'", escapeChar: '\\'}],
    ['too many numeric fields', 'a,b\n1,2,3', {}],
    ['too few numeric fields', 'a,b,c\n1,2', {}],
    ['invalid numeric character', 'a,b\n1,x', {}],
    ['empty numeric field', 'a,b\n1,', {}],
    ['bare carriage return', 'a,b\r1,2\r3,4', {}]
  ])('falls back safely for %s', async (_name, csvText, csvOptions) => {
    const table = await CSVLoader.parseText(csvText as string, {
      csv: {
        header: true,
        shape: 'arrow-table',
        dynamicTyping: true,
        ...(csvOptions as object)
      }
    });
    const expectedTable = await CSVLoader.parseText(csvText as string, {
      csv: {
        header: true,
        shape: 'object-row-table',
        dynamicTyping: true,
        ...(csvOptions as object)
      }
    });
    expect(table.data.numRows).toBe(expectedTable.data.length);
    const expectedFields = (expectedTable.schema?.fields || []).filter(
      field => field.name !== '__parsed_extra'
    );
    expect(table.schema?.fields.map(field => field.name)).toEqual(
      expectedFields.map(field => field.name)
    );
    for (const field of expectedFields) {
      expect(getArrowColumnValues(table, field.name)).toEqual(
        expectedTable.data.map(row => row[field.name] ?? null)
      );
    }
  });

  test('preserves custom delimiter inference for row output', async () => {
    const table = await CSVLoader.parseText('city^count\nParis^42\n', {
      csv: {
        header: true,
        shape: 'array-row-table',
        dynamicTyping: false,
        delimitersToGuess: ['^']
      }
    });

    expect(table.data).toEqual([['Paris', '42']]);
  });

  test('does not create a data row for a header-only unquoted Arrow table', async () => {
    const table = await CSVLoader.parseText('name\n', {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: false}
    });

    expect(table.data.numRows).toBe(0);
  });

  test.each([
    false,
    true
  ])('retains streaming batch behavior across UTF-8 and quoted chunk boundaries (dynamicTyping=%s)', async dynamicTyping => {
    const csvText = 'name,count,note\nÅsa,42,"x,y"\nBob,,"hello\nthere"\nEve,7,"plain"\n';
    const bytes = new TextEncoder().encode(csvText);
    /** Splits the input into one-byte chunks to exercise parser state across boundaries. */
    async function* createChunks(): AsyncIterable<ArrayBuffer> {
      for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
        yield bytes.slice(byteIndex, byteIndex + 1).buffer;
      }
    }

    const batches = await parseInBatches(createChunks(), CSVLoader, {
      core: {worker: false, batchSize: 2},
      csv: {header: true, shape: 'arrow-table', dynamicTyping, skipEmptyLines: false}
    });
    const rows: unknown[][] = [];
    for await (const batch of batches) {
      for (let rowIndex = 0; rowIndex < batch.data.numRows; rowIndex++) {
        rows.push(
          Array.from({length: batch.data.numCols}, (_, columnIndex) =>
            batch.data.getChildAt(columnIndex)?.get(rowIndex)
          )
        );
      }
    }

    expect(rows).toEqual(
      dynamicTyping
        ? [
            ['Åsa', 42, 'x,y'],
            ['Bob', null, 'hello\nthere'],
            ['Eve', 7, 'plain']
          ]
        : [
            ['Åsa', '42', 'x,y'],
            ['Bob', '', 'hello\nthere'],
            ['Eve', '7', 'plain']
          ]
    );
  });
});
