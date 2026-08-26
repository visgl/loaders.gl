// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv/bundled';
import {describe, expect, test} from 'vitest';

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
    const table = await CSVLoader.parseText('value\ntrue\n42\ntext\n', {
      csv: {header: true, shape: 'arrow-table', dynamicTyping: true}
    });

    expect(getArrowColumnValues(table, 'value')).toEqual(['true', '42', 'text']);
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
