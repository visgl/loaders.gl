// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HudiTableSource} from '../src/hudi';

test('discovers Copy-on-Write Hudi base files from a snapshot descriptor', async () => {
  const source = new HudiTableSource(
    new Blob([
      JSON.stringify({
        tableType: 'COPY_ON_WRITE',
        completedInstant: '20260829010101',
        basePath: 'https://example.com/table/',
        files: [
          {
            path: 'year=2026/part-000.parquet',
            size: 12,
            numRecords: 3,
            partitionValues: {year: 2026}
          }
        ]
      })
    ])
  );
  await expect(source.getScanFragments()).resolves.toMatchObject([
    {
      id: 'year=2026/part-000.parquet',
      uri: 'https://example.com/table/year=2026/part-000.parquet',
      partitionValues: {year: 2026},
      byteLength: 12,
      rowCount: 3
    }
  ]);
});

test('rejects Merge-on-Read Hudi snapshots explicitly', async () => {
  const source = new HudiTableSource(
    new Blob([JSON.stringify({tableType: 'MERGE_ON_READ', files: []})])
  );
  await expect(source.getScanFragments()).rejects.toThrow('Merge-on-Read');
});
