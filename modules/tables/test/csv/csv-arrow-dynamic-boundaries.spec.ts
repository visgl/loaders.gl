// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {RecordBatch} from 'apache-arrow';
import {
  parseCSVArrayBufferAsArrow,
  parseCSVInArrowBatches,
  parseCSVTextAsArrow
} from '../../src/csv/csv-arrow-table-parser';

const encoder = new TextEncoder();

/** Returns one Arrow column as ordinary values. */
function values(table: any, name: string): unknown[] {
  const column = table.getChild(name);
  return Array.from({length: table.numRows}, (_, index) => column.get(index));
}

test('ArrayBuffer Arrow parsing covers geometry and untyped fallback paths', async () => {
  const geometry = await parseCSVArrayBufferAsArrow(
    encoder.encode('name,geometry\npoint,POINT (1 2)').buffer,
    {csv: {header: true, detectGeometryColumns: true}}
  );
  expect(geometry.getChild('geometry')!.get(0)).toBeInstanceOf(Uint8Array);

  const untyped = await parseCSVArrayBufferAsArrow(encoder.encode('a,b\n1,2').buffer, {
    csv: {header: true, dynamicTyping: false}
  });
  expect(values(untyped, 'a')).toEqual(['1']);

  const typedQuoted = await parseCSVArrayBufferAsArrow(
    encoder.encode('number,boolean\n"1.5","false"').buffer,
    {csv: {header: true, dynamicTyping: true}}
  );
  expect(values(typedQuoted, 'number')).toEqual([1.5]);
  expect(values(typedQuoted, 'boolean')).toEqual([false]);
});

test('quoted dynamic conversion covers nullable booleans, numbers, and dates', async () => {
  const table = await parseCSVTextAsArrow(
    [
      'boolean,number,date',
      '"true"," -1.25e+3 ","2025-01-02T03:04:05Z"',
      ',,"2026-02-03T04:05:06Z"',
      '"FALSE",".5",'
    ].join('\n'),
    {csv: {header: true, dynamicTyping: true}}
  );
  expect(values(table, 'boolean')).toEqual([true, null, false]);
  expect(values(table, 'number')).toEqual([-1250, null, 0.5]);
  expect(values(table, 'date')).toEqual([
    Date.parse('2025-01-02T03:04:05Z'),
    Date.parse('2026-02-03T04:05:06Z'),
    null
  ]);
});

test.each([
  ['1e', '1e'],
  ['1e+', '1e+'],
  ['1e-x', '1e-x'],
  ['-.', '-.'],
  ['1.2.3', '1.2.3'],
  ['   ', '   ']
])('quoted dynamic conversion preserves invalid numeric grammar %s', async (input, output) => {
  const table = await parseCSVTextAsArrow(`value\n"${input}"`, {
    csv: {header: true, dynamicTyping: true}
  });
  expect(values(table, 'value')).toEqual([output]);
});

test('direct numeric parser covers duplicate headers and malformed speculative rows', async () => {
  const duplicate = await parseCSVTextAsArrow('value,value\n1,2\n3,4', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(duplicate.schema.fields.map(field => field.name)).toEqual(['value', 'value.1']);
  expect(values(duplicate, 'value.1')).toEqual([2, 4]);

  const malformedWidth = await parseCSVTextAsArrow('a,b\n1\n2,3', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(malformedWidth.numRows).toBe(2);

  const headerOnly = await parseCSVTextAsArrow('a,b', {
    csv: {header: true, dynamicTyping: true}
  });
  expect(headerOnly.numRows).toBe(0);
});

test('direct parser rejects incompatible delimiter candidates before safe fallback', async () => {
  const table = await parseCSVTextAsArrow('a§b\n1§2', {
    csv: {
      header: true,
      dynamicTyping: true,
      delimiter: '§'
    }
  });
  expect(values(table, 'a')).toEqual([1]);

  const guessed = await parseCSVTextAsArrow('a|b\n1|2', {
    csv: {
      header: true,
      dynamicTyping: true,
      delimitersToGuess: ['§', '||', '|']
    }
  });
  expect(values(guessed, 'b')).toEqual([2]);
});

test.each([
  ['first-batch', [1, null]],
  ['full', ['1', 'later']],
  [undefined, [1, null]]
] as const)('CSV Arrow streaming uses %s inference', async (schemaInference, expected) => {
  const options = {
    core: {batchSize: 1},
    csv: {header: true as const, dynamicTyping: true, schemaInference}
  };
  const chunks = ['value\n1\n', 'later\n'].map(text => encoder.encode(text));
  const result = [];
  for await (const batch of parseCSVInArrowBatches(chunks, options)) {
    result.push(...values(batch, 'value'));
  }
  expect(result).toEqual(expected);
  const atomic = await parseCSVTextAsArrow('value\n1\nlater', options);
  expect(values(atomic, 'value')).toEqual(
    schemaInference === undefined ? ['1', 'later'] : expected
  );
});

test('CSV Arrow batches retain progress on runtimes without native batch metadata', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(RecordBatch.prototype, 'metadata');
  expect(descriptor).toBeDefined();
  Reflect.deleteProperty(RecordBatch.prototype, 'metadata');
  try {
    const input = [encoder.encode('value\n1\n2\n')];
    const batches = [];
    for await (const batch of parseCSVInArrowBatches(input, {
      core: {batchSize: 1},
      csv: {header: true, dynamicTyping: true}
    })) {
      batches.push(batch);
    }
    expect(batches.map(batch => batch.metadata.get('count'))).toEqual(['0', '1']);
    expect(batches.flatMap(batch => values(batch, 'value'))).toEqual([1, 2]);
  } finally {
    Object.defineProperty(RecordBatch.prototype, 'metadata', descriptor!);
  }
});

test('full CSV inference includes extra header cells that first appear in later rows', async () => {
  const input = [encoder.encode('a,b\n1,2\n3,4,late')];
  const batches = [];
  for await (const batch of parseCSVInArrowBatches(input, {
    core: {batchSize: 1},
    csv: {header: true, dynamicTyping: true, skipEmptyLines: false, schemaInference: 'full'}
  })) {
    batches.push(batch);
  }
  expect(batches).toHaveLength(1);
  const extra = batches[0].getChild('__parsed_extra');
  expect(extra?.get(0)).toBe(null);
  expect(Array.from(extra!.get(1))).toEqual(['late']);
});
