// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parse, parseInBatches} from '@loaders.gl/core';
import * as arrow from 'apache-arrow';
import {describe, expect, it} from 'vitest';

import {ChromeTraceLoader} from '../src';

import type {ChromeTraceFileSchema} from '../src';

/**
 * Builds a compact Chrome trace fixture that exercises Arrow encoding edge cases.
 */
function createChromeTraceFixture(): ChromeTraceFileSchema {
  return {
    displayTimeUnit: 'us',
    metadata: {
      source: 'unit-test',
      version: 1
    },
    traceEvents: [
      {
        name: 'process_name',
        ph: 'M',
        pid: 7,
        tid: 'main',
        args: {name: 'proc-7'}
      },
      {
        name: 'complete-span',
        ph: 'X',
        ts: 100,
        pid: 7,
        tid: 'main',
        cat: 'blink',
        dur: 25,
        args: {nested: {ok: true}},
        id2: {global: 'g-1'},
        custom_flag: true
      },
      {
        name: 'flow-start',
        ph: 's',
        ts: 200,
        pid: '8',
        tid: 9,
        id: 'flow-1',
        bind_id: 42,
        s: 'p'
      },
      {
        name: 'instant-no-args',
        ph: 'i',
        ts: 250,
        pid: '8',
        tid: 9
      }
    ]
  };
}

/**
 * Encodes one Chrome trace fixture into an ArrayBuffer.
 */
function encodeChromeTraceFixture(traceFile: ChromeTraceFileSchema): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(traceFile));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/**
 * Splits one Chrome trace fixture into ArrayBuffer chunks.
 */
async function* streamChromeTraceFixture(
  traceFile: ChromeTraceFileSchema
): AsyncIterable<ArrayBuffer> {
  yield* streamChromeTraceText(JSON.stringify(traceFile), 37);
}

/**
 * Splits one Chrome trace JSON string into ArrayBuffer chunks.
 */
