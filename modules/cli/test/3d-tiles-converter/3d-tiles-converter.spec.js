import test from 'tape-promise/tape';
import {Tiles3DConverter} from '@loaders.gl/cli';
import {isBrowser} from '@loaders.gl/core';

const TILESET_URL =
  'https://tiles.arcgis.com/tiles/u0sSNqDXr7puKJrF/arcgis/rest/services/Frankfurt2017_v17/SceneServer/layers/0';

test('cli - Converters#converts i3s to 3d-tiles tileset', async t => {
  if (!isBrowser) {
    const converter = new Tiles3DConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'Frankfurt',
      maxDepth: 1
    });
  }
  t.end();
});
