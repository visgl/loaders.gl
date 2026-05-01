import {expect, test} from 'vitest';
import {
  forEach,
  makeTextDecoderIterator,
  makeTextEncoderIterator,
  makeLineIterator,
  makeNumberedLineIterator,
  concatenateArrayBuffersAsync
} from '@loaders.gl/loader-utils';
import {flushMicrotasks} from '@loaders.gl/test-utils/vitest';
import {NDJSONLoader} from '@loaders.gl/json/bundled';
const parseNDJSONInBatches = NDJSONLoader.parseInBatches;

async function* asyncNumbers() {
  let number = 0;
  for (let i = 0; i < 3; i++) {
    await flushMicrotasks();
    number += 1;
    yield number;
  }
}
async function* asyncTexts() {
  await flushMicrotasks();
  yield 'line 1\nline';
  await flushMicrotasks();
  yield ' 2\nline 3\n';
  await flushMicrotasks();
  yield 'line 4';
}
function asyncArrayBuffers() {
  return makeTextEncoderIterator(asyncTexts());
}
async function* asyncJsons() {
  await flushMicrotasks();
  yield '{"id":0,"field":"value0","flag":false}\n{"id":1,"fie';
  await flushMicrotasks();
  yield 'ld":"value1","flag":true}\n{"id":2,"field":"value2","flag":false}\n';
  await flushMicrotasks();
  yield '{"id":3,"field":"value3","flag":true}';
}
function asyncNDJson() {
  return makeTextEncoderIterator(asyncJsons());
}
test('async-iterator#forEach', async () => {
  const numbers: number[] = [];
  await forEach(asyncNumbers(), number => {
    numbers.push(number);
  });
  expect(numbers, 'iterates through async values in order').toEqual([1, 2, 3]);
});
test('async-iterator#makeTextDecoderIterator', async () => {
  const sourceTexts: string[] = [];
  for await (const text of asyncTexts()) {
    sourceTexts.push(text);
  }

  const decodedTexts: string[] = [];
  for await (const text of makeTextDecoderIterator(asyncArrayBuffers())) {
    decodedTexts.push(text);
  }

  expect(sourceTexts, 'source iterator yields strings').toEqual([
    'line 1\nline',
    ' 2\nline 3\n',
    'line 4'
  ]);
  expect(decodedTexts, 'decoder preserves async text chunks').toEqual(sourceTexts);
});
test('async-iterator#makeLineIterator', async () => {
  const lines: string[] = [];
  for await (const text of makeLineIterator(asyncTexts())) {
    lines.push(text.trim());
  }

  expect(lines, 'yields one line at a time').toEqual(['line 1', 'line 2', 'line 3', 'line 4']);
});
test('async-iterator#makeNumberedLineIterator', async () => {
  const numberedLines: {line: string; counter: number}[] = [];
  for await (const result of makeNumberedLineIterator(makeLineIterator(asyncTexts()))) {
    numberedLines.push({line: result.line.trim(), counter: result.counter});
  }

  expect(numberedLines, 'tracks line numbers').toEqual([
    {line: 'line 1', counter: 1},
    {line: 'line 2', counter: 2},
    {line: 'line 3', counter: 3},
    {line: 'line 4', counter: 4}
  ]);
});
test('async-iterator#parseNDJSONInBatches', async () => {
  const objects: Array<{id: number; field: string; flag: boolean}> = [];
  for await (const batch of parseNDJSONInBatches(asyncNDJson())) {
    // @ts-expect-error
    objects.push(batch.data[0]);
  }

  expect(objects, 'parses NDJSON batches in order').toEqual([
    {id: 0, field: 'value0', flag: false},
    {id: 1, field: 'value1', flag: true},
    {id: 2, field: 'value2', flag: false},
    {id: 3, field: 'value3', flag: true}
  ]);
});
test('async-iterator#concatenateArrayBuffersAsync accepts ArrayBufferLike and views', async () => {
  const sharedArrayBuffer =
    typeof SharedArrayBuffer !== 'undefined' ? new SharedArrayBuffer(4) : new ArrayBuffer(4);
  const sharedView = new Uint8Array(sharedArrayBuffer);
  sharedView.set([1, 2, 3, 4]);
  const view = new Uint8Array([5, 6]);
  const result = await concatenateArrayBuffersAsync([
    sharedArrayBuffer,
    view.subarray(1),
    new DataView(new Uint8Array([7, 8]).buffer)
  ]);
  expect(new Uint8Array(result)).toEqual(new Uint8Array([1, 2, 3, 4, 6, 7, 8]));
});
test('async-iterator#concatenateArrayBuffersAsync copies numeric views', async () => {
  const floatView = new Float32Array([1.25, 2.5]);
  const int16View = new Int16Array([0x1122, 0x3344]);
  const result = await concatenateArrayBuffersAsync([floatView, int16View]);
  const reconstructed = new Uint8Array(result);
  const expected = new Uint8Array(new Uint8Array(floatView.buffer).length + int16View.byteLength);
  expected.set(new Uint8Array(floatView.buffer));
  expected.set(new Uint8Array(int16View.buffer), floatView.byteLength);
  expect(reconstructed, 'copies view bytes instead of truncating values').toEqual(expected);
});
