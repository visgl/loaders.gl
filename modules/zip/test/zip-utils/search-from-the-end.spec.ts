import {expect, test} from 'vitest';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {DataViewReadableFile} from '../../src/parse-zip/readable-file-utils';
import {searchFromTheEnd} from '../../src/parse-zip/search-from-the-end';
test('SLPKLoader#searchFromTheEnd', async () => {
  expect(
    await searchFromTheEnd(
      new DataViewReadableFile(new DataView(DATA_ARRAY.buffer)),
      new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    )
  ).toBe(0n);
});

/** Emulates strict HTTP reads so ZIP searches cannot rely on Blob slice clamping. */
function createStrictFile(bytes: Uint8Array) {
  const file = new DataViewReadableFile(new DataView(bytes.buffer as ArrayBuffer));
  const originalRead = file.read.bind(file);
  file.read = async (offset = 0, length = 0) => {
    expect(Number(offset)).toBeGreaterThanOrEqual(0);
    expect(Number(offset) + length).toBeLessThanOrEqual(bytes.byteLength);
    return originalRead(offset, length);
  };
  return file;
}

test.each([
  0, 1, 1022, 1023, 1024, 2050
])('ZIP reverse search finds the last signature at offset %i without reading beyond EOF', async offset => {
  const bytes = new Uint8Array(offset + 4);
  bytes.set([0x50, 0x4b, 0x03, 0x04], offset);
  if (offset > 4) bytes.set([0x50, 0x4b, 0x03, 0x04], 0);
  expect(
    await searchFromTheEnd(createStrictFile(bytes), new Uint8Array([0x50, 0x4b, 0x03, 0x04]))
  ).toBe(BigInt(offset));
});

test.each([
  0, 1, 3, 4, 1028
])('ZIP reverse search returns -1 for an absent signature in %i bytes', async size => {
  expect(
    await searchFromTheEnd(
      createStrictFile(new Uint8Array(size)),
      new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    )
  ).toBe(-1n);
});

test.each([
  0, 1, 1023, 1024, 1025, 2047
])('ZIP reverse search scans multiple windows for offset %i', async offset => {
  const bytes = new Uint8Array(3075);
  bytes.set([0x50, 0x4b, 0x03, 0x04], offset);
  expect(
    await searchFromTheEnd(createStrictFile(bytes), new Uint8Array([0x50, 0x4b, 0x03, 0x04]))
  ).toBe(BigInt(offset));
});
