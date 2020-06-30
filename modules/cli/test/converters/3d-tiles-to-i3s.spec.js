import test from 'tape-promise/tape';
import {Converter3dTilesToI3S} from '@loaders.gl/cli';
import {isBrowser} from '@loaders.gl/core';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Batched/BatchedColors/tileset.json';

test('cli - Converters#converts 3d-tiles tileset to i3s tileset', async t => {
  if (!isBrowser) {
    const converter = new Converter3dTilesToI3S();
    const tilesetJson = await converter.convert(TILESET_URL, 'data', 'BatchedColors');
    t.ok(tilesetJson);
  }
  t.end();
});
