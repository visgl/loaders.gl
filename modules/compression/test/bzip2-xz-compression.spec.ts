import {expect, test} from 'vitest';
import {BZip2Compression} from '@loaders.gl/compression/bzip2-compression';
import {XZCompression} from '@loaders.gl/compression/xz-compression';
const EXPECTED = 'compact codec test\n';
const BZIP2_DATA = 'QlpoOTFBWSZTWSiDZ48AAANRgAAQQAAuAswAIAAxANNNBANGRzWtAxEyWR6l4u5IpwoSBRBs8eA=';
const XZ_DATA =
  '/Td6WFoAAATm1rRGBMAXEyEBFgAAAAAAAAAAAFRp7t4BABJjb21wYWN0IGNvZGVjIHRlc3QKAADq+49W0BUVDQABMxPFkVNQH7bzfQEAAAAABFla';
test('BZip2Compression#decompress', async () => {
  const output = await new BZip2Compression().decompress(decode(BZIP2_DATA));
  expect(new TextDecoder().decode(output)).toBe(EXPECTED);
});
test('XZCompression#decompress', async () => {
  const output = await new XZCompression().decompress(decode(XZ_DATA));
  expect(new TextDecoder().decode(output)).toBe(EXPECTED);
});
function decode(value: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(value), character => character.charCodeAt(0));
  return bytes.buffer;
}
