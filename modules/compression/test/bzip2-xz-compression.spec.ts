// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {BZip2Compression} from '@loaders.gl/compression/bzip2-compression';
import {XZCompression} from '@loaders.gl/compression/xz-compression';

const EXPECTED = 'compact codec test\n';
const BZIP2_DATA = 'QlpoOTFBWSZTWSiDZ48AAANRgAAQQAAuAswAIAAxANNNBANGRzWtAxEyWR6l4u5IpwoSBRBs8eA=';
const XZ_DATA =
  '/Td6WFoAAATm1rRGBMAXEyEBFgAAAAAAAAAAAFRp7t4BABJjb21wYWN0IGNvZGVjIHRlc3QKAADq+49W0BUVDQABMxPFkVNQH7bzfQEAAAAABFla';

test('BZip2Compression#decompress', async t => {
  const output = await new BZip2Compression().decompress(decode(BZIP2_DATA));
  t.equal(new TextDecoder().decode(output), EXPECTED);
  t.end();
});

test('XZCompression#decompress', async t => {
  const output = await new XZCompression().decompress(decode(XZ_DATA));
  t.equal(new TextDecoder().decode(output), EXPECTED);
  t.end();
});

function decode(value: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(value), character => character.charCodeAt(0));
  return bytes.buffer;
}
