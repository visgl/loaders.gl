// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {DeltaTableSource} from '../src/delta-table-source';

test('DeltaTableSource replays add and remove actions for an explicit snapshot', async () => {
  const requests: string[] = [];
  const source = new DeltaTableSource('https://data.example.com/table', {
    delta: {
      version: 1,
      fetch: async url => {
        requests.push(url);
        const version = url.includes('00000000000000000001')
          ? '{"remove":{"path":"part-000.parquet"}}\n{"add":{"path":"part-001.parquet","size":12,"partitionValues":{"region":"west"}}}\n'
          : '{"add":{"path":"part-000.parquet","size":11}}\n';
        return new Response(version);
      }
    }
  });

  await expect(source.getParquetFiles()).resolves.toEqual([
    {
      path: 'part-001.parquet',
      size: 12,
      partitionValues: {region: 'west'},
      stats: undefined
    }
  ]);
  expect(requests).toEqual([
    'https://data.example.com/table/_delta_log/00000000000000000000.json',
    'https://data.example.com/table/_delta_log/00000000000000000001.json'
  ]);
});

test('DeltaTableSource requires an explicit non-negative snapshot version', () => {
  expect(
    () => new DeltaTableSource('https://data.example.com/table', {} as never)
  ).toThrow('requires a non-negative delta.version');
  expect(
    () =>
      new DeltaTableSource('https://data.example.com/table', {
        delta: {version: -1}
      })
  ).toThrow('requires a non-negative delta.version');
});
