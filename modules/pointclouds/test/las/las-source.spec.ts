// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {createDataSource, createDataSourceSync, fetchFile, preload} from '@loaders.gl/core';
import {query} from '@loaders.gl/core/scan';
import {LASLoader} from '@loaders.gl/pointclouds/las';
import {LASLoaderWithParser} from '../../src/las/las-loader';
import {LASSource} from '../../src/las/las-source';
import type {RecordBatch} from 'apache-arrow';

/** Small immutable fixture, shared across source scans. */
let bytes: ArrayBuffer;
beforeAll(async () => {
  bytes = await (
    await fetchFile('@loaders.gl/pointclouds/las/test/data/pdrf7-v4-1.4.las')
  ).arrayBuffer();
});

/** Collects native result batches for assertions. */
async function collect(source: AsyncIterable<RecordBatch>) {
  const batches: RecordBatch[] = [];
  for await (const batch of source) batches.push(batch);
  return batches;
}

test('LAS source discovers metadata from header-only input', async () => {
  const offset = new DataView(bytes).getUint32(96, true);
  const source = new LASSource(new Blob([bytes.slice(0, offset)]));
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toContain('COLOR_0');
  expect(metadata.schema.metadata?.las_pointsCount).toBe('1024');
  expect(metadata.capabilities.table?.projection).toBe('pushdown+residual');
});

test('LAS source selects decoder columns and preserves order across batches', async () => {
  const source = new LASSource(new Blob([bytes]), {core: {batchSize: 3}});
  const parse = vi.spyOn(LASLoaderWithParser, 'parseInBatches');
  try {
    const batches = await collect(
      source.read({columns: ['COLOR_0', 'POSITION'], offset: 2, limit: 4})
    );
    expect(parse.mock.calls[0][1]?.las?.columns).toEqual(['COLOR_0', 'POSITION']);
    expect(batches.reduce((count, batch) => count + batch.numRows, 0)).toBe(4);
    expect(batches[0].schema.fields.map(field => field.name)).toEqual(['COLOR_0', 'POSITION']);
    const full = await LASLoaderWithParser.parse(bytes);
    if ('attributes' in full) throw new Error('Expected Arrow');
    expect(
      batches.flatMap(batch =>
        batch
          .toArray()
          .map(row => ({POSITION: Array.from(row.POSITION), COLOR_0: Array.from(row.COLOR_0)}))
      )
    ).toEqual(
      full
        .select(['COLOR_0', 'POSITION'])
        .slice(2, 6)
        .toArray()
        .map(row => ({POSITION: Array.from(row.POSITION), COLOR_0: Array.from(row.COLOR_0)}))
    );
  } finally {
    parse.mockRestore();
  }
});

test('LAS source keeps predicate dependencies before projecting', async () => {
  const source = new LASSource(new Blob([bytes]), {core: {batchSize: 3}});
  const batches = await collect(
    source.read({
      columns: ['COLOR_0'],
      predicate: {op: '>=', args: [{property: 'intensity'}, 0]},
      limit: 2
    })
  );
  expect(batches[0].schema.fields.map(field => field.name)).toEqual(['COLOR_0']);
  expect(batches.reduce((count, batch) => count + batch.numRows, 0)).toBe(2);
});

test('LAS loader source factory supports preload and query aliases', async () => {
  const source = await createDataSource(new Blob([bytes]), LASLoader, {core: {batchSize: 3}});
  await preload(LASLoader);
  expect(createDataSourceSync(new Blob([bytes]), LASLoader)).toBeInstanceOf(LASSource);
  const result = await query({select: [{column: 'COLOR_0', as: 'colors'}], limit: 2}, {source});
  expect(result.schema.fields.map(field => field.name)).toEqual(['colors']);
  expect(result.numRows).toBe(2);
});

