// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table, RecordBatch, tableFromArrays} from 'apache-arrow';
import {encode, fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {
  ChromeTraceLoader,
  PerfettoTraceLoader,
  OtlpTraceLoader,
  OtlpTraceJsonLoader,
  OtlpTraceWriter,
  JaegerTraceLoader,
  ZipkinTraceLoader
} from '../src';
import {
  deserializeTraceWorkerResult,
  deserializeTraceWorkerBatch,
  serializeTraceWorkerResult,
  serializeTraceWorkerBatch
} from '../src/trace-worker-transport';

const workerOptions = {core: {worker: true, _workerType: 'test'}} as const;
const chromeTrace = {
  customContainer: {keep: true},
  displayTimeUnit: 'us',
  metadata: {source: 'worker'},
  traceEvents: [
    {
      name: 'event',
      ph: 'X',
      pid: 7,
      tid: 'main',
      ts: 1,
      dur: 2,
      args: {nested: [1, true]},
      custom: 'value'
    },
    {name: 'end', ph: 'i', pid: 7, tid: 'main', ts: 4}
  ]
};

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

/** Splits fixtures across token and protobuf field boundaries. */
function splitBytes(bytes: Uint8Array): Uint8Array[] {
  return Array.from({length: Math.ceil(bytes.length / 17)}, (_, index) =>
    bytes.slice(index * 17, (index + 1) * 17)
  );
}

test('Chrome trace worker returns columns before caller JSON reconstruction', async () => {
  const parser = await ChromeTraceLoader.preload();
  const mainParse = vi.fn(parser.parse);
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const result = await parse(
    new TextEncoder().encode(JSON.stringify(chromeTrace)),
    {
      ...ChromeTraceLoader,
      preload: async () => ({...parser, parse: mainParse, deserializeWorkerResult: deserialize})
    },
    {...workerOptions, chromeTrace: {shape: 'json'}}
  );
  expect(result).toEqual(chromeTrace);
  expect(mainParse).not.toHaveBeenCalled();
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-js'}
  });
});

test.each([
  'chrome',
  'perfetto',
  'otlp',
  'otlp-json',
  'jaeger',
  'zipkin'
] as const)('%s trace worker preserves atomic tables and streamed tagged record batches', async format => {
  let loader: any = ChromeTraceLoader;
  let bytes = new TextEncoder().encode(JSON.stringify(chromeTrace));
  if (format === 'perfetto') {
    loader = PerfettoTraceLoader;
    bytes = new Uint8Array(
      await (
        await fetchFile('@loaders.gl/traces/test/data/perfetto/interned-event-names.perfetto-trace')
      ).arrayBuffer()
    );
  } else if (format !== 'chrome') {
    const name = format.startsWith('otlp') ? 'otlp' : format;
    bytes = new Uint8Array(
      await (await fetchFile(`@loaders.gl/traces/test/data/${name}/trace.json`)).arrayBuffer()
    );
    loader =
      format === 'jaeger'
        ? JaegerTraceLoader
        : format === 'zipkin'
          ? ZipkinTraceLoader
          : OtlpTraceJsonLoader;
    if (format === 'otlp') {
      const trace = await parse(bytes.slice(), OtlpTraceJsonLoader, {core: {worker: false}});
      bytes = new Uint8Array(await encode(trace, OtlpTraceWriter));
      loader = OtlpTraceLoader;
    }
  }
  const expected: any = await parse(bytes.slice(), loader, {core: {worker: false}});
  const parser = await loader.preload();
  const mainBatches = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const instrumentedLoader = {
    ...loader,
    preload: async () => ({
      ...parser,
      parseInBatches: mainBatches,
      deserializeWorkerBatch: deserialize
    })
  };
  const result: any = await parse(bytes.slice(), instrumentedLoader, workerOptions);
  const expectedTables: Record<string, Table> = format === 'chrome' ? {events: expected} : expected;
  const tables: Record<string, Table> = format === 'chrome' ? {events: result} : result;
  for (const [name, table] of Object.entries(tables)) {
    expect(table).toBeInstanceOf(Table);
    expect(table.toArray().map(row => row.toJSON())).toEqual(
      expectedTables[name].toArray().map(row => row.toJSON())
    );
  }
  const rows: Record<string, any[]> = {};
  const iterator = await parseInBatches(splitBytes(bytes), instrumentedLoader, {
    ...workerOptions,
    chromeTrace: {batchSize: 1},
    perfettoTrace: {batchSize: 1},
    otlpTrace: {batchSize: 1},
    jaegerTrace: {batchSize: 1},
    zipkinTrace: {batchSize: 1}
  });
  for await (const batch of iterator) {
    const name = format === 'chrome' ? 'events' : batch.table;
    const recordBatch = format === 'chrome' ? batch : batch.data;
    expect(recordBatch).toBeInstanceOf(RecordBatch);
    rows[name] ||= [];
    rows[name].push(...recordBatch.toArray().map((row: any) => row.toJSON()));
  }
  for (const [name, table] of Object.entries(expectedTables))
    expect(rows[name] || []).toEqual(table.toArray().map(row => row.toJSON()));
  expect(mainBatches).not.toHaveBeenCalled();
  expect(deserialize).toHaveBeenCalled();
  for (const [payload] of deserialize.mock.calls)
    expect(payload).toMatchObject({columns: {shape: 'arrow-table', data: {transport: 'arrow-js'}}});
});

test('trace transport rejects decoded objects and IPC payloads', () => {
  expect(() => deserializeTraceWorkerResult({spans: {}})).toThrow('Arrow column transport');
  expect(() => deserializeTraceWorkerBatch({columns: new Uint8Array()})).toThrow(
    'Arrow column transport'
  );
  expect(() => serializeTraceWorkerResult({spans: []})).toThrow();
  expect(() => serializeTraceWorkerBatch({data: {}})).toThrow();
});

test('trace table collections and record batches retain source buffers after transfer', () => {
  const table = tableFromArrays({
    name: ['first', 'second'],
    time: new BigUint64Array([1n, 9007199254740993n])
  });
  const result: any = serializeTraceWorkerResult({spans: table});
  const restored = deserializeTraceWorkerResult(structuredClone(result));
  expect(restored.spans.toArray().map((row: any) => row.toJSON())).toEqual(
    table.toArray().map(row => row.toJSON())
  );
  const batch: any = serializeTraceWorkerBatch({table: 'spans', data: table.batches[0]});
  const restoredBatch = deserializeTraceWorkerBatch(structuredClone(batch));
  expect(restoredBatch.table).toBe('spans');
  expect(restoredBatch.data).toBeInstanceOf(RecordBatch);
  const single: any = serializeTraceWorkerResult(table);
  expect(deserializeTraceWorkerResult(single)).toBeInstanceOf(Table);
  const untagged: any = serializeTraceWorkerBatch(table.batches[0]);
  expect(deserializeTraceWorkerBatch(untagged)).toBeInstanceOf(RecordBatch);
});

test.each([
  {ph: 'i', s: 'g'},
  {ph: 'i', scope: 'p'},
  {ph: 'b', s: 't'},
  {ph: 'b', scope: 'g'},
  {ph: 'X', s: 'g', scope: 't'}
])('Chrome worker JSON preserves exact scope fields %j', async scopeFields => {
  const original = {traceEvents: [{name: 'scope', ts: 1, pid: 7, tid: 'main', ...scopeFields}]};
  const result = await parse(
    new TextEncoder().encode(JSON.stringify(original)),
    ChromeTraceLoader,
    {...workerOptions, chromeTrace: {shape: 'json'}}
  );
  expect(result).toEqual(original);
});
