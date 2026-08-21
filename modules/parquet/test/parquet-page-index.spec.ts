// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, describe, expect, test} from 'vitest';

import {createDataSource, isBrowser} from '@loaders.gl/core';
import type {ParquetBatch, ParquetSourceMetadata} from '@loaders.gl/parquet';
import type {ParquetSourceLoaderOptions} from '@loaders.gl/parquet';
import {
  ParquetSource,
  ParquetSourceLoader
} from '@loaders.gl/parquet/parquet-source-loader';
import * as arrow from 'apache-arrow';

import {
  decodeParquetPageStatisticsValue,
  getParquetIndexRange
} from '../src/lib/parquet-page-index';
import {loadWasm} from '../src/lib/utils/load-wasm';
import type {ParquetField} from '../src/parquetjs/schema/declare';

const ROW_COUNT = 8192;
const SELECTED_ROW_START = 7000;
const SELECTED_ROW_END = 7010;
const REMOTE_URL = 'https://example.com/page-index.parquet';

let pageIndexFixture: ArrayBuffer;

beforeAll(async () => {
  pageIndexFixture = await createPageIndexFixture();
});

describe('Parquet page-index pruning', () => {
  test('decodes unsigned page-index statistics without sign extension', () => {
    const uint32Bytes = new Uint8Array(4);
    new DataView(uint32Bytes.buffer).setUint32(0, 0xffffffff, true);
    const uint64Bytes = new Uint8Array(8);
    new DataView(uint64Bytes.buffer).setBigUint64(0, 0xffffffffffffffffn, true);

    expect(
      decodeParquetPageStatisticsValue(
        uint32Bytes,
        {primitiveType: 'INT32', originalType: 'UINT_32'} as ParquetField
      )
    ).toBe(0xffffffff);
    expect(
      decodeParquetPageStatisticsValue(
        uint64Bytes,
        {primitiveType: 'INT64', originalType: 'UINT_64'} as ParquetField
      )
    ).toBe(0xffffffffffffffffn);
  });

  test('rejects optional index ranges outside the containing file', () => {
    expect(getParquetIndexRange(80n, 20, 100)).toEqual({offset: 80, length: 20});
    expect(getParquetIndexRange(80n, 21, 100)).toBeUndefined();
    expect(getParquetIndexRange(101n, 1, 100)).toBeUndefined();
    expect(getParquetIndexRange(-1n, 1, 100)).toBeUndefined();
    expect(getParquetIndexRange(0n, 0, 100)).toBeUndefined();
  });

  test('reads only candidate pages and preserves exact predicate results', async () => {
    const source = createRemoteSource(pageIndexFixture, {core: {worker: false}});
    const metadata = await source.getMetadata();
    const metadataTelemetry = source.getTelemetry();
    const batches = await collectBatches(
      source.read({
        columns: ['id', 'category', 'payload'],
        predicate: {
          op: 'and',
          args: [
            {op: '>=', args: [{property: 'id'}, SELECTED_ROW_START]},
            {op: '<', args: [{property: 'id'}, SELECTED_ROW_END]}
          ]
        }
      })
    );

    expect(getColumnMetadata(metadata, 'id')).toMatchObject({
      columnIndexByteLength: expect.any(Number),
      offsetIndexByteLength: expect.any(Number)
    });
    expect(getBatchValues(batches, 'id')).toEqual(
      Array.from(
        {length: SELECTED_ROW_END - SELECTED_ROW_START},
        (_, index) => SELECTED_ROW_START + index
      )
    );
    expect(getBatchValues(batches, 'payload')).toEqual(
      Array.from(
        {length: SELECTED_ROW_END - SELECTED_ROW_START},
        (_, index) => `payload-${SELECTED_ROW_START + index}-${'-'.repeat(20)}`
      )
    );
    expect(getBatchValues(batches, 'category')).toEqual(
      Array.from({length: SELECTED_ROW_END - SELECTED_ROW_START}, () => 'group-6')
    );
    expect(batches[0].rowGroupRowIndices).toEqual(
      Array.from(
        {length: SELECTED_ROW_END - SELECTED_ROW_START},
        (_, index) => SELECTED_ROW_START + index
      )
    );

    const telemetry = source.getTelemetry();
    const selectedColumnBytes = ['id', 'category', 'payload'].reduce(
      (sum, column) => sum + getColumnMetadata(metadata, column).compressedByteLength,
      0
    );
    expect(telemetry.pageIndexesRead).toBeGreaterThanOrEqual(3);
    expect(telemetry.pagesPruned).toBeGreaterThan(0);
    expect(telemetry.rowsPrunedByPageIndex).toBeGreaterThan(0);
    expect(telemetry.predicateRowsTested).toBeLessThan(ROW_COUNT);
    expect(telemetry.requestedBytes - metadataTelemetry.requestedBytes).toBeLessThan(
      selectedColumnBytes / 2
    );
    await source.close();
  });

  test('merges discontiguous candidate pages without duplicating source rows', async () => {
    const source = createRemoteSource(pageIndexFixture, {core: {worker: false}});
    const batches = await collectBatches(
      source.read({
        columns: ['id'],
        predicate: {
          op: 'or',
          args: [
            {op: '<', args: [{property: 'id'}, 10]},
            {op: '>=', args: [{property: 'id'}, ROW_COUNT - 12]}
          ]
        }
      })
    );

    const expected = [
      ...Array.from({length: 10}, (_, index) => index),
      ...Array.from({length: 12}, (_, index) => ROW_COUNT - 12 + index)
    ];
    expect(getBatchValues(batches, 'id')).toEqual(expected);
    expect(batches.flatMap(batch => batch.rowGroupRowIndices || [])).toEqual(expected);
    expect(source.getTelemetry().predicateRowsTested).toBeLessThan(ROW_COUNT / 2);
    await source.close();
  });

  test('avoids data-page reads when page-range intersections are empty', async () => {
    const source = createRemoteSource(pageIndexFixture, {core: {worker: false}});
    await source.getMetadata();
    const metadataTelemetry = source.getTelemetry();
    const batches = await collectBatches(
      source.read({
        columns: ['payload'],
        predicate: {
          op: 'and',
          args: [
            {op: '<', args: [{property: 'id'}, 100]},
            {op: '>', args: [{property: 'id'}, ROW_COUNT - 100]}
          ]
        }
      })
    );

    expect(batches).toEqual([]);
    expect(source.getTelemetry()).toMatchObject({
      rowGroupsPrunedByPageIndex: 1,
      rowGroupsDecoded: 0,
      predicateRowsTested: 0
    });
    expect(source.getTelemetry().requestedBytes - metadataTelemetry.requestedBytes).toBeLessThan(
      4096
    );
    await source.close();
  });

  test('transfers selective page ranges through worker decoding', async () => {
    if (!isBrowser) {
      return;
    }
    const source = createRemoteSource(pageIndexFixture, {
      core: {worker: true, reuseWorkers: false, _workerType: 'test'}
    });
    const batches = await collectBatches(
      source.read({
        columns: ['payload'],
        predicate: {
          op: 'and',
          args: [
            {op: '>=', args: [{property: 'id'}, SELECTED_ROW_START]},
            {op: '<', args: [{property: 'id'}, SELECTED_ROW_END]}
          ]
        }
      })
    );

    expect(getBatchValues(batches, 'payload')).toHaveLength(
      SELECTED_ROW_END - SELECTED_ROW_START
    );
    expect(source.getTelemetry()).toMatchObject({
      rowsPrunedByPageIndex: expect.any(Number),
      predicateRowsMatched: SELECTED_ROW_END - SELECTED_ROW_START
    });
    expect(source.getTelemetry().rowsPrunedByPageIndex).toBeGreaterThan(0);
    await source.close();
  });
});

