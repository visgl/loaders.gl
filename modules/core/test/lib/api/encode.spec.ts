// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  encode,
  encodeInBatches,
  encodeSync,
  encodeTable,
  encodeTableInBatches,
  encodeText,
  encodeTextSync,
  encodeURLtoURL,
  type Writer
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
        yield TEXT_ENCODER.encode(batch).buffer;
      }
    }
  });
  const binaryOutputs: string[] = [];
  for await (const output of encodeInBatches(['a', 'b'] as any, binaryWriter)) {
    binaryOutputs.push(TEXT_DECODER.decode(output));
  }
  expect(binaryOutputs).toEqual(['a', 'b']);

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

test('async encoding resolves metadata and preserves preload failures', async () => {
  const implementation = makeWriter({text: true});
  const {encode: _encode, ...metadata} = implementation;
  const writer = {...metadata, preload: async () => implementation};

  expect(TEXT_DECODER.decode(await encode('binary', writer))).toBe('binary');
  expect(await encodeText('text', writer)).toBe('text');
  expect(() => encodeSync('sync', writer)).toThrow('could not synchronously encode');
  const failure = new Error('writer import failed');
  const broken = {
    ...metadata,
    preload: async () => {
      throw failure;
    }
  };
  await expect(encode('broken', broken)).rejects.toBe(failure);
});

test.each([
  ['binary', encodeInBatches, 'encodeInBatches'],
  ['text', encodeTextInBatches, 'encodeTextInBatches']
] as const)('lazy %s batch encoding starts loading on iteration', async (_, encodeBatches, method) => {
  let preloads = 0;
  const implementation = makeWriter({
    [method]: async function* () {
      yield TEXT_ENCODER.encode('batch').buffer;
    }
  });
  const {encode: _encode, [method]: _batchEncoder, ...metadata} = implementation;
  const writer = {
    ...metadata,
    async preload() {
      preloads++;
      return implementation;
    }
  };
  const output = encodeBatches([], writer);
  expect(preloads).toBe(0);
  const chunks: string[] = [];
  for await (const chunk of output) {
    chunks.push(TEXT_DECODER.decode(chunk));
  }
  expect(preloads).toBe(1);
  expect(chunks).toEqual(['batch']);
});

test('encode keeps worker dispatch for an on-demand encoder', async () => {
  const implementation = makeWriter({
    worker: new URL('/modules/core/test/worker-utils/fixtures/task-worker.ts', location.href).href,
    encode: async () => {
      throw new Error('expected worker execution');
    }
  });
  const {encode: _encode, ...metadata} = implementation;
  const writer = {...metadata, preload: async () => implementation};

  const data = TEXT_ENCODER.encode('worker').buffer;
  const result = await encode(data, writer, {core: {worker: true}, echoBinary: {}});
  expect(TEXT_DECODER.decode(result)).toBe('worker');
});

test('lazy table batch encoding resolves once on iteration and forwards the table and options', async () => {
  const input = {shape: 'object-row-table' as const, data: [{id: 1}]};
  const options = {batch: {marker: 'table'}};
  let preloads = 0;
  const implementation = makeWriter({
    async *encodeInBatches(batches: Iterable<typeof input>, writerOptions: typeof options) {
      expect(writerOptions).toBe(options);
      for (const batch of batches) {
        yield TEXT_ENCODER.encode(`${writerOptions.batch.marker}:${batch.data[0].id}`).buffer;
      }
    }
  });
  const {encode: _encode, encodeInBatches, ...metadata} = implementation;
  const writer = {
    ...metadata,
    async preload() {
      preloads++;
      return implementation;
    }
  };

  const batches = encodeTableInBatches(input, writer, options);
  expect(preloads).toBe(0);
  const chunks: string[] = [];
  for await (const chunk of batches) {
    chunks.push(TEXT_DECODER.decode(chunk));
  }
  expect(preloads).toBe(1);
  expect(chunks).toEqual(['table:1']);
  const eagerBatchWriter = {...metadata, encodeInBatches};
  expect(TEXT_DECODER.decode(await encodeTable(input, eagerBatchWriter, options))).toBe('table:1');
});

test('metadata without an encoder reports unsupported encoding', async () => {
  const {encode: _encode, ...metadata} = makeWriter();

  await expect(encode('binary', metadata)).rejects.toThrow('could not encode data');
  expect(() => encodeTableInBatches({shape: 'object-row-table', data: []}, metadata)).toThrow(
    'could not encode data in batches'
  );
});

test.each([
  ['binary', (writer: Writer) => encodeInBatches([], writer), 'could not encode in batches'],
  ['text', (writer: Writer) => encodeTextInBatches([], writer), 'could not encode text in batches'],
  [
    'table',
    (writer: Writer) => encodeTableInBatches({shape: 'object-row-table', data: []}, writer),
    'could not encode data in batches'
  ]
] as const)('lazy %s batching resolves once when the encoder also has a preload hook', async (_, encodeBatches, errorMessage) => {
  let preloads = 0;
  const implementation = makeWriter({
    async preload() {
      if (++preloads > 1) {
        throw new Error('encoder was preloaded again');
      }
      return implementation;
    }
  });
  const {encode: _encode, ...writer} = implementation;
  const batches = encodeBatches(writer);
  expect(preloads).toBe(0);
  await expect(batches[Symbol.asyncIterator]().next()).rejects.toThrow(errorMessage);
  expect(preloads).toBe(1);
});
