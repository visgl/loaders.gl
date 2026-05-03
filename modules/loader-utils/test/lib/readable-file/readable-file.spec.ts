import {expect, test} from 'vitest';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {localHeaderSignature, getReadableFileSize, readRange} from '@loaders.gl/zip';
import {
  createReadableFileFromBuffer,
  createReadableFileFromPath,
  createBrowserReadableFile
} from 'test/utils/readable-files';
const SLPK_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
test('ReadableFile#BlobFile range reads and stat', async () => {
  const readableFile = createBrowserReadableFile(DATA_ARRAY.buffer);
  const size = await getReadableFileSize(readableFile);
  expect(size, 'returns expected bigsize').toBe(BigInt(DATA_ARRAY.byteLength));
  const prefix = await readRange(readableFile, 0n, 4n);
  expect(new Uint8Array(prefix), 'reads the zip signature').toEqual(localHeaderSignature);
  const stat = await readableFile.stat();
  expect(stat.size, 'stat.size matches buffer length').toBe(DATA_ARRAY.byteLength);
  expect(stat.bigsize, 'stat.bigsize matches buffer length').toBe(BigInt(DATA_ARRAY.byteLength));
});
// Node-like coverage only executes when NodeFile is available
if (!globalThis.window) {
  test('ReadableFile#NodeFile range reads and stat', async () => {
    const readableFile = await createReadableFileFromPath(SLPK_URL);
    const stat = await readableFile.stat();
    expect(stat.size > 0, 'stat returns a size').toBeTruthy();
    const header = await readRange(readableFile, 0n, 4n);
    expect(new Uint8Array(header), 'reads header bytes from disk').toEqual(localHeaderSignature);
    await readableFile.close?.();
  });
}
test('ReadableFile#DataViewReadableFile supports slices', async () => {
  const readableFile = await createReadableFileFromBuffer(DATA_ARRAY.buffer);
  const midSection = await readRange(readableFile, 2n, 6n);
  expect(new Uint8Array(midSection), 'reads arbitrary slice').toEqual(
    new Uint8Array(DATA_ARRAY.slice(2, 6))
  );
  const trailing = await readRange(
    readableFile,
    BigInt(DATA_ARRAY.byteLength - 4),
    BigInt(DATA_ARRAY.byteLength)
  );
  expect(new Uint8Array(trailing), 'reads trailing bytes').toEqual(
    new Uint8Array(DATA_ARRAY.slice(-4))
  );
});
