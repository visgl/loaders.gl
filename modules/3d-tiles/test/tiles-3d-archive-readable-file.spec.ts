import test from 'tape-promise/tape';
import {parse3DTilesArchive} from '../src/3d-tiles-archive/3d-tiles-archive-parser';
import {createReadableFileFromBuffer, loadArrayBufferFromFile} from 'test/utils/readable-files';

const TEST_URL = '@loaders.gl/3d-tiles/test/data/test.3tz';

test('parse3DTilesArchive#ReadableFile - file extraction', async (t) => {
  const arrayBuffer = await loadArrayBufferFromFile(TEST_URL);
  const archive = await parse3DTilesArchive(await createReadableFileFromBuffer(arrayBuffer));

  const tilesetJson = await archive.getFile('tileset.json');
  t.equal(tilesetJson.byteLength, 2339, 'reads tileset.json content');

  const childTile = await archive.getFile('ll.b3dm');
  t.equal(childTile.byteLength, 9700, 'extracts binary tiles through hash table');

  await t.rejects(archive.getFile('missing.b3dm'));
  t.end();
});
