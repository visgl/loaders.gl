import {expect, test} from 'vitest';
import {BZip2Decompressor} from '@loaders.gl/compression/bzip2-decompressor';
import {XZDecompressor} from '@loaders.gl/compression/xz-decompressor';
const EXPECTED = 'compact codec test\n';
const BZIP2_DATA = 'QlpoOTFBWSZTWSiDZ48AAANRgAAQQAAuAswAIAAxANNNBANGRzWtAxEyWR6l4u5IpwoSBRBs8eA=';
const XZ_DATA =
  '/Td6WFoAAATm1rRGBMAXEyEBFgAAAAAAAAAAAFRp7t4BABJjb21wYWN0IGNvZGVjIHRlc3QKAADq+49W0BUVDQABMxPFkVNQH7bzfQEAAAAABFla';
test('BZip2Decompressor#decompress', async () => {
  const output = await new BZip2Decompressor().decompress(decode(BZIP2_DATA));
  expect(new TextDecoder().decode(output)).toBe(EXPECTED);
});
test('XZDecompressor#decompress', async () => {
  const output = await new XZDecompressor().decompress(decode(XZ_DATA));
  expect(new TextDecoder().decode(output)).toBe(EXPECTED);
});
function decode(value: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(value), character => character.charCodeAt(0));
  return bytes.buffer;
}
