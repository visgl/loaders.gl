// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {ParquetRangeFile} from '../../src/parquet/lib/sources/parquet-range-file';

test('Parquet reads hidden ranges with a single HEAD size probe', async () => {
  const bytes = Uint8Array.from({length: 32}, (_, index) => index);
  let headRequests = 0;
  const file = new ParquetRangeFile('https://example.invalid/data.parquet', {
    fetch: async (_url, options) => {
      if (options?.method === 'HEAD') {
        headRequests++;
        expect(new Headers(options.headers).has('Range')).toBe(false);
        return new Response(null, {headers: {'Content-Length': '32'}});
      }
      const [, start, end] = /bytes=(\d+)-(\d+)/.exec(new Headers(options?.headers).get('Range')!)!;
      return new Response(bytes.slice(Number(start), Number(end) + 1), {status: 206});
    }
  });
  await file.open();
  expect(file.size).toBe(32);
  expect(new Uint8Array(await file.read(8, 4))).toEqual(bytes.slice(8, 12));
  expect(headRequests).toBe(1);
  await file.close();
});

test.each([2, 5])('Parquet hidden ranges reject an opening body of %s bytes', async length => {
  const file = new ParquetRangeFile('https://example.invalid/data.parquet', {
    fetch: async (_url, options) => options?.method === 'HEAD'
      ? new Response(null, {headers: {'Content-Length': '32'}})
      : new Response(new Uint8Array(length), {status: 206})
  });
  await expect(file.open()).rejects.toThrow(/expected 1/);
});

test.each(['', 'invalid', 'bytes 1-4/32'])('Parquet still rejects visible invalid range %s', async range => {
  const file = new ParquetRangeFile('https://example.invalid/data.parquet', {
    fetch: async () => new Response(new Uint8Array(4), {status: 206, headers: {'Content-Range': range}})
  });
  await expect(file.open()).rejects.toThrow(/Content-Range|does not match/);
});

test.each([null, '', 'bad', '0', '9007199254740992'])('Parquet rejects invalid HEAD size %s', async contentLength => {
  let cancelled = false;
  const file = new ParquetRangeFile('https://example.invalid/data.parquet', {
    fetch: async (_url, options) => options?.method === 'HEAD'
      ? new Response(null, {headers: contentLength === null ? {} : {'Content-Length': contentLength}})
      : new Response(new ReadableStream({cancel() {cancelled = true;}}), {status: 206})
  });
  await expect(file.open()).rejects.toThrow(/HEAD did not provide a valid file length/);
  expect(cancelled).toBe(true);
});

test.each(['ETag', 'Last-Modified'])('Parquet hidden ranges avoid automatic preflight headers but validate %s', async validator => {
  let currentVersion = validator === 'ETag' ? '"v1"' : 'Mon, 01 Jan 2024 00:00:00 GMT';
  const file = new ParquetRangeFile('https://example.invalid/data.parquet', {
    fetch: async (_url, options) => {
      const headers = new Headers(options?.headers);
      expect(headers.has('If-Match')).toBe(false);
      expect(headers.has('If-Unmodified-Since')).toBe(false);
      if (options?.method === 'HEAD') return new Response(null, {headers: {'Content-Length': '32', [validator]: currentVersion}});
      const [, start, end] = /bytes=(\d+)-(\d+)/.exec(headers.get('Range')!)!;
      return new Response(new Uint8Array(Number(end) - Number(start) + 1), {status: 206, headers: {[validator]: currentVersion}});
    }
  });
  await file.open();
  expect((await file.read(8, 4)).byteLength).toBe(4);
  currentVersion = validator === 'ETag' ? '"v2"' : 'Tue, 02 Jan 2024 00:00:00 GMT';
  await expect(file.read(20, 4)).rejects.toThrow(/changed/);
  await file.close();
});

