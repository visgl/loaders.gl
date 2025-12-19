import test from 'tape-promise/tape';
import {parseSLPKArchive} from '../src/lib/parsers/parse-slpk/parse-slpk';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';

const SLPK_URL = '@loaders.gl/i3s/test/data/DA12_subset.slpk';

test('parseSLPKArchive#ReadableFile - raw paths', async (t) => {
  const arrayBuffer = await loadArrayBufferFromFile(SLPK_URL);
  const archive = await parseSLPKArchive(await createReadableFileFromBuffer(arrayBuffer));

  const nodeDocument = await archive.getFile('nodes/root', 'http');
  t.ok(nodeDocument.byteLength > 0, 'retrieves decompressed root node document');

  const geometry = await archive.getFile('nodes/3/geometries/0.bin');
  t.equal(
    geometry.byteLength,
    32208,
    'returns decompressed geometry payload without hash provider'
  );

  t.end();
});

test('parseSLPKArchive#ReadableFile - http mode fallbacks', async (t) => {
  const arrayBuffer = await loadArrayBufferFromFile(SLPK_URL);
  const archive = await parseSLPKArchive(await createReadableFileFromBuffer(arrayBuffer));

  const nodePage = await archive.getFile('nodepages/0', 'http');
  t.equal(nodePage.byteLength, 16153, 'expands nodepage lookup using http-style paths');

  const shared = await archive.getFile('nodes/3/shared', 'http');
  t.equal(shared.byteLength, 333, 'resolves shared resources through hash table');

  await t.rejects(archive.getFile('missing/path', 'http'));
  t.end();
});
