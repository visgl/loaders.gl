// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  encode,
  encodeInBatches,
  encodeSync,
  encodeText,
  encodeTextSync,
  encodeURLtoURL
} from '@loaders.gl/core';
import {encodeTextInBatches} from '../../../src/lib/api/encode';

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function makeWriter(overrides: Record<string, unknown> = {}): any {
  return {
    name: 'TestWriter',
    id: 'test-writer',
    module: 'core',
    version: 'latest',
    extensions: [],
    options: {},
    encode: async (data: unknown) => TEXT_ENCODER.encode(String(data)).buffer,
    ...overrides
  };
}

test('encode delegates to the asynchronous writer', async () => {
  const output = await encode('hello', makeWriter());
  expect(TEXT_DECODER.decode(output)).toBe('hello');
});

test('encodeSync supports binary and text synchronous writers', () => {
  expect(
    TEXT_DECODER.decode(
      encodeSync('binary', makeWriter({encodeSync: data => TEXT_ENCODER.encode(data).buffer}))
    )
  ).toBe('binary');
  expect(TEXT_DECODER.decode(encodeSync('text', makeWriter({encodeTextSync: data => data})))).toBe(
    'text'
  );
  expect(() => encodeSync('none', makeWriter())).toThrow(
    'Writer TestWriter could not synchronously encode data'
  );
});

test('encodeText uses async, sync, and binary text writer capabilities', async () => {
  expect(await encodeText('async', makeWriter({encodeText: async data => data}))).toBe('async');
  expect(await encodeText('sync', makeWriter({encodeTextSync: data => data}))).toBe('sync');
  expect(await encodeText('binary', makeWriter({text: true}))).toBe('binary');
  await expect(encodeText('none', makeWriter({text: false}))).rejects.toThrow(
    'Writer TestWriter could not encode data as text'
  );
});

test('encodeTextSync supports text writers and reports unsupported writers', () => {
  expect(encodeTextSync('sync', makeWriter({encodeTextSync: data => data}))).toBe('sync');
  expect(
    encodeTextSync(
      'binary',
      makeWriter({text: true, encodeSync: data => TEXT_ENCODER.encode(data).buffer})
    )
  ).toBe('binary');
  expect(() => encodeTextSync('none', makeWriter())).toThrow(
    'Writer TestWriter could not encode data as text'
  );
});

test('batch encoders normalize input and expose unsupported operations', async () => {
  const binaryWriter = makeWriter({
    encodeInBatches: async function* (batches: Iterable<any>) {
      for (const batch of batches) {
        yield TEXT_ENCODER.encode(`${batch.start}:${batch.end}`).buffer;
      }
    }
  });
  const binaryOutputs: string[] = [];
  for await (const output of encodeInBatches(['a', 'b'] as any, binaryWriter)) {
    binaryOutputs.push(TEXT_DECODER.decode(output));
  }
  expect(binaryOutputs).toEqual(['0:2']);

  const textWriter = makeWriter({
    encodeTextInBatches: async function* (batches: Iterable<any>) {
      for (const batch of batches) {
        yield TEXT_ENCODER.encode(`${batch.start}:${batch.end}`).buffer;
      }
    }
  });
  const textOutputs: string[] = [];
  for await (const output of encodeTextInBatches(['a'] as any, textWriter)) {
    textOutputs.push(TEXT_DECODER.decode(output));
  }
  expect(textOutputs).toEqual(['0:1']);
  expect(() => encodeInBatches([], makeWriter())).toThrow('could not encode in batches');
  expect(() => encodeTextInBatches([], makeWriter())).toThrow('could not encode text in batches');
});

test('URL encoders reject command-line writers in Chromium', async () => {
  const writer = makeWriter({encodeURLtoURL: async () => '/tmp/output'});
  await expect(encodeURLtoURL('input', 'output', writer)).rejects.toThrow();
  await expect(encode(new ArrayBuffer(0), writer)).rejects.toThrow(
    'Writer TestWriter not supported in browser'
  );
});
