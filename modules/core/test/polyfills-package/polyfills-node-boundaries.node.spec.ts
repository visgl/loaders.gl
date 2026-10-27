// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {once} from 'node:events';
import {getDefaultHighWaterMark} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {describe, expect, test, vi} from 'vitest';
import {
  readFileAsArrayBuffer,
  readFileAsText,
  requireFromFile,
  requireFromString
} from '../../src/polyfills/load-library/require-utils.node';
import {makeNodeStream} from '../../src/polyfills/streams/make-node-stream';

const FIXTURE_URL = new URL('./load-library/fixture/submodule.js', import.meta.url);
const FIXTURE_PATH = fileURLToPath(FIXTURE_URL);

describe('makeNodeStream boundaries', () => {
  test('reads synchronous byte iterables', async () => {
    const stream = makeNodeStream([Uint8Array.from([1, 2]), Uint8Array.from([3])]);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(Array.from(Buffer.concat(chunks))).toEqual([1, 2, 3]);
  });

  test('preserves byte mode, default buffering and typed-array conversion', async () => {
    const bytes = Uint8Array.from([9, 1, 2, 9]);
    const stream = makeNodeStream([bytes.subarray(1, 3), new Uint8Array([3, 4]).buffer]);
    expect(stream.readableObjectMode).toBe(false);
    expect(stream.readableHighWaterMark).toBe(getDefaultHighWaterMark(false));
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect([...Buffer.concat(chunks)]).toEqual([1, 2, 3, 4]);
  });

  test('preserves explicit object mode and high water mark', async () => {
    const stream = makeNodeStream([new Uint16Array([258, 3])], {
      objectMode: true,
      highWaterMark: 2
    });
    expect(stream.readableObjectMode).toBe(true);
    expect(stream.readableHighWaterMark).toBe(2);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    expect(chunks.map(chunk => [...chunk])).toEqual([[2, 3]]);
  });

  test('respects backpressure and returns the iterator on early exit', async () => {
    const next = vi.fn(async () => ({done: false as const, value: new Uint8Array([1])}));
    const returnHandler = vi.fn(async () => ({done: true as const, value: undefined}));
    const stream = makeNodeStream(
      {[Symbol.asyncIterator]: () => ({next, return: returnHandler})},
      {
        highWaterMark: 1
      }
    );
    await once(stream, 'readable');
    expect(next).toHaveBeenCalledTimes(1);
    stream.destroy();
    await once(stream, 'close');
    expect(returnHandler).toHaveBeenCalledTimes(1);
  });

  test('forwards iterator failures to the stream', async () => {
    const error = new Error('iterator failed');
    const source = {
      [Symbol.asyncIterator]() {
        return {
          next: async () => {
            throw error;
          }
        };
      }
    };
    const stream = makeNodeStream(source);
    await expect(async () => {
      for await (const chunk of stream) void chunk;
    }).rejects.toBe(error);
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

  test('forwards chunk conversion failures', async () => {
    const stream = makeNodeStream([Symbol('invalid')]);
    await expect(async () => {
      for await (const chunk of stream) void chunk;
    }).rejects.toThrow(TypeError);
  });

  test('forwards iterator cleanup failures on completion', async () => {
    const error = new Error('cleanup failed');
    const source = {
      [Symbol.asyncIterator]: () => ({
        next: async () => ({done: true as const, value: undefined}),
        return: async () => {
          throw error;
        }
      })
    };
    await expect(async () => {
      for await (const chunk of makeNodeStream(source)) void chunk;
    }).rejects.toBe(error);
  });

  test('returns the iterator on completion', async () => {
    const returnHandler = vi.fn(async () => ({done: true, value: undefined}));
    const source = {
      [Symbol.asyncIterator]: () => ({
        next: async () => ({done: true as const, value: undefined}),
        return: returnHandler
      })
    };
    for await (const chunk of makeNodeStream(source)) void chunk;
    expect(returnHandler).toHaveBeenCalled();
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
    const closed = once(stream, 'close');
    stream.destroy(error);
    await closed;
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

test('local library file URLs preserve exact bytes and relative module resolution', async () => {
  const {mkdtemp, writeFile, rm} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const {join} = await import('node:path');
  const {pathToFileURL} = await import('node:url');
  const directory = await mkdtemp(join(tmpdir(), 'polyfill libraries '));
  const filePath = join(directory, 'module with spaces.cjs');
  const source = "module.exports = require('./child.cjs');";
  try {
    await writeFile(filePath, source);
    await writeFile(join(directory, 'child.cjs'), 'module.exports = 42;');
    for (const filename of [filePath, pathToFileURL(filePath).href]) {
      const bytes = await readFileAsArrayBuffer(filename);
      expect(bytes.byteLength).toBe(new TextEncoder().encode(source).byteLength);
      expect(new TextDecoder().decode(bytes)).toBe(source);
      expect(await readFileAsText(filename)).toBe(source);
      expect(await requireFromFile(filename)).toBe(42);
      expect(requireFromString(source, filename)).toBe(42);
    }
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
