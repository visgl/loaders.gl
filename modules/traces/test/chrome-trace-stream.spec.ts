// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse, parseInBatches} from '@loaders.gl/core';
import {describe, expect, it} from 'vitest';

import {
  ChromeTraceLoader,
  consumeChromeTraceArrowStream,
  consumeChromeTraceEventStream,
  consumeChromeTraceFileStream,
  createTraceStreamSession,
  streamChromeTraceArrowChunks,
  streamChromeTraceFileChunks
} from '../src';

import type {ChromeTraceEventSchema, ChromeTraceFileSchema, TraceStreamChunk} from '../src';

/**
 * Builds one minimal metadata event.
 */
function createMetadataEvent(
  name: 'process_name' | 'thread_name',
  tid: number,
  args: Record<string, unknown>
): ChromeTraceEventSchema {
  return {
    name,
    ph: 'M',
    pid: 1,
    tid,
    args
  };
}

/**
 * Builds one minimal complete span event.
 */
function createCompleteSpanEvent(name: string, ts: number, dur: number): ChromeTraceEventSchema {
  return {
    name,
    ph: 'X',
    ts,
    dur,
    pid: 1,
    tid: 1,
    cat: 'blink',
    args: {}
  };
}

/**
 * Builds one streaming fixture.
 */
function createChromeTraceFixture(): ChromeTraceFileSchema {
  return {
    displayTimeUnit: 'us',
    metadata: {
      stream: true
    },
    traceEvents: [
      createMetadataEvent('process_name', 0, {name: 'proc-1'}),
      createMetadataEvent('thread_name', 1, {name: 'main'}),
      createCompleteSpanEvent('span-1', 1000, 2000),
      createCompleteSpanEvent('span-2', 4000, 1000)
    ]
  };
}

/**
 * Streams one Chrome trace file as JSON chunks.
 */
async function* streamChromeTraceFile(
  traceFile: ChromeTraceFileSchema
): AsyncIterable<ArrayBuffer> {
  const text = JSON.stringify(traceFile);

  for (let startIndex = 0; startIndex < text.length; startIndex += 41) {
    const slice = text.slice(startIndex, startIndex + 41);
    const bytes = new TextEncoder().encode(slice);
    yield bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
}

/**
 * Encodes one Chrome trace fixture into an ArrayBuffer.
 */
function encodeChromeTraceFixture(traceFile: ChromeTraceFileSchema): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(traceFile));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Parses one Chrome trace fixture to a public Arrow table through the loader.
 */
async function parseChromeTraceArrowTable(traceFile: ChromeTraceFileSchema): Promise<arrow.Table> {
  const parsed = await parse(encodeChromeTraceFixture(traceFile), ChromeTraceLoader, {
    chromeTrace: {
      shape: 'arrow-table'
    }
  });

  return parsed as arrow.Table;
}

/**
 * Parses one streamed Chrome trace fixture to public Arrow record batches through the loader.
 */
async function parseChromeTraceArrowBatches(
  traceFile: ChromeTraceFileSchema,
  batchSize: number
): Promise<arrow.RecordBatch[]> {
  const batchIterable = await parseInBatches(streamChromeTraceFile(traceFile), ChromeTraceLoader, {
    chromeTrace: {
      shape: 'arrow-table',
      batchSize
    }
  });

  const batches: arrow.RecordBatch[] = [];
  for await (const batch of batchIterable) {
    batches.push(batch as arrow.RecordBatch);
  }

  return batches;
}

/**
 * Creates one comparable summary for a streamed replacement chunk sequence.
 */
function summarizeChunks(chunks: TraceStreamChunk[]): unknown[] {
  return chunks.map(chunk => ({
    name: chunk.name,
    eventCount: chunk.replaceSnapshot?.traceFile.traceEvents.length,
    metadata: chunk.replaceSnapshot?.traceFile.metadata,
    processCount: chunk.replaceSnapshot?.trace.processes.length,
    threadLabels: chunk.replaceSnapshot?.trace.processes.flatMap(process =>
      process.threads.map(thread => thread.label)
    )
  }));
}

