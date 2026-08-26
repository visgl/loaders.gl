// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {DeltaSourceLoader, DeltaTableSource} from '../src/delta-source';

test('DeltaTableSource selects active files from commit actions', async () => {
  const log = [
    JSON.stringify({add: {path: 'part-0.parquet', size: 120, partitionValues: {year: '2024'}}}),
    JSON.stringify({add: {path: 'part-1.parquet', size: 80}}),
    JSON.stringify({remove: {path: 'part-0.parquet'}})
  ].join('\n');
  const source = new DeltaTableSource(new Blob([log]), {delta: {baseUrl: 'https://example.com/table/'}});
  await expect(source.getScanFragments()).resolves.toEqual([
    expect.objectContaining({id: 'part-1.parquet', uri: 'https://example.com/table/part-1.parquet'})
  ]);
});

test('DeltaSourceLoader identifies commit-log URLs', () => {
  expect(DeltaSourceLoader.testURL('https://example.com/table/_delta_log/000.json')).toBe(true);
});
