import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {i3sObbTo3dTilesObb} from '@loaders.gl/tile-converter/3d-tiles-converter/helpers/i3s-obb-to-3d-tiles-obb';
import {PGMLoader} from '@loaders.gl/tile-converter/pgm-loader';

const PGM_FILE_PATH = '@loaders.gl/tile-converter/test/data/egm84-30.pgm';

test('tile-converter - Converters#converts I3S OBB to 3D-Tiles OBB', async t => {
  const geoidHeightModel = await load(PGM_FILE_PATH, PGMLoader);
  // Frankfurt coordinates
  const tiles3DObb = i3sObbTo3dTilesObb(
    {
      center: [8.67694237417622, 50.109450651843204, 172.017822265625],
      halfSize: [2168.2265625, 1815.9986572265625, 86.135009765625],
      quaternion: [0.222949889965723, 0.2582940697615177, 0.7147233311767448, 0.610938663688116]
    },
    geoidHeightModel
  );
  t.deepEqual(tiles3DObb, [
    4051761.1851145783,
    618337.9522269954,
    4870774.44126969,
    -336.2714136867215,
    2143.2431775188084,
    6.702657086033947,
    -1376.7648141647935,
    -219.86692925233362,
    1165.2083195250113,
    54.63531987122361,
    8.337884469955748,
    66.07890687770515
  ]);
});
