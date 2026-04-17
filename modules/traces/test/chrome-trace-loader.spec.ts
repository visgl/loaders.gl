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
  const text = JSON.stringify(traceFile);

  for (let startIndex = 0; startIndex < text.length; startIndex += 37) {
    const slice = text.slice(startIndex, startIndex + 37);
    const bytes = new TextEncoder().encode(slice);
    yield bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
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

  it('emits Arrow record batches whose concatenation matches the full Arrow table rows', async () => {
    const traceFile = createChromeTraceFixture();
    const parsed = await parse(encodeChromeTraceFixture(traceFile), ChromeTraceLoader, {
      chromeTrace: {
        shape: 'arrow-table'
      }
    });
    const table = parsed as arrow.Table;

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
    expect(combinedTable.numRows).toBe(table.numRows);

    for (const fieldName of table.schema.fields.map(field => field.name)) {
      const expectedValues = Array.from({length: table.numRows}, (_, rowIndex) =>
        table.getChild(fieldName)?.get(rowIndex)
      );
      const actualValues = Array.from({length: combinedTable.numRows}, (_, rowIndex) =>
        combinedTable.getChild(fieldName)?.get(rowIndex)
      );
      expect(actualValues).toEqual(expectedValues);
    }

    expect(batches[1].schema.metadata.get('chromeTrace.metadataJson')).toBe(
      JSON.stringify(traceFile.metadata)
    );
  });
});
