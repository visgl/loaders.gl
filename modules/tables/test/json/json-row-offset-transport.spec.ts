// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  deserializeJSONRowOffsetBatch,
  parseJSONRowOffsetsInBatches
} from '../../src/json/lib/json-row-offset-transport';

const encoder = new TextEncoder();

test('JSON row offset frames retain original separators and use UTF-8 byte positions', async () => {
  const first = '{"text":"雪 \\" ]", "nested":[{}]}';
  const second = '{"id":2}';
  const fragments = [Uint8Array.of(0xef), Uint8Array.of(0xbb), Uint8Array.of(0xbf)];
  const input = encoder.encode(' [\n' + first + ',\r\t' + second + ',{}]');
  fragments.push(...Array.from(input, byte => Uint8Array.of(byte)));
  const [batch, lastBatch] = await Array.fromAsync(parseJSONRowOffsetsInBatches(fragments, 2));

  const firstLength = encoder.encode(first).length;
  const end = firstLength + 3 + second.length;
  expect([...batch.offsets]).toEqual([0, firstLength, firstLength + 3, end]);
  expect(batch.data).toEqual(encoder.encode(first + ',\r\t' + second));
  expect(batch.bytesUsed).toBe(6 + end);
  expect(deserializeJSONRowOffsetBatch(batch).data).toEqual([
    {text: '雪 " ]', nested: [{}]},
    {id: 2}
  ]);
  expect(deserializeJSONRowOffsetBatch(lastBatch).data).toEqual([{}]);
});

test('JSON row offset frames in auto mode emit completed rows per input chunk', async () => {
  const first = encoder.encode(' [{} , {"id":');
  const second = encoder.encode('1}] ');
  const batches = await Array.fromAsync(
    parseJSONRowOffsetsInBatches([first.buffer, second.buffer])
  );
  expect(batches.map(batch => deserializeJSONRowOffsetBatch(batch).data)).toEqual([
    [{}],
    [{id: 1}]
  ]);
  expect(await Array.fromAsync(parseJSONRowOffsetsInBatches([encoder.encode('[]')]))).toEqual([]);
});

test.each([
  [Uint8Array.of(0xef, 0x00), 'Invalid UTF-8 prefix'],
  [encoder.encode('[{]'), 'Expected a JSON object row'],
  [encoder.encode('[{},]'), 'require a top-level array'],
  [encoder.encode('[{"id":1}'), 'Unexpected end']
])('JSON row offset scanner rejects malformed framing (%s)', async (input, message) => {
  await expect(Array.fromAsync(parseJSONRowOffsetsInBatches([input]))).rejects.toThrow(message);
});
