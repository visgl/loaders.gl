// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, parse, parseInBatches} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {beforeAll, describe, expect, it} from 'vitest';

import {
  ChromeTraceLoader,
  ChromeTraceWriter,
  PerfettoTraceLoader,
  PerfettoTraceWriter
} from '../src';

import type {ChromeTraceEventArrowTable, PerfettoTrace, PerfettoTraceBatch} from '../src';

let officialTraceBytes: Uint8Array;
let officialTrace: PerfettoTrace;
let internedNamesTrace: PerfettoTrace;

beforeAll(async () => {
  officialTraceBytes = await loadBinaryFixture('./data/perfetto/track-event-tracks.perfetto-trace');
  officialTrace = (await parse(officialTraceBytes, PerfettoTraceLoader)) as PerfettoTrace;
  const internedNamesBytes = await loadBinaryFixture(
    './data/perfetto/interned-event-names.perfetto-trace'
  );
  internedNamesTrace = (await parse(internedNamesBytes, PerfettoTraceLoader)) as PerfettoTrace;
});

describe('trace format writers', () => {
  it('round-trips Chrome trace Arrow events through the public writer', async () => {
    const source = {
      displayTimeUnit: 'us',
      metadata: {origin: 'writer-test'},
      traceEvents: [
        {
          name: 'task',
          ph: 'X',
          ts: 10,
          dur: 5,
          pid: 7,
          tid: 'main',
          args: {value: 3},
          custom: 'preserved'
        }
      ]
    };
    const input = new TextEncoder().encode(JSON.stringify(source));
    const table = (await parse(input, ChromeTraceLoader, {
      chromeTrace: {shape: 'arrow-table'}
    })) as ChromeTraceEventArrowTable;

    const encoded = encodeSync(table, ChromeTraceWriter);
    expect(JSON.parse(new TextDecoder().decode(encoded))).toEqual(source);
  });

  it('loads an official Perfetto TrackEvent fixture', () => {
    expect(officialTrace.tracks.numRows).toBe(10);
    expect(officialTrace.slices.numRows).toBe(15);
    expect(officialTrace.slices.getChild('name')?.toArray()).toContain('event1_on_async2');
    expect(officialTrace.slices.getChild('dur')?.toArray()).toContain(100n);
    expect(officialTrace.processes.getChild('name')?.toArray()).toContain('p2');
    expect(officialTrace.threads.getChild('name')?.toArray()).toContain('t4');
  });

  it('detects a structured Perfetto packet without claiming generic protobuf data', () => {
    const test = PerfettoTraceLoader.tests[0];
    const fixtureBuffer = officialTraceBytes.buffer.slice(
      officialTraceBytes.byteOffset,
      officialTraceBytes.byteOffset + officialTraceBytes.byteLength
    ) as ArrayBuffer;
    expect(test(fixtureBuffer)).toBe(true);
    expect(test(Uint8Array.from([0x0a, 0x02, 0x18, 0x01]).buffer)).toBe(false);
    expect(test(Uint8Array.from([0x0a]).buffer)).toBe(false);
  });

  it('resolves event names from packet-sequence interned data', () => {
    expect(Array.from(internedNamesTrace.slices.getChild('name')?.toArray() ?? [])).toEqual([
      'cuLaunchKernel',
      'vkCmdDispatch'
    ]);
    expect(Array.from(internedNamesTrace.slices.getChild('dur')?.toArray() ?? [])).toEqual([
      100n,
      100n
    ]);
  });

  it('round-trips Perfetto Arrow tables through protobuf and tagged batches', async () => {
    const trace = createPerfettoTrace();
    const encoded = encodeSync(trace, PerfettoTraceWriter);
    const decoded = (await parse(encoded, PerfettoTraceLoader)) as PerfettoTrace;

    expect(decoded.tracks.numRows).toBe(1);
    expect(decoded.tracks.getChild('track_uuid')?.get(0)).toBe(101n);
    expect(decoded.slices.numRows).toBe(2);
    expect(decoded.slices.getChild('name')?.toArray()).toEqual(['forward', 'marker']);
    expect(Array.from(decoded.slices.getChild('dur')?.toArray() ?? [])).toEqual([60n, 0n]);
    expect(decoded.processes.getChild('name')?.get(0)).toBe('trainer');
    expect(decoded.threads.getChild('name')?.get(0)).toBe('worker');

    const batchIterator = await parseInBatches(streamBytes(encoded, 1), PerfettoTraceLoader, {
      perfettoTrace: {batchSize: 1}
    });
    const batches: PerfettoTraceBatch[] = [];
    for await (const batch of batchIterator) {
      batches.push(batch as PerfettoTraceBatch);
    }
    expect(batches.map(batch => batch.table)).toContain('tracks');
    expect(batches.filter(batch => batch.table === 'slices')).toHaveLength(2);
    expect(batches.every(batch => batch.data.numRows === 1)).toBe(true);
  });

  it('streams the official fixture across arbitrary protobuf boundaries', async () => {
    const batchIterator = await parseInBatches(
      streamBytes(officialTraceBytes.buffer as ArrayBuffer, 1),
      PerfettoTraceLoader,
      {perfettoTrace: {batchSize: 4}}
    );
    const batches: PerfettoTraceBatch[] = [];
    for await (const batch of batchIterator) {
      batches.push(batch as PerfettoTraceBatch);
    }

    const sliceRows = batches
      .filter(batch => batch.table === 'slices')
      .reduce((rowCount, batch) => rowCount + batch.data.numRows, 0);
    expect(sliceRows).toBe(15);
    expect(batches.every(batch => batch.data.numRows <= 4)).toBe(true);
  });
});

/** Loads one binary fixture in both browser and Node test projects. */
async function loadBinaryFixture(relativePath: string): Promise<Uint8Array> {
  const url = new URL(relativePath, import.meta.url);
  if (url.protocol === 'file:' && typeof window === 'undefined') {
    const {readFile} = await import('fs/promises');
    return new Uint8Array(await readFile(url));
  }
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

/** Splits one encoded trace into deterministic chunks. */
async function* streamBytes(
  arrayBuffer: ArrayBuffer,
  chunkSize: number
): AsyncIterable<ArrayBuffer> {
  for (let byteOffset = 0; byteOffset < arrayBuffer.byteLength; byteOffset += chunkSize) {
    yield arrayBuffer.slice(byteOffset, byteOffset + chunkSize);
  }
}

/** Builds a package-native Arrow dataset used to verify Perfetto writer symmetry. */
function createPerfettoTrace(): PerfettoTrace {
  return {
    tracks: arrow.tableFromArrays({
      track_uuid: new BigUint64Array([101n]),
      parent_track_uuid: [null],
      type: ['thread'],
      name: ['worker track'],
      pid: new Int32Array([42]),
      tid: new Int32Array([7])
    }) as PerfettoTrace['tracks'],
    slices: arrow.tableFromArrays({
      track_uuid: new BigUint64Array([101n, 101n]),
      ts: new BigUint64Array([100n, 200n]),
      dur: new BigUint64Array([60n, 0n]),
      name: ['forward', 'marker']
    }) as PerfettoTrace['slices'],
    processes: arrow.tableFromArrays({
      pid: new Int32Array([42]),
      name: ['trainer']
    }) as PerfettoTrace['processes'],
    threads: arrow.tableFromArrays({
      tid: new Int32Array([7]),
      pid: new Int32Array([42]),
      name: ['worker']
    }) as PerfettoTrace['threads']
  };
}
