// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {DeltaSourceLoader, DeltaTableSource} from '../src/delta-source';

test('DeltaTableSource selects active files from commit actions', async () => {
  const log = [
    JSON.stringify({add: {path: 'part-0.parquet', size: 120, partitionValues: {year: '2024'}, stats: JSON.stringify({numRecords: 3})}}),
    JSON.stringify({add: {path: 'part-1.parquet', size: 80}}),
    JSON.stringify({remove: {path: 'part-0.parquet'}})
  ].join('\n');
  const source = new DeltaTableSource(new Blob([log]), {delta: {baseUrl: 'https://example.com/table/'}});
  await expect(source.getScanFragments()).resolves.toEqual([
    expect.objectContaining({id: 'part-1.parquet', uri: 'https://example.com/table/part-1.parquet'})
  ]);
});

test('DeltaTableSource resolves commit URLs relative to the table root', async () => {
  const log = JSON.stringify({add: {path: 'part-0.parquet', size: 12, stats: {numRecords: 4}}});
  const source = new DeltaTableSource('https://example.com/table/_delta_log/00000000000000000001.json', {
    core: {loadOptions: {core: {fetch: async () => new Response(log)}}}
  });
  await expect(source.getScanFragments()).resolves.toEqual([
    expect.objectContaining({
      uri: 'https://example.com/table/part-0.parquet',
      rowCount: 4,
      byteLength: 12
    })
  ]);
});

test('DeltaSourceLoader identifies commit-log URLs', () => {
  expect(
    DeltaSourceLoader.testURL(
      'https://example.com/table/_delta_log/00000000000000000001.json'
    )
  ).toBe(true);
  expect(DeltaSourceLoader.testURL('https://example.com/data.json')).toBe(false);
});
