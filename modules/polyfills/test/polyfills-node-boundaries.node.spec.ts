// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {describe, expect, test, vi} from 'vitest';
import {BlobPolyfill} from '../src/file/blob';
import {
  readFileAsArrayBuffer,
  readFileAsText,
  requireFromFile,
  requireFromString
} from '../src/load-library/require-utils.node';
import {makeNodeStream} from '../src/streams/make-node-stream';

const FIXTURE_URL = new URL('./load-library/fixture/submodule.js', import.meta.url);
const FIXTURE_PATH = fileURLToPath(FIXTURE_URL);

describe('BlobPolyfill boundaries', () => {
  test('normalizes MIME types and every supported part shape', async () => {
    const nestedBlob = new BlobPolyfill(['nested']);
    const arrayBuffer = Uint8Array.from([32, 65]).buffer;
    const dataView = new DataView(Uint8Array.from([66, 67, 68]).buffer, 1, 2);
    const blob = new BlobPolyfill(
      ['text', nestedBlob, arrayBuffer, Uint8Array.from([69]), dataView, 42 as unknown as BlobPart],
      {type: 'TEXT/PLAIN'}
    );

    expect(blob.type).toBe('text/plain');
    expect(await blob.text()).toBe('textnested AECD42');
    expect(blob.toString()).toBe('[object Blob]');
    expect(blob[Symbol.toStringTag]).toBe('Blob');
    expect(new BlobPolyfill([], {type: 'text/\u0080'}).type).toBe('');
  });

  test.each([
    {start: -5, end: undefined, expected: 'world'},
    {start: -100, end: 5, expected: 'hello'},
    {start: 6, end: -1, expected: 'worl'},
    {start: 100, end: undefined, expected: ''},
    {start: 8, end: 2, expected: ''}
  ])('slices negative and out-of-range offsets: $expected', async ({start, end, expected}) => {
    const blob = new BlobPolyfill(['hello', ' ', 'world']);
    const slice = end === undefined ? blob.slice(start) : blob.slice(start, end, 'TEXT/CUSTOM');
    expect(await slice.text()).toBe(expected);
    expect(slice.size).toBe(new TextEncoder().encode(expected).byteLength);
    if (expected && end !== undefined) {
      expect(slice.type).toBe('text/custom');
    }
  });

  test('streams all parts and exposes a contiguous ArrayBuffer', async () => {
    const blob = new BlobPolyfill(['ab', Uint8Array.from([99, 100])]);
    const chunks: Uint8Array[] = [];
    for await (const chunk of blob.stream()) {
      chunks.push(chunk);
    }

    expect(chunks.map(chunk => new TextDecoder().decode(chunk)).join('')).toBe('abcd');
    expect(new TextDecoder().decode(await blob.arrayBuffer())).toBe('abcd');
  });
});

describe('makeNodeStream boundaries', () => {
  test('reads synchronous byte iterables', async () => {
    const stream = makeNodeStream([Uint8Array.from([1, 2]), Uint8Array.from([3])]);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(Array.from(Buffer.concat(chunks))).toEqual([1, 2, 3]);
  });

  test('reads asynchronous iterables in object mode', async () => {
    async function* generateValues() {
      yield Uint8Array.from([7]);
      yield Uint8Array.from([8, 9]);
    }
    const stream = makeNodeStream(generateValues(), {objectMode: true});
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.map(chunk => Array.from(chunk))).toEqual([[7], [8, 9]]);
  });

  test('returns the iterator when destroyed normally', async () => {
    const returnHandler = vi.fn(async () => ({done: true, value: undefined}));
    const iterator = {
      next: vi.fn(async () => ({done: false, value: Uint8Array.from([1])})),
      return: returnHandler
    };
    const source = {[Symbol.asyncIterator]: () => iterator};
    const stream = makeNodeStream(source);
    stream.destroy();
    await once(stream, 'close');
    expect(returnHandler).toHaveBeenCalled();
  });

  test('throws into the iterator when destroyed with an error', async () => {
    const error = new Error('stop');
    const throwHandler = vi.fn(async () => ({done: true, value: undefined}));
    const iterator = {
      next: vi.fn(async () => ({done: false, value: Uint8Array.from([1])})),
      throw: throwHandler
    };
    const source = {[Symbol.asyncIterator]: () => iterator};
    const stream = makeNodeStream(source);
    stream.on('error', () => {});
    stream.destroy(error);
    await once(stream, 'close');
    expect(throwHandler).toHaveBeenCalledWith(error);
  });
});

describe('Node require utilities', () => {
  test('reads local files as text and ArrayBuffers', async () => {
    expect(await readFileAsText(FIXTURE_PATH)).toContain('module.exports');
    const arrayBuffer = await readFileAsArrayBuffer(FIXTURE_PATH);
    expect(new TextDecoder().decode(arrayBuffer)).toContain('module.exports');
  });

  test('requires local files through absolute and relative paths', async () => {
    expect(await requireFromFile(FIXTURE_PATH)).toBeTruthy();
    const relativePath = FIXTURE_PATH.slice(process.cwd().length + 1);
    expect(await requireFromFile(relativePath)).toBeTruthy();
  });

  test('supports file URLs and explicit module search paths', () => {
    const result = requireFromString(
      'module.exports = {filename: __filename, paths: module.paths};',
      FIXTURE_URL.href,
      {prependPaths: ['first'], appendPaths: ['last']}
    );
    expect(result.filename).toBe(FIXTURE_PATH);
    expect(result.paths[0]).toBe('first');
    expect(result.paths.at(-1)).toBe('last');
  });

  test('accepts the legacy options-as-filename overload', () => {
    const result = requireFromString('module.exports = module.paths;', {
      prependPaths: ['legacy']
    } as unknown as string);
    expect(result[0]).toBe('legacy');
  });
});
