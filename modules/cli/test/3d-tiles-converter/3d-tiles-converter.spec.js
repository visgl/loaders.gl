import test from 'tape-promise/tape';
import {Tiles3DConverter} from '@loaders.gl/cli';
import {isBrowser} from '@loaders.gl/core';

const TILESET_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

test('cli - Converters#converts i3s to 3d-tiles tileset', async t => {
  if (!isBrowser) {
    const converter = new Tiles3DConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'SanFrancisco',
      maxDepth: 3
    });
  }
  t.end();
});
