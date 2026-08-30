// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {setPathPrefix} from '@loaders.gl/loader-utils';

afterEach(() => setPathPrefix(''));

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
  expect(readBatches[0]).toMatchObject({fragments: [{id: 'part.parquet'}]});
});

test('rejects empty, malformed, and unsupported Hudi descriptors', async () => {
  await expect(new HudiTableSource(new Blob(['not json'])).getScanFragments()).rejects.toThrow(
    'valid JSON'
  );
  await expect(
    new HudiTableSource(new Blob([JSON.stringify({})])).getScanFragments()
  ).rejects.toThrow('files array');
  await expect(
    new HudiTableSource(new Blob([JSON.stringify(null)])).getScanFragments()
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

test.each([
  [null, 'must be an object'],
  [{}, 'non-empty string path'],
  [{path: 1}, 'non-empty string path'],
  [{path: 'part.parquet', size: '1'}, 'size must be a finite number'],
  [{path: 'part.parquet', numRecords: '1'}, 'numRecords must be a finite number'],
  [{path: 'part.parquet', partitionValues: []}, 'partitionValues must be an object']
])('rejects an invalid Hudi base-file descriptor: %j', async (file, message) => {
  const source = new HudiTableSource(new Blob([JSON.stringify({files: [file]})]));
  await expect(source.getScanFragments()).rejects.toThrow(message);
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

test('loads URL descriptors and reports missing file statistics as zero', async () => {
  const descriptorUrl = 'snapshot.json';
  const resolvedDescriptorUrl = 'https://example.com/table/snapshot.json';
  setPathPrefix('https://example.com/table/');
  const signal = new AbortController().signal;
  const source = new HudiTableSource(descriptorUrl, {
    hudi: {headers: {'x-test': 'hudi'}}
  });
  const fetch = vi.fn(
    async () =>
      new Response(JSON.stringify({files: [{path: 'https://cdn.example.com/part.parquet'}]}))
  );
  source.fetch = fetch;

  await expect(source.getQueryMetadata({signal})).resolves.toMatchObject({
    name: descriptorUrl,
    statistics: {rowCount: 0, byteLength: 0}
  });
  expect(fetch).toHaveBeenCalledWith(resolvedDescriptorUrl, {
    headers: {'x-test': 'hudi'},
    signal
  });
});