describe('chrome-trace-stream', () => {
  it('publishes replacement snapshots while consuming parsed event streams', async () => {
    const session = createTraceStreamSession({publishIntervalMs: 0});
    const snapshots: number[] = [];
    session.subscribe(snapshot => {
      snapshots.push(snapshot.sequence);
    });

    async function* source() {
      yield [
        createMetadataEvent('process_name', 0, {name: 'proc-1'}),
        createMetadataEvent('thread_name', 1, {name: 'main'})
      ];
      yield createCompleteSpanEvent('span-1', 1000, 2000);
      yield createCompleteSpanEvent('span-2', 4000, 1000);
    }

    const snapshot = await consumeChromeTraceEventStream(session, source(), {
      name: 'streamed-events',
      publishEveryEvents: 1
    });

    expect(snapshot?.name).toBe('streamed-events');
    expect(
      snapshot?.trace.processes.flatMap(process => process.threads.flatMap(thread => thread.spans))
    ).toHaveLength(2);
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
  });

  it('routes file streaming through the Arrow parser and matches the Arrow chunk path', async () => {
    const traceFile = createChromeTraceFixture();
    const fileChunks: TraceStreamChunk[] = [];
    const arrowChunks: TraceStreamChunk[] = [];
    const arrowBatches = await parseChromeTraceArrowBatches(traceFile, 2);

    for await (const chunk of streamChromeTraceFileChunks(streamChromeTraceFile(traceFile), {
      name: 'streamed-file',
      publishEveryEvents: 1,
      batchSize: 2
    })) {
      fileChunks.push(chunk);
    }

    async function* batchSource() {
      for (const batch of arrowBatches) {
        yield batch;
      }
    }

    for await (const chunk of streamChromeTraceArrowChunks(batchSource(), {
      name: 'streamed-file',
      publishEveryEvents: 1
    })) {
      arrowChunks.push(chunk);
    }

    expect(summarizeChunks(fileChunks)).toEqual(summarizeChunks(arrowChunks));
  });

  it('publishes equivalent snapshots for file and Arrow stream consumption', async () => {
    const traceFile = createChromeTraceFixture();
    const fileSession = createTraceStreamSession({publishIntervalMs: 0});
    const arrowSession = createTraceStreamSession({publishIntervalMs: 0});
    const arrowBatches = await parseChromeTraceArrowBatches(traceFile, 2);

    const fileSnapshot = await consumeChromeTraceFileStream(
      fileSession,
      streamChromeTraceFile(traceFile),
      {
        name: 'streamed-file',
        publishEveryEvents: 1,
        batchSize: 2
      }
    );

    async function* batchSource() {
      for (const batch of arrowBatches) {
        yield batch;
      }
    }

    const arrowSnapshot = await consumeChromeTraceArrowStream(arrowSession, batchSource(), {
      name: 'streamed-file',
      publishEveryEvents: 1
    });

    expect(arrowSnapshot).toEqual(fileSnapshot);
  });

  it('pipes parseInBatches output from ChromeTraceLoader into streamChromeTraceArrowChunks', async () => {
    const traceFile = createChromeTraceFixture();
    const batchIterable = await parseInBatches(
      streamChromeTraceFile(traceFile),
      ChromeTraceLoader,
      {
        chromeTrace: {
          shape: 'arrow-table',
          batchSize: 2
        }
      }
    );

    const chunks: TraceStreamChunk[] = [];
    for await (const chunk of streamChromeTraceArrowChunks(batchIterable as AsyncIterable<any>, {
      name: 'loader-batches',
      publishEveryEvents: 1
    })) {
      chunks.push(chunk);
    }

    expect(chunks.at(-1)?.replaceSnapshot?.traceFile.metadata).toEqual(traceFile.metadata);
    expect(
      chunks
        .at(-1)
        ?.replaceSnapshot?.trace.processes.flatMap(process =>
          process.threads.flatMap(thread => thread.spans)
        )
    ).toHaveLength(2);
  });

  it('preserves metadata and async scope when consuming a public Arrow table stream', async () => {
    const traceFile: ChromeTraceFileSchema = {
      displayTimeUnit: 'us',
      metadata: {
        buildId: 'abc123'
      },
      traceEvents: [
        createMetadataEvent('process_name', 0, {name: 'proc-1'}),
        createMetadataEvent('thread_name', 1, {name: 'main'}),
        {
          name: 'async-start',
          ph: 'b',
          ts: 200,
          pid: 'worker',
          tid: 7,
          id: 77,
          s: 'p'
        },
        createCompleteSpanEvent('span-1', 1000, 2000)
      ]
    };
    const table = await parseChromeTraceArrowTable(traceFile);

    async function* tableSource() {
      yield table as arrow.Table;
    }

    const chunks: TraceStreamChunk[] = [];
    for await (const chunk of streamChromeTraceArrowChunks(tableSource(), {
      name: 'public-arrow-table',
      publishEveryEvents: 1
    })) {
      chunks.push(chunk);
    }

    const finalChunk = chunks.at(-1);
    expect(finalChunk?.replaceSnapshot?.traceFile.metadata).toEqual(traceFile.metadata);
    expect(finalChunk?.replaceSnapshot?.traceFile.traceEvents[2]).toMatchObject({
      name: 'async-start',
      ph: 'b',
      pid: 'worker',
      tid: 7,
      id: 77,
      s: 'p'
    });
  });
});