test('LAS source handles empty projections, zero limits, aborts and invalid columns', async () => {
  const source = new LASSource(new Blob([bytes]));
  expect(await collect(source.read({limit: 0}))).toEqual([]);
  const empty = await collect(source.read({columns: [], limit: 2}));
  expect(empty[0].numRows).toBe(2);
  expect(empty[0].schema.fields).toHaveLength(0);
  await expect(collect(source.read({columns: ['missing']}))).rejects.toThrow('unsupported column');
  const controller = new AbortController();
  controller.abort();
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow();
  await expect(collect(source.read({signal: controller.signal}))).rejects.toThrow();
});

test('LAZ source decodes selected columns through the same scan path', async () => {
  const compressed = await (
    await fetchFile('@loaders.gl/pointclouds/las/test/data/pdrf7-v4-1.4.laz')
  ).arrayBuffer();
  const source = new LASSource(new Blob([compressed]), {core: {batchSize: 3}});
  const batches = await collect(source.read({columns: ['COLOR_0'], limit: 2}));
  expect(batches[0].schema.fields.map(field => field.name)).toEqual(['COLOR_0']);
  expect(batches.reduce((count, batch) => count + batch.numRows, 0)).toBe(2);
});

test('LAS source closes URL streams after a row limit', async () => {
  const cancel = vi.fn();
  const fetch = vi.fn(async () => {
    let offset = 0;
    return new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          const next = bytes.slice(offset, offset + 512);
          offset += next.byteLength;
          if (next.byteLength) controller.enqueue(new Uint8Array(next));
          else controller.close();
        },
        cancel
      })
    );
  });
  const result = await query(
    {select: ['COLOR_0'], limit: 2},
    {
      source: 'https://example.test/points.las',
      loaders: LASLoader,
      core: {fetch, batchSize: 3}
    }
  );
  expect(result.numRows).toBe(2);
  expect(cancel).toHaveBeenCalledTimes(2);
});

test('LAS source retains schema for an empty file', async () => {
  const offset = new DataView(bytes).getUint32(96, true);
  const empty = bytes.slice(0, offset);
  const view = new DataView(empty);
  view.setUint32(107, 0, true);
  view.setBigUint64(247, 0n, true);
  const batches = await collect(new LASSource(new Blob([empty])).read({columns: ['POSITION']}));
  expect(batches[0].numRows).toBe(0);
  expect(batches[0].schema.fields.map(field => field.name)).toEqual(['POSITION']);
});

test('LAS source reports malformed headers and failed requests', async () => {
  await expect(new LASSource(new Blob([new Uint8Array(100)])).getQueryMetadata()).rejects.toThrow(
    'Truncated'
  );
  await expect(new LASSource(new Blob([new Uint8Array(227)])).getQueryMetadata()).rejects.toThrow(
    'Invalid'
  );
  const source = new LASSource('https://example.test/missing.las', {
    core: {fetch: async () => new Response(null, {status: 404})}
  });
  await expect(source.getQueryMetadata()).rejects.toThrow('404');
});

test('LAS source aborts a pending byte read', async () => {
  const controller = new AbortController();
  const cancel = vi.fn();
  const source = new LASSource('https://example.test/stalled.las', {
    core: {
      fetch: async () =>
        new Response(
          new ReadableStream({
            pull() {
              controller.abort();
            },
            cancel
          })
        )
    }
  });
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow();
  expect(cancel).toHaveBeenCalled();
});

test('LAS source metadata and queries retain position precision and header values', async () => {
  const source = new LASSource(new Blob([bytes]), {las: {fp64: true}});
  const metadata = await source.getQueryMetadata();
  const result = await query({select: ['POSITION'], limit: 1}, {source});
  expect(String(result.getChild('POSITION')!.type)).toContain('Float64');
  expect(result.schema.metadata.get('las_scale')).toBe(metadata.schema.metadata?.las_scale);
  expect(result.schema.metadata.get('loaders.gl.las.header')).toBeDefined();
  const explanation = await source.explain({columns: ['POSITION'], limit: 1});
  expect(explanation).toBeDefined();
});
