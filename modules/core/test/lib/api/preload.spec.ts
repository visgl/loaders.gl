import {describe, expect, test} from 'vitest';
import {parse, parseInBatches, parseSync, preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const CSV_TEXT = 'city,population\nParis,2148000\n';
const CSV_ARRAY_BUFFER = new TextEncoder().encode(CSV_TEXT).buffer;

describe('preload', () => {
  test('resolves a parser-bearing loader and caches it', async () => {
    const firstLoader = await preload(CSVLoader);
    const secondLoader = await preload(CSVLoader);

    expect(firstLoader).toBe(secondLoader);
    expect(typeof firstLoader.parse).toBe('function');
  });

  test('parse upgrades CSVLoader through preload', async () => {
    const table = await parse(CSV_ARRAY_BUFFER, CSVLoader, {
      csv: {shape: 'object-row-table'}
    });

    expect(table).toMatchObject({
      shape: 'object-row-table',
      data: [{city: 'Paris', population: 2148000}]
    });
  });

  test('parseInBatches upgrades CSVLoader through preload', async () => {
    const iterator = await parseInBatches([new Uint8Array(CSV_ARRAY_BUFFER)], CSVLoader, {
      csv: {shape: 'object-row-table'}
    });
    const rows: unknown[] = [];

    for await (const batch of iterator) {
      if (batch.shape === 'object-row-table') {
        rows.push(...batch.data);
      }
    }

    expect(rows).toEqual([{city: 'Paris', population: 2148000}]);
  });

  test('parseSync accepts a parser-bearing loader returned by preload', async () => {
    const CSVLoaderWithParser = await preload(CSVLoader);
    const table = parseSync(CSV_ARRAY_BUFFER, CSVLoaderWithParser, {
      csv: {shape: 'object-row-table'}
    });

    expect(table).toMatchObject({
      shape: 'object-row-table',
      data: [{city: 'Paris', population: 2148000}]
    });
  });

  test('parseSync rejects CSVLoader without a parser-bearing import', () => {
    expect(() =>
      parseSync(CSV_ARRAY_BUFFER, CSVLoader, {
        csv: {shape: 'object-row-table'}
      })
    ).toThrow(/Import the loader implementation directly/);
  });
});
