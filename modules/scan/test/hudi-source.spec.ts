// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';

vi.mock('@loaders.gl/parquet/parquet-dataset-source', () => ({
  ParquetDatasetSource: class MockParquetDatasetSource {
    constructor(public readonly fragments: unknown[] | (() => Promise<unknown[]>)) {}
    async getSchema() {
      return {fields: []};
    }
    async getScanPlan() {
      return {fragments: this.fragments};
    }
    async *read() {
      const fragments =
        typeof this.fragments === 'function' ? await this.fragments() : this.fragments;
      yield {data: 'batch', fragments};
    }
  }
}));
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

test('validates descriptors and supports metadata, explain, read, and scan', async () => {
  const source = new HudiTableSource(
    new Blob([
      JSON.stringify({
        basePath: 'https://example.com/table/',
        files: [{path: 'part.parquet', size: 10, numRecords: 2}]
      })
    ])
  );
  await expect(source.getDescriptor()).resolves.toMatchObject({files: [{path: 'part.parquet'}]});
  await expect(source.getQueryMetadata()).resolves.toMatchObject({
    sourceType: 'hudi',
    statistics: {rowCount: 2, byteLength: 10}
  });
  await expect(source.getScanPlan()).resolves.toMatchObject({fragments: [{id: 'part.parquet'}]});
  const readBatches = [];
  for await (const batch of source.read()) readBatches.push(batch);
  expect(readBatches).toHaveLength(1);
  const scanBatches = [];
  for await (const batch of source.scan()) scanBatches.push(batch);
  expect(scanBatches).toHaveLength(1);
});

test('rejects empty, malformed, and unsupported Hudi descriptors', async () => {
  await expect(new HudiTableSource(new Blob(['not json'])).getScanFragments()).rejects.toThrow(
    'valid JSON'
  );
  await expect(
    new HudiTableSource(new Blob([JSON.stringify({})])).getScanFragments()
  ).rejects.toThrow('files array');
  await expect(
    new HudiTableSource(
      new Blob([JSON.stringify({tableType: 'UNKNOWN', files: []})])
    ).getScanFragments()
  ).rejects.toThrow('Unsupported Hudi table type');
  await expect(
    new HudiTableSource(new Blob([JSON.stringify({files: []})])).getQueryMetadata()
  ).rejects.toThrow('contains no Parquet base files');
});

test('resolves relative files with the configured Hudi base URL', async () => {
  const source = new HudiTableSource(
    new Blob([JSON.stringify({files: [{path: 'part.parquet'}]})]),
    {hudi: {baseUrl: 'https://example.com/data/'}}
  );
  await expect(source.getScanFragments()).resolves.toMatchObject([
    {uri: 'https://example.com/data/part.parquet'}
  ]);
});

test('preserves absolute and path-only file references', async () => {
  const source = new HudiTableSource(new Blob([JSON.stringify({files: [{path: 'part.parquet'}]})]));
  await expect(source.getScanFragments()).resolves.toMatchObject([{uri: 'part.parquet'}]);
});

test('loads URL descriptors with headers and defaults missing statistics to zero', async () => {
  const fetchFunction = vi.fn(async (_url: string, options?: RequestInit) => {
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test');
    return new Response(JSON.stringify({files: [{path: 'part.parquet'}]}));
  });
  const source = new HudiTableSource('https://example.com/snapshot.json', {
    hudi: {headers: {Authorization: 'Bearer test'}},
    core: {loadOptions: {fetch: fetchFunction}}
  });

  await expect(source.getQueryMetadata()).resolves.toMatchObject({
    name: 'https://example.com/snapshot.json',
    statistics: {rowCount: 0, byteLength: 0}
  });
  expect(fetchFunction).toHaveBeenCalledOnce();
});

test('rejects primitive JSON descriptors', async () => {
  await expect(new HudiTableSource(new Blob(['null'])).getScanFragments()).rejects.toThrow(
    'files array'
  );
});
