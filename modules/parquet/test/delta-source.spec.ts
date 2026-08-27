// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {DeltaSourceLoaderWithParser, DeltaTableSource} from '../src/delta-source';

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

test('DeltaTableSource replays every commit through the selected snapshot version', async () => {
  const requestedURLs: string[] = [];
  const source = new DeltaTableSource(
    'https://example.com/table/_delta_log/00000000000000000002.json',
    {
      delta: {headers: {Authorization: 'Bearer test'}},
      core: {
        loadOptions: {
          core: {
            fetch: async (url, options) => {
              requestedURLs.push(`${url}:${options?.headers ? 'headers' : 'no-headers'}`);
              const version = url.includes('00000000000000000000')
                ? '{"add":{"path":"part-0.parquet"}}'
                : url.includes('00000000000000000001')
                  ? '{"remove":{"path":"part-0.parquet"}}\n{"add":{"path":"part-1.parquet"}}'
                  : '{"add":{"path":"part-2.parquet"}}';
              return new Response(version);
            }
          }
        }
      }
    }
  );

  await expect(source.getScanFragments()).resolves.toEqual([
    expect.objectContaining({id: 'part-1.parquet'}),
    expect.objectContaining({id: 'part-2.parquet'})
  ]);
  expect(requestedURLs).toEqual([
    'https://example.com/table/_delta_log/00000000000000000000.json:headers',
    'https://example.com/table/_delta_log/00000000000000000001.json:headers',
    'https://example.com/table/_delta_log/00000000000000000002.json:headers'
  ]);
});

test('DeltaTableSource rejects active files with deletion vectors', async () => {
  const historicalDeletionVectorSource = new DeltaTableSource(
    new Blob([
      [
        JSON.stringify({add: {path: 'part-old.parquet', deletionVector: {storageType: 'u'}}}),
        JSON.stringify({remove: {path: 'part-old.parquet'}}),
        JSON.stringify({add: {path: 'part-current.parquet'}})
      ].join('\n')
    ]),
    {}
  );
  await expect(historicalDeletionVectorSource.getScanFragments()).resolves.toEqual([
    expect.objectContaining({id: 'part-current.parquet'})
  ]);

  const source = new DeltaTableSource(
    new Blob([
      [
        JSON.stringify({add: {path: 'part-current.parquet'}}),
        JSON.stringify({add: {path: 'part-deleted.parquet', deletionVector: {storageType: 'u'}}})
      ].join('\n')
    ]),
    {}
  );
  await expect(source.getScanFragments()).rejects.toThrow('deletion vectors are not supported');
});

test('DeltaTableSource rejects unsupported reader protocols and column mapping', async () => {
  const protocolSource = new DeltaTableSource(
    new Blob([JSON.stringify({protocol: {minReaderVersion: 2}})]),
    {}
  );
  await expect(protocolSource.getScanFragments()).rejects.toThrow('reader protocol 2');

  const columnMappingSource = new DeltaTableSource(
    new Blob([
      JSON.stringify({metaData: {configuration: {'delta.columnMapping.mode': 'name'}}})
    ]),
    {}
  );
  await expect(columnMappingSource.getScanFragments()).rejects.toThrow('column mapping mode');
});

test('DeltaSourceLoader identifies commit-log URLs', () => {
  expect(
    DeltaSourceLoaderWithParser.testURL(
      'https://example.com/table/_delta_log/00000000000000000001.json'
    )
  ).toBe(true);
  expect(DeltaSourceLoaderWithParser.testURL('https://example.com/data.json')).toBe(false);
});