async function* streamChromeTraceText(text: string, chunkSize: number): AsyncIterable<ArrayBuffer> {
  for (let startIndex = 0; startIndex < text.length; startIndex += chunkSize) {
    const slice = text.slice(startIndex, startIndex + chunkSize);
    const bytes = new TextEncoder().encode(slice);
    yield bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
}

/**
 * Builds a larger streamed trace fixture with heterogeneous id-like values and payload shapes.
 */
function createLargeStreamedChromeTraceFixture() {
  const metadata = {
    source: 'generated-stream-test',
    eventCount: 257
  };
  const traceEvents: Record<string, unknown>[] = [];

  for (let eventIndex = 0; eventIndex < metadata.eventCount; eventIndex++) {
    const event: Record<string, unknown> = {
      name: `event-${eventIndex}`,
      ph: 'X',
      ts: eventIndex * 10,
      dur: eventIndex + 0.5,
      pid: eventIndex % 2 === 0 ? eventIndex : `process-${eventIndex}`,
      tid: eventIndex % 3 === 0 ? eventIndex + 1000 : `thread-${eventIndex}`,
      cat: eventIndex % 2 === 0 ? 'render' : 'worker',
      ignored_extra_field: {eventIndex}
    };

    if (eventIndex % 4 === 0) {
      event.id = eventIndex * 100;
    } else if (eventIndex % 4 === 1) {
      event.id = `id-${eventIndex}`;
    }

    if (eventIndex % 5 === 0) {
      event.bind_id = eventIndex + 500;
    } else if (eventIndex % 5 === 1) {
      event.bind_id = `bind-${eventIndex}`;
    }

    if (eventIndex % 11 === 0) {
      event.args = null;
    } else if (eventIndex % 7 !== 0) {
      event.args = {
        eventIndex,
        nested: {
          alternating: eventIndex % 2 === 0,
          labels: [`label-${eventIndex}`, {depth: eventIndex % 5}]
        },
        escaped: `line\n${eventIndex}`
      };
    }

    if (eventIndex % 13 === 0) {
      event.id2 = null;
    } else if (eventIndex % 6 === 0) {
      event.id2 = {
        global: eventIndex,
        local: `local-${eventIndex}`
      };
    }

    traceEvents.push(event);
  }

  const expectedArgsJson = JSON.stringify(traceEvents[5].args);
  const expectedId2Json = JSON.stringify(traceEvents[12].id2);

  return {
    jsonText: JSON.stringify({
      displayTimeUnit: 'us',
      metadata,
      traceEvents
    }),
    metadata,
    eventCount: metadata.eventCount,
    expectedArgsJson,
    expectedId2Json
  };
}

describe('ChromeTraceLoader', () => {
  it('parses to the expected Arrow schema contract', async () => {
    const traceFile = createChromeTraceFixture();
    const parsed = await parse(encodeChromeTraceFixture(traceFile), ChromeTraceLoader, {
      chromeTrace: {
        shape: 'arrow-table'
      }
    });
    const table = parsed as arrow.Table;

    expect(table.schema.fields.map(field => field.name)).toEqual([
      'name',
      'ph',
      'ts',
      'pid',
      'tid',
      'cat',
      'dur',
      'tdur',
      'tts',
      'id',
      'bind_id',
      'scope',
      'args',
      'extraJson'
    ]);

    expect(table.schema.fields.map(field => field.nullable)).toEqual([
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ]);

    expect(table.schema.fields.map(field => field.type.typeId)).toEqual([
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId,
      new arrow.Float64().typeId,
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId,
      new arrow.Float64().typeId,
      new arrow.Float64().typeId,
      new arrow.Float64().typeId,
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId,
      new arrow.Utf8().typeId
    ]);
  });

  it('parses a full Chrome trace into an Arrow table with encoded args and schema metadata', async () => {
    const traceFile = createChromeTraceFixture();
    const parsed = await parse(encodeChromeTraceFixture(traceFile), ChromeTraceLoader, {
      chromeTrace: {
        shape: 'arrow-table'
      }
    });
    const table = parsed as arrow.Table;

    expect(table.numRows).toBe(4);
    expect(table.schema.metadata.get('chromeTrace.displayTimeUnit')).toBe('us');
    expect(table.schema.metadata.get('chromeTrace.metadataJson')).toBe(
      JSON.stringify(traceFile.metadata)
    );
    expect(table.getChild('pid')?.get(0)).toBe('7');
    expect(table.getChild('tid')?.get(0)).toBe('main');
    expect(table.getChild('args')?.get(1)).toBe('{"nested":{"ok":true}}');
    expect(table.getChild('args')?.get(3)).toBeNull();
    expect(table.getChild('scope')?.get(2)).toBe('p');

    const extraJson = table.getChild('extraJson')?.get(1);
    expect(typeof extraJson).toBe('string');
    expect(JSON.parse(extraJson as string)).toEqual({
      pid: 7,
      id2: {global: 'g-1'},
      custom_flag: true
    });
  });

  it('emits lossless streamed Arrow record batches through the canonical parser', async () => {
    const traceFile = createChromeTraceFixture();
    const batchIterable = await parseInBatches(
      streamChromeTraceFixture(traceFile),
      ChromeTraceLoader,
      {
        chromeTrace: {
          shape: 'arrow-table',
          batchSize: 2
        }
      }
    );

    const batches: arrow.RecordBatch[] = [];
    for await (const batch of batchIterable) {
      batches.push(batch as arrow.RecordBatch);
    }

    expect(batches).toHaveLength(2);

    const combinedTable = new arrow.Table(batches[0].schema, batches);
    expect(combinedTable.numRows).toBe(4);
    expect(combinedTable.schema.fields.map(field => field.name)).toEqual([
      'name',
      'ph',
      'ts',
      'pid',
      'tid',
      'cat',
      'dur',
      'tdur',
      'tts',
      'id',
      'bind_id',
      'scope',
      'args',
      'extraJson'
    ]);
    expect(combinedTable.getChild('pid')?.get(0)).toBe('7');
    expect(combinedTable.getChild('tid')?.get(2)).toBe('9');
    expect(combinedTable.getChild('bind_id')?.get(2)).toBe('42');
    expect(combinedTable.getChild('args')?.get(1)).toBe('{"nested":{"ok":true}}');
    expect(JSON.parse(combinedTable.getChild('extraJson')?.get(1) as string)).toEqual({
      pid: 7,
      id2: {global: 'g-1'},
      custom_flag: true
    });

    expect(batches[1].schema.metadata.get('chromeTrace.metadataJson')).toBe(
      JSON.stringify(traceFile.metadata)
    );
  });

  it('preserves exact streamed Chrome trace args and id2 JSON text across chunk boundaries', async () => {
    const jsonText =
      '{"displayTimeUnit":"us","metadata":{"source":"raw"},"traceEvents":[{"name":"raw","ph":"X","ts":1,"pid":7,"tid":8,"args": { "nested" : ["\\\\u2603", {"ok":true}] }, "id2": { "global" : 9 }}]}';
    const batchIterable = await parseInBatches(
      streamChromeTraceText(jsonText, 5),
      ChromeTraceLoader,
      {
        chromeTrace: {
          shape: 'arrow-table',
          batchSize: 1
        }
      }
    );

    const batches: arrow.RecordBatch[] = [];
    for await (const batch of batchIterable) {
      batches.push(batch as arrow.RecordBatch);
    }

    const table = new arrow.Table(batches[0].schema, batches);
    expect(table.getChild('pid')?.get(0)).toBe('7');
    expect(table.getChild('tid')?.get(0)).toBe('8');
    expect(JSON.parse(table.getChild('args')?.get(0) as string)).toEqual({
      nested: ['\\u2603', {ok: true}]
    });
    expect(JSON.parse(table.getChild('extraJson')?.get(0) as string)).toEqual({
      pid: 7,
      tid: 8,
      id2: {global: 9}
    });
  });

  it('streams a large mixed Chrome trace fixture across multiple Arrow batches', async () => {
    const fixture = createLargeStreamedChromeTraceFixture();
    const batchIterable = await parseInBatches(
      streamChromeTraceText(fixture.jsonText, 29),
      ChromeTraceLoader,
      {
        chromeTrace: {
          shape: 'arrow-table',
          batchSize: 32
        }
      }
    );

    const batches: arrow.RecordBatch[] = [];
    for await (const batch of batchIterable) {
      batches.push(batch as arrow.RecordBatch);
    }

    expect(batches).toHaveLength(Math.ceil(fixture.eventCount / 32));

    const table = new arrow.Table(batches[0].schema, batches);
    expect(table.numRows).toBe(fixture.eventCount);
    expect(table.getChild('pid')?.get(12)).toBe('12');
    expect(table.getChild('tid')?.get(12)).toBe('1012');
    expect(table.getChild('id')?.get(12)).toBe('1200');
    expect(table.getChild('pid')?.get(13)).toBe('process-13');
    expect(table.getChild('id')?.get(13)).toBe('id-13');
    expect(table.getChild('bind_id')?.get(10)).toBe('510');
    expect(table.getChild('bind_id')?.get(11)).toBe('bind-11');
    expect(table.getChild('args')?.get(5)).toBe(fixture.expectedArgsJson);
    expect(table.getChild('args')?.get(7)).toBeNull();
    expect(table.getChild('args')?.get(11)).toBeNull();
    expect(JSON.parse(table.getChild('extraJson')?.get(12) as string).id2).toEqual(
      JSON.parse(fixture.expectedId2Json)
    );
    expect(JSON.parse(table.getChild('extraJson')?.get(13) as string)).toEqual({
      id2: null,
      ignored_extra_field: {eventIndex: 13}
    });
    expect(table.getChild('ignored_extra_field')).toBeNull();
    expect(batches.at(-1)?.schema.metadata.get('chromeTrace.metadataJson')).toBe(
      JSON.stringify(fixture.metadata)
    );
  });
});
