// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, encodeSync, parse, parseInBatches} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {describe, expect, it} from 'vitest';

import {
  ChromeTraceLoader,
  ChromeTraceWriter,
  PerfettoTraceLoader,
  PerfettoTraceWriter,
  consumeChromeTraceArrowStream,
  consumeChromeTraceEventStream,
  consumeChromeTraceFileStream,
  createTraceStreamSession,
  parseChromeTrace,
  streamChromeTraceArrowChunks,
  streamChromeTraceEventChunks,
  streamChromeTraceFileChunks
} from '../src';
import {ChromeTraceLoaderWithParser} from '../src/chrome-trace-loader';
import {PerfettoTraceLoaderWithParser} from '../src/perfetto-trace-loader';
import {PerfettoTraceParser} from '../src/perfetto-trace-parser';
import {streamProtobufMessages} from '../src/perfetto-protobuf';

import type {
  ChromeTraceEventArrowTable,
  ChromeTraceEventSchema,
  ChromeTraceFileSchema,
  PerfettoTrace,
  TraceStreamChunk
} from '../src';

/** Encodes a JSON value for the public loader API. */
function encodeJson(value: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Creates a minimal complete Chrome trace event. */
function createSpan(name: string, timestamp = 1): ChromeTraceEventSchema {
  return {name, ph: 'X', ts: timestamp, dur: 1, pid: 1, tid: 2};
}

/** Concatenates test fixture byte arrays. */
function concatenateBytes(...arrays: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(arrays.reduce((length, array) => length + array.byteLength, 0));
  let byteOffset = 0;
  for (const array of arrays) {
    result.set(array, byteOffset);
    byteOffset += array.byteLength;
  }
  return result;
}

/** Encodes an unsigned protobuf varint for canonical fixture construction. */
function encodeVarint(value: bigint | number): Uint8Array {
  let remaining = BigInt.asUintN(64, BigInt(value));
  const bytes: number[] = [];
  do {
    let byte = Number(remaining & 0x7fn);
    remaining >>= 7n;
    if (remaining !== 0n) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (remaining !== 0n);
  return Uint8Array.from(bytes);
}

/** Encodes one protobuf varint field for canonical fixture construction. */
function encodeVarintField(fieldNumber: number, value: bigint | number): Uint8Array {
  return concatenateBytes(encodeVarint(fieldNumber << 3), encodeVarint(value));
}

/** Encodes one protobuf bytes field for canonical fixture construction. */
function encodeBytesField(fieldNumber: number, value: Uint8Array): Uint8Array {
  return concatenateBytes(encodeVarint((fieldNumber << 3) | 2), encodeVarint(value.length), value);
}

/** Encodes one protobuf string field for canonical fixture construction. */
function encodeStringField(fieldNumber: number, value: string): Uint8Array {
  return encodeBytesField(fieldNumber, new TextEncoder().encode(value));
}

/** Wraps one canonical TracePacket in the top-level Trace message. */
function encodeTracePacket(...fields: Uint8Array[]): Uint8Array {
  return encodeBytesField(1, concatenateBytes(...fields));
}

describe('traces public API edge coverage', () => {
  it('assembles every supported semantic Chrome event family', () => {
    const trace = parseChromeTrace({
      displayTimeUnit: 'ms',
      metadata: {source: 'coverage'},
      traceEvents: [
        {name: 'process_name', ph: 'M', pid: 1, tid: 2, args: {process_name: ' Process '}},
        {name: 'thread_name', ph: 'M', pid: 1, tid: 2, args: {thread_name: ' Main '}},
        {name: 'ignored_metadata', ph: 'M', pid: 1, tid: 2, args: {name: 'ignored'}},
        {name: 'empty_metadata', ph: 'M', pid: 1, tid: 2, args: {name: '  '}},
        {name: 'complete', ph: 'X', ts: 1, dur: 2, pid: 1, tid: 2, args: {x: 1}},
        {name: 'missing-duration', ph: 'X', ts: 2, pid: 1, tid: 2},
        {name: 'outer', ph: 'B', ts: 3, pid: 1, tid: 2},
        {name: 'inner', ph: 'B', ts: 4, pid: 1, tid: 2},
        {name: 'inner-end', ph: 'E', ts: 5, pid: 1, tid: 2},
        {name: 'outer-end', ph: 'E', ts: 6, pid: 1, tid: 2},
        {name: 'unmatched-end', ph: 'E', ts: 7, pid: 1, tid: 2},
        {name: 'instant-scope', ph: 'i', ts: 8, pid: 1, tid: 2, scope: 'g'},
        {name: 'instant-s', ph: 'I', ts: 9, pid: 1, tid: 2, s: 'p'},
        {name: 'instant-default', ph: 'i', ts: 10, pid: 1, tid: 2},
        {name: 'counter', ph: 'C', ts: 11, pid: 1, tid: 2, args: {value: 4}},
        {name: 'flow', ph: 's', ts: 12, pid: 1, tid: 2, bind_id: 4},
        {name: 'flow', ph: 't', ts: 13, pid: 1, tid: 2},
        {name: 'flow', ph: 'f', ts: 14, pid: 1, tid: 2},
        {name: 'unsupported', ph: 'N', ts: 15, pid: 1, tid: 2},
        {name: 'missing-time', ph: 'N', pid: 1, tid: 'worker'}
      ]
    });

    expect(trace.metadata).toEqual({source: 'coverage'});
    expect(trace.processes[0].label).toBe('Process');
    expect(trace.processes[0].threads[0].label).toBe('Main');
    expect(trace.processes[0].threads[0].spans.map(span => span.name)).toEqual([
      'complete',
      'inner',
      'outer'
    ]);
    expect(trace.processes[0].threads[0].instants.map(instant => instant.scope)).toEqual([
      'g',
      'p',
      't'
    ]);
    expect(trace.processes[0].threads[0].counters[0].series).toEqual({value: 4});
    expect(trace.processes[0].threads[0].flows.map(flow => flow.kind)).toEqual([
      'start',
      'step',
      'end'
    ]);
    expect(trace.processes[0].threads[1].label).toBe('worker');
  });

  it.each([
    [undefined, 0.001],
    ['ns', 0.000001],
    ['nanoseconds', 0.000001],
    ['us', 0.001],
    ['microseconds', 0.001],
    ['ms', 1],
    ['milliseconds', 1],
    ['s', 1000],
    ['seconds', 1000],
    [' unknown ', 0.001]
  ])('normalizes the %s Chrome time unit', (displayTimeUnit, expectedStartTimeMs) => {
    const trace = parseChromeTrace({displayTimeUnit, traceEvents: [createSpan('span')]});
    expect(trace.processes[0].threads[0].spans[0].startTimeMs).toBe(expectedStartTimeMs);
  });

  it('applies bounded validation and reports invalid Chrome trace paths', async () => {
    const partlyInvalid = {
      traceEvents: [createSpan('valid'), {name: 'invalid', ph: 'not-a-phase', pid: 1, tid: 1}]
    };
    const bounded = (await parse(encodeJson(partlyInvalid), ChromeTraceLoader, {
      maxLength: 1
    })) as ChromeTraceFileSchema;
    expect(bounded.traceEvents).toHaveLength(2);

    await expect(parse(encodeJson(partlyInvalid), ChromeTraceLoader)).rejects.toThrow(
      /traceEvents\.1\.ph/
    );
    await expect(parse(encodeJson(null), ChromeTraceLoader)).rejects.toThrow(/object/i);
    await expect(parse(encodeJson({metadata: {}}), ChromeTraceLoader)).rejects.toThrow(
      /traceEvents/
    );
  });

  it('supports current and legacy loader options and rejects JSON batch output', async () => {
    const input = encodeJson({traceEvents: [createSpan('span')]});
    const json = (await parse(input, ChromeTraceLoader)) as ChromeTraceFileSchema;
    const arrowTable = (await parse(input, ChromeTraceLoader, {
      shape: 'arrow-table'
    })) as ChromeTraceEventArrowTable;

    expect(json.traceEvents).toHaveLength(1);
    expect(arrowTable.numRows).toBe(1);

    const batches = await parseInBatches([input], ChromeTraceLoader);
    await expect(async () => {
      for await (const _batch of batches) {
        // The public iterator throws before yielding when JSON output is requested.
      }
    }).rejects.toThrow(/requires shape/);
  });

  it('supports every public Chrome parser and writer entry point', async () => {
    const text = JSON.stringify({traceEvents: [createSpan('span')]});
    const input = encodeJson({traceEvents: [createSpan('span')]});

    expect((await ChromeTraceLoader.preload()).id).toBe('chromeTrace');
    expect((await ChromeTraceLoaderWithParser.parse(input)) as ChromeTraceFileSchema).toMatchObject(
      {
        traceEvents: [{name: 'span'}]
      }
    );
    expect(ChromeTraceLoaderWithParser.parseSync(input) as ChromeTraceFileSchema).toMatchObject({
      traceEvents: [{name: 'span'}]
    });
    expect(
      (await ChromeTraceLoaderWithParser.parseText(text)) as ChromeTraceFileSchema
    ).toMatchObject({traceEvents: [{name: 'span'}]});
    expect(
      ChromeTraceLoaderWithParser.parseTextSync(text, {shape: 'arrow-table'}) as arrow.Table
    ).toHaveProperty('numRows', 1);

    const table = (await parse(input, ChromeTraceLoader, {
      chromeTrace: {shape: 'arrow-table'}
    })) as ChromeTraceEventArrowTable;
    expect(await ChromeTraceWriter.encodeText(table)).toContain('"traceEvents"');
    expect(ChromeTraceWriter.encodeTextSync(table)).toContain('"traceEvents"');
    expect(new Uint8Array(await encode(table, ChromeTraceWriter))).not.toHaveLength(0);
  });

  it('streams escaped nested Chrome JSON across every supported chunk view', async () => {
    const traceFile: ChromeTraceFileSchema = {
      displayTimeUnit: 'ns',
      metadata: {source: 'stream'},
      traceEvents: [
        {...createSpan('escaped "span"'), args: {nested: {text: 'slash\\quote"'}}},
        createSpan('second', 3),
        createSpan('third', 5)
      ]
    };
    const bytes = new TextEncoder().encode(JSON.stringify(traceFile));
    const splitOffsets = [0, 5, 19, 43, 71, bytes.length - 4, bytes.length];

    async function* source() {
      yield new TextDecoder().decode(bytes.subarray(splitOffsets[0], splitOffsets[1]));
      yield bytes.subarray(splitOffsets[1], splitOffsets[2]);
      yield new DataView(
        bytes.buffer,
        bytes.byteOffset + splitOffsets[2],
        splitOffsets[3] - splitOffsets[2]
      );
      yield bytes.buffer.slice(
        bytes.byteOffset + splitOffsets[3],
        bytes.byteOffset + splitOffsets[4]
      );
      yield bytes.subarray(splitOffsets[4], splitOffsets[5]);
      yield bytes.subarray(splitOffsets[5], splitOffsets[6]);
    }

    const chunks: TraceStreamChunk[] = [];
    for await (const chunk of streamChromeTraceFileChunks(source(), {
      batchSize: 2,
      publishEveryEvents: 2
    })) {
      chunks.push(chunk);
    }
    expect(chunks.map(chunk => chunk.replaceSnapshot?.traceFile.traceEvents.length)).toEqual([
      3, 3
    ]);
    expect(chunks.at(-1)?.replaceSnapshot?.traceFile).toMatchObject({
      displayTimeUnit: 'ns',
      metadata: {source: 'stream'}
    });
  });

  it('handles exact, fallback, and empty Chrome stream boundaries', async () => {
    async function* exactSource() {
      yield JSON.stringify({traceEvents: [createSpan('one'), createSpan('two')]});
    }
    async function* emptyTraceSource() {
      yield JSON.stringify({displayTimeUnit: 'ms', traceEvents: []});
    }
    async function* emptySource() {}

    const exactChunks: TraceStreamChunk[] = [];
    for await (const chunk of streamChromeTraceFileChunks(exactSource(), {
      batchSize: 2,
      publishEveryEvents: 100
    })) {
      exactChunks.push(chunk);
    }
    expect(exactChunks.at(-1)?.replaceSnapshot?.traceFile.traceEvents).toHaveLength(2);

    for await (const _chunk of streamChromeTraceFileChunks(emptyTraceSource())) {
      throw new Error('An empty Chrome trace must not publish a chunk.');
    }

    const sessions = [
      createTraceStreamSession(),
      createTraceStreamSession(),
      createTraceStreamSession()
    ];
    await expect(consumeChromeTraceEventStream(sessions[0], emptySource())).resolves.toBeNull();
    await expect(consumeChromeTraceArrowStream(sessions[1], emptySource())).resolves.toBeNull();
    await expect(consumeChromeTraceFileStream(sessions[2], emptySource())).resolves.toBeNull();
  });

  it('decodes optional Chrome Arrow columns and reports invalid rows', async () => {
    const table = arrow.tableFromArrays({
      name: ['async', 'instant'],
      ph: ['b', 'i'],
      pid: ['worker', '1'],
      tid: ['thread', '2'],
      ts: [1, null],
      cat: ['category', null],
      scope: ['g', 'p'],
      s: ['t', null],
      args: ['{"value":1}', null],
      id2: ['{"local":"id"}', null],
      extraJson: ['{"custom":true}', null]
    }) as ChromeTraceEventArrowTable;

    async function* source() {
      yield table;
    }
    const chunks: TraceStreamChunk[] = [];
    for await (const chunk of streamChromeTraceArrowChunks(source(), {publishEveryEvents: 1})) {
      chunks.push(chunk);
    }
    expect(chunks.at(-1)?.replaceSnapshot?.traceFile.traceEvents).toMatchObject([
      {s: 't', scope: 'g', args: {value: 1}, id2: {local: 'id'}, custom: true},
      {scope: 'p'}
    ]);

    async function* invalidSource() {
      yield arrow.tableFromArrays({
        name: [null],
        ph: ['X'],
        pid: ['1'],
        tid: ['2']
      }) as unknown as ChromeTraceEventArrowTable;
    }
    await expect(async () => {
      for await (const _chunk of streamChromeTraceArrowChunks(invalidSource())) {
        // Invalid public Arrow input is rejected before a chunk is published.
      }
    }).rejects.toThrow(/required string data/);
  });

  it('applies writer metadata overrides and rejects incomplete Arrow rows', async () => {
    const table = (await parse(
      encodeJson({
        displayTimeUnit: 'us',
        metadata: {source: 'input'},
        traceEvents: [createSpan('span')]
      }),
      ChromeTraceLoader,
      {chromeTrace: {shape: 'arrow-table'}}
    )) as ChromeTraceEventArrowTable;

    const encoded = encodeSync(table, ChromeTraceWriter, {
      chromeTrace: {displayTimeUnit: 'ns', metadata: {source: 'override'}}
    });
    expect(JSON.parse(new TextDecoder().decode(encoded))).toMatchObject({
      displayTimeUnit: 'ns',
      metadata: {source: 'override'}
    });

    const missingName = arrow.tableFromArrays({ph: ['X'], pid: ['1'], tid: ['2']});
    expect(() => encodeSync(missingName, ChromeTraceWriter)).toThrow(/required string data/);

    const missingProcess = arrow.tableFromArrays({name: ['span'], ph: ['X'], tid: ['2']});
    expect(() => encodeSync(missingProcess, ChromeTraceWriter)).toThrow(/include pid\/tid/);
  });

  it('publishes, replays, unsubscribes, and closes trace stream sessions', async () => {
    const traceFile: ChromeTraceFileSchema = {traceEvents: [createSpan('span')]};
    const trace = parseChromeTrace(traceFile);
    const session = createTraceStreamSession({name: 'initial', publishIntervalMs: 0});

    session.applyChunk({name: 'renamed'});
    expect(session.publishSnapshot()).toBeNull();

    const chunk: TraceStreamChunk = {
      replaceSnapshot: {name: 'published', trace, traceFile}
    };
    session.applyChunk(chunk);
    const firstSnapshot = session.publishSnapshot();
    expect(firstSnapshot?.sequence).toBe(1);
    expect(session.publishSnapshot()).toBe(firstSnapshot);
    expect(session.getPublishedSnapshot()).toBe(firstSnapshot);

    const replayedSequences: number[] = [];
    const unsubscribe = session.subscribe(snapshot => replayedSequences.push(snapshot.sequence));
    expect(replayedSequences).toEqual([1]);
    unsubscribe();

    session.applyChunk(chunk);
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(session.getPublishedSnapshot()?.sequence).toBe(2);

    session.applyChunk(chunk);
    session.close();
    expect(() => session.applyChunk(chunk)).toThrow(/already been closed/);
    expect(() => session.publishSnapshot()).toThrow(/already been closed/);
    expect(() => session.subscribe(() => {})).toThrow(/already been closed/);
  });

  it('normalizes event stream thresholds and skips empty event groups', async () => {
    async function* source() {
      yield [];
      yield createSpan('one');
      yield [createSpan('two', 3)];
    }

    const chunks: TraceStreamChunk[] = [];
    for await (const chunk of streamChromeTraceEventChunks(source(), {
      publishEveryEvents: Number.NaN
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(1);
    expect(chunks[0].replaceSnapshot?.traceFile.traceEvents).toHaveLength(2);
  });

  it('detects only structurally recognizable Perfetto packets', () => {
    const detect = PerfettoTraceLoader.tests[0];
    const cases: Array<[number[], boolean]> = [
      [[], false],
      [[0x08, 0x01], false],
      [[0x0a], false],
      [[0x0a, 0x00], false],
      [[0x0a, 0x02, 0x58, 0x01], true],
      [[0x0a, 0x04, 0x18, 0x01, 0x58, 0x01], true],
      [[0x0a, 0x0b, 0x09, 0, 0, 0, 0, 0, 0, 0, 0, 0x58, 0x01], true],
      [[0x0a, 0x07, 0x15, 0, 0, 0, 0, 0x58, 0x01], true],
      [[0x0a, 0x05, 0x1a, 0x01, 0, 0x58, 0x01], true],
      [[0x0a, 0x01, 0x1f], false],
      [[0x0a, 0x02, 0x18], false],
      [[0x0a, 0x03, 0x1a, 0x04, 0], false]
    ];

    for (const [bytes, expected] of cases) {
      expect(detect(Uint8Array.from(bytes).buffer)).toBe(expected);
    }
  });

  it('reports malformed and truncated Perfetto protobuf payloads', async () => {
    const cases = [
      Uint8Array.from([0]),
      Uint8Array.from([0x0f]),
      Uint8Array.from([0x09, 0]),
      Uint8Array.from([0x0a, 0x02, 0x08]),
      Uint8Array.from([0x0a, 0x05, 0x58, 0x01])
    ];

    for (const bytes of cases) {
      await expect(parse(bytes, PerfettoTraceLoader)).rejects.toThrow(/protobuf|truncated/i);
    }

    const batches = await parseInBatches(
      [Uint8Array.from([0x0a, 0x05, 0x58])],
      PerfettoTraceLoader
    );
    await expect(async () => {
      for await (const _batch of batches) {
        // Finalizing the public iterator detects the incomplete packet.
      }
    }).rejects.toThrow(/truncated protobuf stream/i);
  });

  it('supports public Perfetto parser entry points and batch size normalization', async () => {
    const empty = new ArrayBuffer(0);
    expect((await PerfettoTraceLoader.preload()).id).toBe('perfettoTrace');
    expect((await PerfettoTraceLoaderWithParser.parse(empty)).tracks.numRows).toBe(0);
    expect(PerfettoTraceLoaderWithParser.parseSync(empty).slices.numRows).toBe(0);

    for (const batchSize of [undefined, 0, Number.NaN, 1.9]) {
      const batches = await parseInBatches([empty], PerfettoTraceLoader, {
        perfettoTrace: {batchSize}
      });
      const results = [];
      for await (const batch of batches) {
        results.push(batch);
      }
      expect(results).toEqual([]);
    }
  });

  it('parses canonical sequence defaults, interned names, updates, and legacy events', async () => {
    const process = concatenateBytes(encodeVarintField(1, 7), encodeStringField(6, 'process'));
    const thread = concatenateBytes(
      encodeVarintField(1, 7),
      encodeVarintField(2, 8),
      encodeStringField(5, 'thread')
    );
    const processTrack = concatenateBytes(
      encodeVarintField(1, 10),
      encodeStringField(2, 'process track'),
      encodeBytesField(3, process)
    );
    const threadTrack = concatenateBytes(
      encodeVarintField(1, 20),
      encodeStringField(10, 'thread track'),
      encodeVarintField(5, 10),
      encodeBytesField(4, thread)
    );
    const counterTrack = concatenateBytes(
      encodeVarintField(1, 30),
      encodeStringField(13, 'counter track'),
      encodeBytesField(8, new Uint8Array())
    );
    const internedName = encodeBytesField(
      2,
      concatenateBytes(encodeVarintField(1, 1), encodeStringField(2, 'interned'))
    );
    const defaults = encodeBytesField(11, encodeVarintField(11, 20));
    const begin = concatenateBytes(encodeVarintField(9, 1), encodeVarintField(10, 1));
    const end = encodeVarintField(9, 2);
    const instant = concatenateBytes(
      encodeVarintField(9, 3),
      encodeVarintField(11, 30),
      encodeStringField(23, 'instant')
    );
    const noType = encodeStringField(23, 'ignored');
    const legacy = (phase: number, duration?: number) =>
      encodeBytesField(
        6,
        concatenateBytes(
          encodeVarintField(2, phase),
          ...(duration === undefined ? [] : [encodeVarintField(3, duration)])
        )
      );

    const bytes = concatenateBytes(
      encodeTracePacket(encodeBytesField(60, encodeStringField(2, 'missing uuid'))),
      encodeTracePacket(encodeBytesField(43, encodeStringField(6, 'missing pid'))),
      encodeTracePacket(encodeBytesField(44, encodeVarintField(1, 7))),
      encodeTracePacket(
        encodeVarintField(10, 5),
        encodeVarintField(13, 1),
        encodeBytesField(12, internedName),
        encodeBytesField(59, defaults),
        encodeBytesField(60, processTrack),
        encodeBytesField(60, threadTrack),
        encodeBytesField(60, counterTrack)
      ),
      encodeTracePacket(
        encodeVarintField(10, 5),
        encodeVarintField(8, 10),
        encodeBytesField(11, begin)
      ),
      encodeTracePacket(
        encodeVarintField(10, 5),
        encodeVarintField(8, 20),
        encodeBytesField(11, end)
      ),
      encodeTracePacket(encodeVarintField(8, 25), encodeBytesField(11, instant)),
      encodeTracePacket(encodeVarintField(8, 30), encodeBytesField(11, noType)),
      encodeTracePacket(encodeVarintField(8, 40), encodeBytesField(11, legacy(66))),
      encodeTracePacket(encodeVarintField(8, 50), encodeBytesField(11, legacy(69))),
      encodeTracePacket(encodeVarintField(8, 60), encodeBytesField(11, legacy(73))),
      encodeTracePacket(encodeVarintField(8, 70), encodeBytesField(11, legacy(105))),
      encodeTracePacket(encodeVarintField(8, 80), encodeBytesField(11, legacy(88, 2))),
      encodeTracePacket(
        encodeBytesField(43, concatenateBytes(encodeVarintField(1, 7))),
        encodeBytesField(44, concatenateBytes(encodeVarintField(2, 8))),
        encodeBytesField(60, concatenateBytes(encodeVarintField(1, 20)))
      )
    );

    const trace = (await parse(bytes, PerfettoTraceLoader)) as PerfettoTrace;
    expect(trace.tracks.numRows).toBe(3);
    expect(trace.processes.getChild('name')?.get(0)).toBe('process');
    expect(trace.threads.getChild('name')?.get(0)).toBe('thread');
    expect(trace.slices.numRows).toBe(6);
    expect(Array.from(trace.slices.getChild('name') ?? [])).toContain('interned');
  });

  it('rejects unbounded Perfetto incremental state and open slices', () => {
    const beginPacket = concatenateBytes(
      encodeVarintField(8, 1),
      encodeBytesField(11, encodeVarintField(9, 1))
    );
    const openSliceParser = new PerfettoTraceParser({maxOpenSlices: 1});
    openSliceParser.addTracePacket(beginPacket);
    expect(() => openSliceParser.addTracePacket(beginPacket)).toThrow(/unmatched begin/i);

    const sequenceParser = new PerfettoTraceParser({maxStateEntries: 1});
    sequenceParser.addTracePacket(encodeVarintField(10, 1));
    expect(() => sequenceParser.addTracePacket(encodeVarintField(10, 2))).toThrow(
      /incremental-state sequences/i
    );

    const internedEventName = (identifier: number, name: string) =>
      encodeBytesField(
        2,
        concatenateBytes(encodeVarintField(1, identifier), encodeStringField(2, name))
      );
    const internedParser = new PerfettoTraceParser({maxStateEntries: 1});
    internedParser.addTracePacket(
      concatenateBytes(encodeVarintField(10, 1), encodeBytesField(12, internedEventName(1, 'one')))
    );
    expect(() =>
      internedParser.addTracePacket(
        concatenateBytes(
          encodeVarintField(10, 1),
          encodeBytesField(12, internedEventName(2, 'two'))
        )
      )
    ).toThrow(/interned event names/i);
  });

  it('rejects oversized streamed protobuf envelopes', async () => {
    const messages = streamProtobufMessages([Uint8Array.from([0])], 1, {
      maxPendingBytes: 0
    });
    await expect(async () => {
      for await (const _message of messages) {
        // The stream must reject before yielding a message.
      }
    }).rejects.toThrow(/maximum supported size/i);
  });

  it('handles unrelated Perfetto fields and rejects incomplete wire values in streams', async () => {
    const fixed64 = concatenateBytes(Uint8Array.from([0x09]), new Uint8Array(8));
    const fixed32 = concatenateBytes(Uint8Array.from([0x15]), new Uint8Array(4));
    const unrelatedBytes = concatenateBytes(
      encodeVarintField(2, 1),
      fixed64,
      fixed32,
      encodeBytesField(3, Uint8Array.from([1, 2])),
      encodeTracePacket(encodeVarintField(8, 1), encodeBytesField(11, encodeVarintField(9, 3)))
    );
    const padded = new Uint8Array(unrelatedBytes.length + 2);
    padded.set(unrelatedBytes, 1);
    const view = new DataView(padded.buffer, 1, unrelatedBytes.length);
    const batches = await parseInBatches([view], PerfettoTraceLoader, {
      perfettoTrace: {batchSize: 1}
    });
    const results = [];
    for await (const batch of batches) {
      results.push(batch);
    }
    expect(results.some(batch => batch.table === 'slices')).toBe(true);

    const malformedStreams = [
      Uint8Array.from([0]),
      Uint8Array.from([0x0f]),
      Uint8Array.from([0x08, 0x80]),
      concatenateBytes(Uint8Array.from([0x09]), new Uint8Array(7)),
      concatenateBytes(Uint8Array.from([0x15]), new Uint8Array(3)),
      Uint8Array.from([0x0a, 0x80]),
      Uint8Array.from([0x0a, 0x02, 0x01])
    ];
    for (const malformed of malformedStreams) {
      const iterator = await parseInBatches([malformed], PerfettoTraceLoader);
      await expect(async () => {
        for await (const _batch of iterator) {
          // Public streaming validation rejects malformed outer protobuf fields.
        }
      }).rejects.toThrow(/protobuf/i);
    }
  });

  it('encodes every Perfetto track variant and nullable descriptor field', async () => {
    const trace: PerfettoTrace = {
      tracks: arrow.tableFromArrays({
        track_uuid: new BigUint64Array([10n, 20n, 30n, 40n]),
        parent_track_uuid: [null, 10n, null, null],
        type: ['process', 'thread', 'counter', 'slice'],
        name: ['process track', 'thread track', '', null],
        pid: new Int32Array([7, 7, 0, 0]),
        tid: [null, 8, null, null]
      }) as PerfettoTrace['tracks'],
      slices: arrow.tableFromArrays({
        track_uuid: new BigUint64Array([40n, 40n, 40n]),
        ts: new BigUint64Array([20n, 5n, 10n]),
        dur: new BigUint64Array([0n, 2n, 1n]),
        name: [null, 'first', 'second']
      }) as PerfettoTrace['slices'],
      processes: arrow.tableFromArrays({
        pid: new Int32Array([7, 9]),
        name: ['process', null]
      }) as PerfettoTrace['processes'],
      threads: arrow.tableFromArrays({
        tid: new Int32Array([8, 10]),
        pid: [7, null],
        name: ['thread', null]
      }) as PerfettoTrace['threads']
    };

    const encoded = encodeSync(trace, PerfettoTraceWriter);
    const decoded = (await parse(encoded, PerfettoTraceLoader)) as PerfettoTrace;

    expect(decoded.tracks.getChild('type')?.toArray()).toEqual([
      'process',
      'thread',
      'counter',
      'slice'
    ]);
    expect(Array.from(decoded.slices.getChild('ts')?.toArray() ?? [])).toEqual([5n, 10n, 20n]);
    expect(decoded.processes.numRows).toBe(2);
    expect(decoded.threads.numRows).toBe(2);
  });

  it('rejects incomplete Perfetto Arrow writer inputs', () => {
    const empty = arrow.tableFromArrays({});
    const validEmptyTrace = {
      tracks: empty,
      slices: empty,
      processes: empty,
      threads: empty
    } as unknown as PerfettoTrace;
    expect(encodeSync(validEmptyTrace, PerfettoTraceWriter).byteLength).toBe(0);

    const missingProcessId = {
      ...validEmptyTrace,
      processes: arrow.tableFromArrays({name: ['missing']})
    } as PerfettoTrace;
    expect(() => encodeSync(missingProcessId, PerfettoTraceWriter)).toThrow(/required integer/);

    const missingTrackUuid = {
      ...validEmptyTrace,
      tracks: arrow.tableFromArrays({type: ['slice']})
    } as PerfettoTrace;
    expect(() => encodeSync(missingTrackUuid, PerfettoTraceWriter)).toThrow(/required uint64/);

    const invalidSliceTimestamp = {
      ...validEmptyTrace,
      slices: arrow.tableFromArrays({track_uuid: [1n], ts: [null], dur: [0n], name: ['bad']})
    } as PerfettoTrace;
    expect(() => encodeSync(invalidSliceTimestamp, PerfettoTraceWriter)).toThrow(/required uint64/);
  });
});
