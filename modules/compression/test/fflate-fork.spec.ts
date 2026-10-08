// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as internal from '../src/lib/fflate/index';
import * as upstream from 'fflate';
import {inflate, inflateRaw, ungzip} from 'pako';

const INPUTS = [
  new Uint8Array(),
  new TextEncoder().encode('compression boundary '.repeat(100)),
  Uint8Array.from({length: 4096}, (_, index) => (index * 73 + (index >>> 3)) & 255)
];
const FORMATS = [
  {
    name: 'raw',
    encode: 'deflateSync',
    decode: 'inflateSync',
    stream: 'Deflate',
    decodeStream: 'Inflate'
  },
  {name: 'zlib', encode: 'zlibSync', decode: 'unzlibSync', stream: 'Zlib', decodeStream: 'Unzlib'},
  {name: 'gzip', encode: 'gzipSync', decode: 'gunzipSync', stream: 'Gzip', decodeStream: 'Gunzip'}
] as const;

test.each(FORMATS)('$name matches upstream and cross-decodes offset inputs', format => {
  for (const input of INPUTS) {
    const storage = new Uint8Array(input.length + 14);
    storage.set(input, 7);
    const view = storage.subarray(7, 7 + input.length);
    for (const level of [0, 1, 6, 9] as const) {
      const options = {level, mtime: 0};
      const encoded = internal[format.encode](view, options);
      const reference = upstream[format.encode](view, options);
      expect(encoded).toEqual(reference);
      expect(upstream[format.decode](encoded)).toEqual(input);
      const independentDecode =
        format.name === 'raw' ? inflateRaw : format.name === 'gzip' ? ungzip : inflate;
      expect(independentDecode(encoded)).toEqual(input);
      expect(internal[format.decode](reference)).toEqual(input);
    }
  }
});

test.each(FORMATS)('$name stream output matches upstream across chunk boundaries', format => {
  const input = INPUTS[1];
  /** Collects encoded stream output with deterministic headers. */
  function encode(engine: typeof internal | typeof upstream): Uint8Array {
    const chunks: Uint8Array[] = [];
    const stream = new engine[format.stream]({mtime: 0}, chunk => chunks.push(chunk));
    stream.push(input.subarray(0, 1));
    stream.push(input.subarray(1, 257));
    stream.push(input.subarray(257), true);
    const output = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }
  const encoded = encode(internal);
  expect(encoded).toEqual(encode(upstream));
  const chunks: Uint8Array[] = [];
  const decoder = new internal[format.decodeStream](chunk => chunks.push(chunk));
  for (let offset = 0; offset < encoded.length; offset++)
    decoder.push(encoded.subarray(offset, offset + 1), offset === encoded.length - 1);
  expect(Array.from(chunks.flatMap(chunk => Array.from(chunk)))).toEqual(Array.from(input));
});

test('fork preserves upstream malformed-input errors', () => {
  for (const engine of [internal, upstream]) {
    expect(() => engine.inflateSync(new Uint8Array([7]))).toThrow();
    expect(() => engine.gunzipSync(new Uint8Array([0, 0, 0]))).toThrow();
    expect(() => engine.unzlibSync(new Uint8Array([0, 0, 0]))).toThrow();
  }
});
