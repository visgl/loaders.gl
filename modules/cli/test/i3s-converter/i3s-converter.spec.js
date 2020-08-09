import test from 'tape-promise/tape';
import {I3SConverter} from '@loaders.gl/cli';
import {isBrowser} from '@loaders.gl/core';
import {promises as fs} from 'fs';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';

async function cleanUpPath(testPath) {
  // Do not run under browser
  if (!isBrowser) {
    await fs.rmdir(testPath, {recursive: true});
  }
}

test('cli - Converters#converts 3d-tiles tileset to i3s tileset', async t => {
  const converter = new I3SConverter();
  const tilesetJson = await converter.convert({
    inputUrl: TILESET_URL,
    outputPath: 'data',
    tilesetName: 'BatchedColors'
  });
  t.ok(tilesetJson);
  cleanUpPath('data/BatchedColors');
  t.end();
});

test('cli - Converters#root node should not contain geometry and textures', async t => {
  if (!isBrowser) {
    const converter = new I3SConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'BatchedColors'
    });

    // Read the converted tileset json
    const rootTileJson = await fs.readFile(
      'data/BatchedColors/layers/0/nodes/root/index.json',
      'utf8'
    );
    const rootTile = JSON.parse(rootTileJson);
    t.notOk(rootTile.geometryData);
    t.notOk(rootTile.textureData);
  }
  cleanUpPath('data/BatchedColors');
  t.end();
});
