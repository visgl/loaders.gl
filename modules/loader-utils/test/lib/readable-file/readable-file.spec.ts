import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {localHeaderSignature, getReadableFileSize, readRange} from '@loaders.gl/zip';
import {createReadableFileFromBuffer, createReadableFileFromPath, createBrowserReadableFile} from 'test/utils/readable-files';

const SLPK_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';

test('ReadableFile#BlobFile range reads and stat', async (t) => {
  const readableFile = createBrowserReadableFile(DATA_ARRAY.buffer);

  const size = await getReadableFileSize(readableFile);
  t.equal(size, BigInt(DATA_ARRAY.byteLength), 'returns expected bigsize');

  const prefix = await readRange(readableFile, 0n, 4n);
  t.deepEqual(new Uint8Array(prefix), localHeaderSignature, 'reads the zip signature');

  const stat = await readableFile.stat();
  t.equal(stat.size, DATA_ARRAY.byteLength, 'stat.size matches buffer length');
  t.equal(stat.bigsize, BigInt(DATA_ARRAY.byteLength), 'stat.bigsize matches buffer length');
  t.end();
});

// Node-like coverage only executes when NodeFile is available
if (!globalThis.window) {
  test('ReadableFile#NodeFile range reads and stat', async (t) => {
    const readableFile = await createReadableFileFromPath(SLPK_URL);
    const stat = await readableFile.stat();
    t.ok(stat.size > 0, 'stat returns a size');

    const header = await readRange(readableFile, 0n, 4n);
    t.deepEqual(new Uint8Array(header), localHeaderSignature, 'reads header bytes from disk');

    await readableFile.close?.();
    t.end();
  });
}

test('ReadableFile#DataViewReadableFile supports slices', async (t) => {
  const readableFile = await createReadableFileFromBuffer(DATA_ARRAY.buffer);

  const midSection = await readRange(readableFile, 2n, 6n);
  t.deepEqual(new Uint8Array(midSection), new Uint8Array(DATA_ARRAY.slice(2, 6)), 'reads arbitrary slice');

  const trailing = await readRange(readableFile, BigInt(DATA_ARRAY.byteLength - 4), BigInt(DATA_ARRAY.byteLength));
  t.deepEqual(new Uint8Array(trailing), new Uint8Array(DATA_ARRAY.slice(-4)), 'reads trailing bytes');

  t.end();
});