/** Creates a multi-page fixture whose page and chunk statistics are written by parquet-rs. */
async function createPageIndexFixture(): Promise<ArrayBuffer> {
  const wasm = await loadWasm();
  const table = arrow.tableFromArrays({
    id: Int32Array.from({length: ROW_COUNT}, (_, index) => index),
    category: Array.from({length: ROW_COUNT}, (_, index) => `group-${Math.floor(index / 1024)}`),
    payload: Array.from(
      {length: ROW_COUNT},
      (_, index) => `payload-${index}-${'-'.repeat(20)}`
    )
  });
  const wasmTable = wasm.Table.fromIPCStream(arrow.tableToIPC(table));
  const writerProperties = new wasm.WriterPropertiesBuilder()
    .setStatisticsEnabled(wasm.EnabledStatistics.Page)
    .setDataPageSizeLimit(1024)
    .setDictionaryEnabled(false)
    .setColumnDictionaryEnabled('category', true)
    .build();
  const bytes = wasm.writeParquet(wasmTable, writerProperties);
  return bytes.slice().buffer;
}

/** Creates a strict in-memory HTTP range source for the generated fixture. */
function createRemoteSource(
  fixture: ArrayBuffer,
  options: ParquetSourceLoaderOptions
): ParquetSource {
  const rangeFetch = async (_url: string, requestOptions: RequestInit = {}): Promise<Response> => {
    const range = new Headers(requestOptions.headers).get('Range');
    const match = range?.match(/^bytes=(\d+)-(\d+)$/);
    if (!match) {
      throw new Error(`Unexpected Range header: ${range}`);
    }
    const start = Number(match[1]);
    const end = Number(match[2]);
    return new Response(fixture.slice(start, end + 1), {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fixture.byteLength}`,
        ETag: '"page-index-fixture"'
      }
    });
  };
  return createDataSource(REMOTE_URL, [ParquetSourceLoader], {
    ...options,
    core: {
      ...options.core,
      type: 'parquet',
      _workerType: options.core?._workerType ?? 'test',
      loadOptions: {core: {fetch: rangeFetch}}
    }
  }) as ParquetSource;
}

/** Returns normalized metadata for one top-level fixture column. */
function getColumnMetadata(metadata: ParquetSourceMetadata, column: string) {
  const columnMetadata = metadata.rowGroups[0].columns.find(candidate => candidate.path[0] === column);
  if (!columnMetadata) {
    throw new Error(`Missing fixture column ${column}`);
  }
  return columnMetadata;
}

/** Collects an Arrow batch stream for focused assertions. */
async function collectBatches(batches: AsyncIterable<ParquetBatch>): Promise<ParquetBatch[]> {
  const result: ParquetBatch[] = [];
  for await (const batch of batches) {
    result.push(batch);
  }
  return result;
}

/** Materializes one Arrow column across all emitted batches. */
function getBatchValues(batches: readonly ParquetBatch[], column: string): unknown[] {
  return batches.flatMap(batch => Array.from(batch.data.getChild(column)?.toArray() || []));
}
