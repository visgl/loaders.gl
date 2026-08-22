// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encodeSync, parse, parseInBatches} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {describe, expect, it} from 'vitest';

import {
  ChromeTraceLoader,
  ChromeTraceWriter,
  PerfettoTraceLoader,
  PerfettoTraceWriter
} from '../src';

import type {ChromeTraceEventArrowTable, PerfettoTrace, PerfettoTraceBatch} from '../src';

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

  it('loads a canonical Perfetto protobuf envelope', async () => {
    const processName = new TextEncoder().encode('trainer');
    const descriptor = Uint8Array.from([8, 42, 50, processName.length, ...processName]);
    const packet = Uint8Array.from([42, descriptor.length, ...descriptor]);
    const traceBytes = Uint8Array.from([10, packet.length, ...packet]);

    const trace = (await parse(traceBytes, PerfettoTraceLoader)) as PerfettoTrace;
    expect(trace.processes.numRows).toBe(1);
    expect(trace.processes.getChild('pid')?.get(0)).toBe(42);
    expect(trace.processes.getChild('name')?.get(0)).toBe('trainer');
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

    const batchIterator = await parseInBatches([encoded], PerfettoTraceLoader, {
      perfettoTrace: {batchSize: 1}
    });
    const batches: PerfettoTraceBatch[] = [];
    for await (const batch of batchIterator) {
      batches.push(batch as PerfettoTraceBatch);
    }
    expect(batches.map(batch => batch.table)).toEqual([
      'tracks',
      'slices',
      'slices',
      'processes',
      'threads'
    ]);
    expect(batches.every(batch => batch.data.numRows === 1)).toBe(true);
  });
});

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
