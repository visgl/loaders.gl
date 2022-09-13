// TODO testing external dataset can be flaky. We need to find a way to test I3S locally
import test from 'tape-promise/tape';
import {Tiles3DConverter} from '@loaders.gl/tile-converter';
import {isBrowser} from '@loaders.gl/core';
import {BROWSER_ERROR_MESSAGE} from '../../src/constants';

const TILESET_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_3DObjects_1_7/SceneServer/layers/0';
const PGM_FILE_PATH = '@loaders.gl/tile-converter/test/data/egm84-30.pgm';

test('tile-converter - Converters#converts i3s to 3d-tiles tileset', async (t) => {
  if (!isBrowser) {
    const converter = new Tiles3DConverter();
    await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'San Francisco',
      maxDepth: 2,
      egmFilePath: PGM_FILE_PATH
    });
  }
  t.end();
});

test('tile-converter - Converters#converts i3s tileset to 3d-tiles tileset', async (t) => {
  if (isBrowser) {
    const converter = new Tiles3DConverter();
    const tilesetJson = await converter.convert({
      inputUrl: TILESET_URL,
      outputPath: 'data',
      tilesetName: 'San Francisco',
      maxDepth: 2,
      egmFilePath: PGM_FILE_PATH
    });
    t.equals(tilesetJson, BROWSER_ERROR_MESSAGE);
  }
  t.end();
});
