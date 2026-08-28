import {expect, test} from 'vitest';
import {parseSLPKArchive} from '../src/lib/parsers/parse-slpk/parse-slpk';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';
const SLPK_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';
test('parseSLPKArchive#ReadableFile - raw paths', async () => {
  const arrayBuffer = await loadArrayBufferFromFile(SLPK_URL);
  const archive = await parseSLPKArchive(await createReadableFileFromBuffer(arrayBuffer));
  const nodeDocument = await archive.getFile('nodes/root', 'http');
  expect(nodeDocument.byteLength > 0, 'retrieves decompressed root node document').toBeTruthy();
  const geometry = await archive.getFile('nodes/3/geometries/0.bin');
  expect(geometry.byteLength, 'returns decompressed geometry payload without hash provider').toBe(
    32208
  );
});
test('parseSLPKArchive#ReadableFile - http mode fallbacks', async () => {
  const arrayBuffer = await loadArrayBufferFromFile(SLPK_URL);
  const archive = await parseSLPKArchive(await createReadableFileFromBuffer(arrayBuffer));
  const nodePage = await archive.getFile('nodepages/0', 'http');
  expect(nodePage.byteLength, 'expands nodepage lookup using http-style paths').toBe(16153);
  const shared = await archive.getFile('nodes/3/shared', 'http');
  expect(shared.byteLength, 'resolves shared resources through hash table').toBe(333);
  await expect(archive.getFile('missing/path', 'http')).rejects.toBeDefined();
});
